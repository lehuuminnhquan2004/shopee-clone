import { Outlet } from "react-router";
import { AccountSidebar } from "../components/UserLayout/AccountSidebar";
import './UserPage.css'


export default function UserPage() {
  return (
    <div className="user-layout">
      <AccountSidebar />
      <div className="user-layout__content"><Outlet /></div>
    </div>
  );
}