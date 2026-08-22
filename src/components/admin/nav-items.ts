import {
  LayoutDashboard,
  Users,
  Pill,
  Dna,
  ClipboardList,
  FileBarChart,
  BarChart3,
  ScrollText,
  Activity,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  to: string;
  section?: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", to: "/", icon: LayoutDashboard },
  { label: "User Management", to: "/admin/$section", section: "users", icon: Users },
  { label: "Drug Database", to: "/admin/$section", section: "drugs", icon: Pill },
  { label: "Genetic Database", to: "/admin/$section", section: "genetics", icon: Dna },
  {
    label: "Recommendations",
    to: "/admin/$section",
    section: "recommendations",
    icon: ClipboardList,
  },
  { label: "Reports", to: "/admin/$section", section: "reports", icon: FileBarChart },
  { label: "Analytics", to: "/admin/$section", section: "analytics", icon: BarChart3 },
  { label: "Audit Logs", to: "/admin/$section", section: "audit-logs", icon: ScrollText },
  { label: "Activity Logs", to: "/admin/$section", section: "activity-logs", icon: Activity },
  { label: "System Settings", to: "/admin/$section", section: "settings", icon: Settings },
];

export const SECTION_LABELS: Record<string, string> = Object.fromEntries(
  NAV_ITEMS.filter((i) => i.section).map((i) => [i.section as string, i.label]),
);
