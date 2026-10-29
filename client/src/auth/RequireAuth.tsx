import { Navigate, Outlet } from "react-router";
import { useAuth } from "./AuthContext";

export default function RequireAuth() {
  const {session}=useAuth();
  if(!session){
    return <Navigate to='/auth' replace/>
  }
  return <Outlet key={session.user.id}/>
}