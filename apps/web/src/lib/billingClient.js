import { getAnonId } from "../utils/anonId.js";
import { getAuthUser } from "./authClient.js";
import { safeJson } from "./safeJson.js";
import { track } from "./eventsClient.js";

let razorpayLoader = null;

function loadRazorpayScript() {
  if (typeof window === "undefined") return Promise.reject(new Error("Not in browser"));
  if (window.Razorpay) return Promise.resolve(window.Razorpay);
  if (razorpayLoader) return razorpayLoader;

  razorpayLoader = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(window.Razorpay);
    script.onerror = () => reject(new Error("Failed to load Razorpay"));
    document.head.appendChild(script);
  });

  return razorpayLoader;
}

export async function startSubscriptionCheckout({ planId, billingPeriod, source = "pricing", onSuccess, onError }) {
  const anonId = getAnonId();
  const user = getAuthUser();
  const email = user?.email || "";
  const name = user?.name || "";

  try {
    track("upgrade_clicked", { plan_id: planId, billing_period: billingPeriod, source });
  } catch {}

  try {
    const res = await fetch("/api/billing/razorpay/create-subscription", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-rp-anon-id": anonId
      },
      body: JSON.stringify({
        plan_id: planId,
        billing_period: billingPeriod,
        email,
        name
      })
    });
    const data = await safeJson(res);
    if (!res.ok || !data?.subscription?.id || !data?.key_id) {
      throw new Error(data?.error?.message || "Unable to start checkout.");
    }

    const Razorpay = await loadRazorpayScript();

    const options = {
      key: data.key_id,
      subscription_id: data.subscription.id,
      name: "RankyPulse",
      description: "Premium SEO audits and fix plans",
      image: "/rankypulse-logo.svg",
      prefill: { email, name },
      theme: { color: "#7C3AED" },
      handler: async (response) => {
        try {
          const verifyRes = await fetch("/api/billing/razorpay/verify-subscription", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-rp-anon-id": anonId
            },
            body: JSON.stringify({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_subscription_id: response.razorpay_subscription_id,
              razorpay_signature: response.razorpay_signature
            })
          });
          const verifyData = await safeJson(verifyRes);
          if (!verifyRes.ok || !verifyData?.ok) {
            throw new Error(verifyData?.error?.message || "Payment verification failed.");
          }
          try {
            track("subscribed", { plan_id: planId, billing_period: billingPeriod, source });
          } catch {}
          onSuccess?.(verifyData);
        } catch (err) {
          onError?.(err);
        }
      },
      modal: {
        ondismiss: () => {
          onError?.(new Error("Checkout closed"));
        }
      }
    };

    const instance = new Razorpay(options);
    instance.open();
  } catch (err) {
    onError?.(err);
  }
}
