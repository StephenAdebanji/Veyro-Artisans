"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { Briefcase, History, LogOut, MessageSquare, UserCircle } from "lucide-react";

interface DashboardNavbarProps {
  role: "artisan" | "homeowner";
  userName?: string;
  profilePhotoUrl?: string | null;
}

function linkClass(active: boolean) {
  return `flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium transition-colors ${
    active ? "bg-white/20 text-white" : "text-blue-100 hover:bg-white/10 hover:text-white"
  }`;
}

function UnreadBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-0.5 text-[9px] font-bold leading-none text-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}

export function DashboardNavbar({ role, userName: _userName, profilePhotoUrl: _profilePhotoUrl }: DashboardNavbarProps) {
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    async function fetchCount() {
      try {
        const res = await fetch("/api/me/unread-count");
        if (res.ok) {
          const { count } = await res.json() as { count: number };
          setUnreadCount(count);
        }
      } catch { /* silent */ }
    }

    fetchCount();
    const interval = setInterval(fetchCount, 30_000);
    return () => clearInterval(interval);
  }, []);

  // Clear badge when navigating to messages.
  useEffect(() => {
    if (pathname.includes("/messages")) setUnreadCount(0);
  }, [pathname]);

  const messagesHref = role === "artisan" ? "/artisan/messages" : "/homeowner/messages";
  const messagesActive = pathname === messagesHref || pathname.startsWith(messagesHref + "/");

  const historyHref = role === "artisan" ? "/artisan/history" : "/homeowner/history";

  const primaryLinks =
    role === "artisan"
      ? [{ href: "/artisan/jobs", label: "Jobs", icon: Briefcase }]
      : [];

  const accountHref = role === "artisan" ? "/artisan/account" : "/homeowner/account";

  return (
    <nav className="sticky top-0 z-50 w-full bg-[#1E3A8A] text-white shadow-md">
      <div className="flex w-full items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link
          href={role === "artisan" ? "/artisan/dashboard" : "/homeowner/dashboard"}
          className="flex items-center gap-2 hover:opacity-90"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white font-extrabold text-[#1E3A8A]">
            V
          </span>
          <span className="text-xl font-extrabold tracking-tight text-white">VEYRO</span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-1">
          <div className="hidden items-center gap-1 md:flex">
            {primaryLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={linkClass(pathname === href || pathname.startsWith(href + "/"))}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden md:inline">{label}</span>
              </Link>
            ))}

            <Link
              href={historyHref}
              className={linkClass(pathname === historyHref || pathname.startsWith(historyHref + "/"))}
            >
              <History className="h-4 w-4" />
              <span className="hidden md:inline">History</span>
            </Link>

            {/* Messages with unread badge */}
            <Link href={messagesHref} className={linkClass(messagesActive)}>
              <div className="relative">
                <MessageSquare className="h-4 w-4" />
                <UnreadBadge count={unreadCount} />
              </div>
              <span className="hidden md:inline">Messages</span>
            </Link>

            <Link
              href={accountHref}
              className={linkClass(pathname === accountHref || pathname.startsWith(accountHref + "/"))}
            >
              <UserCircle className="h-4 w-4" />
              <span className="hidden md:inline">Account</span>
            </Link>
          </div>

          <button
            onClick={() => signOut({ callbackUrl: "/sign-in" })}
            className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-blue-100 hover:bg-white/10 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden md:inline">Logout</span>
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      <div className="flex gap-1 overflow-x-auto px-4 pb-2 md:hidden">
        {primaryLinks.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1 text-sm font-medium ${
              pathname === href || pathname.startsWith(href + "/")
                ? "bg-white/20 text-white"
                : "text-blue-100 hover:bg-white/10"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}

        <Link
          href={historyHref}
          className={`flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1 text-sm font-medium ${
            pathname === historyHref || pathname.startsWith(historyHref + "/")
              ? "bg-white/20 text-white"
              : "text-blue-100 hover:bg-white/10"
          }`}
        >
          <History className="h-4 w-4" />
          History
        </Link>

        {/* Mobile Messages */}
        <Link
          href={messagesHref}
          className={`flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1 text-sm font-medium ${
            messagesActive ? "bg-white/20 text-white" : "text-blue-100 hover:bg-white/10"
          }`}
        >
          <div className="relative">
            <MessageSquare className="h-4 w-4" />
            <UnreadBadge count={unreadCount} />
          </div>
          Messages
        </Link>

        <Link
          href={accountHref}
          className={`flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1 text-sm font-medium ${
            pathname === accountHref || pathname.startsWith(accountHref + "/")
              ? "bg-white/20 text-white"
              : "text-blue-100 hover:bg-white/10"
          }`}
        >
          <UserCircle className="h-4 w-4" />
          Account
        </Link>
      </div>
    </nav>
  );
}
