import type { ReactNode } from "react";

// Group pages contain private data and must be rendered for each request.
export const dynamic = "force-dynamic";

export default function GroupsLayout({ children }: { children: ReactNode }) {
  return children;
}
