"use client";

import React from "react";

type Props = {
  postId: string;
  fallbackCount?: number;
  className?: string;
  label?: (count: number) => string;
};

export default function LiveCommentCount({ postId, fallbackCount = 0, className, label }: Props) {
  const [count, setCount] = React.useState<number>(fallbackCount);

  React.useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await fetch(`/api/posts/${postId}/comments?limit=1`, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (mounted) setCount(typeof data?.meta?.total === "number" ? data.meta.total : fallbackCount);
      } catch {
        // ignore
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [postId, fallbackCount]);

  return <span className={className}>{label ? label(count) : String(count)}</span>;
}


