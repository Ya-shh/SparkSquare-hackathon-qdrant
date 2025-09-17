import React from "react";
import { cn } from "@/lib/utils";

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  as?: React.ElementType;
};

export default function Card({ as: Component = "div", className, ...props }: CardProps) {
  return (
    <Component
      className={cn(
        "bg-card rounded-xl border border-border shadow-sm relative overflow-hidden",
        className
      )}
      {...props}
    />
  );
}







