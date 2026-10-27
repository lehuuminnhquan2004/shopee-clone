import { useState, type ReactNode } from "react"
import { AuthContext, type AuthSession } from "./AuthContext"

type AuthProviderProps={
    children:ReactNode
}
export function AuthProvider({
    children
}:AuthProviderProps){
    const [session,setSession]=useState<AuthSession|null>(null)
    return(
        <AuthContext.Provider value={{session,setSession}}>
            {children}
        </AuthContext.Provider>
    )
}