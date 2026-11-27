import { Link } from "@tanstack/react-router";

import { LogoMark } from "./LogoMark";

export function Logo() {
  return (
    <Link to="/" className="flex min-w-0 items-center gap-2">
      <LogoMark className="h-7 w-7 shrink-0" />
      <span className="display truncate text-lg font-semibold tracking-tight">Hardvoxel</span>
    </Link>
  );
}
