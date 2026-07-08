(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const countEl = $("count");
  const wordEl = $("word");
  const resultEl = $("result");
  const summaryEl = $("flavorSummary");
  const metricsEl = $("metrics");
  const tagsEl = $("tags");
  const quoteEl = $("quote");
  const titleEl = $("title");
  const canvas = $("canvas");

  if (!countEl || !wordEl || !resultEl || !summaryEl) return;

  const familyInfo = {
    fruit:  { label: "果香明亮系", icon: "🍓", color: "#ff8a65", title: "花果光譜咖啡", role: "果香導航員" },
    floral: { label: "花香優雅系", icon: "🌸", color: "#f6a6ff", title: "茉莉雲朵咖啡", role: "花香收藏家" },
    sweet:  { label: "甜香回甘系", icon: "🍯", color: "#ffd56a", title: "蜂蜜焦糖咖啡", role: "甜感調香師" },
    body:   { label: "醇厚可可系", icon: "☕", color: "#c98145", title: "絲絨可可咖啡", role: "口感雕刻師" },
    mature: { label: "酒香香料系", icon: "🍷", color: "#d679b7", title: "酒香暮色咖啡", role: "餘韻鍊金師" },
    muted:  { label: "茶感沉靜系", icon: "💧", color: "#8ca5b3", title: "雨後茶霧咖啡", role: "安靜品飲家" }
  };

  const categoryFamily = {
    水感: "muted", 清新: "muted", 單薄: "muted", 輕盈: "muted", 短促: "muted", 乾淨: "muted", 苦感: "muted", 苦澀: "muted", 乾澀: "muted", 土質: "muted", 過熟: "muted",
    果香: "fruit", 果甜: "fruit", 柑橘: "fruit", 酸質: "fruit",
    花香: "floral",
    甜香: "sweet", 甜感: "sweet", 糖香: "sweet", 回甘: "sweet",
    堅果: "body", 口感: "body", 平衡: "body", 醇厚: "body", 烘焙: "body", 餘韻: "body",
    發酵香: "mature", 酒香: "mature", 煙燻: "mature", 香料: "mature"
  };

  const metricInfluence = {
    fruit:  { 香氣: 3, 明亮感: 6, 醇厚度: -1, 順口度: 1, 平衡感: 1, 餘韻: 1 },
    floral: { 香氣: 7, 明亮感: 2, 醇厚度: 0, 順口度: 2, 平衡感: 2, 餘韻: 3 },
    sweet:  { 香氣: 2, 明亮感: 0, 醇厚度: 2, 順口度: 5, 平衡感: 4, 餘韻: 3 },
    body:   { 香氣: 1, 明亮感: -2, 醇厚度: 7, 順口度: 4, 平衡感: 4, 餘韻: 4 },
    mature: { 香氣: 3, 明亮感: -1, 醇厚度: 2, 順口度: -1, 平衡感: 1, 餘韻: 7 },
    muted:  { 香氣: -3, 明亮感: -2, 醇厚度: -2, 順口度: -3, 平衡感: -3, 餘韻: -2 }
  };

  const stageNames = ["聞香", "啜飲", "餘韻"];
  const stageColors = ["#ff8aa0", "#8fe3c2", "#ffd56a"];
  let choices = [];
  let applied = false;

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const beans = (value) => {
    const filled = clamp(Math.round(value / 20), 1, 5);
    return "◆".repeat(filled) + "◇".repeat(5 - filled);
  };

  function familyFor(category) {
    return categoryFamily[category] || "muted";
  }

  function readChoice(index) {
    const span = wordEl.querySelector("span");
    const small = wordEl.querySelector("small");
    if (!span || !small) return;
    const raw = span.textContent.trim();
    if (!raw.startsWith("抓到：")) return;
    const category = raw.replace("抓到：", "").trim();
    const detail = small.textContent.trim();
    if (!category || !detail) return;
    choices[index] = {
      category,
      detail,
      family: familyFor(category),
      stage: Math.floor(index / 2),
      text: `${category}・${detail}`
    };
  }

  function recoverFromTags() {
    if (choices.filter(Boolean).length >= 6) return;
    const tags = [...tagsEl.querySelectorAll(".tag")].map((tag) => tag.textContent.replace(/^#\s*/, "").trim());
    tags.slice(0, 6).forEach((text, index) => {
      if (choices[index] || !text) return;
      const [category, ...rest] = text.split("・");
      choices[index] = {
        category,
        detail: rest.join("・") || "未命名風味",
        family: familyFor(category),
        stage: Math.floor(index / 2),
        text
      };
    });
  }

  function familyCounts() {
    const counts = Object.fromEntries(Object.keys(familyInfo).map((key) => [key, 0]));
    choices.filter(Boolean).forEach((choice) => { counts[choice.family] += 1; });
    return counts;
  }

  function dominantFamily(counts) {
    const ordered = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    if (!ordered.length) return "muted";
    if (ordered[0][1] === ordered[1]?.[1]) {
      const priority = ["floral", "fruit", "sweet", "body", "mature", "muted"];
      return priority.find((key) => counts[key] === ordered[0][1]) || ordered[0][0];
    }
    return ordered[0][0];
  }

  function adjustMetrics() {
    const values = {};
    [...metricsEl.querySelectorAll(".metric")].forEach((card) => {
      const label = card.querySelector("b")?.textContent || "";
      const match = label.match(/^([^\d]+)\s+(\d+)/);
      if (match) values[match[1].trim()] = Number(match[2]);
    });

    choices.filter(Boolean).forEach((choice) => {
      const influence = metricInfluence[choice.family];
      Object.entries(influence).forEach(([metric, amount]) => {
        if (metric in values) values[metric] += amount;
      });
    });

    Object.keys(values).forEach((key) => { values[key] = Math.round(clamp(values[key], 10, 100)); });
    metricsEl.innerHTML = ["香氣", "明亮感", "醇厚度", "順口度", "平衡感", "餘韻"]
      .map((key) => `<div class="metric"><b>${key} ${values[key]}</b><span class="beans">${beans(values[key])}</span></div>`)
      .join("");
    return values;
  }

  function buildSummary(counts, dominant) {
    const info = familyInfo[dominant];
    const bars = Object.entries(familyInfo).map(([key, family]) => {
      const count = counts[key];
      return `<div class="family-row"><span class="family-name">${family.icon} ${family.label.replace("系", "")}</span><span class="family-track"><i class="family-fill" style="--family-width:${(count / 6) * 100}%;--family-color:${family.color}"></i></span><span class="family-count">${count}</span></div>`;
    }).join("");

    const records = stageNames.map((name, stageIndex) => {
      const stageChoices = choices.filter((choice) => choice && choice.stage === stageIndex);
      return `<div class="stage-record" style="--stage-color:${stageColors[stageIndex]}"><strong>${name}</strong><div class="stage-flavors">${stageChoices.map((choice) => `<span class="stage-chip">${choice.text}</span>`).join("")}</div></div>`;
    }).join("");

    const signatures = choices.filter((choice) => choice && choice.family === dominant).map((choice) => choice.detail);
    const signatureText = [...new Set(signatures)].slice(0, 3).join("、") || choices.filter(Boolean).slice(0, 3).map((choice) => choice.detail).join("、");

    summaryEl.innerHTML = `
      <div class="summary-title"><span>你的主要風味家族</span><div><b>${info.icon} ${info.label}</b><em>${counts[dominant]} / 6 次選擇</em></div></div>
      <div class="family-bars">${bars}</div>
      <div class="stage-records">${records}</div>
      <div class="signature-note">代表細項：<b>${signatureText}</b><br>這些實際選擇已直接影響下方分數、咖啡命名與評語。</div>`;

    return signatureText;
  }

  function updateIdentity(dominant, signatureText, metricValues) {
    const info = familyInfo[dominant];
    titleEl.textContent = info.title;
    const score = Math.round(Object.values(metricValues).reduce((sum, value) => sum + value, 0) / Object.keys(metricValues).length);
    const descriptions = {
      fruit: `你的味覺集中在明亮果香，以 ${signatureText} 最有代表性，整體清爽、活潑，酸質輪廓鮮明。`,
      floral: `你的味覺特別容易捕捉細緻花香，以 ${signatureText} 最有代表性，香氣輕盈、優雅而有延伸感。`,
      sweet: `你的選擇偏向甜香與回甘，以 ${signatureText} 最有代表性，入口圓潤，甜感會在口中慢慢展開。`,
      body: `你的選擇集中在口感與醇厚度，以 ${signatureText} 最有代表性，整體像絲絨般厚實而穩定。`,
      mature: `你偏好發酵、酒香與香料層次，以 ${signatureText} 最有代表性，餘韻成熟、深邃且富有變化。`,
      muted: `你的味覺偏向安靜的茶感與低飽和風味，以 ${signatureText} 最有代表性，輪廓柔和、沉靜而克制。`
    };
    quoteEl.innerHTML = `<b>${info.role}</b><br>${descriptions[dominant]}<br><br>選擇回饋後總評分：<b>${score} / 100</b>`;
    return score;
  }

  function decorateCanvas(dominant, signatureText, score) {
    if (!canvas || !canvas.getContext) return;
    const oldWidth = canvas.width;
    const oldHeight = canvas.height;
    const snapshot = document.createElement("canvas");
    snapshot.width = oldWidth;
    snapshot.height = oldHeight;
    snapshot.getContext("2d").drawImage(canvas, 0, 0);

    canvas.height = 1450;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(snapshot, 0, 0);
    ctx.fillStyle = "#211511";
    ctx.fillRect(54, 1210, 792, 190);
    ctx.strokeStyle = familyInfo[dominant].color;
    ctx.lineWidth = 6;
    ctx.strokeRect(68, 1224, 764, 162);
    ctx.textAlign = "left";
    ctx.fillStyle = familyInfo[dominant].color;
    ctx.font = "bold 28px monospace";
    ctx.fillText(`${familyInfo[dominant].icon} ${familyInfo[dominant].label}`, 92, 1265);
    ctx.fillStyle = "#fff2cf";
    ctx.font = "20px monospace";
    ctx.fillText(`代表風味：${signatureText}`, 92, 1305);
    stageNames.forEach((name, index) => {
      const text = choices.filter((choice) => choice && choice.stage === index).map((choice) => choice.detail).join("・");
      ctx.fillStyle = stageColors[index];
      ctx.fillText(`${name}｜${text}`, 92, 1342 + index * 27);
    });
    ctx.textAlign = "right";
    ctx.fillStyle = "#ffd56a";
    ctx.font = "bold 30px monospace";
    ctx.fillText(`${score} / 100`, 806, 1371);
  }

  function applyFeedback() {
    if (applied) return;
    recoverFromTags();
    if (choices.filter(Boolean).length < 6) return;
    applied = true;
    const counts = familyCounts();
    const dominant = dominantFamily(counts);
    const metrics = adjustMetrics();
    const signatureText = buildSummary(counts, dominant);
    const score = updateIdentity(dominant, signatureText, metrics);
    decorateCanvas(dominant, signatureText, score);
  }

  const countObserver = new MutationObserver(() => {
    const number = Number.parseInt(countEl.textContent, 10);
    if (number === 0) {
      choices = [];
      applied = false;
      summaryEl.innerHTML = "";
      return;
    }
    if (number >= 1 && number <= 6) readChoice(number - 1);
  });
  countObserver.observe(countEl, { childList: true, characterData: true, subtree: true });

  const resultObserver = new MutationObserver(() => {
    if (!resultEl.classList.contains("hidden")) setTimeout(applyFeedback, 80);
    else applied = false;
  });
  resultObserver.observe(resultEl, { attributes: true, attributeFilter: ["class"] });
})();
