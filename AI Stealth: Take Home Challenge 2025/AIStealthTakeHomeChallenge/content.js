const scriptUrl = chrome.runtime.getURL("injected.js");
const styleUrl = chrome.runtime.getURL("styles.css");

function injectScript() {
  const script = document.createElement("script");
  script.src = scriptUrl;
  script.type = "module";
  script.dataset.tgDisappearing = "true";
  document.documentElement.appendChild(script);
  script.addEventListener("load", () => {
    script.remove();
  });
}

function injectStyles() {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = styleUrl;
  link.dataset.tgDisappearing = "true";
  document.documentElement.appendChild(link);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    injectStyles();
    injectScript();
  });
} else {
  injectStyles();
  injectScript();
}