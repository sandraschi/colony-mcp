import { motion } from "framer-motion";
import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useZoom } from "@/hooks/useZoom";
import LoggerPanel from "./LoggerPanel";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

export default function AppLayout() {
  const { zoom, resetZoom } = useZoom();
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        const el = document.querySelector<HTMLElement>("[data-testid='feed-search']");
        if (el) {
          el.focus();
        } else {
          navigate("/feed");
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);

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
        <div className="px-4 md:px-6 pb-4 flex items-center gap-2 text-sm text-foreground/40">
          <span data-testid="zoom-indicator">Zoom {(zoom * 100).toFixed(0)}%</span>
          <button
            type="button"
            data-testid="zoom-reset"
            onClick={resetZoom}
            className="px-2 py-0.5 rounded border border-border hover:bg-card"
          >
            Reset (Ctrl+0)
          </button>
        </div>
      </div>
      <LoggerPanel />
    </div>
  );
}
