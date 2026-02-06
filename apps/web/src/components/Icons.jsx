import React from "react";

function baseProps({ size = 16, stroke = 2, ...rest }) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: stroke,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    ...rest
  };
}

export function IconLink(props) {
  return (
    <svg {...baseProps(props)}>
      <path d="M10 13a5 5 0 0 1 0-7l2-2a5 5 0 0 1 7 7l-1 1" />
      <path d="M14 11a5 5 0 0 1 0 7l-2 2a5 5 0 0 1-7-7l1-1" />
    </svg>
  );
}

export function IconCheck(props) {
  return (
    <svg {...baseProps(props)}>
      <path d="M5 12l4 4 10-10" />
    </svg>
  );
}

export function IconTitle(props) {
  return (
    <svg {...baseProps(props)}>
      <path d="M4 6h16" />
      <path d="M9 6v12" />
      <path d="M15 6v12" />
    </svg>
  );
}

export function IconDoc(props) {
  return (
    <svg {...baseProps(props)}>
      <rect x="5" y="4" width="14" height="16" rx="2" />
      <path d="M8 9h8" />
      <path d="M8 13h8" />
    </svg>
  );
}

export function IconHeading(props) {
  return (
    <svg {...baseProps(props)}>
      <path d="M6 5v14" />
      <path d="M18 5v14" />
      <path d="M6 12h12" />
    </svg>
  );
}

export function IconCanonical(props) {
  return (
    <svg {...baseProps(props)}>
      <path d="M8 8h8v8H8z" />
      <path d="M12 4v4" />
      <path d="M12 16v4" />
    </svg>
  );
}

export function IconLines(props) {
  return (
    <svg {...baseProps(props)}>
      <path d="M6 6h12" />
      <path d="M6 10h12" />
      <path d="M6 14h8" />
    </svg>
  );
}

export function IconChart(props) {
  return (
    <svg {...baseProps(props)}>
      <path d="M4 18h16" />
      <path d="M7 15v-4" />
      <path d="M12 15V7" />
      <path d="M17 15v-2" />
    </svg>
  );
}

export function IconSearch(props) {
  return (
    <svg {...baseProps(props)}>
      <circle cx="11" cy="11" r="6" />
      <path d="M20 20l-3.5-3.5" />
    </svg>
  );
}

export function IconBolt(props) {
  return (
    <svg {...baseProps(props)}>
      <path d="M13 2L4 14h6l-1 8 9-12h-6z" />
    </svg>
  );
}

export function IconShield(props) {
  return (
    <svg {...baseProps(props)}>
      <path d="M12 3l7 4v5c0 5-3.5 8.5-7 9-3.5-.5-7-4-7-9V7l7-4z" />
    </svg>
  );
}

export function IconCompass(props) {
  return (
    <svg {...baseProps(props)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M15.5 8.5l-2 6-6 2 2-6z" />
    </svg>
  );
}

export function IconReport(props) {
  return (
    <svg {...baseProps(props)}>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M8 8h8" />
      <path d="M8 12h6" />
      <path d="M8 16h5" />
    </svg>
  );
}

export function IconArrowRight(props) {
  return (
    <svg {...baseProps(props)}>
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </svg>
  );
}

export function IconPlay(props) {
  return (
    <svg {...baseProps(props)}>
      <path d="M8 6l10 6-10 6z" />
    </svg>
  );
}

export function IconRefresh(props) {
  return (
    <svg {...baseProps(props)}>
      <path d="M20 12a8 8 0 1 1-2.3-5.6" />
      <path d="M20 4v6h-6" />
    </svg>
  );
}

export function IconMail(props) {
  return (
    <svg {...baseProps(props)}>
      <path d="M4 6h16v12H4z" />
      <path d="M4 7l8 6 8-6" />
    </svg>
  );
}

export function IconUser(props) {
  return (
    <svg {...baseProps(props)}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20a8 8 0 0 1 16 0" />
    </svg>
  );
}

export function IconSettings(props) {
  return (
    <svg {...baseProps(props)}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1-1.7 3-0.2-.1a1.7 1.7 0 0 0-1.8.1l-0.2.1-1.6 0.9-0.1-.2a1.7 1.7 0 0 0-1.5-0.9H11a1.7 1.7 0 0 0-1.5.9l-0.1.2-1.6-0.9-0.2-.1a1.7 1.7 0 0 0-1.8-.1l-0.2.1-1.7-3 0.1-.1a1.7 1.7 0 0 0 .3-1.8l-0.1-.2-0.1-1.8 0.2-.1a1.7 1.7 0 0 0 .9-1.5V10a1.7 1.7 0 0 0-.9-1.5l-0.2-.1 0.1-1.8 0.1-.2a1.7 1.7 0 0 0-.3-1.8l-0.1-.1 1.7-3 0.2.1a1.7 1.7 0 0 0 1.8-.1l0.2-.1 1.6-.9 0.1.2a1.7 1.7 0 0 0 1.5.9h0.2a1.7 1.7 0 0 0 1.5-.9l0.1-.2 1.6.9 0.2.1a1.7 1.7 0 0 0 1.8.1l0.2-.1 1.7 3-0.1.1a1.7 1.7 0 0 0-.3 1.8l0.1.2 0.1 1.8-0.2.1a1.7 1.7 0 0 0-.9 1.5v0.2c0 .6.3 1.1.9 1.5l0.2.1-0.1 1.8z" />
    </svg>
  );
}

export function IconTrash(props) {
  return (
    <svg {...baseProps(props)}>
      <path d="M4 7h16" />
      <path d="M9 7V4h6v3" />
      <path d="M7 7l1 13h8l1-13" />
    </svg>
  );
}

export function IconClock(props) {
  return (
    <svg {...baseProps(props)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v6l4 2" />
    </svg>
  );
}
