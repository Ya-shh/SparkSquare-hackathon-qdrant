"use client";

import { useRouter } from "next/navigation";

interface UserLinkProps {
  username: string;
  name: string;
  className?: string;
}

export default function UserLink({ username, name, className = "" }: UserLinkProps) {
  const router = useRouter();
  
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/users/${username}`);
  };
  
  return (
    <span 
      className={`text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer ${className}`}
      onClick={handleClick}
    >
      {name}
    </span>
  );
} 