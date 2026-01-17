import React from "react";
import { NavLink } from "react-router-dom";
import { Separator } from "components/ui/separator";
import { Button } from "components/ui/button";
import { Input } from "components/ui/input";

const navItems = [
  { to: "/admin/dashboard", label: "Dashboard" },
  { to: "/admin/audit", label: "Site Audit" },
  { to: "/admin/projects", label: "Projects" },
  { to: "/admin/history", label: "Audit History" },
  { to: "/admin/settings", label: "Settings" },
];

export default function AppShell({ title, subtitle, rightAction, children }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-white border-r">
          <div className="h-16 px-6 flex items-center font-bold text-slate-900">
            RankyPulse
          </div>
          <Separator />
          <nav className="px-3 py-4 space-y-1">
            {navItems.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                className={({ isActive }) =>
                  `block rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? "bg-slate-900 text-white"
                      : "text-slate-700 hover:bg-slate-100"
                  }`
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Main */}
        <div className="flex-1 md:pl-64">
          {/* Topbar */}
          <header className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b">
            <div className="h-16 px-4 md:px-8 flex items-center gap-3">
              <div className="flex-1 flex items-center gap-3">
                <Input
                  placeholder="Search… (projects, audits, keywords)"
                  className="max-w-md"
                />
              </div>
              <Button variant="outline">Help</Button>
              <Button variant="outline">Account</Button>
            </div>
          </header>

          {/* Page container */}
          <main className="px-4 md:px-8 py-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
                {subtitle && (
                  <p className="text-sm text-slate-600 mt-1">{subtitle}</p>
                )}
              </div>
              {rightAction ? <div>{rightAction}</div> : null}
            </div>

            <div className="mt-6">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
