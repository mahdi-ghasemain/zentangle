window.addEventListener("beforeinstallprompt", function (event) {
  event.preventDefault();
  window.zentangleInstallPrompt = event;
  window.dispatchEvent(new Event("zentangle-install-ready"));
});
window.addEventListener("appinstalled", function () {
  window.zentangleInstallPrompt = null;
});
if ("serviceWorker" in navigator && window.isSecureContext) {
  window.addEventListener("load", function () {
    navigator.serviceWorker.register("/sw.js").catch(function () {});
  });
}
