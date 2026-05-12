import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface PageHeroProps extends HTMLAttributes<HTMLDivElement> {
  eyebrow?: string;
  title: string;
  lead?: string;
  size?: "default" | "large";
}

export default function PageHero({ eyebrow, title, lead, size = "default", children, className }: PageHeroProps) {
  return (
    <div className={cn("glass rounded-xl p-6 border-primary/10", className)}>
      {eyebrow && (
        <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">{eyebrow}</p>
      )}
      <h2 className={cn(
        "font-bold tracking-tight text-foreground",
        size === "large" ? "text-3xl md:text-4xl" : "text-2xl"
      )}>
        {title}
      </h2>
      {lead && (
        <p className="mt-2 text-foreground/60 leading-relaxed max-w-2xl">{lead}</p>
      )}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
