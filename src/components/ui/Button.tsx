import React from "react";

interface ButtonProps {
  variant?: "primary" | "ghost";
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export function Button({ 
  variant = "primary", 
  children, 
  className = "", 
  disabled = false,
  onClick,
  id,
  ...props 
}: ButtonProps) {
  const baseStyle = "px-4 py-2 font-black uppercase text-[10px] sm:text-xs rounded-xl cursor-pointer border transition duration-250 select-none outline-none flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variantStyles = {
    primary: "bg-[#00FF88] text-black border-transparent hover:bg-[#00FF88]/90 shadow-[0_4px_12px_rgba(0,255,136,0.25)]",
    ghost: "border-white/15 bg-transparent text-white/70 hover:bg-white/5"
  };

  return (
    <button
      id={id}
      disabled={disabled}
      onClick={onClick}
      className={`${baseStyle} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
