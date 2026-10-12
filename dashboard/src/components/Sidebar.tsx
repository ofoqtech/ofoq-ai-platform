"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { MessageSquare, BarChart2, Users, Key, Cpu, LogOut } from "lucide-react";
import { clsx } from "clsx";

const navItems = [
  { href: "/chat", label: "المحادثات", icon: MessageSquare },
  { href: "/usage", label: "الاستهلاك", icon: BarChart2 },
  { href: "/keys", label: "مفاتيح API", icon: Key },
  { href: "/models", label: "النماذج", icon: Cpu },
];

const adminItems = [
  { href: "/admin/users", label: "المبرمجين", icon: Users },
  { href: "/admin/usage", label: "إجمالي الاستهلاك", icon: BarChart2 },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout, isAdmin } = useAuthStore();

  return (
    <aside className="w-60 bg-surface-card border-l border-surface-border flex flex-col h-screen fixed right-0 top-0">
      <div className="p-4 border-b border-surface-border">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🤖</span>
          <div>
            <p className="font-bold text-white text-sm">Ofoq AI</p>
            <p className="text-slate-400 text-xs">{user?.name}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href}
            className={clsx("flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
              pathname.startsWith(href)
                ? "bg-primary text-white"
                : "text-slate-400 hover:bg-surface-border hover:text-white"
            )}>
            <Icon size={16} />
            {label}
          </Link>
        ))}

        {isAdmin() && (
          <>
            <p className="text-slate-600 text-xs px-3 pt-4 pb-1">الإدارة</p>
            {adminItems.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href}
                className={clsx("flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                  pathname.startsWith(href)
                    ? "bg-primary text-white"
                    : "text-slate-400 hover:bg-surface-border hover:text-white"
                )}>
                <Icon size={16} />
                {label}
              </Link>
            ))}
          </>
        )}
      </nav>

      <div className="p-3 border-t border-surface-border">
        <button onClick={logout}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-red-400 hover:bg-red-400/10 w-full transition-colors">
          <LogOut size={16} />
          تسجيل الخروج
        </button>
      </div>
    </aside>
  );
}
