"use client";

import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/utils/cn";
import {
  LayoutDashboard, FileText, BookOpen, ClipboardList,
  Users, CreditCard, Key, AlertCircle, BarChart3,
  Headphones, Megaphone, Shield, Settings, LogOut,
  ChevronDown, ChevronRight, Menu, X,
  PanelLeftClose, PanelLeft,
} from "lucide-react";

// =============================================================================
// SIDEBAR STATE CONTEXT
// =============================================================================

interface SidebarContextValue {
  collapsed: boolean;
  mobileOpen: boolean;
  toggleCollapsed: () => void;
  toggleMobileOpen: () => void;
  closeMobile: () => void;
}

const SidebarContext = createContext<SidebarContextValue>({
  collapsed: false,
  mobileOpen: false,
  toggleCollapsed: () => {},
  toggleMobileOpen: () => {},
  closeMobile: () => {},
});

export function useSidebar() {
  return useContext(SidebarContext);
}

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleCollapsed = useCallback(() => setCollapsed((v) => !v), []);
  const toggleMobileOpen = useCallback(() => setMobileOpen((v) => !v), []);
  const closeMobile = useCallback(() => setMobileOpen(false), []);

  return (
    <SidebarContext.Provider value={{ collapsed, mobileOpen, toggleCollapsed, toggleMobileOpen, closeMobile }}>
      {children}
    </SidebarContext.Provider>
  );
}

// =============================================================================
// NAVIGATION STRUCTURE
// =============================================================================

interface NavItem {
  label: string;
  href?: string;
  icon: ReactNode;
  children?: { label: string; href: string }[];
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: "",
    items: [
      { label: "Dashboard", href: "/admin", icon: <LayoutDashboard className="w-4 h-4" /> },
    ],
  },
  {
    title: "EXAM MANAGEMENT",
    items: [
      {
        label: "Exams", icon: <FileText className="w-4 h-4" />,
        children: [
          { label: "All Exams", href: "/admin/exams" },
          { label: "Create Exam", href: "/admin/exams/new" },
          { label: "Subjects", href: "/admin/subjects" },
        ],
      },
      {
        label: "Mock Tests", icon: <ClipboardList className="w-4 h-4" />,
        children: [
          { label: "All Tests", href: "/admin/tests" },
          { label: "Create Test", href: "/admin/tests/new" },
          { label: "Import Mock Test", href: "/admin/tests/import" },
        ],
      },
    ],
  },
  {
    title: "CONTENT",
    items: [
      {
        label: "Question Bank", icon: <BookOpen className="w-4 h-4" />,
        children: [
          { label: "All Questions", href: "/admin/questions" },
          { label: "Add Question", href: "/admin/questions/new" },
          { label: "Bulk Import", href: "/admin/questions/import" },
        ],
      },
      { label: "Objections", href: "/admin/objections", icon: <AlertCircle className="w-4 h-4" /> },
    ],
  },
  {
    title: "USERS",
    items: [
      { label: "Students", href: "/admin/users", icon: <Users className="w-4 h-4" /> },
      { label: "Subscriptions", href: "/admin/subscriptions", icon: <Key className="w-4 h-4" /> },
    ],
  },
  {
    title: "FINANCE",
    items: [
      { label: "Payments", href: "/admin/payments", icon: <CreditCard className="w-4 h-4" /> },
    ],
  },
  {
    title: "ANALYTICS",
    items: [
      { label: "Results", href: "/admin/results", icon: <BarChart3 className="w-4 h-4" /> },
    ],
  },
  {
    title: "SYSTEM",
    items: [
      { label: "Support", href: "/admin/support", icon: <Headphones className="w-4 h-4" /> },
      { label: "Announcements", href: "/admin/announcements", icon: <Megaphone className="w-4 h-4" /> },
      { label: "Audit Logs", href: "/admin/audit-logs", icon: <Shield className="w-4 h-4" /> },
      { label: "Settings", href: "/admin/settings", icon: <Settings className="w-4 h-4" /> },
    ],
  },
];

// =============================================================================
// SIDEBAR COMPONENT
// =============================================================================

