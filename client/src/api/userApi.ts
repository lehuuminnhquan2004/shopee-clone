import { api } from "../lib/api";
import type { Gender, MeResponse, UserProfile } from "../types/user";
type UploadAvatarResponse = {
    avatarUrl: string | null;
};
type UpdateProfilePayload={
    fullName:string|null,
    gender:Gender|null,
    birthDate:string|null,
}
type UpdateProfileResponse = {
    message: string;
    user: UserProfile;
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
export async function updateProfile(payload: UpdateProfilePayload,): Promise<UpdateProfileResponse> {
    const { data } = await api.patch<UpdateProfileResponse>("/api/users/me",payload,);
    return data;
}
