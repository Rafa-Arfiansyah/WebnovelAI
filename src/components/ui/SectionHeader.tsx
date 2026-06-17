import React from "react";

interface SectionHeaderProps {
  title: string;
  badge?: string | number;
  action?: React.ReactNode;
}

export function SectionHeader({ title, badge, action }: SectionHeaderProps) {
  return (
    <div className="flex justify-between items-center pb-2.5 border-b border-white/5">
      <h4 className="font-extrabold text-white text-xs uppercase tracking-wider font-mono">{title}</h4>
      <div className="flex items-center gap-2">
        {badge !== undefined && (
          <span className="bg-[#00FF88]/10 text-[#00FF88] font-mono text-[9px] px-2 py-0.5 rounded-full font-bold">
            {badge}
          </span>
        )}
        {action}
      </div>
    </div>
  );
}
