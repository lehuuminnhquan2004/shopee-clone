import {
    useEffect,
    useState,
    type ReactNode,
    useCallback,
    useRef
} from "react"
import { AuthContext, type AuthSession } from "./AuthContext"
import { refreshSession } from "../api/authApi"
import axios, { type InternalAxiosRequestConfig } from "axios";
import {
    api,
    getApiErrorMessage,
    setApiAccessToken,
} from "../lib/api";

type AuthRequestConfig = InternalAxiosRequestConfig & {
    // Request đã được gửi lại sau lỗi xác thực hay chưa?
    _authRetried?: boolean;

    // Request được tạo trong lần đăng nhập nào?
    _loginVersion?: number;
};

type AuthProviderProps = {
    children: ReactNode
}
type RefreshTask = {
    version: number;
    promise: Promise<AuthSession | null>;
};
export function AuthProvider({
    children
}: AuthProviderProps) {
    const [session, setSessionState] = useState<AuthSession | null>(null)
    // Giữ phiên mới nhất để các hàm bất đồng bộ đọc được ngay.
    const sessionRef = useRef<AuthSession | null>(null);

    // Mỗi lần thay đổi phiên, tăng số phiên bản.
    const sessionVersionRef = useRef(0);

    // Giữ request refresh đang chạy để nhiều nơi có thể chờ chung.
    const refreshTaskRef = useRef<RefreshTask | null>(null);

    const loginVersionRef = useRef(0);

    const commitSession = useCallback(
        (nextSession: AuthSession | null): void => {
            sessionVersionRef.current += 1;
            sessionRef.current = nextSession;

            setApiAccessToken(nextSession?.accessToken ?? null);
            setSessionState(nextSession);
        },
        [],
    );
    const setSession = useCallback(
        (nextSession: AuthSession | null): void => {
            loginVersionRef.current += 1;
            commitSession(nextSession);
        },
        [commitSession],
    );

    const refreshAuth = useCallback((): Promise<AuthSession | null> => {
        // Chưa đăng nhập thì không refresh theo luồng này.
        if (!sessionRef.current) {
            return Promise.resolve(null);
        }

        const version = sessionVersionRef.current;
        const runningTask = refreshTaskRef.current;

        // Đã có request refresh cho phiên này: chờ chung kết quả.
        if (runningTask && runningTask.version === version) {
            return runningTask.promise;
        }

        const promise = (async (): Promise<AuthSession | null> => {
            try {
                const data = await refreshSession();

                // Đã đăng xuất hoặc thay đổi phiên trong lúc chờ.
                if (sessionVersionRef.current !== version) {
                    return null;
                }
                if (data.user.id !== sessionRef.current?.user.id) {
                    setSession(null);
                    return null;
                }

                const nextSession: AuthSession = {
                    user: data.user,
                    accessToken: data.accessToken,
                };

                commitSession(nextSession);

                return nextSession;
            } catch (error) {
                // Lỗi của phiên cũ không được ảnh hưởng phiên mới.
                if (sessionVersionRef.current !== version) {
                    return null;
                }

                const status = axios.isAxiosError(error)
                    ? error.response?.status
                    : undefined;

                if (status === 401 || status === 403) {
                    setSession(null);
                }

                // Lỗi mạng hoặc lỗi server vẫn chuyển ra nơi gọi để xử lý.
                // Những lỗi này không tự xóa phiên đăng nhập.
                throw error;
            } finally {
                // Chỉ dọn task của mình, tránh xóa nhầm task mới.
                if (refreshTaskRef.current?.version === version) {
                    refreshTaskRef.current = null;
                }
            }
        })();

        refreshTaskRef.current = {
            version,
            promise,
        };

        return promise;
    }, [commitSession, setSession]);


    useEffect(() => {
        let active = true;
        // Ghi nhớ phiên đăng nhập và gắn token trước khi gửi request.
        const requestInterceptorId = api.interceptors.request.use(
            (config) => {
                const request = config as AuthRequestConfig;

                if (request._loginVersion === undefined) {
                    request._loginVersion = loginVersionRef.current
                }
                if (!active || request._loginVersion !== loginVersionRef.current) {
                    throw new axios.CanceledError("Phiên đăng nhập đã thay đổi");
                }

                const curentSession = sessionRef.current;

                if (curentSession) {
                    request.headers.set(
                        "Authorization",
                        `Bearer ${curentSession.accessToken}`
                    )
                } else {
                    request.headers.delete("Authorization")
                }
                return request
            },
            (error: unknown)=>{
                throw error;
            },
            { synchronous: true },

        )

        const responseInterceptorId = api.interceptors.response.use(
            (response) => response,
            async (error: unknown) => {
                if (!axios.isAxiosError<{ code?: string }>(error)) {
                    throw error
                }
                const request = error.config as AuthRequestConfig | undefined

                // Chỉ xử lý access token hết hạn.
                // Không refresh cho mọi lỗi 401.
                if (
                    !request ||
                    request._authRetried ||
                    request._loginVersion === undefined ||
                    request.url === "/api/auth/refresh" ||
                    error.response?.status !== 401 ||
                    error.response.data?.code !== "ACCESS_TOKEN_EXPIRED"
                ) {
                    throw error;
                }
                if (
                    !active ||
                    request.signal?.aborted ||
                    request._loginVersion !== loginVersionRef.current
                ) {
                    throw new axios.CanceledError(
                        "Request đã bị hủy hoặc phiên đăng nhập đã thay đổi",
                    );
                }
                const currentSession = sessionRef.current;

                if (!currentSession) {
                    throw error;
                }

                // Mỗi request chỉ được gửi lại một lần.
                request._authRetried = true;

                const sentAuthorization = request.headers.get("Authorization");
                const currentAuthorization =
                    `Bearer ${currentSession.accessToken}`;

                // Nếu token vẫn là token đã gây lỗi, cần refresh.
                // Nếu token đã đổi, một request khác đã refresh thành công.
                if (sentAuthorization === currentAuthorization) {
                    const refreshedSession = await refreshAuth();

                    if (!refreshedSession) {
                        throw new axios.CanceledError(
                            "Phiên đăng nhập không còn phù hợp để gửi lại request",
                        );
                    }
                }

                // Trong lúc chờ refresh, người dùng có thể đã đăng xuất.
                if (
                    !active ||
                    request.signal?.aborted ||
                    request._loginVersion !== loginVersionRef.current
                ) {
                    throw new axios.CanceledError(
                        "Request đã bị hủy hoặc phiên đăng nhập đã thay đổi",
                    );
                }
                const latestSession = sessionRef.current;

                if (!latestSession) {
                    throw error;
                }
                // Cấu hình request cũ chứa token cũ, nên phải thay lại.
                request.headers.set(
                    "Authorization",
                    `Bearer ${latestSession.accessToken}`,
                );

                return api.request(request);
            }
        )
        return () => {
            active = false;

            api.interceptors.request.eject(requestInterceptorId);
            api.interceptors.response.eject(responseInterceptorId);

            // Bỏ hiệu lực các công việc cũ khi provider được dọn dẹp.
            sessionVersionRef.current += 1;
            loginVersionRef.current += 1;
        };
    }, [refreshAuth])


    // Lúc vừa mở trang, chưa biết người dùng có phiên hợp lệ hay không.
    const [restoring, setRestoring] = useState(true);
    const [restoreError, setRestoreError] = useState<string | null>(null);
    const [retryCount, setRetryCount] = useState(0);

    useEffect(() => {
        const controller = new AbortController();

        async function restoreSession() {
            try {
                const data = await refreshSession(controller.signal);
                if (controller.signal.aborted) return;

                setSession({
                    user: data.user,
                    accessToken: data.accessToken
                })
            } catch (error) {
                if (controller.signal.aborted) return;

                const status = axios.isAxiosError(error)
                    ? error.response?.status : undefined;
                if (status === 401 || status === 403) {
                    //Khong co dang nhap hop le
                    setSession(null)
                } else {
                    setRestoreError(getApiErrorMessage(error, "Không thể kiểm tra phiên đăng nhập. Vui lòng thử lại"))
                }
            } finally {
                if (!controller.signal.aborted) {
                    setRestoring(false);
                }

            }
        }

        restoreSession();
        return () => {
            controller.abort();
        }
    }, [retryCount, setSession])

    function handleRetry() {
        setRestoreError(null);
        setRestoring(true);
        setRetryCount((previous) => previous + 1);
    }

    if (restoring) {
        return <p role="status">Đang kiểm tra phiên đăng nhập...</p>;
    }

    if (restoreError) {
        return (
            <div>
                <p role="alert">{restoreError}</p>

                <button type="button" onClick={handleRetry}>
                    Thử lại
                </button>
            </div>
        );
    }

    return (
        <AuthContext.Provider value={{ session, setSession, refreshAuth }}>
            {children}
        </AuthContext.Provider>
    );
}


