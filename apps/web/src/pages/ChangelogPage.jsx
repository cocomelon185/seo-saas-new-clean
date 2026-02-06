import React from "react";
import { Link } from "react-router-dom";
import AppShell from "../components/AppShell.jsx";
import { IconClock, IconArrowRight } from "../components/Icons.jsx";

const updates = [
  {
    date: "Feb 2026",
    title: "Premium experience refresh",
    summary: "A new visual system with upgraded landing and use-case journeys."
  },
  {
    date: "Jan 2026",
    title: "Shareable report flow",
    summary: "Client-ready exports and conversion-ready share pages."
  },
  {
    date: "Dec 2025",
    title: "Audit speed improvements",
    summary: "Faster crawl pipelines and smarter issue clustering."
  }
];

export default function ChangelogPage() {
  return (
    <AppShell
      title="Changelog"
      subtitle="Track product improvements, release notes, and platform updates."
    >
      <div className="space-y-5">
        {updates.map((item) => (
          <div key={item.title} className="rp-card p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[var(--rp-text-900)]">{item.title}</h2>
              <span className="inline-flex items-center gap-1 text-xs text-[var(--rp-text-500)]">
                <IconClock size={12} />
                {item.date}
              </span>
            </div>
            <p className="mt-2 rp-body-small">{item.summary}</p>
          </div>
        ))}
        <div className="rp-card p-5">
          <h3 className="text-lg font-semibold text-[var(--rp-text-900)]">Stay in the loop</h3>
          <p className="mt-2 rp-body-small">
            Want the monthly release digest? Start an audit and opt into release notes.
          </p>
          <div className="mt-4">
            <Link to="/audit" className="rp-btn-primary"><IconArrowRight size={14} />Run audit</Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
