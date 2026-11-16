import { api } from "../lib/api";
import type { MeResponse } from "../types/user";
type UploadAvatarResponse = {
    avatarUrl: string | null;
};

export async function getMe(signal?: AbortSignal): Promise<MeResponse> {
    const { data } = await api.get<MeResponse>("/api/users/me", {
        signal,
        timeout: 10000,
    });
    return data;
}
export async function uploadAvatar(file:File):Promise<UploadAvatarResponse>{
    const form=new FormData();
    form.append('avatar',file)
    const {data}=await api.patch<UploadAvatarResponse>('/api/users/me/avatar',form)
    return data
}
