import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import PricingModal from "../components/PricingModal.jsx";
import ShareAuditButton from "../components/ShareAuditButton.jsx";
import AppShell from "../components/AppShell.jsx";
import IssuesPanel from "../components/IssuesPanel.jsx";
import { exportAuditSummary } from "../utils/exportAuditSummary.js";
import { exportAuditPdf } from "../utils/exportAuditPdf.js";
import { isMonitored, listMonitors, removeMonitor, updateMonitorFromAudit, upsertMonitor } from "../utils/monitoring.js";
import { getAnonId } from "../utils/anonId.js";
import SavedAuditsPanel from "../components/SavedAuditsPanel.jsx";
import AuditImpactBanner from "../components/AuditImpactBanner.jsx";
import AuditHistoryPanel from "../components/AuditHistoryPanel.jsx";
import { pushAuditHistory } from "../lib/auditHistory.js";
import ErrorBoundary from "../components/ErrorBoundary.jsx";
import { track } from "../lib/eventsClient.js";
import { getAuthToken, getAuthUser } from "../lib/authClient.js";
import { safeJson } from "../lib/safeJson.js";
import {
  IconLink,
  IconCheck,
  IconTitle,
  IconDoc,
  IconHeading,
  IconCanonical,
  IconLines,
  IconPlay,
  IconRefresh,
  IconMail,
  IconArrowRight,
  IconClock,
  IconTrash,
  IconBolt,
  IconReport,
  IconShield,
  IconCompass
} from "../components/Icons.jsx";

