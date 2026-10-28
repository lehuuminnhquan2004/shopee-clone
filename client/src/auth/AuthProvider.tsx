import { 
  useEffect, 
  useState, 
  type ReactNode,
  useCallback
 } from "react"
import { AuthContext, type AuthSession } from "./AuthContext"
import { refreshSession } from "../api/authApi"
import axios from "axios"
import { 
  getApiErrorMessage,
  setApiAccessToken,
 } from "../lib/api"

type AuthProviderProps = {
    children: ReactNode
}
export function AuthProvider({
    children
}: AuthProviderProps) {
    const [session, setSessionState] = useState<AuthSession | null>(null)
    const setSession= useCallback((nextSession:AuthSession|null):void=>{
      setApiAccessToken(nextSession?.accessToken??null);
      setSessionState(nextSession);
    },[]);
    
    
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
    }, [retryCount,setSession])

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
        <AuthContext.Provider value={{ session, setSession }}>
            {children}
        </AuthContext.Provider>
    );
}


