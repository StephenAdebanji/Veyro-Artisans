"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LogOut, Settings, User } from "lucide-react";

interface NavLink {
  href: string;
  label: string;
}

interface DashboardNavbarProps {
  role: "artisan" | "homeowner";
  userName: string;
}

const ARTISAN_LINKS: NavLink[] = [
  { href: "/artisan/jobs", label: "Jobs" },
  { href: "/artisan/messages", label: "Messages" },
];

const HOMEOWNER_LINKS: NavLink[] = [
  { href: "/homeowner/requests/new", label: "New Request" },
  { href: "/homeowner/messages", label: "Messages" },
];

export function DashboardNavbar({ role, userName }: DashboardNavbarProps) {
  const pathname = usePathname();
  const links = role === "artisan" ? ARTISAN_LINKS : HOMEOWNER_LINKS;
  const profileHref = role === "artisan" ? "/artisan/profile/edit" : "#";

  return (
    <nav className="sticky top-0 z-50 w-full bg-[#1E3A8A] text-white shadow-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link
          href={role === "artisan" ? "/artisan/dashboard" : "/homeowner/dashboard"}
          className="flex items-center gap-2 hover:opacity-90"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white font-extrabold text-[#1E3A8A]">
            V
          </span>
          <span className="text-xl font-extrabold tracking-tight text-white">EYRO</span>
        </Link>

        {/* Nav links */}
        <div className="hidden items-center gap-1 md:flex">
          {links.map((link) => {
            const active = pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-white/20 text-white"
                    : "text-blue-100 hover:bg-white/10 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <span className="hidden text-sm text-blue-100 md:block">{userName}</span>

          {role === "artisan" && (
            <Link
              href={profileHref}
              className="flex items-center gap-1 rounded-md px-2 py-1.5 text-sm text-blue-100 hover:bg-white/10 hover:text-white"
            >
              <Settings className="h-4 w-4" />
              <span className="hidden md:inline">Edit Profile</span>
            </Link>
          )}

          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex items-center gap-1 rounded-md px-2 py-1.5 text-sm text-blue-100 hover:bg-white/10 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden md:inline">Logout</span>
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      <div className="flex gap-1 overflow-x-auto px-4 pb-2 md:hidden">
        {links.map((link) => {
          const active = pathname === link.href || pathname.startsWith(link.href + "/");
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`shrink-0 rounded-md px-3 py-1 text-sm font-medium ${
                active ? "bg-white/20 text-white" : "text-blue-100 hover:bg-white/10"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
        {role === "artisan" && (
          <Link
            href={profileHref}
            className="shrink-0 rounded-md px-3 py-1 text-sm text-blue-100 hover:bg-white/10"
          >
            Edit Profile
          </Link>
        )}
      </div>
    </nav>
  );
}
