import React from "react";

interface MeterBarProps {
  label: string;
  value: number;
  color?: string; // tailwind bg class
}

export function MeterBar({ label, value, color = "bg-[#00FF88]" }: MeterBarProps) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[9px] font-bold uppercase font-mono tracking-wider text-white/40">
        <span>{label}</span>
        <span className="text-[#00FF88]">{value}%</span>
      </div>
      <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
        <div className={`${color} h-full transition-all duration-500`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
