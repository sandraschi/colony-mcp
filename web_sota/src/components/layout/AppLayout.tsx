import { motion } from "framer-motion";
import { Outlet } from "react-router-dom";
import LoggerPanel from "./LoggerPanel";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

export default function AppLayout() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 md:pb-0 pb-16">
        <TopBar />
        <motion.main
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="flex-1 p-4 md:p-6 space-y-6 mb-10"
        >
          <Outlet />
        </motion.main>
      </div>
      <LoggerPanel />
    </div>
  );
}
