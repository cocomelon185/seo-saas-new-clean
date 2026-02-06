import React from "react";
import { Link } from "react-router-dom";
import AppShell from "../components/AppShell.jsx";
import { IconArrowRight, IconTrash } from "../components/Icons.jsx";

export default function AccountDeletedPage() {
  return (
    <AppShell
      title="Account deleted"
      subtitle="Your RankyPulse workspace has been removed. We are sorry to see you go."
    >
      <div className="rp-card p-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-rose-700">
          <IconTrash size={20} />
        </div>
        <h2 className="mt-4 text-xl font-semibold text-[var(--rp-text-900)]">We have closed your account</h2>
        <p className="mt-2 rp-body-small">
          If this was a mistake or you need data access, reach out and we will help right away.
        </p>
        <div className="mt-6 flex flex-col gap-3 md:flex-row md:justify-center">
          <Link to="/about" className="rp-btn-secondary"><IconArrowRight size={14} />Contact support</Link>
          <Link to="/" className="rp-btn-primary"><IconArrowRight size={14} />Return home</Link>
        </div>
      </div>
    </AppShell>
  );
}
