import type { LucideIcon } from "lucide-react";
import {
  ArrowLeftToLine,
  BadgeCheck,
  Gauge,
  HelpCircle,
  KeyRound,
  LayoutDashboard,
  LayoutGrid,
  MessagesSquare,
  ShieldAlert,
  UploadCloud,
  UserCog,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Highlight this item when the pathname matches exactly, not just as a prefix. */
  exact?: boolean;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const appNavGroups: NavGroup[] = [
  {
    label: "Workspace",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
      { href: "/workflows", label: "Browse Workflows", icon: LayoutGrid },
      { href: "/workflows/new", label: "Upload Workflow", icon: UploadCloud },
      { href: "/qa", label: "Q&A Forum", icon: MessagesSquare },
      { href: "/qa/ask", label: "Ask a Question", icon: HelpCircle },
    ],
  },
  {
    label: "Account",
    items: [
      { href: "/settings/profile", label: "Profile", icon: UserCog },
      { href: "/settings/api-keys", label: "API Keys", icon: KeyRound },
    ],
  },
];

export const adminNavGroups: NavGroup[] = [
  {
    label: "Admin",
    items: [
      { href: "/admin", label: "Overview", icon: Gauge, exact: true },
      { href: "/admin/moderation", label: "Moderation Queue", icon: ShieldAlert },
      { href: "/admin/creators", label: "Creator Requests", icon: BadgeCheck },
    ],
  },
  {
    label: "",
    items: [{ href: "/dashboard", label: "Back to Hub", icon: ArrowLeftToLine }],
  },
];
