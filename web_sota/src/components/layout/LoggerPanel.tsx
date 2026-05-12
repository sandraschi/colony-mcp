import { useLogger } from "@/context/LoggerContext";
import { Button } from "@/components/ui/button";
import { X, Pause, Play, ChevronUp, ChevronDown } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function LoggerPanel() {
  const { entries, clear, paused, togglePause } = useLogger();
  const [expanded, setExpanded] = useState(false);

  if (!expanded) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 md:left-[220px]">
        <button
          onClick={() => setExpanded(true)}
          className="flex items-center justify-center w-full h-7 glass border-t border-border/60 text-foreground/40 hover:text-foreground/70 transition-colors"
        >
          <ChevronUp className="w-4 h-4" />
          {entries.length > 0 && (
            <span className="ml-2 text-[10px]">{entries.length} logs</span>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:left-[220px]">
      <div className="glass border-t border-border/60 max-h-[200px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/40">
          <span className="text-[10px] font-medium text-foreground/50">{entries.length} logs</span>
          <div className="flex items-center gap-1">
            <button onClick={togglePause} className="p-1 rounded text-foreground/40 hover:text-foreground/70">
              {paused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
            </button>
            <button onClick={clear} className="p-1 rounded text-foreground/40 hover:text-destructive">
              <X className="w-3 h-3" />
            </button>
            <button onClick={() => setExpanded(false)} className="p-1 rounded text-foreground/40 hover:text-foreground/70">
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>
        </div>
        {/* Entries */}
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5 font-mono text-[11px]">
          {entries.length === 0 && (
            <p className="text-foreground/30 text-center py-4">No log entries yet</p>
          )}
          {entries.map((entry, i) => (
            <div key={i} className="flex gap-2">
              <span className="text-foreground/30 shrink-0">{new Date(entry.ts).toLocaleTimeString()}</span>
              <span className={cn(
                entry.type === "error" && "text-destructive",
                entry.type === "success" && "text-success",
                entry.type === "info" && "text-foreground/60"
              )}>
                {entry.message}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
