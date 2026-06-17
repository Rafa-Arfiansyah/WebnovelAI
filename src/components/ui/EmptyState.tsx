import React from "react";

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
      <div className="text-white/10">{icon}</div>
      <p className="font-mono uppercase font-bold text-xs text-white/30">{title}</p>
      <p className="font-sans text-[10px] text-white/40 max-w-sm">{description}</p>
      {action ? <div className="pt-2">{action}</div> : null}
    </div>
  );
}
