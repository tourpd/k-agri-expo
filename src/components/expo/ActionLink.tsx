import React from "react";
import Link from "next/link";

export default function ActionLink({
  href,
  external,
  style,
  children,
  className,
}: {
  href: string;
  external: boolean;
  style?: React.CSSProperties;
  children: React.ReactNode;
  className?: string;
}) {
  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        style={style}
        className={className}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href} style={style} className={className}>
      {children}
    </Link>
  );
}