(() => {
  "use strict";

  const restartButton = document.getElementById("restart");
  const downloadButton = document.getElementById("download");
  const canvas = document.getElementById("canvas");
  const toast = document.getElementById("toast");
  const MODE_KEY = "pixelCoffee:lastMode";

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove("show"), 1300);
  }

  function setBusy(button, busy, label) {
    if (!button) return;
    if (busy) {
      button.dataset.originalLabel = button.textContent;
      button.textContent = label;
      button.disabled = true;
      button.classList.add("is-busy");
    } else {
      button.textContent = button.dataset.originalLabel || button.textContent;
      button.disabled = false;
      button.classList.remove("is-busy");
      delete button.dataset.originalLabel;
    }
  }

  function isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  }

  function canvasToBlob(sourceCanvas) {
    return new Promise((resolve, reject) => {
      if (!sourceCanvas) {
        reject(new Error("找不到評測圖"));
        return;
      }
      sourceCanvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("圖片產生失敗"));
      }, "image/png", 1);
    });
  }

  function safeFileName() {
    const coffeeName = document.getElementById("title")?.textContent?.trim() || "像素咖啡評測";
    const mode = window.__coffeeRun?.modeLabel || "品嚐結果";
    return `${coffeeName}-${mode}.png`.replace(/[\\/:*?"<>|]/g, "-");
  }

  async function handleDownload(event) {
    event.preventDefault();
    event.stopImmediatePropagation();
    if (!downloadButton || downloadButton.disabled) return;

    setBusy(downloadButton, true, "產生圖片中");

    try {
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const blob = await canvasToBlob(canvas);
      const fileName = safeFileName();
      const file = new File([blob], fileName, { type: "image/png" });

      if (isIOS() && navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "像素咖啡評測",
          text: "我的像素咖啡品嚐結果"
        });
        showToast("可從分享選單儲存圖片");
      } else {
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = fileName;
        anchor.rel = "noopener";
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        setTimeout(() => URL.revokeObjectURL(url), 4000);
        showToast("評測圖已下載");
      }
    } catch (error) {
      if (error?.name !== "AbortError") {
        console.error("Coffee result download failed:", error);
        showToast("圖片產生失敗，請再試一次");
      }
    } finally {
      setBusy(downloadButton, false);
    }
  }

  function handleRestart(event) {
    event.preventDefault();
    event.stopImmediatePropagation();
    if (!restartButton || restartButton.disabled) return;

    setBusy(restartButton, true, "重新準備中");
    const mode = window.__coffeeRun?.mode;
    if (mode) sessionStorage.setItem(MODE_KEY, mode);

    setTimeout(() => {
      const cleanUrl = `${location.pathname}${location.search}`;
      location.replace(cleanUrl);
    }, 80);
  }

  function restoreMode() {
    const mode = sessionStorage.getItem(MODE_KEY);
    if (!mode) return;
    sessionStorage.removeItem(MODE_KEY);

    requestAnimationFrame(() => {
      const modeButton = document.querySelector(`.mode-btn[data-mode="${mode}"]`);
      modeButton?.click();
      window.scrollTo({ top: 0, behavior: "auto" });
    });
  }

  if (downloadButton) {
    downloadButton.onclick = null;
    downloadButton.addEventListener("click", handleDownload, { capture: true });
  }

  if (restartButton) {
    restartButton.onclick = null;
    restartButton.addEventListener("click", handleRestart, { capture: true });
  }

  restoreMode();
})();