function NavItemComponent({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const pathname = usePathname();
  const { closeMobile } = useSidebar();
  const [open, setOpen] = useState(() => {
    if (!item.children) return false;
    return item.children.some((c) => pathname === c.href || pathname.startsWith(c.href + "/"));
  });

  const isActive = item.href
    ? pathname === item.href
    : item.children?.some((c) => pathname === c.href || pathname.startsWith(c.href + "/"));

  if (item.children) {
    return (
      <div>
        <button
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "flex items-center gap-2.5 w-full px-3 py-2 rounded text-sm transition-colors",
            isActive
              ? "text-sidebar-text-active bg-sidebar-hover"
              : "text-sidebar-text hover:text-sidebar-text-active hover:bg-sidebar-hover",
            collapsed && "justify-center px-2",
          )}
          title={collapsed ? item.label : undefined}
        >
          <span className="shrink-0">{item.icon}</span>
          {!collapsed && (
            <>
              <span className="flex-1 text-left">{item.label}</span>
              {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </>
          )}
        </button>
        {!collapsed && open && (
          <div className="ml-[26px] mt-0.5 space-y-0.5 border-l border-brand-700/40 pl-3">
            {item.children.map((child) => {
              const childActive = pathname === child.href || pathname.startsWith(child.href + "/");
              return (
                <Link
                  key={child.href}
                  href={child.href}
                  onClick={closeMobile}
                  className={cn(
                    "block px-2.5 py-1.5 rounded text-[13px] transition-colors",
                    childActive
                      ? "text-sidebar-text-active bg-sidebar-hover font-medium"
                      : "text-brand-300 hover:text-sidebar-text-active hover:bg-sidebar-hover",
                  )}
                >
                  {child.label}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      href={item.href!}
      onClick={closeMobile}
      className={cn(
        "flex items-center gap-2.5 px-3 py-2 rounded text-sm transition-colors",
        isActive
          ? "text-sidebar-text-active bg-sidebar-hover font-medium"
          : "text-sidebar-text hover:text-sidebar-text-active hover:bg-sidebar-hover",
        collapsed && "justify-center px-2",
      )}
      title={collapsed ? item.label : undefined}
    >
      <span className="shrink-0">{item.icon}</span>
      {!collapsed && <span>{item.label}</span>}
    </Link>
  );
}

export function AdminSidebar() {
  const { collapsed, mobileOpen, toggleCollapsed, closeMobile } = useSidebar();
  const [user, setUser] = useState<{ name: string | null; email: string; role: string } | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          setUser(data.user);
        }
      })
      .catch(() => {});
  }, []);

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      window.location.href = "/admin/login";
    }
  };

  const displayName = user?.name || "Admin User";
  const initials = displayName
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "AU";

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className={cn(
        "flex items-center gap-2.5 px-4 py-4 border-b border-brand-700/30",
        collapsed && "justify-center px-2",
      )}>
        <div className="w-8 h-8 bg-accent-500 rounded flex items-center justify-center shrink-0">
          <span className="text-brand-900 font-bold text-sm">P</span>
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">Panther Law Prep</p>
            <p className="text-[11px] text-brand-400">Admin Portal</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {navSections.map((section, i) => (
          <div key={i}>
            {section.title && !collapsed && (
              <p className="px-3 mb-1.5 text-[10px] font-semibold text-brand-500 uppercase tracking-wider">
                {section.title}
              </p>
            )}
            {collapsed && section.title && (
              <div className="h-px bg-brand-700/30 mx-2 my-2" />
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavItemComponent key={item.label} item={item} collapsed={collapsed} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className={cn(
        "border-t border-brand-700/30 px-3 py-3",
        collapsed && "px-2",
      )}>
        {!collapsed ? (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-brand-700 flex items-center justify-center shrink-0">
              <span className="text-xs font-medium text-white">{initials}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white truncate">{displayName}</p>
              <p className="text-[11px] text-brand-400 truncate">{user?.email || "Administrator"}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="text-brand-400 hover:text-white transition-colors shrink-0 p-1 rounded hover:bg-brand-700/40"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={handleSignOut}
            className="w-full flex justify-center text-brand-400 hover:text-white transition-colors p-1.5 rounded hover:bg-brand-700/40"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Collapse toggle (desktop only) */}
      <div className="hidden lg:block border-t border-brand-700/30 px-2 py-2">
        <button
          onClick={toggleCollapsed}
          className="w-full flex items-center justify-center gap-2 px-2 py-1.5 rounded text-xs text-brand-400 hover:text-white hover:bg-sidebar-hover transition-colors"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={closeMobile}
          aria-hidden
        />
      )}

      {/* Mobile sidebar (drawer) */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[260px] bg-sidebar-bg lg:hidden",
          "transform transition-transform duration-200 ease-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="absolute top-3 right-3">
          <button onClick={closeMobile} className="text-brand-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden lg:block fixed inset-y-0 left-0 z-30 bg-sidebar-bg border-r border-brand-700/20",
          "transition-[width] duration-200 ease-out",
          collapsed ? "w-[60px]" : "w-[240px]",
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}

// =============================================================================
// MOBILE HEADER BAR
// =============================================================================

export function AdminMobileHeader() {
  const { toggleMobileOpen } = useSidebar();

  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-white border-b border-border h-14 flex items-center px-4 gap-3">
      <button onClick={toggleMobileOpen} className="text-foreground" aria-label="Open menu">
        <Menu className="w-5 h-5" />
      </button>
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 bg-brand-800 rounded flex items-center justify-center">
          <span className="text-white font-bold text-xs">P</span>
        </div>
        <span className="text-sm font-semibold text-brand-900">Admin</span>
      </div>
    </header>
  );
}
