"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Briefcase, LogOut, MessageSquare, UserCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface NavLink {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface DashboardNavbarProps {
  role: "artisan" | "homeowner";
  userName?: string;
  profilePhotoUrl?: string | null;
}

const ARTISAN_RIGHT_LINKS: NavLink[] = [
  { href: "/artisan/jobs", label: "Jobs", icon: Briefcase },
  { href: "/artisan/messages", label: "Messages", icon: MessageSquare },
  { href: "/artisan/account", label: "Account", icon: UserCircle },
];

const HOMEOWNER_RIGHT_LINKS: NavLink[] = [
  { href: "/homeowner/messages", label: "Messages", icon: MessageSquare },
  { href: "/homeowner/account", label: "Account", icon: UserCircle },
];

function linkClass(active: boolean) {
  return `flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium transition-colors ${
    active ? "bg-white/20 text-white" : "text-blue-100 hover:bg-white/10 hover:text-white"
  }`;
}

function NavAvatar({ src, name }: { src?: string | null; name?: string }) {
  const initials = name ? name.slice(0, 1).toUpperCase() : "?";
  if (src) {
    return (
      <span className="flex h-7 w-7 shrink-0 overflow-hidden rounded-full ring-2 ring-white/40">
        <Image src={src} alt={name ?? "avatar"} width={28} height={28} className="h-full w-full object-cover" />
      </span>
    );
  }
  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-bold text-white ring-2 ring-white/40">
      {initials}
    </span>
  );
}

export function DashboardNavbar({ role, userName, profilePhotoUrl }: DashboardNavbarProps) {
  const pathname = usePathname();

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
            {(role === "artisan" ? ARTISAN_RIGHT_LINKS : HOMEOWNER_RIGHT_LINKS).map(
              ({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={linkClass(pathname === href || pathname.startsWith(href + "/"))}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden md:inline">{label}</span>
                </Link>
              ),
            )}
          </div>

          {/* Avatar + name */}
          <Link
            href={role === "artisan" ? "/artisan/account" : "/homeowner/account"}
            className="ml-1 flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-white/10"
          >
            <NavAvatar src={profilePhotoUrl} name={userName} />
            {userName && (
              <span className="hidden text-sm font-medium text-white md:inline">{userName}</span>
            )}
          </Link>

          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-blue-100 hover:bg-white/10 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden md:inline">Logout</span>
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      <div className="flex gap-1 overflow-x-auto px-4 pb-2 md:hidden">
        {(role === "artisan" ? ARTISAN_RIGHT_LINKS : HOMEOWNER_RIGHT_LINKS).map(
          ({ href, label, icon: Icon }) => (
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
          ),
        )}
      </div>
    </nav>
  );
}