function AuditPageInner() {
  const __rp_markSkipAutoRun = () => {
    try { __rpSkipAutoRunRef.current = true; } catch {}
  };
  const __rpSkipAutoRunRef = useRef(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [pricingOpen, setPricingOpen] = useState(false);

  const [url, setUrl] = useState("");
  const hasUrl = Boolean(url?.trim());
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [hasResumeSnapshot, setHasResumeSnapshot] = useState(false);
  const [debug, setDebug] = useState("");
  const [debugExpanded, setDebugExpanded] = useState(false);
  const autoRunRef = useRef(false);
  
  // Conversion panel state
  const [conversionEmail, setConversionEmail] = useState("");
  const [conversionSubmitted, setConversionSubmitted] = useState(false);
  const [conversionDismissed, setConversionDismissed] = useState(false);
  const [advancedView, setAdvancedView] = useState(() => {
    try {
      return localStorage.getItem("rp_advanced_view") === "true";
    } catch {
      return false;
    }
  });
  const [showAllGuidedFixes, setShowAllGuidedFixes] = useState(false);
  const [guidedDone, setGuidedDone] = useState({});
  const [showScoreInfo, setShowScoreInfo] = useState(false);
  const [scoreMode, setScoreMode] = useState(() => {
    try {
      return localStorage.getItem("rp_score_mode") || "narrowed";
    } catch {
      return "narrowed";
    }
  });
  const [monitors, setMonitors] = useState(() => listMonitors());
  const [gscStatus, setGscStatus] = useState("idle");
  const [gscData, setGscData] = useState(null);
  const [fixWebhookUrl, setFixWebhookUrl] = useState("");
  const [valuePerVisit, setValuePerVisit] = useState(2);
  const [weeklyEmail, setWeeklyEmail] = useState("");
  const [weeklyEnabled, setWeeklyEnabled] = useState(false);
  const [weeklyStatus, setWeeklyStatus] = useState("");
  const [reportBrandName, setReportBrandName] = useState("RankyPulse");
  const [reportBrandColor, setReportBrandColor] = useState("#FF642D");
  const [reportBrandLogo, setReportBrandLogo] = useState("");
  const [wordpressWebhook, setWordpressWebhook] = useState("");
  const [shopifyWebhook, setShopifyWebhook] = useState("");
  const [wpSiteUrl, setWpSiteUrl] = useState("");
  const [wpStatus, setWpStatus] = useState("idle");
  const [shopifyShop, setShopifyShop] = useState("");
  const [shopifyStatus, setShopifyStatus] = useState("idle");
  const [showNextStep, setShowNextStep] = useState(false);
  const [competitorUrls, setCompetitorUrls] = useState(["", "", ""]);
  const [competitorScores, setCompetitorScores] = useState([]);
  const [compareStatus, setCompareStatus] = useState("idle");
  const [ctaVariant, setCtaVariant] = useState("A");
  const anonId = getAnonId();
  const authUser = getAuthUser();
  const [authToken, setAuthToken] = useState(() => getAuthToken() || "");
  const [requireVerified, setRequireVerified] = useState(false);
  const [allowAudit, setAllowAudit] = useState(true);
  const [requestStatus, setRequestStatus] = useState("");
  const auditDisabledReason =
    !allowAudit
      ? "Audit tool is disabled by your admin."
      : requireVerified && authUser && authUser.verified === false
        ? "Verify your email to run audits."
        : !hasUrl
          ? "Enter a valid URL to run an audit."
          : status === "loading"
            ? "Audit is running..."
            : "";

  useEffect(() => {
    try {
      localStorage.setItem("rp_advanced_view", advancedView ? "true" : "false");
    } catch {}
  }, [advancedView]);

  useEffect(() => {
    try {
      localStorage.setItem("rp_score_mode", scoreMode);
    } catch {}
  }, [scoreMode]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const storedWebhook = window.localStorage.getItem("rp_fix_webhook_url") || "";
      const storedValue = window.localStorage.getItem("rp_value_per_visit") || "";
      const storedWeeklyEmail = window.localStorage.getItem("rp_weekly_email") || "";
      const storedWeeklyEnabled = window.localStorage.getItem("rp_weekly_enabled") || "";
      const token = window.localStorage.getItem("rp_auth_token") || "";
      const storedBrandName = window.localStorage.getItem("rp_report_brand_name") || "";
      const storedBrandColor = window.localStorage.getItem("rp_report_brand_color") || "";
      const storedBrandLogo = window.localStorage.getItem("rp_report_brand_logo") || "";
      const storedWpWebhook = window.localStorage.getItem("rp_wp_webhook_url") || "";
      const storedShopifyWebhook = window.localStorage.getItem("rp_shopify_webhook_url") || "";
      const storedWpSite = window.localStorage.getItem("rp_wp_site_url") || "";
      const storedShopifyShop = window.localStorage.getItem("rp_shopify_shop") || "";
      if (storedWebhook) setFixWebhookUrl(storedWebhook);
      if (storedValue) setValuePerVisit(Number(storedValue) || 2);
      if (storedWeeklyEmail) setWeeklyEmail(storedWeeklyEmail);
      if (storedWeeklyEnabled) setWeeklyEnabled(storedWeeklyEnabled === "true");
      if (token) setAuthToken(token);
      if (storedBrandName) setReportBrandName(storedBrandName);
      if (storedBrandColor) setReportBrandColor(storedBrandColor);
      if (storedBrandLogo) setReportBrandLogo(storedBrandLogo);
      if (storedWpWebhook) setWordpressWebhook(storedWpWebhook);
      if (storedShopifyWebhook) setShopifyWebhook(storedShopifyWebhook);
      if (storedWpSite) setWpSiteUrl(storedWpSite);
      if (storedShopifyShop) setShopifyShop(storedShopifyShop);
      if (token) setAuthToken(token);
    } catch {}
  }, []);

  useEffect(() => {
    if (!authUser?.email) return;
    const token = getAuthToken();
    if (!token) return;
    fetch("/api/account-settings", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((r) => safeJson(r))
      .then((data) => {
        if (data?.ok && data?.settings) {
          setRequireVerified(!!data.settings.require_verified);
          setAllowAudit(data.settings.allow_audit !== false);
        }
      })
      .catch(() => {});
  }, [authUser?.email]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const key = "rp_cta_variant";
      const params = new URLSearchParams(window.location.search || "");
      const forced = params.get("cta");
      if (forced === "A" || forced === "B") {
        localStorage.setItem(key, forced);
        setCtaVariant(forced);
        return;
      }
      const existing = localStorage.getItem(key);
      if (existing === "A" || existing === "B") {
        setCtaVariant(existing);
        return;
      }
      const next = Math.random() < 0.5 ? "A" : "B";
      localStorage.setItem(key, next);
      setCtaVariant(next);
    } catch {}
  }, []);

  useEffect(() => {
    if (status !== "success" || !result?.url) return;
    try {
      const key = "rp_first_audit_done";
      const already = localStorage.getItem(key);
      if (!already) {
        localStorage.setItem(key, "true");
        setShowNextStep(true);
      }
    } catch {}
  }, [status, result?.url]);

  useEffect(() => {
    if (!anonId) return;
    fetch("/api/wp/status", { headers: { "x-rp-anon-id": anonId } })
      .then((r) => safeJson(r))
      .then((data) => {
        if (data?.connected) {
          setWpStatus("connected");
          if (data?.site_url) setWpSiteUrl(data.site_url);
        } else {
          setWpStatus("disconnected");
        }
      })
      .catch(() => setWpStatus("error"));
    fetch("/api/shopify/status", { headers: { "x-rp-anon-id": anonId } })
      .then((r) => safeJson(r))
      .then((data) => {
        if (data?.connected) {
          setShopifyStatus("connected");
          if (data?.shop) setShopifyShop(data.shop);
        } else {
          setShopifyStatus("disconnected");
        }
      })
      .catch(() => setShopifyStatus("error"));
  }, [anonId]);

  function refreshMonitors() {
    try {
      setMonitors(listMonitors());
    } catch {
      setMonitors([]);
    }
  }

  const issues = Array.isArray(result?.issues) ? result.issues : [];
  const quickWins = Array.isArray(result?.quick_wins) ? result.quick_wins : [];
  const scoreValue = useMemo(() => {
    if (typeof result?.score !== "number") return null;
    return displayScore(result.score, issues);
  }, [result?.score, issues, scoreMode]);

  const summaryCards = useMemo(() => {
    if (!result) return [];
    const evidence = result?.evidence || {};
    const titleLen = typeof evidence?.title_char_count === "number"
      ? evidence.title_char_count
      : (evidence?.title ? String(evidence.title).length : 0);
    const metaLen = typeof evidence?.meta_description_char_count === "number"
      ? evidence.meta_description_char_count
      : (evidence?.meta_description ? String(evidence.meta_description).length : 0);
    const h1Count = typeof evidence?.h1_count === "number" ? evidence.h1_count : (evidence?.h1 ? 1 : 0);
    const wordCount = typeof evidence?.word_count === "number" ? evidence.word_count : 0;

    const titleOk = titleLen >= 30 && titleLen <= 60;
    const metaOk = metaLen >= 70 && metaLen <= 160;
    const h1Ok = h1Count === 1;
    const wordOk = wordCount >= 600;

    return [
      {
        label: "Title length",
        value: titleLen ? `${titleLen} chars` : "Missing",
        hint: titleOk ? "Ideal range" : "Aim 30–60 chars",
        percent: clampScore(Math.round(Math.min(1, titleLen / 60) * 100)),
        color: titleOk ? "bg-emerald-400" : "bg-amber-400",
        icon: <IconTitle size={14} />
      },
      {
        label: "Meta description",
        value: metaLen ? `${metaLen} chars` : "Missing",
        hint: metaOk ? "Strong snippet" : "Aim 70–160 chars",
        percent: clampScore(Math.round(Math.min(1, metaLen / 160) * 100)),
        color: metaOk ? "bg-emerald-400" : "bg-amber-400",
        icon: <IconDoc size={14} />
      },
      {
        label: "H1 coverage",
        value: h1Count ? `${h1Count} found` : "Missing",
        hint: h1Ok ? "Perfect" : "Use 1 clear H1",
        percent: h1Ok ? 100 : 30,
        color: h1Ok ? "bg-emerald-400" : "bg-amber-400",
        icon: <IconHeading size={14} />
      },
      {
        label: "Word count",
        value: wordCount ? `${wordCount.toLocaleString()} words` : "Missing",
        hint: wordOk ? "Healthy depth" : "Aim 600+ words",
        percent: clampScore(Math.round(Math.min(1, wordCount / 800) * 100)),
        color: wordOk ? "bg-emerald-400" : "bg-amber-400",
        icon: <IconLines size={14} />
      }
    ];
  }, [result]);

  const signalMetrics = useMemo(() => {
    if (!result || typeof scoreValue !== "number") return [];
    return buildSignalMetrics(result, scoreValue);
  }, [result, scoreValue]);

  const overviewMetrics = useMemo(() => {
    if (!result || typeof scoreValue !== "number") return null;
    return computeMetrics(result, scoreValue);
  }, [result, scoreValue]);

  const pageType = result?.page_type || "landing";
  const pageTypeAdvice = Array.isArray(result?.page_type_advice) ? result.page_type_advice : [];
  const rewriteExamples = Array.isArray(result?.rewrite_examples) ? result.rewrite_examples : [];

  useEffect(() => {
    try {
      const key = `rp_guided_done::${(result?.url || url || "").trim()}`;
      if (!key.trim()) return;
      const raw = localStorage.getItem(key);
      setGuidedDone(raw ? JSON.parse(raw) : {});
    } catch {
      setGuidedDone({});
    }
  }, [result?.url, url]);

  useEffect(() => {
    refreshMonitors();
  }, []);

  useEffect(() => {
    if (!result?.url) return;
    if (!isMonitored(result.url)) return;
    updateMonitorFromAudit(result.url, scoreValue ?? result.score, issues.length);
    refreshMonitors();
  }, [result?.url, scoreValue, issues.length]);

  useEffect(() => {
    if (!result?.url) return;
    let cancelled = false;
    setGscStatus("loading");
    setGscData(null);
    fetch("/api/gsc/summary", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(anonId ? { "x-rp-anon-id": anonId } : {}) },
      body: JSON.stringify({ url: result.url })
    })
      .then((r) => safeJson(r))
      .then((data) => {
        if (cancelled) return;
        if (data?.ok && data.metrics) {
          setGscData(data);
          setGscStatus("success");
        } else {
          setGscStatus("empty");
        }
      })
      .catch(() => {
        if (cancelled) return;
        setGscStatus("error");
      });
    return () => { cancelled = true; };
  }, [result?.url]);

  useEffect(() => {
    try {
      const params = new URLSearchParams(location.search || "");
      const u = (params.get("url") || "").trim();
      if (u) {
        setUrl(u);
        return;
      }
    } catch {}

    // If no query param, restore last audited URL (enables Resume after reload)
    try {
      const last = (localStorage.getItem("rp_last_audit_url") || "").trim();
      if (last) setUrl(last);
    } catch {}
  }, [location.search]);

  useEffect(() => {
    if (__rpSkipAutoRunRef.current) { __rpSkipAutoRunRef.current = false; return; }

    if (hasResumeSnapshot) return;
    if (autoRunRef.current) return;
    if (status !== "idle") return;
    try {
      const u = new URL(url.trim());
      if (!(u.protocol === "http:" || u.protocol === "https:")) return;
    } catch {
      return;
    }
    if (!url.trim()) return;

    const snapshot = __rp_loadSnapshotForUrl(url);
    if (snapshot) {
      autoRunRef.current = true;
      setResult(snapshot);
      setStatus("success");
      setHasResumeSnapshot(true);
      return;
    }

    autoRunRef.current = true;
    run();
  }, [url, status]);

  // Check if conversion panel was dismissed in this session
  useEffect(() => {
    try {
      const dismissed = sessionStorage.getItem("post_audit_conversion_dismissed");
      if (dismissed === "true") {
        setConversionDismissed(true);
      }
    } catch {}
  }, []);

  // Show conversion panel when audit completes successfully
  useEffect(() => {
    if (status === "success" && result && !conversionDismissed && !conversionSubmitted) {
      // Panel will be shown via conditional rendering
    }
  }, [status, result, conversionDismissed, conversionSubmitted]);
  const canRun = useMemo(() => {
    try {
      const u = new URL(url.trim());
      return u.protocol === "http:" || u.protocol === "https:";
    } catch {
      return false;
    }
  }, [url]);

  useEffect(() => {
    if (!url.trim()) return;
    const snap = __rp_loadSnapshotForUrl(url);
    setHasResumeSnapshot(Boolean(snap));
  }, [url]);

  function __rp_loadSnapshotForUrl(snapshotUrl) {
    if (!snapshotUrl) return null;
    try {
      const key = "rp_audit_snapshot::" + snapshotUrl.trim();
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const data = JSON.parse(raw);
      return data && typeof data === "object" ? data : null;
    } catch {
      return null;
    }
  }

  function __rp_resumeWithoutNetwork() {
    try { __rpSkipAutoRunRef.current = true; } catch {}

    const snap = __rp_loadSnapshotForUrl(url);
    if (!snap) return false;
    try {
      setResult(snap);
      setStatus("success");
      setHasResumeSnapshot(true);
    } catch {}
    return true;
  }



  async function run() {
    setError("");
    setResult(null);

    if (!allowAudit) {
      setStatus("error");
      setError("Audit tool is disabled for your team. Contact your admin.");
      return;
    }
    if (requireVerified && authUser && authUser.verified === false) {
      setStatus("error");
      setError("Please verify your email to run audits.");
      return;
    }

    if (!canRun) {
      setStatus("error");
      setError("Enter a valid URL (include https://).");
      return;
    }

    setStatus("loading");
    try {
      const res = await fetch("/api/page-report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify({ url: url.trim() })
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `HTTP ${res.status}`);
      }

      const data = await safeJson(res);
      try { setDebug(JSON.stringify(data, null, 2)); } catch {}
      setResult(data);
      try {
        const key = "rp_audit_snapshot::" + (url || "").trim();
        localStorage.setItem(key, JSON.stringify(data));
        try { localStorage.setItem("rp_last_audit_url", (url || "").trim()); } catch {}
      } catch {}
      if (data?.warning) {
        setStatus("error");
        setError(String(data.warning));
        return;
      }
try {
        pushAuditHistory({
          url: data?.url || url,
          score: data?.score,
          issuesCount: Array.isArray(data?.issues) ? data.issues.length : (data?.issues_found ?? data?.issuesFound ?? 0),
          ranAt: Date.now()
        });

      } catch {}

      setStatus("success");
      try {
        track("audit_run", {
          url: data?.url || url,
          score: data?.score ?? null,
          issues: Array.isArray(data?.issues) ? data.issues.length : null
        });
      } catch {}
      try {
        if (anonId) {
          await fetch("/api/user-state", {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-rp-anon-id": anonId },
            body: JSON.stringify({ first_audit_at: Date.now() })
          });
        }
      } catch {}
    } catch (e) {
      setStatus("error");
      setError(String(e?.message || "Request failed."));
    }
  }

  function handleConversionSubmit(e) {
    e.preventDefault();
    
    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (conversionEmail.trim() && !emailRegex.test(conversionEmail.trim())) {
      return; // Silently ignore invalid email
    }

    // Store email in localStorage
    try {
      if (conversionEmail.trim()) {
        localStorage.setItem("post_audit_email", conversionEmail.trim());
      }
    } catch {}

    // Track event
    track("post_audit_email_opt_in", {
      meta: { source: "audit_page" }
    });

    // Show success state
    setConversionSubmitted(true);
  }

  function handleConversionDismiss() {
    // Store dismissal in sessionStorage
    try {
      sessionStorage.setItem("post_audit_conversion_dismissed", "true");
    } catch {}

    // Track event
    track("post_audit_email_dismissed", {
      meta: { source: "audit_page" }
    });

    // Hide panel
    setConversionDismissed(true);
  }

  const strictPriorityIds = new Set([
    "missing_title",
    "missing_meta_description",
    "missing_h1",
    "no_canonical",
    "http_status_error"
  ]);

  function strictPrioritizeIssues(list) {
    if (!Array.isArray(list)) return [];
    return list.map((issue) => {
      if (scoreMode !== "strict") return issue;
      if (strictPriorityIds.has(String(issue?.issue_id || ""))) {
        return { ...issue, priority: "fix_now" };
      }
      return issue;
    });
  }

  function strictPrioritizeQuickWins(list) {
    if (!Array.isArray(list)) return [];
    if (scoreMode !== "strict") return list;
    const high = [];
    const rest = [];
    for (const item of list) {
      const lc = String(item || "").toLowerCase();
      if (lc.includes("meta description") || lc.includes("h1") || lc.includes("<title") || lc.includes("title")) {
        high.push(item);
      } else {
        rest.push(item);
      }
    }
    return [...high, ...rest];
  }
  const brief = typeof result?.content_brief === "string" ? result.content_brief : "";

  function scoreLabel(score) {
    if (typeof score !== "number") return "";
    if (score >= 85) return "Strong foundation - optimize for growth.";
    if (score >= 70) return "Good start - a few basics are missing.";
    if (score >= 55) return "Needs attention - key SEO basics are missing.";
    return "Low score - fix fundamentals first.";
  }

  function explainQuickWin(item) {
    const raw = String(item || "").trim();
    const lc = raw.toLowerCase();
    if (!raw) return { title: "Quick win", detail: "Fixing this removes a common SEO blocker." };
    if (lc.includes("meta description")) {
      return {
        title: "Add a meta description",
        detail: "Write a short summary so search engines show a better snippet."
      };
    }
    if (lc.includes("missing h1") || lc.includes("h1")) {
      return {
        title: "Add a clear H1 heading",
        detail: "The H1 tells visitors and Google the main topic of the page."
      };
    }
    if (lc.includes("title")) {
      return {
        title: "Improve the page title",
        detail: "Make the title clear and descriptive so people know what the page is about."
      };
    }
    if (lc.includes("canonical")) {
      return {
        title: "Set a canonical URL",
        detail: "Tell search engines which URL is the main version of this page."
      };
    }
    if (lc.includes("alt")) {
      return {
        title: "Add image alt text",
        detail: "Alt text improves accessibility and helps search engines understand images."
      };
    }
    if (lc.includes("links")) {
      return {
        title: "Review links",
        detail: "Fixing link issues helps users and search engines navigate the page."
      };
    }
    return { title: raw, detail: "Fixing this removes a common SEO blocker." };
  }

  function isValidUrl(value) {
    try {
      const u = new URL(String(value || "").trim());
      return u.protocol === "http:" || u.protocol === "https:";
    } catch {
      return false;
    }
  }

  function gradeFromScore(score) {
    if (score >= 85) return "A";
    if (score >= 70) return "B";
    if (score >= 55) return "C";
    if (score >= 40) return "D";
    return "F";
  }

  function impactLabelForIssueName(name = "") {
    const lc = String(name || "").toLowerCase();
    if (lc.includes("meta") || lc.includes("title") || lc.includes("h1") || lc.includes("canonical") || lc.includes("alt")) {
      return { label: "Low effort · High ROI", tone: "rp-chip rp-chip-success" };
    }
    if (lc.includes("broken link") || lc.includes("links")) {
      return { label: "Medium effort · Solid ROI", tone: "rp-chip rp-chip-info" };
    }
    if (lc.includes("word count") || lc.includes("content") || lc.includes("speed") || lc.includes("performance")) {
      return { label: "Strategic play", tone: "rp-chip rp-chip-warning" };
    }
    return { label: "Quick win", tone: "rp-chip rp-chip-neutral" };
  }

  function estimateTrafficUplift() {
    const metrics = gscData?.metrics;
    if (!metrics) return null;
    const impressions = Number(metrics.impressions || 0);
    const ctr = Number(metrics.ctr || 0);
    const position = Number(metrics.position || 0);
    if (!impressions || !position) return null;
    const currentClicks = impressions * ctr;
    if (position <= 3) {
      return { lift: 0, targetCtr: ctr, currentClicks };
    }
    const targetCtr = 0.12;
    const projectedClicks = impressions * targetCtr;
    const lift = Math.max(0, Math.round(projectedClicks - currentClicks));
    return { lift, targetCtr, currentClicks };
  }

  function strictScoreFromIssues(baseScore, issueList) {
    if (!Array.isArray(issueList) || issueList.length === 0) return baseScore;
    const weightMap = {
      missing_title: 25,
      missing_meta_description: 20,
      missing_h1: 20,
      no_canonical: 15,
      title_too_long: 8,
      multiple_h1: 6,
      http_status_error: 30
    };
    const defaultPenalty = 6;
    const penalty = issueList.reduce((acc, issue) => {
      const key = String(issue?.issue_id || "");
      const weight = Object.prototype.hasOwnProperty.call(weightMap, key) ? weightMap[key] : defaultPenalty;
      return acc + weight;
    }, 0);
    const computed = Math.max(0, Math.min(100, 100 - penalty));
    return typeof computed === "number" ? computed : baseScore;
  }

  function narrowedScore(baseScore) {
    if (typeof baseScore !== "number") return baseScore;
    const s = Math.max(0, Math.min(100, baseScore));
    if (s >= 90) {
      return Math.round(80 + (s - 90) * 2);
    }
    return Math.round(s * 0.75);
  }

  function displayScore(baseScore, issueList) {
    if (scoreMode === "strict") return strictScoreFromIssues(baseScore, issueList);
    if (scoreMode === "narrowed") return narrowedScore(baseScore);
    return baseScore;
  }

  function scoreModeLabel() {
    if (scoreMode === "strict") return "Strict (agency-grade)";
    if (scoreMode === "narrowed") return "Narrowed scale";
    if (scoreMode === "explain") return "Explain-only";
    return "Normal (balanced)";
  }

  function explainScoreDetails(issueList) {
    if (!Array.isArray(issueList) || issueList.length === 0) return [];
    const top = issueList
      .filter((it) => it?.priority === "fix_now" || it?.severity === "High")
      .slice(0, 3);
    return top.map((it) => it?.title || it?.issue_id || "Issue");
  }

  function clampScore(value) {
    if (typeof value !== "number" || Number.isNaN(value)) return 0;
    return Math.max(0, Math.min(100, value));
  }

  function scoreToY(score, height = 70, top = 14, bottom = 60) {
    const s = clampScore(score);
    const range = bottom - top;
    return Math.round(bottom - (s / 100) * range);
  }

  function buildLiftPoints(baseScore, lift) {
    const base = clampScore(baseScore);
    const delta = Math.max(0, Math.min(30, lift));
    const targets = [
      base - 8,
      base - 4,
      base + Math.round(delta * 0.3),
      base + Math.round(delta * 0.55),
      base + Math.round(delta * 0.8),
      base + delta
    ].map(clampScore);
    const xs = [5, 45, 80, 120, 160, 195];
    return xs.map((x, idx) => `${x},${scoreToY(targets[idx])}`).join(" ");
  }

  function estimateScoreLiftFromIssues(issueList) {
    if (!Array.isArray(issueList) || issueList.length === 0) return 0;
    const fixNowCount = issueList.filter((it) => it?.priority === "fix_now").length;
    const fixNextCount = issueList.filter((it) => it?.priority === "fix_next").length;
    return Math.min(30, fixNowCount * 6 + fixNextCount * 3);
  }

  function toggleGuidedDone(id) {
    const key = `rp_guided_done::${(result?.url || url || "").trim()}`;
    if (!id || !key.trim()) return;
    setGuidedDone((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch {}
      return next;
    });
  }

  function computeMetrics(resultData, scoreValue) {
    const evidence = resultData?.evidence || {};
    const title = String(evidence?.title || "").trim();
    const metaDesc = String(evidence?.meta_description || "").trim();
    const h1 = String(evidence?.h1 || "").trim();
    const titleLen = typeof evidence?.title_char_count === "number" ? evidence.title_char_count : title.length;
    const wordCount = typeof evidence?.word_count === "number" ? evidence.word_count : 0;

    const visibility = clampScore(scoreValue ?? 0);
    let ctrClarity = 0;
    if (title) ctrClarity += 40;
    if (metaDesc) ctrClarity += 40;
    if (titleLen >= 30 && titleLen <= 60) ctrClarity += 20;
    ctrClarity = clampScore(ctrClarity);

    let contentDepth = clampScore(Math.round((wordCount / 600) * 100));
    if (wordCount === 0 && h1) contentDepth = 25;

    return { visibility, ctrClarity, contentDepth };
  }

  function buildSignalMetrics(resultData, scoreValue) {
    const evidence = resultData?.evidence || {};
    const cwv = resultData?.cwv || null;
    const metrics = [];

    const lcp = cwv?.field?.lcp ?? cwv?.lab?.lcp ?? null;
    const inp = cwv?.field?.inp ?? cwv?.lab?.inp ?? null;
    const cls = cwv?.field?.cls ?? cwv?.lab?.cls ?? null;
    if (lcp !== null || inp !== null || cls !== null) {
      const lcpScore = lcp === null ? 0 : lcp <= 2.5 ? 90 : lcp <= 4 ? 60 : 30;
      const inpScore = inp === null ? 0 : inp <= 200 ? 90 : inp <= 500 ? 60 : 30;
      const clsScore = cls === null ? 0 : cls <= 0.1 ? 90 : cls <= 0.25 ? 60 : 30;
      metrics.push(
        { label: "LCP", value: lcp !== null ? `${lcp}s` : "N/A", percent: lcpScore, color: "bg-emerald-400" },
        { label: "INP", value: inp !== null ? `${inp}ms` : "N/A", percent: inpScore, color: "bg-cyan-400" },
        { label: "CLS", value: cls !== null ? `${cls}` : "N/A", percent: clsScore, color: "bg-amber-400" }
      );
    } else {
      metrics.push(
        { label: "LCP", value: "Not available", percent: 0, color: "bg-[var(--rp-gray-100)]" },
        { label: "INP", value: "Not available", percent: 0, color: "bg-[var(--rp-gray-100)]" },
        { label: "CLS", value: "Not available", percent: 0, color: "bg-[var(--rp-gray-100)]" }
      );
    }

    const internalLinks = typeof evidence?.internal_links_count === "number" ? evidence.internal_links_count : 0;
    const externalLinks = typeof evidence?.external_links_count === "number" ? evidence.external_links_count : 0;
    const linkCoverage = clampScore(Math.round(Math.min(1, internalLinks / 20) * 100));
    const linkDepthAvg = evidence?.internal_link_depth_avg;
    const linkDepthScore =
      typeof linkDepthAvg === "number"
        ? clampScore(Math.round(100 - Math.min(5, Math.max(0, linkDepthAvg - 1)) * 15))
        : 0;

    metrics.push(
      {
        label: "Internal links",
        value: `${internalLinks}`,
        percent: linkCoverage,
        color: "bg-cyan-400"
      },
      {
        label: "Link depth",
        value: typeof linkDepthAvg === "number" ? `${linkDepthAvg} avg` : "N/A",
        percent: linkDepthScore,
        color: "bg-emerald-400"
      },
      {
        label: "External links",
        value: `${externalLinks}`,
        percent: clampScore(Math.round(Math.min(1, externalLinks / 15) * 100)),
        color: "bg-amber-400"
      }
    );

    if (typeof scoreValue === "number") {
      metrics.unshift({
        label: "Overall score",
        value: `${scoreValue}`,
        percent: clampScore(scoreValue),
        color: "bg-emerald-400"
      });
    }

    return metrics;
  }

  function buildSeverityStats(issueList) {
    const stats = { High: 0, Medium: 0, Low: 0 };
    if (!Array.isArray(issueList)) return stats;
    issueList.forEach((issue) => {
      const sev = String(issue?.severity || "").toLowerCase();
      if (sev === "high") stats.High += 1;
      else if (sev === "medium") stats.Medium += 1;
      else if (sev === "low") stats.Low += 1;
    });
    return stats;
  }

  function buildPriorityStats(issueList) {
    const stats = { fix_now: 0, fix_next: 0, fix_later: 0 };
    if (!Array.isArray(issueList)) return stats;
    issueList.forEach((issue) => {
      const pr = String(issue?.priority || "").toLowerCase();
      if (pr === "fix_now") stats.fix_now += 1;
      else if (pr === "fix_next") stats.fix_next += 1;
      else stats.fix_later += 1;
    });
    return stats;
  }

  function buildSeveritySegments(issueList) {
    const stats = buildSeverityStats(issueList);
    const total = Math.max(1, stats.High + stats.Medium + stats.Low);
    return [
      { label: "High", value: stats.High, color: "#FF788F" },
      { label: "Medium", value: stats.Medium, color: "#F6C453" },
      { label: "Low", value: stats.Low, color: "#45E0A8" }
    ].map((entry) => ({
      ...entry,
      percent: (entry.value / total) * 100
    }));
  }

  function getCwvFieldValue(resultData, key) {
    const cwv = resultData?.cwv || null;
    const field = cwv?.field || {};
    const lab = cwv?.lab || {};
    const raw = field[key] ?? lab[key] ?? null;
    return typeof raw === "number" ? raw : null;
  }

  function getCwvPair(resultData, key) {
    const cwv = resultData?.cwv || null;
    const field = cwv?.field || {};
    const lab = cwv?.lab || {};
    const fieldVal = typeof field[key] === "number" ? field[key] : null;
    const labVal = typeof lab[key] === "number" ? lab[key] : null;
    return { field: fieldVal, lab: labVal };
  }

  function cwvBadgeClass(kind, value) {
    if (typeof value !== "number") return "bg-[var(--rp-gray-50)] text-[var(--rp-text-500)] border border-[var(--rp-border)]";
    if (kind === "lcp") {
      if (value <= 2.5) return "bg-emerald-100 text-emerald-700 border border-emerald-200";
      if (value <= 4) return "bg-amber-100 text-amber-700 border border-amber-200";
      return "bg-rose-100 text-rose-700 border border-rose-200";
    }
    if (kind === "inp") {
      if (value <= 200) return "bg-emerald-100 text-emerald-700 border border-emerald-200";
      if (value <= 500) return "bg-amber-100 text-amber-700 border border-amber-200";
      return "bg-rose-100 text-rose-700 border border-rose-200";
    }
    if (kind === "cls") {
      if (value <= 0.1) return "bg-emerald-100 text-emerald-700 border border-emerald-200";
      if (value <= 0.25) return "bg-amber-100 text-amber-700 border border-amber-200";
      return "bg-rose-100 text-rose-700 border border-rose-200";
    }
    return "bg-[var(--rp-gray-50)] text-[var(--rp-text-500)] border border-[var(--rp-border)]";
  }

  function guidedSteps(items, showAll = false) {
    if (!Array.isArray(items) || items.length === 0) return [];
    const prioritized = [...items].sort((a, b) => {
      const pa = a?.priority === "fix_now" ? 0 : a?.priority === "fix_next" ? 1 : 2;
      const pb = b?.priority === "fix_now" ? 0 : b?.priority === "fix_next" ? 1 : 2;
      if (pa !== pb) return pa - pb;
      const sa = a?.severity === "High" ? 0 : a?.severity === "Medium" ? 1 : 2;
      const sb = b?.severity === "High" ? 0 : b?.severity === "Medium" ? 1 : 2;
      return sa - sb;
    });
    const sliceCount = showAll ? prioritized.length : 3;
    return prioritized.slice(0, sliceCount).map((it) => {
      const rawTitle = String(it?.title || it?.issue_id || "Issue");
      const title = rawTitle.replace(/_/g, " ");
      const why = String(it?.why || "").trim();
      const fix = String(it?.example_fix || "").trim();
      const id = String(it?.issue_id || title).trim();
      return {
        id,
        title,
        why,
        fix
      };
    });
  }

  return (
<AppShell data-testid="audit-page"
      title="SEO Page Audit"
      subtitle="SEO tools that feel instant. Paste a URL and get a score, quick wins, and a prioritized list of issues."
    >

      <div className="flex flex-col gap-5">
        <div className="grid gap-4 md:grid-cols-4">
          {[
            { label: "SEO health", value: "88", tone: "text-emerald-600" },
            { label: "Issues found", value: "42", tone: "text-rose-600" },
            { label: "Quick wins", value: "16", tone: "text-amber-600" },
            { label: "Estimated lift", value: "+31%", tone: "text-[var(--rp-indigo-700)]" }
          ].map((item) => (
            <div key={item.label} className="rp-kpi-card rounded-2xl border border-[var(--rp-border)] bg-white p-4 shadow-sm">
              <div className="text-xs text-[var(--rp-text-500)]">{item.label}</div>
              <div className={`mt-2 text-2xl font-semibold ${item.tone}`}>{item.value}</div>
            </div>
          ))}
        </div>
        {authUser?.role === "member" && (
          <div className="rounded-2xl border border-[var(--rp-border)] bg-[var(--rp-gray-50)] p-4 text-sm text-[var(--rp-text-600)]">
            You’re in a member role. Ask your admin to unlock full fixes, briefs, and exports.
            <div className="mt-3 flex gap-2">
              <button
                className="rp-btn-secondary rp-btn-sm h-9 px-3 text-xs"
                onClick={async () => {
                  try {
                    const token = getAuthToken();
                    await fetch("/api/request-upgrade", {
                      method: "POST",
                      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
                    });
                    setRequestStatus("Request sent.");
                    setTimeout(() => setRequestStatus(""), 2000);
                  } catch {}
                }}
              >
                Request upgrade
              </button>
              {requestStatus && <span className="text-xs text-emerald-600">{requestStatus}</span>}
            </div>
          </div>
        )}
        {!allowAudit && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            The Audit tool is disabled for your team. Ask an admin to enable it.
          </div>
        )}
        {requireVerified && authUser && authUser.verified === false && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <div className="font-semibold">Email verification required</div>
            <div className="mt-1 text-xs text-amber-700">
              This workspace requires verified emails before running audits.
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                className="rp-btn-primary rp-btn-sm h-9 px-3 text-xs"
                onClick={async () => {
                  if (!authUser?.email) return;
                  await fetch("/api/reset-password", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: authUser.email, verifyOnly: true })
                  });
                }}
              >
                Resend verification email
              </button>
              <Link to="/auth/verify" className="rp-btn-secondary rp-btn-sm h-9 px-3 text-xs">
                I already have a token
              </Link>
            </div>
          </div>
        )}
        <div className="rp-hero rounded-2xl border border-white/10 p-6 text-white shadow-[0_30px_80px_rgba(66,25,131,0.25)] md:p-8">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="flex flex-col gap-4">
              <div className="inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/80">
                RankyPulse Audit
              </div>
              <h2 className="text-3xl font-semibold leading-tight md:text-4xl">
                SEO clarity in one scan.
              </h2>
              <p className="text-sm text-white/80 md:text-base">
                Paste a URL to generate a score, quick wins, and a prioritized fix plan in seconds.
              </p>
              <div className="flex flex-wrap items-center gap-3 text-xs text-white/70">
                <span className="rounded-full border border-white/20 px-3 py-1">SEO basics + content depth</span>
                <span className="rounded-full border border-white/20 px-3 py-1">Core Web Vitals when available</span>
                <span className="rounded-full border border-white/20 px-3 py-1">Client‑ready report</span>
              </div>
            </div>
            <div className="rounded-2xl bg-white p-5 text-[var(--rp-text-900)] shadow-[0_12px_30px_rgba(15,23,42,0.15)]">
              <div className="flex items-center justify-between text-xs font-semibold text-[var(--rp-text-500)]">
                <span>Audit setup</span>
                <span className="rounded-full bg-[var(--rp-gray-100)] px-2 py-1 rp-body-xsmall">~20s</span>
              </div>
              <div className="mt-3 grid gap-4">
                <label className="block text-xs font-semibold text-[var(--rp-text-500)]">Page URL</label>
                <input
                  aria-label="Page URL"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/pricing"
                  className="rp-input"
                />
                <div className="grid gap-4 md:grid-cols-[1fr_150px]">
                  <div className="rp-body-xsmall">Tip: test with https://example.com</div>
                  <select className="rp-input text-sm">
                    <option>US</option>
                    <option>UK</option>
                    <option>EU</option>
                  </select>
                </div>
                <button
                  onClick={run}
                  disabled={!hasUrl || status === "loading" || !allowAudit}
                  title={auditDisabledReason}
                  className={[
                    "rp-btn-primary w-full",
                    !hasUrl || status === "loading" || !allowAudit ? "opacity-50 cursor-not-allowed" : ""
                  ].join(" ")}
                >
                  <IconPlay size={16} />
                  {status === "loading" ? "Running..." : "Run SEO Audit"}
                </button>
                {auditDisabledReason && (!hasUrl || status === "loading" || !allowAudit || (requireVerified && authUser && authUser.verified === false)) && (
                  <div className="text-xs text-[var(--rp-text-500)]">{auditDisabledReason}</div>
                )}
              </div>
              <div className="mt-4 grid grid-cols-3 gap-4 text-xs text-[var(--rp-text-500)]">
                {(() => {
                  const previewScore = typeof scoreValue === "number" ? scoreValue : 0;
                  const totalIssues = issues.length;
                  const fixNow = issues.filter((it) => it?.priority === "fix_now").length;
                  return (
                    <>
                      <div className="rounded-lg border border-[var(--rp-border)] bg-[var(--rp-gray-50)] p-2">
                        <div className="text-[11px] uppercase tracking-wide text-[var(--rp-text-400)]">Score</div>
                        <div className="text-sm font-semibold text-[var(--rp-text-800)]">
                          {previewScore || "—"}
                        </div>
                      </div>
                      <div className="rounded-lg border border-[var(--rp-border)] bg-[var(--rp-gray-50)] p-2">
                        <div className="text-[11px] uppercase tracking-wide text-[var(--rp-text-400)]">Issues</div>
                        <div className="text-sm font-semibold text-[var(--rp-text-800)]">
                          {totalIssues || "—"}
                        </div>
                      </div>
                      <div className="rounded-lg border border-[var(--rp-border)] bg-[var(--rp-gray-50)] p-2">
                        <div className="text-[11px] uppercase tracking-wide text-[var(--rp-text-400)]">Fix Now</div>
                        <div className="text-sm font-semibold text-[var(--rp-text-800)]">
                          {fixNow || "—"}
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>

        {result?.url && (
          <div className="flex flex-wrap items-center gap-2">
            <ShareAuditButton result={result} />
            <button
              onClick={() => exportAuditSummary(result)}
              className="rp-btn-secondary rp-btn-sm h-9 px-3 text-xs"
            >
              Export summary
            </button>
            <button
              onClick={() => exportAuditPdf({
                ...result,
                score: typeof scoreValue === "number" ? scoreValue : result.score,
                branding: {
                  name: reportBrandName,
                  color: reportBrandColor,
                  logo: reportBrandLogo
                }
              })}
              className="rp-btn-secondary rp-btn-sm h-9 px-3 text-xs"
            >
              Export PDF
            </button>
            <button
              onClick={() => {
                const u = result?.url;
                if (!u) return;
                if (isMonitored(u)) {
                  removeMonitor(u);
                } else {
                  upsertMonitor({ url: u });
                }
                refreshMonitors();
              }}
              className="rp-btn-secondary rp-btn-sm h-9 px-3 text-xs"
            >
              {isMonitored(result.url) ? "Stop monitoring" : "Monitor this page"}
            </button>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {status !== "loading" && hasResumeSnapshot && (
            <button
              onClick={() => {
                try {
                  const raw = localStorage.getItem("rp_audit_snapshot::" + (url || "").trim());
                  if (!raw) return;
                  const snap = JSON.parse(raw);
                  setError("");
                  setResult(snap);
                  setStatus("success");
                } catch {}
              }}
              className="rp-btn-secondary text-sm"
            >
              <IconClock size={14} />
              Resume audit
            </button>
          )}

          {status === "success" && (
            <button
              onClick={() => {
                __rp_markSkipAutoRun();
                run();
              }}
              className="rp-btn-secondary text-sm"
            >
              <IconRefresh size={14} />
              Re-run audit
            </button>
          )}
        </div>

        {status === "idle" && (
          <div className="rp-card p-5 text-sm text-[var(--rp-text-500)]">
            Enter a URL above to run an audit.
          </div>
        )}

        {status === "loading" && (
          <div className="rp-card p-5 text-sm text-[var(--rp-text-600)]">
            Analyzing... this may take up to 20 seconds.
          </div>
        )}

        {status === "error" && (
          <div className="rounded-2xl border border-rose-300/60 bg-rose-100/70 p-5 text-sm text-rose-700">
            {String(error || "")}
          </div>
        )}

        {status === "success" && result?.ok === false && (
          <div className="rounded-2xl border border-rose-300/60 bg-rose-100/70 p-4 text-sm text-rose-700">
            {result?.warning || "Audit failed. See debug for details."}
          </div>
        )}

        {status === "success" && (
          <div className="grid gap-5 md:grid-cols-12">
            <div className="md:col-span-12 rp-card px-4 py-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="rp-section-title">Audit overview</div>
                  <div className="mt-1 text-xs text-[var(--rp-text-500)]">
                    Choose how strict the scoring should be. Narrowed is the default for realistic ranges.
                  </div>
                  <button
                    className="mt-2 text-xs font-semibold text-[var(--rp-indigo-700)] hover:text-[var(--rp-indigo-900)]"
                    onClick={() => setShowScoreInfo((prev) => !prev)}
                  >
                    Learn about scoring
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2 rounded-2xl border border-[var(--rp-border)] bg-[var(--rp-gray-50)] p-2 text-xs text-[var(--rp-text-500)]">
                    <button
                      type="button"
                      className={[
                        "rounded-xl px-3 py-1",
                        scoreMode === "normal" ? "bg-white text-[var(--rp-text-900)] shadow-sm" : "text-[var(--rp-text-500)]"
                      ].join(" ")}
                      onClick={() => setScoreMode("normal")}
                    >
                      Normal
                    </button>
                    <button
                      type="button"
                      className={[
                        "rounded-xl px-3 py-1",
                        scoreMode === "narrowed" ? "bg-white text-[var(--rp-text-900)] shadow-sm" : "text-[var(--rp-text-500)]"
                      ].join(" ")}
                      onClick={() => setScoreMode("narrowed")}
                    >
                      Narrowed
                    </button>
                    <button
                      type="button"
                      className={[
                        "rounded-xl px-3 py-1",
                        scoreMode === "strict" ? "bg-white text-[var(--rp-text-900)] shadow-sm" : "text-[var(--rp-text-500)]"
                      ].join(" ")}
                      onClick={() => setScoreMode("strict")}
                    >
                      Strict
                    </button>
                    <button
                      type="button"
                      className={[
                        "rounded-xl px-3 py-1",
                        scoreMode === "explain" ? "bg-white text-[var(--rp-text-900)] shadow-sm" : "text-[var(--rp-text-500)]"
                      ].join(" ")}
                      onClick={() => setScoreMode("explain")}
                    >
                      Explain
                    </button>
                  </div>
                  {scoreMode === "strict" && (
                    <span className="rp-chip rp-chip-warning">
                      Strict mode is re-ranking issues
                    </span>
                  )}
                  {scoreMode === "narrowed" && (
                    <span className="rp-chip rp-chip-info">
                      Narrowed scale lowers most scores
                    </span>
                  )}
                  {scoreMode === "explain" && (
                    <span className="rp-chip rp-chip-success">
                      Explanation-focused view
                    </span>
                  )}
                  <label className="flex items-center gap-2 text-xs text-[var(--rp-text-500)]">
                    <input
                      type="checkbox"
                      checked={advancedView}
                      onChange={(e) => setAdvancedView(e.target.checked)}
                    />
                    Advanced view
                  </label>
                </div>
              </div>
              {showScoreInfo && (
              <div className="mt-4 rounded-2xl border border-[var(--rp-border)] bg-[var(--rp-gray-50)] p-4 text-xs text-[var(--rp-text-600)]">
                  <div className="rp-section-title">Scoring model</div>
                  <p className="mt-2">
                    Scores weigh on-page basics, content depth, internal linking, and Core Web Vitals when available.
                    Narrowed mode compresses ranges so only exceptional pages reach 80-100.
                  </p>
                  <p className="mt-2 text-[var(--rp-text-500)]">
                    Strict mode applies heavier penalties for missing fundamentals.
                  </p>
                </div>
              )}
            </div>
            {summaryCards.length > 0 && (
              <div className="md:col-span-12 rp-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="rp-section-title">Page snapshot</div>
                    <div className="mt-1 text-xs text-[var(--rp-text-500)]">
                      Key on-page basics detected from the HTML.
                    </div>
                  </div>
                  <span className="rp-chip rp-chip-neutral">Based on HTML</span>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-4">
                  {summaryCards.map((card) => (
                    <div key={card.label} className="rp-metric-tile rounded-xl border border-[var(--rp-border)] bg-white p-4 shadow-sm">
                      <div className="flex items-center gap-2 text-sm font-semibold text-[var(--rp-text-800)]">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-[rgba(66,25,131,0.08)] text-[var(--rp-indigo-700)]">
                          {card.icon}
                        </span>
                        {card.label}
                      </div>
                      <div className="mt-2 text-lg font-semibold text-[var(--rp-text-900)] tabular-nums">
                        {card.value}
                      </div>
                      <div className="mt-1 text-xs text-[var(--rp-text-500)]">{card.hint}</div>
                      <div className="mt-2 h-1.5 w-full rounded-full bg-[var(--rp-gray-100)]">
                        <div className={`rp-bar h-1.5 rounded-full ${card.color}`} style={{ width: `${card.percent}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {gscStatus !== "idle" && (
              <div className="md:col-span-12 rp-card p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="rp-section-title">Search Console snapshot</div>
                    <div className="mt-1 text-xs text-[var(--rp-text-500)]">
                      Trusted ranking signals from Google Search Console (last 28 days).
                    </div>
                  </div>
                  <span className="rp-chip rp-chip-neutral">GSC</span>
                </div>
                {gscStatus === "loading" && (
                  <div className="mt-3 text-sm text-[var(--rp-text-500)]">Loading Search Console data…</div>
                )}
                {gscStatus === "success" && gscData?.metrics && (
                  <div className="mt-3 grid gap-3 md:grid-cols-4">
                    {[
                      { label: "Clicks", value: gscData.metrics.clicks },
                      { label: "Impressions", value: gscData.metrics.impressions },
                      { label: "CTR", value: `${Math.round(gscData.metrics.ctr * 1000) / 10}%` },
                      { label: "Avg position", value: Math.round(gscData.metrics.position * 10) / 10 }
                    ].map((item) => (
                      <div key={item.label} className="rp-metric-tile rounded-xl border border-[var(--rp-border)] bg-white p-4 shadow-sm">
                        <div className="text-xs text-[var(--rp-text-500)]">{item.label}</div>
                        <div className="mt-2 text-lg font-semibold text-[var(--rp-text-900)] tabular-nums">{item.value}</div>
                      </div>
                    ))}
                  </div>
                )}
                {(gscStatus === "empty" || gscStatus === "error") && (
                  <div className="mt-3 text-sm text-[var(--rp-text-500)]">
                    Connect Google Search Console to pull trusted ranking data.{" "}
                    <a className="font-semibold text-[var(--rp-indigo-700)]" href={`/api/gsc/auth/start?state=${encodeURIComponent(anonId)}`}>Connect GSC</a>
                  </div>
                )}
              </div>
            )}
            <div className="md:col-span-12 rp-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="rp-section-title">Automation & retention</div>
                  <div className="mt-1 text-xs text-[var(--rp-text-500)]">
                    Push AI fixes to your workflow and receive weekly change summaries.
                  </div>
                </div>
                <span className="rp-chip rp-chip-neutral">Subscription drivers</span>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="block text-sm text-[var(--rp-text-600)]">
                  Fix delivery webhook (optional)
                  <input
                    className="rp-input mt-2"
                    value={fixWebhookUrl}
                    onChange={(e) => {
                      setFixWebhookUrl(e.target.value);
                      try { localStorage.setItem("rp_fix_webhook_url", e.target.value); } catch {}
                    }}
                    placeholder="https://hooks.zapier.com/..."
                  />
                  <div className="mt-1 text-xs text-[var(--rp-text-400)]">
                    Used by AI fix buttons to push updates into your stack.
                  </div>
                </label>
                <div className="rounded-xl border border-[var(--rp-border)] bg-[var(--rp-gray-50)] p-4">
                  <div className="text-sm font-semibold text-[var(--rp-text-700)]">CMS push (Phase 2)</div>
                  <div className="mt-2 grid gap-3">
                    <label className="text-xs text-[var(--rp-text-500)]">
                      WordPress site URL
                      <input
                        className="rp-input mt-2"
                        value={wpSiteUrl}
                        onChange={(e) => {
                          setWpSiteUrl(e.target.value);
                          try { localStorage.setItem("rp_wp_site_url", e.target.value); } catch {}
                        }}
                        placeholder="https://yourwordpress.com"
                      />
                    </label>
                    <label className="text-xs text-[var(--rp-text-500)]">
                      Shopify shop domain
                      <input
                        className="rp-input mt-2"
                        value={shopifyShop}
                        onChange={(e) => {
                          setShopifyShop(e.target.value);
                          try { localStorage.setItem("rp_shopify_shop", e.target.value); } catch {}
                        }}
                        placeholder="your-shop.myshopify.com"
                      />
                    </label>
                  </div>
                  <div className="mt-2 text-xs text-[var(--rp-text-400)]">
                    Connect your CMS to push AI fixes directly into your live pages.
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button
                      className="rp-btn-secondary rp-btn-sm h-9 px-3 text-xs"
                      onClick={() => {
                        if (!wpSiteUrl || !anonId) return;
                        const url = `/api/wp/auth/start?owner=${encodeURIComponent(anonId)}&site=${encodeURIComponent(wpSiteUrl)}`;
                        window.location.href = url;
                      }}
                    >
                      {wpStatus === "connected" ? "Re-connect WordPress" : "Connect WordPress"}
                    </button>
                    <button
                      className="rp-btn-secondary rp-btn-sm h-9 px-3 text-xs"
                      onClick={async () => {
                        if (!anonId) return;
                        await fetch("/api/wp/disconnect", {
                          method: "POST",
                          headers: { "Content-Type": "application/json", "x-rp-anon-id": anonId }
                        });
                        setWpStatus("disconnected");
                      }}
                    >
                      Disconnect WP
                    </button>
                    <button
                      className="rp-btn-secondary rp-btn-sm h-9 px-3 text-xs"
                      onClick={() => {
                        if (!shopifyShop || !anonId) return;
                        const url = `/api/shopify/auth/start?owner=${encodeURIComponent(anonId)}&shop=${encodeURIComponent(shopifyShop)}`;
                        window.location.href = url;
                      }}
                    >
                      {shopifyStatus === "connected" ? "Re-connect Shopify" : "Connect Shopify"}
                    </button>
                    <button
                      className="rp-btn-secondary rp-btn-sm h-9 px-3 text-xs"
                      onClick={async () => {
                        if (!anonId) return;
                        await fetch("/api/shopify/disconnect", {
                          method: "POST",
                          headers: { "Content-Type": "application/json", "x-rp-anon-id": anonId }
                        });
                        setShopifyStatus("disconnected");
                      }}
                    >
                      Disconnect Shopify
                    </button>
                  </div>
                </div>
                <div className="rounded-xl border border-[var(--rp-border)] bg-[var(--rp-gray-50)] p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-[var(--rp-text-700)]">Weekly delta report</div>
                    <label className="flex items-center gap-2 text-xs text-[var(--rp-text-500)]">
                      <input
                        type="checkbox"
                        checked={weeklyEnabled}
                        onChange={(e) => {
                          const next = e.target.checked;
                          setWeeklyEnabled(next);
                          try { localStorage.setItem("rp_weekly_enabled", String(next)); } catch {}
                        }}
                      />
                      Enable
                    </label>
                  </div>
                  <div className="mt-2 text-xs text-[var(--rp-text-500)]">
                    We’ll email a summary of fixes + regressions once per week.
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <input
                      className="rp-input h-9 flex-1 text-sm"
                      value={weeklyEmail}
                      onChange={(e) => {
                        setWeeklyEmail(e.target.value);
                        try { localStorage.setItem("rp_weekly_email", e.target.value); } catch {}
                      }}
                      placeholder="you@company.com"
                    />
                    <button
                      className="rp-btn-secondary rp-btn-sm h-9 px-3 text-xs"
                      onClick={async () => {
                        if (!weeklyEmail || !result?.url) return;
                        setWeeklyStatus("saving");
                        const res = await fetch("/api/weekly-report/subscribe", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            url: result.url,
                            email: weeklyEmail,
                            enabled: weeklyEnabled
                          })
                        });
                        setWeeklyStatus(res.ok ? "saved" : "error");
                        setTimeout(() => setWeeklyStatus(""), 2000);
                      }}
                    >
                      {weeklyStatus === "saving" ? "Saving…" : "Save"}
                    </button>
                  </div>
                  {weeklyStatus === "saved" && (
                    <div className="mt-2 text-xs text-emerald-600">Weekly report saved.</div>
                  )}
                  {weeklyStatus === "error" && (
                    <div className="mt-2 text-xs text-rose-600">Could not save report settings.</div>
                  )}
                </div>
              </div>
              <div className="mt-4 rounded-xl border border-[var(--rp-border)] bg-white p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-[var(--rp-text-700)]">Weekly email preview</div>
                  <span className="rp-chip rp-chip-info">Preview</span>
                </div>
                {(() => {
                  const total = issues.length;
                  const fixNow = issues.filter((it) => it?.priority === "fix_now").length;
                  const highSev = issues.filter((it) => it?.severity === "High").length;
                  const sampleFixed = Math.max(0, Math.min(3, fixNow));
                  const sampleNew = Math.max(0, Math.min(2, highSev));
                  const previewHtml = `
                    <div style="font-family: Inter, Arial, sans-serif; color:#0f172a;">
                      <div style="background:#421983;padding:16px;border-radius:12px 12px 0 0;color:#fff;">
                        <div style="font-size:13px;opacity:0.8;">Weekly SEO Delta</div>
                        <div style="font-size:20px;font-weight:700;">${result?.url || "your page"}</div>
                      </div>
                      <div style="border:1px solid #e2e8f0;border-top:0;border-radius:0 0 12px 12px;padding:16px;background:#fff;">
                        <div style="display:flex;gap:12px;flex-wrap:wrap;">
                          <div style="flex:1;min-width:140px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:10px;">
                            <div style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.12em;">Score change</div>
                            <div style="font-size:18px;font-weight:700;color:#0f172a;">+${Math.min(5, fixNow)} pts</div>
                          </div>
                          <div style="flex:1;min-width:140px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:10px;">
                            <div style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.12em;">Fixed</div>
                            <div style="font-size:18px;font-weight:700;color:#0f172a;">${sampleFixed}</div>
                          </div>
                          <div style="flex:1;min-width:140px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:10px;">
                            <div style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.12em;">New issues</div>
                            <div style="font-size:18px;font-weight:700;color:#0f172a;">${sampleNew}</div>
                          </div>
                        </div>
                        <div style="margin-top:12px;font-size:13px;color:#475569;">
                          You fixed ${sampleFixed} items, but ${sampleNew} new issues appeared. Total tracked: ${total}.
                        </div>
                      </div>
                    </div>
                  `;
                  return (
                    <div className="mt-3 rounded-xl border border-[var(--rp-border)] bg-[var(--rp-gray-50)] p-4 text-xs text-[var(--rp-text-600)]">
                      <div className="text-[11px] text-[var(--rp-text-500)] mb-2">
                        Subject: Weekly audit update for {result?.url || "your page"}
                      </div>
                      <div
                        className="rounded-xl border border-[var(--rp-border)] bg-white p-3"
                        dangerouslySetInnerHTML={{ __html: previewHtml }}
                      />
                    </div>
                  );
                })()}
              </div>
              <div className="mt-4 rounded-xl border border-[var(--rp-border)] bg-white p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-[var(--rp-text-700)]">White‑label PDF branding</div>
                  <span className="rp-chip rp-chip-neutral">Agencies</span>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  <label className="text-xs text-[var(--rp-text-500)]">
                    Brand name
                    <input
                      className="rp-input mt-2"
                      value={reportBrandName}
                      onChange={(e) => {
                        setReportBrandName(e.target.value);
                        try { localStorage.setItem("rp_report_brand_name", e.target.value); } catch {}
                      }}
                      placeholder="Agency name"
                    />
                  </label>
                  <label className="text-xs text-[var(--rp-text-500)]">
                    Brand color
                    <input
                      className="rp-input mt-2"
                      value={reportBrandColor}
                      onChange={(e) => {
                        setReportBrandColor(e.target.value);
                        try { localStorage.setItem("rp_report_brand_color", e.target.value); } catch {}
                      }}
                      placeholder="#FF642D"
                    />
                  </label>
                  <label className="text-xs text-[var(--rp-text-500)]">
                    Logo URL
                    <input
                      className="rp-input mt-2"
                      value={reportBrandLogo}
                      onChange={(e) => {
                        setReportBrandLogo(e.target.value);
                        try { localStorage.setItem("rp_report_brand_logo", e.target.value); } catch {}
                      }}
                      placeholder="https://cdn.com/logo.png"
                    />
                  </label>
                </div>
                <div className="mt-2 text-xs text-[var(--rp-text-400)]">
                  Applied to PDF exports to keep reports client‑ready.
                </div>
              </div>
            </div>
            <div className="rp-card p-5 md:col-span-4 rp-fade-in">
              <div className="flex items-center gap-2 rp-section-title">
                <span>SEO Score</span>
                <span className="relative inline-flex group" aria-hidden="true">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-[var(--rp-border)] bg-[var(--rp-gray-50)] text-[11px] text-[var(--rp-text-500)]">
                    ?
                  </span>
                  <span className="pointer-events-none absolute left-0 top-7 z-10 w-64 rounded-xl border border-[var(--rp-border)] bg-white p-3 text-[11px] leading-relaxed text-[var(--rp-text-500)] opacity-0 shadow-lg transition group-hover:opacity-100">
                    Scoring model factors in on-page basics, content depth, internal links, and Core Web Vitals when available.
                  </span>
                </span>
              </div>
              <div className="mt-1 text-3xl font-semibold text-[var(--rp-text-900)] tabular-nums">
                {(result && result.ok === false)
                  ? "-"
                  : (typeof scoreValue === "number" ? scoreValue : "-")}
              </div>
              {typeof scoreValue === "number" && (
              <div className="mt-3">
                {(() => {
                  const clamped = Math.max(0, Math.min(100, scoreValue));
                  const radius = 48;
                  const cx = 60;
                  const cy = 60;
                  const circumference = 2 * Math.PI * radius;
                  const offset = circumference * (1 - clamped / 100);
                  const angleDeg = (clamped / 100) * 360 - 90;
                  const angleRad = (Math.PI / 180) * angleDeg;
                  const dotX = cx + Math.cos(angleRad) * radius;
                  const dotY = cy + Math.sin(angleRad) * radius;
                  return (
                    <div className="flex items-center gap-3">
                      <svg viewBox="0 0 120 120" className="h-24 w-24">
                          <defs>
                            <linearGradient id="donutGradient" x1="0" y1="0" x2="1" y2="1">
                              <stop offset="0%" stopColor="#fb7185" />
                              <stop offset="50%" stopColor="#facc15" />
                              <stop offset="100%" stopColor="#34d399" />
                            </linearGradient>
                          </defs>
                          <circle
                            cx={cx}
                            cy={cy}
                            r={radius}
                            stroke="rgba(148,163,184,0.25)"
                            strokeWidth="10"
                            fill="none"
                          />
                          <circle
                            cx={cx}
                            cy={cy}
                            r={radius}
                            stroke="url(#donutGradient)"
                            strokeWidth="10"
                            fill="none"
                            className="rp-donut-progress"
                            strokeDasharray={circumference}
                            strokeDashoffset={offset}
                            strokeLinecap="round"
                            transform={`rotate(-90 ${cx} ${cy})`}
                          />
                          <circle cx={dotX} cy={dotY} r="4" fill="#ff642d" />
                          <text x={cx} y={cy + 4} textAnchor="middle" fill="#0f172a" fontSize="14" fontWeight="600">
                            {clamped}
                          </text>
                          <text x={cx} y={cy + 18} textAnchor="middle" fill="#64748b" fontSize="9">
                            / 100
                          </text>
                        </svg>
                      <div className="text-[11px] text-[var(--rp-text-500)] space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="inline-block h-2 w-2 rounded-full bg-rose-400"></span>
                          <span>0–49 Low</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="inline-block h-2 w-2 rounded-full bg-amber-400"></span>
                          <span>50–79 OK</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="inline-block h-2 w-2 rounded-full bg-emerald-400"></span>
                          <span>80–100 Strong</span>
                        </div>
                        <div className="mt-1.5 rp-body-xsmall text-[var(--rp-text-400)]">
                          Score recalculates with mode toggles.
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
              )}
              <div className="mt-1.5 rp-body-small">
                {(typeof scoreValue === "number" ? scoreLabel(scoreValue) : "") || "Score is a directional signal, not a grade."}
              </div>
              <div className="mt-1.5 rp-body-xsmall">
                Mode: {scoreModeLabel()}
              </div>
              {scoreMode === "explain" && (
                <div className="mt-1.5 rp-body-xsmall">
                  {explainScoreDetails(issues).length > 0
                    ? `Top drivers: ${explainScoreDetails(issues).join(", ")}.`
                    : "Score is based on critical SEO checks and page structure."}
                </div>
              )}
              <div className="mt-1.5 rp-body-xsmall">
                Fixing the top issues usually improves visibility and click-through rates.
              </div>
              <div className="mt-3 rounded-xl border border-[var(--rp-border)] bg-[var(--rp-gray-50)] p-4">
                <div className="flex items-center justify-between text-xs text-[var(--rp-text-500)]">
                  <span>Projected score lift</span>
                  <span>Next 4 fixes</span>
                </div>
                <svg viewBox="0 0 200 70" className="mt-2 h-16 w-full">
                  <defs>
                    <linearGradient id="liftLine" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#22d3ee" />
                      <stop offset="100%" stopColor="#34d399" />
                    </linearGradient>
                  </defs>
                  {(() => {
                    const baseScore = scoreValue ?? 0;
                    const fixNowCount = issues.filter((it) => it?.priority === "fix_now").length;
                    const fixNextCount = issues.filter((it) => it?.priority === "fix_next").length;
                    const lift = Math.min(30, fixNowCount * 6 + fixNextCount * 3);
                    const linePoints = buildLiftPoints(baseScore, lift);
                    const areaPoints = `5,70 ${linePoints} 195,70`;
                    return (
                      <>
                        <polyline
                          fill="none"
                          stroke="url(#liftLine)"
                          strokeWidth="3"
                          points={linePoints}
                        />
                        <polyline
                          fill="url(#liftLine)"
                          opacity="0.15"
                          points={areaPoints}
                        />
                      </>
                    );
                  })()}
                </svg>
                <div className="mt-1 rp-body-xsmall">
                  Fix top issues to unlock the next score lift.
                </div>
              </div>
              <div className="mt-4 rounded-xl border border-[var(--rp-border)] bg-[var(--rp-gray-50)] p-4">
                <div className="flex items-center justify-between text-xs text-[var(--rp-text-500)]">
                  <span>Traffic & revenue impact (estimate)</span>
                  <span className="rp-chip rp-chip-neutral">GSC-based</span>
                </div>
                {(() => {
                  const uplift = estimateTrafficUplift();
                  if (!uplift) {
                    return (
                      <div className="mt-2 text-xs text-[var(--rp-text-500)]">
                        Connect Google Search Console to estimate potential traffic lift.
                      </div>
                    );
                  }
                  const value = Number(valuePerVisit || 0);
                  const revenue = Math.round(uplift.lift * value);
                  return (
                    <div className="mt-2 space-y-2 text-xs text-[var(--rp-text-600)]">
                      <div>
                        Potential uplift: <span className="font-semibold text-[var(--rp-text-800)]">~{uplift.lift} visits / month</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-[var(--rp-text-500)]">Value per visit ($)</label>
                        <input
                          className="rp-input h-8 w-20 text-xs"
                          value={valuePerVisit}
                          onChange={(e) => {
                            const next = e.target.value;
                            setValuePerVisit(next);
                            try { localStorage.setItem("rp_value_per_visit", String(next)); } catch {}
                          }}
                        />
                        <span className="text-[var(--rp-text-500)]">Estimated monthly impact:</span>
                        <span className="font-semibold text-[var(--rp-text-800)]">${Number.isFinite(revenue) ? revenue : 0}</span>
                      </div>
                      <div className="text-[10px] text-[var(--rp-text-400)]">
                        Assumes improvement toward a top‑3 CTR benchmark.
                      </div>
                    </div>
                  );
                })()}
              </div>
              <button
                onClick={() => setPricingOpen(true)}
                className="rp-btn-secondary mt-4 w-full text-sm"
              >
                <IconArrowRight size={14} />
                Unlock Full Fix Plan
              </button>
            </div>

            <div id="quick-wins" className="rp-card p-5 md:col-span-8 rp-fade-in">
              <div className="rp-section-title">Quick Wins</div>
              <div className="mt-3">
                {quickWins.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {strictPrioritizeQuickWins(quickWins).slice(0, 10).map((x, i) => {
                      const info = explainQuickWin(x);
                      const impact = impactLabelForIssueName(info.title);
                      const icon =
                        info.title.toLowerCase().includes("meta")
                          ? <IconDoc size={14} />
                          : info.title.toLowerCase().includes("h1")
                          ? <IconHeading size={14} />
                          : info.title.toLowerCase().includes("title")
                          ? <IconTitle size={14} />
                          : <IconBolt size={14} />;
                      const impactLabel = info.title.toLowerCase().includes("title") || info.title.toLowerCase().includes("meta")
                        ? "High impact"
                        : info.title.toLowerCase().includes("h1")
                        ? "Medium impact"
                        : "Medium impact";
                      const timeLabel = info.title.toLowerCase().includes("meta") ? "10-15 min" : "5-10 min";
                      return (
                    <div key={i} className="rp-card-hover rounded-xl border border-[var(--rp-border)] bg-white p-4 shadow-sm">
                          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--rp-text-800)]">
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-[rgba(66,25,131,0.08)] text-[var(--rp-indigo-700)]">
                              {icon}
                            </span>
                            {info.title}
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-[var(--rp-text-500)]">
                            <span className="rp-chip rp-chip-warning">
                              {impactLabel}
                            </span>
                            <span className="rp-chip rp-chip-info">
                              {timeLabel}
                            </span>
                            <span className={impact.tone}>
                              {impact.label}
                            </span>
                          </div>
                          <div className="mt-1 text-sm text-[var(--rp-text-600)]">{info.detail}</div>
                          <div className="mt-2 text-xs text-[var(--rp-text-500)]">
                            Why it helps clicks: clearer snippets and stronger page relevance.
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-[var(--rp-text-500)]">No major quick wins returned.</div>
                )}
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-3">
                {overviewMetrics && [
                  { label: "Visibility", value: overviewMetrics.visibility, color: "bg-emerald-400" },
                  { label: "CTR clarity", value: overviewMetrics.ctrClarity, color: "bg-cyan-400" },
                  { label: "Content depth", value: overviewMetrics.contentDepth, color: "bg-amber-400" }
                ].map((metric) => (
                  <div key={metric.label} className="rp-metric-tile rounded-xl border border-[var(--rp-border)] bg-white p-4 shadow-sm">
                    <div className="text-xs text-[var(--rp-text-500)]">{metric.label}</div>
                    <div className="mt-1 text-sm font-semibold text-[var(--rp-text-800)] tabular-nums">{metric.value}%</div>
                    <div className="mt-2 h-1.5 w-full rounded-full bg-[var(--rp-gray-100)]">
                      <div className={`rp-bar h-1.5 rounded-full ${metric.color}`} style={{ width: `${metric.value}%` }} />
                    </div>
                    <div className="mt-1 rp-body-xsmall text-[var(--rp-text-400)]">Benchmark: 70%+</div>
                  </div>
                ))}
              </div>

              <div className="mt-6">
                <div className="rp-section-title">Granular signals</div>
                <div className="mt-3 grid gap-4 md:grid-cols-3">
                  {signalMetrics.length > 0 ? (
                    signalMetrics.map((metric) => (
                      <div key={metric.label} className="rp-metric-tile rounded-xl border border-[var(--rp-border)] bg-white p-4 shadow-sm">
                        <div className="text-xs text-[var(--rp-text-500)]">{metric.label}</div>
                        <div className="mt-2 text-sm font-semibold text-[var(--rp-text-800)] tabular-nums">{metric.value}</div>
                        <div className="mt-2 h-1.5 w-full rounded-full bg-[var(--rp-gray-100)]">
                          <div
                            className={`rp-bar h-1.5 rounded-full ${metric.color}`}
                            style={{ width: `${metric.percent}%` }}
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl border border-[var(--rp-border)] bg-[var(--rp-gray-50)] p-4 text-sm text-[var(--rp-text-500)]">
                      Signals will appear after the first audit completes.
                    </div>
                  )}
                </div>
                <div className="mt-4 rounded-2xl border border-[var(--rp-border)] bg-[var(--rp-gray-50)] p-4">
                  <div className="flex items-center gap-2 rp-section-title">
                    Core Web Vitals
                    <span className="relative inline-flex group">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-[var(--rp-border)] bg-white text-[11px] text-[var(--rp-text-500)]">
                        i
                      </span>
                      <span className="pointer-events-none absolute left-0 top-7 z-10 w-56 rounded-xl border border-[var(--rp-border)] bg-white p-3 text-[11px] leading-relaxed text-[var(--rp-text-500)] opacity-0 shadow-lg transition group-hover:opacity-100">
                        Field = real user data. Lab = simulated test in a controlled environment.
                      </span>
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-[var(--rp-text-500)]">
                    Thresholds used by Google for a good user experience.
                  </p>
                  <div className="mt-3 grid gap-4 md:grid-cols-3 text-xs text-[var(--rp-text-600)]">
                    <div className="rp-metric-tile rounded-xl border border-[var(--rp-border)] bg-white p-4">
                      <div className="text-[var(--rp-text-700)] font-semibold">LCP</div>
                      <div className="mt-1 text-xs text-[var(--rp-text-500)]">
                        {(() => {
                          const { field, lab } = getCwvPair(result, "lcp");
                          const f = field !== null ? `${field}s` : "N/A";
                          const l = lab !== null ? `${lab}s` : "N/A";
                          return `Field: ${f} | Lab: ${l}`;
                        })()}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {(() => {
                          const lcp = getCwvFieldValue(result, "lcp");
                          return (
                            <>
                              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${cwvBadgeClass("lcp", lcp <= 2.5 ? lcp : null)}`}>
                                Good: ≤ 2.5s
                              </span>
                              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${cwvBadgeClass("lcp", lcp > 2.5 && lcp <= 4 ? lcp : null)}`}>
                                Needs work: 2.5-4.0s
                              </span>
                              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${cwvBadgeClass("lcp", lcp > 4 ? lcp : null)}`}>
                                Poor: &gt; 4.0s
                              </span>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                    <div className="rp-metric-tile rounded-xl border border-[var(--rp-border)] bg-white p-4">
                      <div className="text-[var(--rp-text-700)] font-semibold">INP</div>
                      <div className="mt-1 text-xs text-[var(--rp-text-500)]">
                        {(() => {
                          const { field, lab } = getCwvPair(result, "inp");
                          const f = field !== null ? `${field}ms` : "N/A";
                          const l = lab !== null ? `${lab}ms` : "N/A";
                          return `Field: ${f} | Lab: ${l}`;
                        })()}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {(() => {
                          const inp = getCwvFieldValue(result, "inp");
                          return (
                            <>
                              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${cwvBadgeClass("inp", inp <= 200 ? inp : null)}`}>
                                Good: ≤ 200ms
                              </span>
                              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${cwvBadgeClass("inp", inp > 200 && inp <= 500 ? inp : null)}`}>
                                Needs work: 200-500ms
                              </span>
                              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${cwvBadgeClass("inp", inp > 500 ? inp : null)}`}>
                                Poor: &gt; 500ms
                              </span>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                    <div className="rp-metric-tile rounded-xl border border-[var(--rp-border)] bg-white p-4">
                      <div className="text-[var(--rp-text-700)] font-semibold">CLS</div>
                      <div className="mt-1 text-xs text-[var(--rp-text-500)]">
                        {(() => {
                          const { field, lab } = getCwvPair(result, "cls");
                          const f = field !== null ? `${field}` : "N/A";
                          const l = lab !== null ? `${lab}` : "N/A";
                          return `Field: ${f} | Lab: ${l}`;
                        })()}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {(() => {
                          const cls = getCwvFieldValue(result, "cls");
                          return (
                            <>
                              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${cwvBadgeClass("cls", cls <= 0.1 ? cls : null)}`}>
                                Good: ≤ 0.1
                              </span>
                              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${cwvBadgeClass("cls", cls > 0.1 && cls <= 0.25 ? cls : null)}`}>
                                Needs work: 0.1-0.25
                              </span>
                              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${cwvBadgeClass("cls", cls > 0.25 ? cls : null)}`}>
                                Poor: &gt; 0.25
                              </span>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                  {!result?.cwv && (
                  <p className="mt-2 text-xs leading-relaxed text-[var(--rp-text-500)]">
                    Core Web Vitals require a performance audit. Add a PageSpeed API key to populate LCP, INP, and CLS.
                  </p>
                  )}
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-[var(--rp-border)] bg-white p-4 shadow-sm">
                  <div className="rp-section-title">Issue severity mix</div>
                  <div className="rp-section-subtitle">
                    Severity overrides priority in this view.
                  </div>
                    {(() => {
                      const segments = buildSeveritySegments(issues);
                      const total = segments.reduce((acc, seg) => acc + seg.value, 0) || 1;
                      const radius = 36;
                      const circumference = 2 * Math.PI * radius;
                      let offset = 0;
                      return (
                  <div className="mt-4 flex items-center gap-4">
                    <svg width="96" height="96" viewBox="0 0 96 96">
                      <circle cx="48" cy="48" r={radius} stroke="#E6EAF0" strokeWidth="10" fill="none" />
                            {segments.map((seg) => {
                              const dash = (seg.value / total) * circumference;
                              const dashArray = `${dash} ${circumference - dash}`;
                              const dashOffset = -offset;
                              offset += dash;
                              return (
                                <circle
                                  key={seg.label}
                                  cx="48"
                                  cy="48"
                                  r={radius}
                                  stroke={seg.color}
                                  strokeWidth="10"
                                  fill="none"
                                  strokeDasharray={dashArray}
                                  strokeDashoffset={dashOffset}
                                  transform="rotate(-90 48 48)"
                                />
                              );
                            })}
                            <text x="48" y="46" textAnchor="middle" fontSize="13" fontWeight="700" fill="#111827">
                              {total}
                            </text>
                            <text x="48" y="60" textAnchor="middle" fontSize="9" fill="#6B7280">
                              issues
                            </text>
                          </svg>
                          <div className="space-y-2 text-xs text-[var(--rp-text-500)]">
                            {segments.map((seg) => (
                              <div key={seg.label} className="flex items-center justify-between gap-3 tabular-nums">
                                <span className="flex items-center gap-2">
                                  <span className="inline-block h-2 w-2 rounded-full" style={{ background: seg.color }} />
                                  {seg.label}
                                </span>
                                <span className="text-[var(--rp-text-700)]">
                                  {seg.value} • {Math.round(seg.percent)}%
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                  <div className="rounded-2xl border border-[var(--rp-border)] bg-white p-4 shadow-sm">
                    <div className="rp-section-title">Fix pipeline</div>
                    <div className="rp-section-subtitle">
                      Prioritized queue based on impact.
                    </div>
                    {(() => {
                      const stats = buildPriorityStats(issues);
                      const total = Math.max(1, stats.fix_now + stats.fix_next + stats.fix_later);
                      const rows = [
                        { label: "Fix now", value: stats.fix_now, color: "#FF788F" },
                        { label: "Fix next", value: stats.fix_next, color: "#F6C453" },
                        { label: "Fix later", value: stats.fix_later, color: "#45E0A8" }
                      ];
                      return (
                    <div className="mt-4 space-y-2 text-xs text-[var(--rp-text-500)]">
                      {rows.map((row) => (
                        <div key={row.label} className="tabular-nums">
                          <div className="flex items-center justify-between">
                            <span>{row.label}</span>
                            <span className="text-[var(--rp-text-700)]">
                              {row.value} • {Math.round((row.value / total) * 100)}%
                                </span>
                              </div>
                              <div className="mt-1 h-2 w-full rounded-full bg-[var(--rp-gray-100)]">
                                <div
                                  className="rp-bar h-2 rounded-full"
                                  style={{
                                    width: `${Math.round((row.value / total) * 100)}%`,
                                    background: row.color
                                  }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {status === "success" && (
          <div className="rp-card p-5 rp-fade-in">
            <div className="rp-section-title">Services included in every audit</div>
            <div className="rp-section-subtitle">
              Proof-backed fixes, content direction, and client-ready deliverables.
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-4">
              {[
                { title: "Fix prioritization", icon: <IconBolt size={14} />, tone: "bg-cyan-100 text-cyan-700" },
                { title: "Content brief", icon: <IconDoc size={14} />, tone: "bg-emerald-100 text-emerald-700" },
                { title: "Shareable report", icon: <IconReport size={14} />, tone: "bg-amber-100 text-amber-700" },
                { title: "Performance signals", icon: <IconShield size={14} />, tone: "bg-purple-100 text-purple-700" }
              ].map((item) => (
                <div key={item.title} className="rp-metric-tile rounded-xl border border-[var(--rp-border)] bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[var(--rp-text-800)]">
                    <span className={`inline-flex h-6 w-6 items-center justify-center rounded-lg ${item.tone}`}>
                      {item.icon}
                    </span>
                    {item.title}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {status === "success" && (
          <div className="rp-card p-5 rp-fade-in">
            <div className="flex flex-wrap items-center gap-2">
              <div className="rp-section-title">Guided Fix Mode</div>
              <span className="rp-section-subtitle">Step-by-step for non-technical teams</span>
            </div>
            <p className="mt-2 rp-body-small">
              Start with the top 3 fixes. Each step is written in plain language so anyone can act on it.
            </p>
            <div className="mt-3 rounded-2xl border border-[var(--rp-border)] bg-[var(--rp-gray-50)] p-4 text-xs text-[var(--rp-text-600)]">
              <div className="font-semibold text-[var(--rp-text-700)]">Progress across audits</div>
              <div className="mt-3 grid gap-4 md:grid-cols-2">
                {(() => {
                  const keys = Object.keys(localStorage || {}).filter((k) => k.startsWith("rp_guided_done::"));
                  if (!keys.length) {
                    return <span>No saved progress yet.</span>;
                  }
                  return keys.slice(0, 4).map((key) => {
                    const urlKey = key.replace("rp_guided_done::", "");
                    let doneCount = 0;
                    let totalCount = 0;
                    let lastRun = "";
                    try {
                      const raw = localStorage.getItem(key);
                      const obj = raw ? JSON.parse(raw) : {};
                      doneCount = Object.values(obj).filter(Boolean).length;
                      totalCount = Object.keys(obj).length;
                    } catch {}
                    try {
                      const snapKey = `rp_audit_snapshot::${urlKey}`;
                      const snapRaw = localStorage.getItem(snapKey);
                      const snap = snapRaw ? JSON.parse(snapRaw) : null;
                      const ts = snap?.ranAt || snap?.ran_at || snap?.created_at;
                      if (ts) {
                        const date = new Date(ts);
                        if (!Number.isNaN(date.getTime())) {
                          lastRun = date.toLocaleString();
                        }
                      }
                    } catch {}
                    return (
                      <div key={key} className="flex items-center justify-between gap-2 rounded-xl border border-[var(--rp-border)] bg-white px-3 py-2 shadow-sm">
                        <div className="min-w-0">
                          <button
                            type="button"
                            className="truncate text-left text-xs font-semibold text-[var(--rp-indigo-700)] hover:text-[var(--rp-indigo-900)]"
                            onClick={() => {
                              if (!urlKey) return;
                              navigate(`/audit?url=${encodeURIComponent(urlKey)}`);
                            }}
                            title={urlKey}
                          >
                            {urlKey || "Audit"}
                          </button>
                        <div className="rp-body-xsmall">
                          {lastRun ? `Last run: ${lastRun}` : "Last run: N/A"}
                        </div>
                      </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[var(--rp-text-500)]">{doneCount}/{totalCount || 0}</span>
                          {(() => {
                            const pct = totalCount ? Math.round((doneCount / totalCount) * 100) : 0;
                            const badgeClass =
                              pct >= 80
                                ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                                : pct >= 50
                                ? "bg-amber-100 text-amber-700 border border-amber-200"
                                : "bg-rose-100 text-rose-700 border border-rose-200";
                            return (
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${badgeClass}`}
                                title="Progress thresholds: Red <50%, Amber 50-79%, Green 80%+"
                              >
                                {pct}%
                              </span>
                            );
                          })()}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
            {(() => {
              const base = scoreValue ?? 0;
              const remainingIssues = issues.filter((it) => !guidedDone[String(it?.issue_id || it?.title || "")]);
              const lift = estimateScoreLiftFromIssues(remainingIssues);
              const projected = Math.min(100, base + lift);
              const totalSteps = guidedSteps(issues, true).length;
              const completedSteps = totalSteps
                ? guidedSteps(issues, true).filter((step) => guidedDone[step.id]).length
                : 0;
              return (
                <div className="mt-4 rounded-2xl border border-[var(--rp-border)] bg-[var(--rp-gray-50)] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-xs text-[var(--rp-text-500)]">Before / After preview</div>
                      <div className="mt-1 text-lg font-semibold text-[var(--rp-text-800)]">
                        {Math.round(base)} <span className="text-[var(--rp-text-400)]">→</span> {Math.round(projected)}
                      </div>
                    </div>
                    <div className="text-xs text-[var(--rp-text-500)]">
                      Estimated lift: +{Math.round(lift)}
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-[var(--rp-text-500)]">
                    Progress: {completedSteps}/{totalSteps || 0} fixes completed
                  </div>
                  <div className="mt-2 inline-flex items-center rounded-full border border-emerald-200 bg-emerald-100 px-2 py-1 text-[11px] font-semibold text-emerald-700">
                    Next step: Tackle the highest impact fix first
                  </div>
                  <div className="mt-2 text-xs text-[var(--rp-text-500)]">
                    Estimated time to complete: {Math.max(10, (totalSteps || 3) * 6)} min
                  </div>
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-[var(--rp-text-500)]">
                      <span>Fix-impact meter</span>
                      <span>{Math.round(lift)} pts</span>
                    </div>
                    <div className="mt-2 h-2 w-full rounded-full bg-[var(--rp-gray-100)]">
                      <div
                        className="rp-bar h-2 rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400"
                        style={{ width: `${Math.min(100, Math.round((lift / 30) * 100))}%` }}
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs text-[var(--rp-text-500)]">
                      <span>Progress trend</span>
                      <span>Next steps</span>
                    </div>
                    <svg viewBox="0 0 200 70" className="mt-2 h-16 w-full">
                      <defs>
                        <linearGradient id="guidedTrend" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#22d3ee" />
                          <stop offset="100%" stopColor="#34d399" />
                        </linearGradient>
                      </defs>
                      {(() => {
                        const linePoints = buildLiftPoints(base, lift);
                        const areaPoints = `5,70 ${linePoints} 195,70`;
                        return (
                          <>
                            <polyline
                              fill="none"
                              stroke="url(#guidedTrend)"
                              strokeWidth="3"
                              points={linePoints}
                            />
                            <polyline
                              fill="url(#guidedTrend)"
                              opacity="0.15"
                              points={areaPoints}
                            />
                          </>
                        );
                      })()}
                    </svg>
                  </div>
                </div>
              );
            })()}
            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-[var(--rp-text-500)]">
              <span className="whitespace-nowrap">{showAllGuidedFixes ? "Showing all fixes" : "Showing top 3 fixes"}</span>
              <div className="flex items-center gap-2 text-[11px] text-[var(--rp-text-500)] whitespace-nowrap">
                <span className="inline-flex items-center gap-1">
                  <span className="inline-block h-2 w-2 rounded-full bg-rose-400"></span>
                  <span>&lt;50%</span>
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="inline-block h-2 w-2 rounded-full bg-amber-400"></span>
                  <span>50-79%</span>
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-400"></span>
                  <span>80%+</span>
                </span>
              </div>
              <div className="ml-auto flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                <button
                  type="button"
                  className="rp-btn-secondary rp-btn-sm h-8 px-3 text-xs inline-flex items-center gap-2 whitespace-nowrap"
                  onClick={() => setShowAllGuidedFixes((prev) => !prev)}
                >
                  {showAllGuidedFixes ? "Show top 3" : "Show all fixes"}
                </button>
                <button
                  type="button"
                  className="rp-btn-secondary rp-btn-sm h-8 px-3 text-xs inline-flex items-center gap-2 whitespace-nowrap"
                  onClick={() => {
                    const key = `rp_guided_done::${(result?.url || url || "").trim()}`;
                    if (!key.trim()) return;
                    try { localStorage.removeItem(key); } catch {}
                    setGuidedDone({});
                  }}
                >
                  <IconTrash size={14} />
                  Reset progress
                </button>
              </div>
            </div>
            {guidedSteps(issues, showAllGuidedFixes).length > 0 ? (
              <ol className="mt-4 grid gap-4 md:grid-cols-3">
                {guidedSteps(issues, showAllGuidedFixes).map((step, idx) => (
                  <li key={idx} className="rp-metric-tile rounded-xl border border-[var(--rp-border)] bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xs font-semibold text-[var(--rp-indigo-700)]">Step {idx + 1}</div>
                        <div className="mt-2 text-sm font-semibold text-[var(--rp-text-800)]">{step.title}</div>
                      </div>
                      <label className="flex items-center gap-2 text-xs text-[var(--rp-text-500)]">
                        <input
                          type="checkbox"
                          checked={Boolean(guidedDone[step.id])}
                          onChange={() => toggleGuidedDone(step.id)}
                        />
                        Mark as done
                      </label>
                    </div>
                    <p className="mt-2 text-sm text-[var(--rp-text-600)]">
                      {step.why || "This fix improves clarity for visitors and search engines."}
                    </p>
                    <p className="mt-2 text-sm text-[var(--rp-text-600)]">
                      {step.fix || "Add the missing element and re-run the audit to confirm."}
                    </p>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="mt-3 text-sm text-[var(--rp-text-500)]">Run an audit to see your guided fix steps.</div>
            )}
          </div>
        )}

        {status === "success" && (
          <div className="rp-card p-5 rp-fade-in">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
            <div className="rp-section-title">Pro services</div>
            <div className="rp-section-subtitle">
              Built for teams who want done-for-you clarity and recurring performance wins.
            </div>
              </div>
              <div className="flex flex-col items-end">
                <button className="rp-btn-primary text-sm">
                  <IconArrowRight size={14} />
                  Upgrade to Pro
                </button>
                <div className="mt-1 text-xs text-[var(--rp-text-500)]">
                  Instant access to fix plans, reports, and weekly tracking after checkout.
                </div>
              </div>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-4">
              {[
                { title: "Done-for-you fix plan", icon: <IconBolt size={14} />, tone: "bg-cyan-100 text-cyan-700" },
                { title: "Client report branding", icon: <IconReport size={14} />, tone: "bg-emerald-100 text-emerald-700" },
                { title: "Weekly monitoring", icon: <IconCompass size={14} />, tone: "bg-amber-100 text-amber-700" },
                { title: "Priority support", icon: <IconShield size={14} />, tone: "bg-purple-100 text-purple-700" }
              ].map((item) => (
                <div key={item.title} className="rp-metric-tile rounded-xl border border-[var(--rp-border)] bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[var(--rp-text-800)]">
                    <span className={`inline-flex h-6 w-6 items-center justify-center rounded-lg ${item.tone}`}>
                      {item.icon}
                    </span>
                    {item.title}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Conversion Panel - Show after audit completes, only once per session */}
        {status === "success" && result && !conversionDismissed && !conversionSubmitted && (
          <div className="rp-card p-5 rp-fade-in">
            <div className="rp-section-title">Save your audit & track improvements</div>
            <div className="rp-section-subtitle mb-4">Get notified when your SEO score changes or new issues appear.</div>
            <form onSubmit={handleConversionSubmit} className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="flex-1">
                <input
                  type="email"
                  value={conversionEmail}
                  onChange={(e) => setConversionEmail(e.target.value)}
                  placeholder="Email address"
                  className="rp-input text-sm"
                />
                <div className="mt-1 rp-body-xsmall">Optional</div>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="rp-btn-primary text-sm"
                >
                  <IconMail size={14} />
                  Email me updates
                </button>
                <button
                  type="button"
                  onClick={handleConversionDismiss}
                  className="rp-btn-secondary text-sm"
                >
                  <IconArrowRight size={14} />
                  Not now
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Success state after email submission */}
        {status === "success" && result && conversionSubmitted && (
          <div className="rp-card p-5 rp-fade-in">
            <div className="text-sm text-[var(--rp-text-600)]">You're all set. We'll notify you when things change.</div>
          </div>
        )}

        {status === "success" && result && (
          <div className="rp-card p-5 rp-fade-in" data-testid="observed-data">
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[rgba(66,25,131,0.08)] text-[var(--rp-indigo-700)]">
                <IconBolt size={16} />
              </span>
              <div className="rp-section-title">What we found</div>
            </div>
            <p className="text-sm text-[var(--rp-text-500)] mb-4">
              These details confirm what the page exposes to search engines and visitors.
            </p>
            <div className="rounded-xl border border-[var(--rp-border)] bg-white max-h-[360px] overflow-auto">
              <table className="rp-table w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--rp-border)]">
                      <th className="px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--rp-text-500)]">
                        Signal
                      </th>
                      <th className="px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--rp-text-500)]">
                        Value
                      </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: "Final URL", value: result?.debug?.final_url || result?.final_url || "-" },
                    { label: "HTTP Status", value: result?.debug?.final_status ?? result?.debug?.fetch_status ?? result?.status ?? "-" },
                    {
                      label: "Title",
                      value: result?.evidence?.title
                        ? `${result.evidence.title}${result.evidence.title_char_count !== undefined ? ` (${result.evidence.title_char_count} chars)` : ""}`
                        : "-"
                    },
                    {
                      label: "Meta Description",
                      value: result?.evidence?.meta_description
                        ? `${result.evidence.meta_description}${result.evidence.meta_description_char_count !== undefined ? ` (${result.evidence.meta_description_char_count} chars)` : ""}`
                        : "-"
                    },
                    {
                      label: "H1",
                      value: result?.evidence?.h1
                        ? `${result.evidence.h1}${result.evidence.h1_count !== undefined ? ` (${result.evidence.h1_count} found)` : ""}`
                        : "-"
                    },
                    { label: "Canonical", value: result?.evidence?.canonical || "-" },
                    {
                      label: "Word Count",
                      value: result?.evidence?.word_count !== undefined
                        ? `${result.evidence.word_count.toLocaleString()} words`
                        : "-"
                    },
                    {
                      label: "Internal Links",
                      value: result?.evidence?.internal_links_count !== undefined
                        ? String(result.evidence.internal_links_count)
                        : "-"
                    },
                    {
                      label: "External Links",
                      value: result?.evidence?.external_links_count !== undefined
                        ? String(result.evidence.external_links_count)
                        : "-"
                    }
                  ].map((row, idx) => (
                    <tr
                      key={row.label}
                      className={`rp-table-row ${idx !== 0 ? "border-t border-[var(--rp-border)]" : ""}`}
                    >
                      <th className="w-40 bg-[var(--rp-gray-50)] px-4 py-2 text-left text-xs font-semibold text-[var(--rp-text-500)]">
                        {row.label}
                      </th>
                      <td className="px-4 py-2 text-[var(--rp-text-700)] break-all">{row.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {advancedView && (
              <details className="mt-4 text-xs text-[var(--rp-text-500)]">
                <summary className="cursor-pointer select-none text-[var(--rp-text-600)]">Show raw response</summary>
                <pre className="mt-2 overflow-auto text-xs text-[var(--rp-text-600)]">
                  {JSON.stringify(result?.evidence || {}, null, 2)}
                </pre>
              </details>
            )}
          </div>
        )}

        {status === "success" && (
          <div className="grid gap-5 md:grid-cols-3">
            {showNextStep && (
              <div className="md:col-span-3 rounded-2xl border border-[var(--rp-border)] bg-[var(--rp-gray-50)] p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="rp-section-title">Next step</div>
                    <div className="mt-1 text-sm text-[var(--rp-text-600)]">
                      Start with the highest‑impact fixes so you see improvement immediately.
                    </div>
                  </div>
                  <button
                    className="rp-btn-secondary rp-btn-sm h-9 px-3 text-xs"
                    onClick={() => setShowNextStep(false)}
                  >
                    Dismiss
                  </button>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-[1.2fr_0.8fr]">
                  <div className="rp-metric-tile rounded-xl border border-[var(--rp-border)] bg-white p-4">
                    <div className="text-xs text-[var(--rp-text-500)]">Top fix to start with</div>
                    {(() => {
                      const fixNow = issues.filter((it) => it?.priority === "fix_now");
                      const best = fixNow[0] || issues[0];
                      return (
                    <div className="mt-1 text-lg font-semibold text-[var(--rp-text-900)]">
                      {best?.title || best?.issue_id || "Resolve the highest‑impact issue"}
                    </div>
                      );
                    })()}
                    <div className="mt-1 text-xs text-[var(--rp-text-500)]">
                      This typically produces the fastest lift in visibility and click‑through rate.
                    </div>
                  </div>
                  <div className="rp-metric-tile rounded-xl border border-[var(--rp-border)] bg-white p-4">
                    <div className="text-xs text-[var(--rp-text-500)]">Recommended action</div>
                    <button
                      type="button"
                      className="rp-btn-primary mt-2 w-full text-sm"
                      onClick={() => {
                        try {
                          track("cta_next_step_click", {
                            variant: ctaVariant,
                            url: result?.url || url || ""
                          });
                        } catch {}
                        const el = document.querySelector("[data-testid='key-issues']");
                        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                      }}
                    >
                      {ctaVariant === "B" ? "Fix this in 1 click" : "Generate AI fixes"}
                    </button>
                    <div className="mt-2 text-xs text-[var(--rp-text-400)]">
                      {ctaVariant === "B"
                        ? "Instantly create fixes and push to WordPress or Shopify."
                        : "You can copy or push fixes directly into your CMS."}
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="md:col-span-3 rp-card p-5 rp-fade-in">
              <div className="rp-section-title">Content Brief</div>
              {brief ? (
                <div className="mt-3 whitespace-pre-wrap text-[var(--rp-text-700)]">{brief}</div>
              ) : (
                <div className="mt-3 text-sm text-[var(--rp-text-600)]">
                  <div className="text-[var(--rp-text-700)] font-semibold">Starter brief (auto-generated)</div>
                  <ul className="mt-3 list-disc space-y-2 pl-5">
                    <li>Goal: Explain what this page offers and who it is for.</li>
                    <li>Angle: Lead with the main benefit and a clear outcome.</li>
                    <li>Suggested sections: Problem, Solution, Proof, FAQs, Clear CTA.</li>
                    <li>Target reader: People evaluating whether this page solves their need.</li>
                    <li>CTA example: "Start a free audit" or "Book a demo".</li>
                  </ul>
                </div>
              )}
            </div>
            <div className="md:col-span-1 rp-card p-5">
              <div className="flex items-center gap-2 rp-section-title">
                Page‑type guidance
                <span className="rp-chip rp-chip-neutral">{pageType}</span>
              </div>
              {pageTypeAdvice.length ? (
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-[var(--rp-text-600)]">
                  {pageTypeAdvice.map((tip, idx) => (
                    <li key={idx}>{tip}</li>
                  ))}
                </ul>
              ) : (
                <div className="mt-3 text-sm text-[var(--rp-text-500)]">No page‑type advice available.</div>
              )}
            </div>
            <div className="md:col-span-2 rp-card p-5">
              <div className="rp-section-title">Rewrite examples</div>
              {rewriteExamples.length ? (
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {rewriteExamples.slice(0, 6).map((ex, idx) => (
                    <div key={idx} className="rounded-xl border border-[var(--rp-border)] bg-[var(--rp-gray-50)] p-4">
                      <div className="text-xs font-semibold text-[var(--rp-text-600)]">{ex.label}</div>
                      <div className="mt-2 text-xs text-[var(--rp-text-500)]">Before</div>
                      <div className="text-sm text-[var(--rp-text-700)]">{ex.before || "-"}</div>
                      <div className="mt-2 text-xs text-[var(--rp-text-500)]">After</div>
                      <div className="text-sm font-semibold text-[var(--rp-text-900)]">{ex.after || "-"}</div>
                      {ex.note ? (
                        <div className="mt-2 text-xs text-[var(--rp-text-500)]">{ex.note}</div>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-3 text-sm text-[var(--rp-text-500)]">No rewrite examples generated.</div>
              )}
            </div>
            <div id="competitor-compare" className="md:col-span-3 rp-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="rp-section-title">Competitor comparison</div>
                  <div className="mt-1 text-xs text-[var(--rp-text-500)]">
                    Enter three competitors to benchmark your score.
                  </div>
                </div>
                <span className="rp-chip rp-chip-warning">Subscription driver</span>
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                {competitorUrls.map((val, idx) => (
                  <input
                    key={idx}
                    className="rp-input"
                    value={val}
                    placeholder={`Competitor ${idx + 1} URL`}
                    onChange={(e) => {
                      const next = [...competitorUrls];
                      next[idx] = e.target.value;
                      setCompetitorUrls(next);
                    }}
                  />
                ))}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  className="rp-btn-secondary rp-btn-sm h-9 px-3 text-xs"
                  disabled={compareStatus === "loading"}
                  onClick={async () => {
                    try {
                      track("competitor_compare_run", {
                        url: result?.url || url || "",
                        count: competitorUrls.filter((u) => isValidUrl(u)).length
                      });
                    } catch {}
                    const list = competitorUrls.filter((u) => isValidUrl(u));
                    if (!list.length) return;
                    setCompareStatus("loading");
                    const results = [];
                    for (const u of list.slice(0, 3)) {
                      try {
                        const res = await fetch("/api/page-report", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ url: u.trim() })
                        });
                        const data = await safeJson(res);
                        results.push({
                          url: u,
                          score: typeof data?.score === "number" ? data.score : null
                        });
                      } catch {
                        results.push({ url: u, score: null });
                      }
                    }
                    setCompetitorScores(results);
                    setCompareStatus("success");
                  }}
                >
                  {compareStatus === "loading" ? "Comparing..." : "Compare scores"}
                </button>
                <button
                  className="rp-btn-primary rp-btn-sm h-9 px-3 text-xs"
                  onClick={() => {
                    try { track("competitor_auto_upgrade_click", { url: result?.url || url || "" }); } catch {}
                    setPricingOpen(true);
                  }}
                >
                  Unlock auto‑competitors
                </button>
                <button
                  className="rp-btn-secondary rp-btn-sm h-9 px-3 text-xs"
                  onClick={() => {
                    setCompetitorUrls(["", "", ""]);
                    setCompetitorScores([]);
                    setCompareStatus("idle");
                  }}
                >
                  Reset
                </button>
              </div>
              {competitorScores.length > 0 && (
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {[{ url: result?.url, score: typeof scoreValue === "number" ? scoreValue : null, label: "You" }, ...competitorScores].map((row, idx) => {
                    const score = typeof row.score === "number" ? row.score : 0;
                    const grade = gradeFromScore(score);
                    return (
                      <div key={`${row.url}-${idx}`} className="rp-metric-tile rounded-xl border border-[var(--rp-border)] bg-white p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-[var(--rp-text-500)]">{row.label || "Competitor"}</div>
                          <span className="rp-chip rp-chip-neutral">Grade {grade}</span>
                        </div>
                        <div className="mt-2 text-sm font-semibold text-[var(--rp-text-800)] break-all">
                          {row.url || "—"}
                        </div>
                        <div className="mt-2 flex items-center gap-3">
                          <div className="text-2xl font-semibold text-[var(--rp-text-900)]">{score}</div>
                          <div className="h-2 w-full rounded-full bg-[var(--rp-gray-100)]">
                            <div className="rp-bar h-2 rounded-full bg-emerald-400" style={{ width: `${Math.max(0, Math.min(100, score))}%` }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="md:col-span-3 rp-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="rp-section-title">Light monitoring</div>
                  <div className="mt-1 text-xs text-[var(--rp-text-500)]">
                    Track your most important pages and see when it’s time to re‑audit.
                  </div>
                </div>
                {result?.url && (
                  <button
                    onClick={() => {
                      const u = result?.url;
                      if (!u) return;
                      if (isMonitored(u)) {
                        removeMonitor(u);
                      } else {
                        upsertMonitor({ url: u });
                      }
                      refreshMonitors();
                    }}
                    className="rp-btn-secondary rp-btn-sm h-9 px-3 text-xs"
                  >
                    {isMonitored(result.url) ? "Stop monitoring" : "Monitor this page"}
                  </button>
                )}
              </div>
              {monitors.length ? (
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  {monitors.map((m) => (
                    <div key={m.url} className="rp-metric-tile rounded-xl border border-[var(--rp-border)] bg-white p-4 shadow-sm">
                      <div className="text-xs text-[var(--rp-text-500)]">URL</div>
                      <div className="mt-1 text-sm font-semibold text-[var(--rp-text-900)] break-all">{m.url}</div>
                      <div className="mt-2 text-xs text-[var(--rp-text-500)]">Last score</div>
                      <div className="text-lg font-semibold text-[var(--rp-text-900)]">{m.lastScore ?? "—"}</div>
                      <div className="mt-2 text-xs text-[var(--rp-text-500)]">
                        Last checked: {m.lastChecked ? new Date(m.lastChecked).toLocaleString() : "—"}
                      </div>
                      <div className="mt-1 text-xs text-[var(--rp-text-500)]">
                        Next check: {m.nextCheck ? new Date(m.nextCheck).toLocaleDateString() : "—"}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-4 text-sm text-[var(--rp-text-500)]">No pages monitored yet.</div>
              )}
            </div>
          </div>
        )}
      </div>
          <PricingModal
        open={pricingOpen}
        onClose={() => setPricingOpen(false)}
        onSelectPlan={() => {
          setPricingOpen(false);
          navigate("/pricing");
        }}
      />
          <AuditImpactBanner score={typeof scoreValue === "number" ? scoreValue : result?.score} issues={issues} />
            <div data-testid="key-issues">
              <IssuesPanel
                issues={strictPrioritizeIssues(issues)}
                advanced={advancedView}
                finalUrl={String(result?.debug?.final_url || result?.final_url || "")}
                fixWebhookUrl={fixWebhookUrl}
                wpWebhookUrl={wpSiteUrl}
                shopifyWebhookUrl={shopifyShop}
                ownerId={anonId}
              />
            </div>
      {import.meta.env.DEV && debug && (
        <div className="rp-card p-5 rp-fade-in">
          <button
            onClick={() => setDebugExpanded(!debugExpanded)}
            className="flex w-full items-center justify-between text-sm font-semibold text-[var(--rp-text-700)] hover:text-[var(--rp-text-900)]"
          >
            <span>Raw response (debug)</span>
            <span className="text-xs text-[var(--rp-text-500)]">{debugExpanded ? "v" : ">"}</span>
          </button>
          {debugExpanded && (
            <pre className="mt-3 overflow-auto text-xs text-[var(--rp-text-600)]">{debug}</pre>
          )}
        </div>
      )}
    </AppShell>
  );
}

export default function AuditPage() {
  return <AuditPageInner />;
}
