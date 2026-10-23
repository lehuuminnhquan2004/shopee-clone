import type { User } from "./user";

export type LoginPayload = {
    identifier: string;
    password: string;
}
export type LoginResponse={
    message:string;
    accessToken:string;
    user:User;
}