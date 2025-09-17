import React from "react";
import { cn } from "@/lib/utils";

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const base =
  "block w-full rounded-md bg-transparent border border-input px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent";

export default function Input({ className, ...props }: InputProps) {
  return <input className={cn(base, className)} {...props} />;
}







