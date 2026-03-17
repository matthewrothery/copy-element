const params = new URLSearchParams(window.location.search);
const code = params.get("code") ?? "";
const install_id = params.get("install_id") ?? "";

chrome.runtime.sendMessage({
  type: "EXCHANGE_AUTH_CODE",
  payload: { code, install_id },
});
