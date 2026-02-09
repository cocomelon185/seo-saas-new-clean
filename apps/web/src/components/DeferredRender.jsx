import React, { useEffect, useState } from "react";

export default function DeferredRender({ children, timeout = 0, idleTimeout = 1200 }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      setReady(true);
      return undefined;
    }

    let cancelled = false;
    const finish = () => {
      if (!cancelled) setReady(true);
    };

    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(() => {
        if (timeout > 0) {
          window.setTimeout(finish, timeout);
        } else {
          finish();
        }
      }, { timeout: idleTimeout });

      return () => {
        cancelled = true;
        if (window.cancelIdleCallback) window.cancelIdleCallback(id);
      };
    }

    const id = window.setTimeout(finish, Math.max(1, timeout));
    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, [timeout, idleTimeout]);

  if (!ready) return null;
  return <>{children}</>;
}
