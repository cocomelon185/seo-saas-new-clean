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
    pro: {
      monthly: 199900, // 1999 INR
      yearly: 1999000, // 19990 INR (10 months equivalent, ~17% discount)
    },
    starter: {
      monthly: 99900, // 999 INR
      yearly: 999000, // 9990 INR
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
  // POST /api/billing/razorpay/create-order (Phase 4.2)
  app.get("/api/billing/config", (req, res) => {
    const c = getRazorpayConfig();
    return res.json({ ok: true, razorpay_configured: !!c.ok });
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
    
    if (plan_id !== "pro" && plan_id !== "starter") {
      return res.status(400).json({
        ok: false,
        order: null,
        key_id: null,
        error: { code: "INVALID_PLAN_ID", message: 'plan_id must be "starter" or "pro"', retryable: false }
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
    
    if (plan !== "pro") {
      return jsonError(res, 400, "INVALID_PLAN", 'Only "pro" plan is supported');
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
