import crypto from "crypto";
import { setUserPlan } from "../services/node-api/lib/planStore.js";
import { setEntitlements, getEntitlements } from "../services/node-api/lib/entitlementsStore.js";
import { getProcessedPayment, markPaymentProcessed } from "../services/node-api/lib/paymentStore.js";
import { jsonError } from "../api_hardening.js";

/**
 * Get anonId from request header
 */
function getAnonId(req) {
  const v = req.headers["x-rp-anon-id"];
  return typeof v === "string" && v.trim() ? v.trim() : "";
}

/**
 * Log event via /api/events endpoint if available, otherwise fallback to console
 */
async function logEvent(anonId, name, scope, meta) {
  if (!anonId || !name) return;
  
  try {
    // Try to log via /api/events endpoint (internal call)
    const baseUrl = process.env.APP_BASE_URL || "http://localhost:3000";
    const eventsUrl = `${baseUrl}/api/events`;
    
    await fetch(eventsUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-rp-anon-id": anonId,
      },
      body: JSON.stringify({
        name,
        scope: scope || "",
        meta: meta || {},
      }),
    }).catch(() => {
      // Fallback to console if fetch fails
      console.log(`[EVENT] ${name}`, { anonId, scope, meta });
    });
  } catch (err) {
    // Minimal logging fallback
    console.log(`[EVENT] ${name}`, { anonId, scope, meta });
  }
}

/**
 * Verify Razorpay configuration
 */
function getRazorpayConfig() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  
  if (!keyId || !keySecret) {
    return { ok: false, error: "razorpay not configured" };
  }
  
  return { ok: true, keyId, keySecret, webhookSecret };
}

function getTrialDays() {
  const raw = process.env.RAZORPAY_TRIAL_DAYS || process.env.APP_TRIAL_DAYS || "7";
  const num = Number(raw);
  if (!Number.isFinite(num) || num < 0) return 0;
  return Math.min(30, Math.floor(num));
}

function getPlanId(planId, billingPeriod) {
  const period = billingPeriod === "yearly" ? "yearly" : "monthly";
  const map = {
    starter: {
      monthly: process.env.RAZORPAY_PLAN_STARTER_MONTHLY,
      yearly: process.env.RAZORPAY_PLAN_STARTER_YEARLY
    },
    pro: {
      monthly: process.env.RAZORPAY_PLAN_PRO_MONTHLY,
      yearly: process.env.RAZORPAY_PLAN_PRO_YEARLY
    },
    teams: {
      monthly: process.env.RAZORPAY_PLAN_TEAMS_MONTHLY,
      yearly: process.env.RAZORPAY_PLAN_TEAMS_YEARLY
    }
  };
  return map[planId]?.[period] || null;
}

function resolvePlanKeyFromRazorpay(planId) {
  const pairs = [
    ["starter", process.env.RAZORPAY_PLAN_STARTER_MONTHLY],
    ["starter", process.env.RAZORPAY_PLAN_STARTER_YEARLY],
    ["pro", process.env.RAZORPAY_PLAN_PRO_MONTHLY],
    ["pro", process.env.RAZORPAY_PLAN_PRO_YEARLY],
    ["teams", process.env.RAZORPAY_PLAN_TEAMS_MONTHLY],
    ["teams", process.env.RAZORPAY_PLAN_TEAMS_YEARLY]
  ];
  for (const [key, val] of pairs) {
    if (val && planId === val) return key;
  }
  return "pro";
}

/**
 * Create Razorpay Order
 */
async function createRazorpayOrder(keyId, keySecret, amount, receipt, notes) {
  const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
  
  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Basic ${auth}`,
    },
    body: JSON.stringify({
      amount,
      currency: "INR",
      receipt,
      notes,
    }),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Razorpay API error: ${response.status} ${errorText}`);
  }
  
  return await response.json();
}

/**
 * Fetch Razorpay Order details
 */
