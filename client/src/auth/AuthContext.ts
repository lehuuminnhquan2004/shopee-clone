import { createContext, useContext } from "react";
import type { LoginResponse } from "../types/auth";


export type AuthSession=Pick<LoginResponse,"user"|"accessToken">
export type AuthContextValue={
    session:AuthSession|null,
    setSession:(session:AuthSession|null)=>void;
    refreshAuth: () => Promise<AuthSession | null>;
}

export const AuthContext=createContext<AuthContextValue|undefined>(undefined);

export function useAuth(){
    const context=useContext(AuthContext)
    if(context===undefined){
        throw new Error('useAuth phải đặt trong Provider')
    }
    return context
}