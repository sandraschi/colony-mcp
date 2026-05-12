import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import LoggerPanel from "./LoggerPanel";

export default function AppLayout() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 md:pb-0 pb-16">
        <TopBar />
        <main className="flex-1 p-4 md:p-6 space-y-6 mb-10">
          <Outlet />
        </main>
      </div>
      <LoggerPanel />
    </div>
  );
}