async function fetchRazorpayOrder(keyId, keySecret, orderId) {
  const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
  
  const response = await fetch(`https://api.razorpay.com/v1/orders/${orderId}`, {
    method: "GET",
    headers: {
      "Authorization": `Basic ${auth}`,
    },
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Razorpay API error: ${response.status} ${errorText}`);
  }
  
  return await response.json();
}

async function createRazorpaySubscription(keyId, keySecret, payload) {
  const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
  const response = await fetch("https://api.razorpay.com/v1/subscriptions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Basic ${auth}`,
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Razorpay API error: ${response.status} ${errorText}`);
  }
  return await response.json();
}

async function fetchRazorpaySubscription(keyId, keySecret, subscriptionId) {
  const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
  const response = await fetch(`https://api.razorpay.com/v1/subscriptions/${subscriptionId}`, {
    method: "GET",
    headers: { "Authorization": `Basic ${auth}` }
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Razorpay API error: ${response.status} ${errorText}`);
  }
  return await response.json();
}

async function cancelRazorpaySubscription(keyId, keySecret, subscriptionId, atPeriodEnd) {
  const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
  const response = await fetch(`https://api.razorpay.com/v1/subscriptions/${subscriptionId}/cancel`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Basic ${auth}`,
    },
    body: JSON.stringify({ cancel_at_cycle_end: atPeriodEnd ? 1 : 0 })
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Razorpay API error: ${response.status} ${errorText}`);
  }
  return await response.json();
}

async function fetchRazorpayInvoices(keyId, keySecret, subscriptionId) {
  const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
  const url = `https://api.razorpay.com/v1/invoices?subscription_id=${encodeURIComponent(subscriptionId)}`;
  const response = await fetch(url, {
    method: "GET",
    headers: { "Authorization": `Basic ${auth}` }
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Razorpay API error: ${response.status} ${errorText}`);
  }
  return await response.json();
}

/**
 * Verify Razorpay payment signature
 */
function verifyRazorpaySignature(orderId, paymentId, signature, keySecret) {
  const payload = `${orderId}|${paymentId}`;
  const expectedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(payload)
    .digest("hex");
  
  // Use timing-safe compare to prevent timing attacks
  const providedBuffer = Buffer.from(signature, "utf8");
  const expectedBuffer = Buffer.from(expectedSignature, "utf8");
  
  if (providedBuffer.length !== expectedBuffer.length) {
    return false;
  }
  
  return crypto.timingSafeEqual(providedBuffer, expectedBuffer);
}

function verifyRazorpaySubscriptionSignature(subscriptionId, paymentId, signature, keySecret) {
  const payload = `${subscriptionId}|${paymentId}`;
  const expectedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(payload)
    .digest("hex");

  const providedBuffer = Buffer.from(signature, "utf8");
  const expectedBuffer = Buffer.from(expectedSignature, "utf8");

  if (providedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(providedBuffer, expectedBuffer);
}

/**
 * Verify Razorpay webhook signature
 */
function verifyRazorpayWebhookSignature(webhookSecret, payload, signature) {
  if (!webhookSecret) {
    return false;
  }
  
  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(payload)
    .digest("hex");
  
  const providedBuffer = Buffer.from(signature, "utf8");
  const expectedBuffer = Buffer.from(expectedSignature, "utf8");
  
  if (providedBuffer.length !== expectedBuffer.length) {
    return false;
  }
  
  return crypto.timingSafeEqual(providedBuffer, expectedBuffer);
}

/**
 * Get plan pricing (authoritative server-side)
 * @param {string} planId - Plan ID (e.g., "starter", "pro")
 * @param {string} billingPeriod - Billing period ("monthly" | "yearly")
 * @returns {number|null} Amount in paise, or null if invalid
 */
function getPlanAmount(planId, billingPeriod = "monthly") {
  // Pricing in paise (INR)
  const pricing = {
    starter: {
      monthly: 999, // 9.99 INR equivalent (placeholder)
      yearly: 9990,
    },
    pro: {
      monthly: 2900,
      yearly: 29000,
    },
    teams: {
      monthly: 5900,
      yearly: 59000,
    }
  };
  
  if (!pricing[planId]) {
    return null;
  }
  
  const period = billingPeriod === "yearly" ? "yearly" : "monthly";
  return pricing[planId][period] || null;
}

/**
 * Register billing routes
 */
export default function registerBilling(app) {
  app.get("/api/billing/status", (req, res) => {
    const anonId = getAnonId(req);
    if (!anonId) {
      return res.status(400).json({
        ok: false,
        entitlements: null,
        error: { code: "MISSING_ANON_ID", message: "Missing x-rp-anon-id header", retryable: false }
      });
    }
    const entitlements = getEntitlements(anonId);
    return res.json({ ok: true, entitlements, error: null });
  });

  // POST /api/billing/razorpay/create-order (Phase 4.2)
  app.get("/api/billing/config", (req, res) => {
    const c = getRazorpayConfig();
    return res.json({
      ok: true,
      razorpay_configured: !!c.ok,
      trial_days: getTrialDays()
    });
  });

  app.post("/api/billing/razorpay/create-subscription", async (req, res) => {
    const anonId = getAnonId(req);
    if (!anonId) {
      return res.status(400).json({
        ok: false,
        subscription: null,
        key_id: null,
        error: { code: "MISSING_ANON_ID", message: "Missing x-rp-anon-id header", retryable: false }
      });
    }

    const { plan_id, billing_period, email, name } = req.body || {};
    if (!plan_id || typeof plan_id !== "string") {
      return res.status(400).json({
        ok: false,
        subscription: null,
        key_id: null,
        error: { code: "INVALID_PLAN_ID", message: "Missing or invalid plan_id", retryable: false }
      });
    }

    if (!["starter", "pro", "teams"].includes(plan_id)) {
      return res.status(400).json({
        ok: false,
        subscription: null,
        key_id: null,
        error: { code: "INVALID_PLAN_ID", message: 'plan_id must be "starter", "pro", or "teams"', retryable: false }
      });
    }

    const period = billing_period === "yearly" ? "yearly" : "monthly";
    const config = getRazorpayConfig();
    if (!config.ok) {
      return res.status(500).json({
        ok: false,
        subscription: null,
        key_id: null,
        error: { code: "RAZORPAY_NOT_CONFIGURED", message: "Razorpay not configured", retryable: false }
      });
    }

    const razorpayPlanId = getPlanId(plan_id, period);
    if (!razorpayPlanId) {
      return res.status(400).json({
        ok: false,
        subscription: null,
        key_id: null,
        error: { code: "MISSING_PLAN_ID", message: "Razorpay plan ID not configured", retryable: false }
      });
    }

    const trialDays = getTrialDays();
    const startAt = trialDays > 0 ? Math.floor(Date.now() / 1000) + trialDays * 86400 : undefined;
    const totalCount = period === "yearly" ? 10 : 120;
    const payload = {
      plan_id: razorpayPlanId,
      total_count: totalCount,
      customer_notify: 1,
      quantity: 1,
      notes: {
        anon_id: anonId,
        plan_id,
        billing_period: period
      }
    };
    if (email) {
      payload.notify_info = { email, name: name || email };
    }
    if (startAt) payload.start_at = startAt;

    try {
      const subscription = await createRazorpaySubscription(
        config.keyId,
        config.keySecret,
        payload
      );

      const trialEndsAt = startAt ? new Date(startAt * 1000).toISOString() : null;
      setEntitlements(anonId, {
        plan_id,
        status: trialDays > 0 ? "trialing" : "pending",
        billing_period: period,
        subscription_id: subscription.id,
        trial_ends_at: trialEndsAt,
        cancel_at_period_end: false
      });

      await logEvent(anonId, "billing_subscription_created", "", {
        plan_id,
        billing_period: period,
        subscription_id: subscription.id,
        trial_days: trialDays
      });

      return res.json({
        ok: true,
        subscription: {
          id: subscription.id,
          status: subscription.status,
          start_at: subscription.start_at,
          short_url: subscription.short_url || null,
          notes: subscription.notes || payload.notes
        },
        key_id: config.keyId,
        trial_days: trialDays,
        error: null
      });
    } catch (err) {
      console.error("Failed to create Razorpay subscription:", err);
      return res.status(500).json({
        ok: false,
        subscription: null,
        key_id: null,
        error: { code: "SUBSCRIPTION_CREATION_FAILED", message: String(err?.message || err), retryable: true }
      });
    }
  });

  app.post("/api/billing/razorpay/verify-subscription", async (req, res) => {
    const anonId = getAnonId(req);
    if (!anonId) {
      return res.status(400).json({
        ok: false,
        entitlements: null,
        error: { code: "MISSING_ANON_ID", message: "Missing x-rp-anon-id header", retryable: false }
      });
    }

    const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature } = req.body || {};
    if (!razorpay_payment_id || typeof razorpay_payment_id !== "string") {
      return res.status(400).json({
        ok: false,
        entitlements: null,
        error: { code: "INVALID_INPUT", message: "Missing or invalid razorpay_payment_id", retryable: false }
      });
    }
    if (!razorpay_subscription_id || typeof razorpay_subscription_id !== "string") {
      return res.status(400).json({
        ok: false,
        entitlements: null,
        error: { code: "INVALID_INPUT", message: "Missing or invalid razorpay_subscription_id", retryable: false }
      });
    }
    if (!razorpay_signature || typeof razorpay_signature !== "string") {
      return res.status(400).json({
        ok: false,
        entitlements: null,
        error: { code: "INVALID_INPUT", message: "Missing or invalid razorpay_signature", retryable: false }
      });
    }

    const config = getRazorpayConfig();
    if (!config.ok) {
      return res.status(500).json({
        ok: false,
        entitlements: null,
        error: { code: "RAZORPAY_NOT_CONFIGURED", message: "Razorpay not configured", retryable: false }
      });
    }

    const existingPayment = getProcessedPayment(razorpay_payment_id);
    if (existingPayment) {
      const entitlements = getEntitlements(anonId);
      return res.json({
        ok: true,
        entitlements,
        error: null
      });
    }

    const isValid = verifyRazorpaySubscriptionSignature(
      razorpay_subscription_id,
      razorpay_payment_id,
      razorpay_signature,
      config.keySecret
    );

    if (!isValid) {
      await logEvent(anonId, "billing_payment_failed_verification", "", {
        subscriptionId: razorpay_subscription_id,
        paymentId: razorpay_payment_id
      });
      return res.status(400).json({
        ok: false,
        entitlements: null,
        error: { code: "INVALID_SIGNATURE", message: "Payment signature verification failed", retryable: false }
      });
    }

    try {
      let planId = "pro";
      let billingPeriod = "monthly";
      const subscription = await fetchRazorpaySubscription(config.keyId, config.keySecret, razorpay_subscription_id);
      if (subscription.notes) {
        planId = subscription.notes.plan_id || planId;
        billingPeriod = subscription.notes.billing_period || billingPeriod;
      } else if (subscription.plan_id) {
        planId = resolvePlanKeyFromRazorpay(subscription.plan_id);
      }

      markPaymentProcessed(razorpay_payment_id, razorpay_subscription_id, anonId, planId);

      const now = new Date();
      const periodEnd = new Date(now);
      if (billingPeriod === "yearly") {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      } else {
        periodEnd.setMonth(periodEnd.getMonth() + 1);
      }

      const updated = setEntitlements(anonId, {
        plan_id: planId,
        status: "paid",
        billing_period: billingPeriod,
        current_period_end: periodEnd.toISOString(),
        subscription_id: razorpay_subscription_id,
        cancel_at_period_end: false
      });

      setUserPlan(anonId, planId);

      await logEvent(anonId, "billing_subscription_verified", "", {
        plan_id: planId,
        billing_period: billingPeriod,
        subscription_id: razorpay_subscription_id,
        paymentId: razorpay_payment_id
      });

      return res.json({
        ok: true,
        entitlements: updated.entitlements,
        error: null
      });
    } catch (err) {
      console.error("Failed to verify subscription:", err);
      return res.status(500).json({
        ok: false,
        entitlements: null,
        error: { code: "SUBSCRIPTION_VERIFY_FAILED", message: "Failed to verify subscription", retryable: true }
      });
    }
  });

  app.post("/api/billing/razorpay/cancel-subscription", async (req, res) => {
    const anonId = getAnonId(req);
    if (!anonId) {
      return res.status(400).json({
        ok: false,
        error: { code: "MISSING_ANON_ID", message: "Missing x-rp-anon-id header", retryable: false }
      });
    }

    const { subscription_id, cancel_at_period_end } = req.body || {};
    const entitlements = getEntitlements(anonId);
    const subId = subscription_id || entitlements.subscription_id;
    if (!subId) {
      return res.status(400).json({
        ok: false,
        error: { code: "MISSING_SUBSCRIPTION", message: "No subscription found", retryable: false }
      });
    }

    const config = getRazorpayConfig();
    if (!config.ok) {
      return res.status(500).json({
        ok: false,
        error: { code: "RAZORPAY_NOT_CONFIGURED", message: "Razorpay not configured", retryable: false }
      });
    }

    try {
      const canceled = await cancelRazorpaySubscription(
        config.keyId,
        config.keySecret,
        subId,
        cancel_at_period_end !== false
      );
      const status = cancel_at_period_end !== false ? "canceling" : "canceled";
      const updated = setEntitlements(anonId, {
        status,
        subscription_id: subId,
        cancel_at_period_end: cancel_at_period_end !== false
      });
      await logEvent(anonId, "billing_subscription_canceled", "", {
        subscription_id: subId,
        at_period_end: cancel_at_period_end !== false
      });
      return res.json({ ok: true, entitlements: updated.entitlements, subscription: canceled, error: null });
    } catch (err) {
      console.error("Failed to cancel subscription:", err);
      return res.status(500).json({
        ok: false,
        error: { code: "CANCEL_FAILED", message: String(err?.message || err), retryable: true }
      });
    }
  });

  app.get("/api/billing/razorpay/invoices", async (req, res) => {
    const anonId = getAnonId(req);
    if (!anonId) {
      return res.status(400).json({
        ok: false,
        invoices: [],
        error: { code: "MISSING_ANON_ID", message: "Missing x-rp-anon-id header", retryable: false }
      });
    }
    const entitlements = getEntitlements(anonId);
    if (!entitlements.subscription_id) {
      return res.json({ ok: true, invoices: [], error: null });
    }
    const config = getRazorpayConfig();
    if (!config.ok) {
      return res.status(500).json({
        ok: false,
        invoices: [],
        error: { code: "RAZORPAY_NOT_CONFIGURED", message: "Razorpay not configured", retryable: false }
      });
    }
    try {
      const result = await fetchRazorpayInvoices(config.keyId, config.keySecret, entitlements.subscription_id);
      return res.json({ ok: true, invoices: result.items || [], error: null });
    } catch (err) {
      console.error("Failed to fetch invoices:", err);
      return res.status(500).json({
        ok: false,
        invoices: [],
        error: { code: "INVOICE_FETCH_FAILED", message: String(err?.message || err), retryable: true }
      });
    }
  });

  app.post("/api/billing/razorpay/create-order", async (req, res) => {
    const anonId = getAnonId(req);
    
    if (!anonId) {
      return res.status(400).json({
        ok: false,
        order: null,
        key_id: null,
        error: { code: "MISSING_ANON_ID", message: "Missing x-rp-anon-id header", retryable: false }
      });
    }
    
    const { plan_id, billing_period } = req.body || {};
    
    // Validate plan_id
    if (!plan_id || typeof plan_id !== "string") {
      return res.status(400).json({
        ok: false,
        order: null,
        key_id: null,
        error: { code: "INVALID_PLAN_ID", message: "Missing or invalid plan_id", retryable: false }
      });
    }
    
    if (!["starter", "pro", "teams"].includes(plan_id)) {
      return res.status(400).json({
        ok: false,
        order: null,
        key_id: null,
        error: { code: "INVALID_PLAN_ID", message: 'plan_id must be "starter", "pro", or "teams"', retryable: false }
      });
    }
    
    // Validate billing_period
    const period = billing_period === "yearly" ? "yearly" : "monthly";
    
    const config = getRazorpayConfig();
    if (!config.ok) {
      return res.status(500).json({
        ok: false,
        order: null,
        key_id: null,
        error: { code: "RAZORPAY_NOT_CONFIGURED", message: "Razorpay not configured", retryable: false }
      });
    }
    
    // Compute amount server-side (authoritative)
    const amount = getPlanAmount(plan_id, period);
    if (!amount) {
      return res.status(400).json({
        ok: false,
        order: null,
        key_id: null,
        error: { code: "INVALID_PLAN_PRICING", message: "Invalid plan pricing", retryable: false }
      });
    }
    
    // Generate unique receipt
    const timestamp = Date.now();
    const receipt = `rp_${anonId}_${timestamp}`;
    
    // Notes must include anon_id, plan_id, billing_period
    const notes = {
      anon_id: anonId,
      plan_id,
      billing_period: period,
    };
    
    try {
      const order = await createRazorpayOrder(
        config.keyId,
        config.keySecret,
        amount,
        receipt,
        notes
      );
      
      // Log event
      await logEvent(anonId, "billing_order_created", "", {
        plan_id,
        billing_period: period,
        amount,
        orderId: order.id,
      });
      
      // Response must match Phase 4.2 spec
      return res.json({
        ok: true,
        order: {
          id: order.id,
          amount: order.amount,
          currency: order.currency || "INR",
          receipt: receipt,
          notes: notes
        },
        key_id: config.keyId,
        error: null
      });
    } catch (err) {
      console.error("Failed to create Razorpay order:", err);
      return res.status(500).json({
        ok: false,
        order: null,
        key_id: null,
        error: { code: "ORDER_CREATION_FAILED", message: String(err?.message || err), retryable: true }
      });
    }
  });
  
  // POST /api/billing/razorpay/verify (Phase 4.2 - idempotent)
  app.post("/api/billing/razorpay/verify", async (req, res) => {
    const anonId = getAnonId(req);
    
    if (!anonId) {
      return res.status(400).json({
        ok: false,
        entitlements: null,
        error: { code: "MISSING_ANON_ID", message: "Missing x-rp-anon-id header", retryable: false }
      });
    }
    
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};
    
    // Validate inputs
    if (!razorpay_order_id || typeof razorpay_order_id !== "string") {
      return res.status(400).json({
        ok: false,
        entitlements: null,
        error: { code: "INVALID_INPUT", message: "Missing or invalid razorpay_order_id", retryable: false }
      });
    }
    
    if (!razorpay_payment_id || typeof razorpay_payment_id !== "string") {
      return res.status(400).json({
        ok: false,
        entitlements: null,
        error: { code: "INVALID_INPUT", message: "Missing or invalid razorpay_payment_id", retryable: false }
      });
    }
    
    if (!razorpay_signature || typeof razorpay_signature !== "string") {
      return res.status(400).json({
        ok: false,
        entitlements: null,
        error: { code: "INVALID_INPUT", message: "Missing or invalid razorpay_signature", retryable: false }
      });
    }
    
    const config = getRazorpayConfig();
    if (!config.ok) {
      return res.status(500).json({
        ok: false,
        entitlements: null,
        error: { code: "RAZORPAY_NOT_CONFIGURED", message: "Razorpay not configured", retryable: false }
      });
    }
    
    // IDEMPOTENCY CHECK: Check if payment was already processed
    const existingPayment = getProcessedPayment(razorpay_payment_id);
    if (existingPayment) {
      // Payment already processed - return current entitlements (idempotent)
      const entitlements = getEntitlements(anonId);
      await logEvent(anonId, "billing_payment_verify_duplicate", "", {
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        processedAt: existingPayment.processed_at
      });
      
      return res.json({
        ok: true,
        entitlements: {
          plan_id: entitlements.plan_id,
          status: entitlements.status,
          billing_period: entitlements.billing_period,
          current_period_end: entitlements.current_period_end,
          updated_at: entitlements.updated_at
        },
        error: null
      });
    }
    
    // Verify signature (must be valid before processing)
    const isValid = verifyRazorpaySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      config.keySecret
    );
    
    if (!isValid) {
      // Log failed verification
      await logEvent(anonId, "billing_payment_failed_verification", "", {
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
      });
      
      return res.status(400).json({
        ok: false,
        entitlements: null,
        error: { code: "INVALID_SIGNATURE", message: "Payment signature verification failed", retryable: false }
      });
    }
    
    // Signature is valid - process payment
    try {
      // Fetch order from Razorpay to get notes (plan_id, billing_period)
      let planId = "pro";
      let billingPeriod = "monthly";
      
      try {
        const order = await fetchRazorpayOrder(config.keyId, config.keySecret, razorpay_order_id);
        if (order.notes) {
          planId = order.notes.plan_id || planId;
          billingPeriod = order.notes.billing_period || billingPeriod;
        }
      } catch (err) {
        console.warn("Failed to fetch order details, using defaults:", err);
        // Continue with defaults if order fetch fails
      }
      
      // Mark payment as processed (idempotency)
      markPaymentProcessed(razorpay_payment_id, razorpay_order_id, anonId, planId);
      
      // Update entitlements
      const now = new Date();
      const periodEnd = new Date(now);
      if (billingPeriod === "yearly") {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      } else {
        periodEnd.setMonth(periodEnd.getMonth() + 1);
      }
      
      const updatedEntitlements = setEntitlements(anonId, {
        plan_id: planId,
        status: "paid",
        billing_period: billingPeriod,
        current_period_end: periodEnd.toISOString()
      });
      
      // Also update legacy plan store for backward compatibility
      setUserPlan(anonId, planId);
      
      // Log successful verification
      await logEvent(anonId, "billing_payment_verified", "", {
        plan_id: planId,
        billing_period: billingPeriod,
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
      });
      
      return res.json({
        ok: true,
        entitlements: {
          plan_id: updatedEntitlements.plan_id,
          status: updatedEntitlements.status,
          billing_period: updatedEntitlements.billing_period,
          current_period_end: updatedEntitlements.current_period_end,
          updated_at: updatedEntitlements.updated_at
        },
        error: null
      });
    } catch (err) {
      console.error("Failed to process payment:", err);
      return res.status(500).json({
        ok: false,
        entitlements: null,
        error: { code: "PAYMENT_PROCESSING_FAILED", message: "Failed to process payment", retryable: true }
      });
    }
  });
  
  // POST /api/billing/verify (legacy endpoint - kept for backward compatibility)
  app.post("/api/billing/verify", async (req, res) => {
    const anonId = getAnonId(req);
    
    if (!anonId) {
      return jsonError(res, 400, "MISSING_ANON_ID", "Missing x-rp-anon-id header");
    }
    
    const { plan, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};
    
    // Validate inputs
    if (!plan || typeof plan !== "string") {
      return jsonError(res, 400, "INVALID_INPUT", "Missing or invalid plan");
    }
    
    if (!razorpay_order_id || typeof razorpay_order_id !== "string") {
      return jsonError(res, 400, "INVALID_INPUT", "Missing or invalid razorpay_order_id");
    }
    
    if (!razorpay_payment_id || typeof razorpay_payment_id !== "string") {
      return jsonError(res, 400, "INVALID_INPUT", "Missing or invalid razorpay_payment_id");
    }
    
    if (!razorpay_signature || typeof razorpay_signature !== "string") {
      return jsonError(res, 400, "INVALID_INPUT", "Missing or invalid razorpay_signature");
    }
    
    if (!["starter", "pro", "teams"].includes(plan)) {
      return jsonError(res, 400, "INVALID_PLAN", 'plan must be "starter", "pro", or "teams"');
    }
    
    const config = getRazorpayConfig();
    if (!config.ok) {
      return res.status(500).json({ ok: false, error: config.error });
    }
    
    // Check idempotency
    const existingPayment = getProcessedPayment(razorpay_payment_id);
    if (existingPayment) {
      const entitlements = getEntitlements(anonId);
      return res.json({
        ok: true,
        verified: true,
        plan: entitlements.plan_id,
      });
    }
    
    // Verify signature
    const isValid = verifyRazorpaySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      config.keySecret
    );
    
    if (!isValid) {
      await logEvent(anonId, "billing_payment_failed_verification", "", {
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
      });
      
      return res.status(400).json({
        ok: false,
        verified: false,
        error: "invalid signature",
      });
    }
    
    // Signature is valid - upgrade user plan
    try {
      markPaymentProcessed(razorpay_payment_id, razorpay_order_id, anonId, plan);
      setUserPlan(anonId, plan);
      setEntitlements(anonId, {
        plan_id: plan,
        status: "paid",
        billing_period: "monthly"
      });
      
      await logEvent(anonId, "billing_payment_verified", "", {
        plan,
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
      });
      
      return res.json({
        ok: true,
        verified: true,
        plan,
      });
    } catch (err) {
      console.error("Failed to set user plan:", err);
      return jsonError(res, 500, "PLAN_UPDATE_FAILED", "Failed to upgrade plan");
    }
  });
  
  // POST /api/billing/webhook (stub for future implementation)
  app.post("/api/billing/webhook", async (req, res) => {
    const config = getRazorpayConfig();
    
    if (!config.ok) {
      return res.status(500).json({ ok: false, error: config.error });
    }
    
    // Note: For proper webhook signature verification, we need raw body.
    // Express parses JSON automatically, so this is a limitation of the stub.
    // Full implementation would require raw body middleware (express.raw() or similar).
    const rawBody = JSON.stringify(req.body);
    const signature = req.headers["x-razorpay-signature"];
    
    // Verify webhook signature if webhook secret is configured
    if (config.webhookSecret && signature) {
      const isValid = verifyRazorpayWebhookSignature(
        config.webhookSecret,
        rawBody,
        signature
      );
      
      if (!isValid) {
        return res.status(400).json({
          ok: false,
          error: "invalid webhook signature",
        });
      }
    }
    
    // Log webhook received (for now, just log)
    // Webhooks come from Razorpay, not from users, so anonId may not be available
    const anonId = getAnonId(req) || req.body?.payload?.payment?.entity?.notes?.anonId || "webhook";
    await logEvent(anonId, "billing_webhook_received", "", {
      event: req.body?.event || "unknown",
      entity: req.body?.payload?.payment?.entity?.id || "unknown",
    });
    
    // Stub: return success without processing
    return res.json({ ok: true });
  });
}
