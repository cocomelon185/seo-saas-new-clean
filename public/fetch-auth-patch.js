(function () {
  const origFetch = window.fetch;
  window.fetch = function (input, init) {
    try {
      const token = localStorage.getItem("rp_token") || "";
      if (token) {
        init = init || {};
        const headers = new Headers(init.headers || {});
        if (!headers.has("Authorization")) headers.set("Authorization", "Bearer " + token);
        init.headers = headers;
      }
    } catch (e) {}
    return origFetch(input, init);
  };
})();
