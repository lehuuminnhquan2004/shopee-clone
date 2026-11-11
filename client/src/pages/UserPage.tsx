import { Outlet } from "react-router";
import { AccountSidebar } from "../components/UserLayout/AccountSidebar";


export default function UserPage() {
  return (
    <div className="user-layout">
      <AccountSidebar />
      <main className="user-layout__content"><Outlet /></main>
    </div>
  );
}