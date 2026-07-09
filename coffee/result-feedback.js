(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const resultEl = $("result");
  const summaryEl = $("flavorSummary");
  const metricsEl = $("metrics");
  const quoteEl = $("quote");
  const titleEl = $("title");
  const canvas = $("canvas");
  if (!resultEl || !summaryEl || !metricsEl || !quoteEl || !titleEl || !canvas) return;

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
    果香: "fruit", 果甜: "fruit", 柑橘: "fruit", 酸質: "fruit", 花香: "floral",
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

  const stageColors = ["#ff8aa0", "#8fe3c2", "#ffd56a"];
  let applied = false;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const beans = (value) => {
    const filled = clamp(Math.round(value / 20), 1, 5);
    return "◆".repeat(filled) + "◇".repeat(5 - filled);
  };

  function currentRun() {
    const run = window.__coffeeRun;
    if (!run || !Array.isArray(run.choices) || !run.choices.length) return null;
    return {
      ...run,
      total: run.total || run.choices.length,
      phaseNames: run.phaseNames || ["聞香", "啜飲", "餘韻"],
      choices: run.choices.map((choice) => ({
        ...choice,
        cat: choice.cat || String(choice.word || "").split("・")[0],
        detail: choice.detail || String(choice.word || "").split("・").slice(1).join("・"),
        family: categoryFamily[choice.cat] || choice.fx || "muted"
      }))
    };
  }

  function familyCounts(run) {
    const counts = Object.fromEntries(Object.keys(familyInfo).map((key) => [key, 0]));
    run.choices.forEach((choice) => { counts[choice.family] = (counts[choice.family] || 0) + 1; });
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

  function adjustMetrics(run) {
    const values = {};
    [...metricsEl.querySelectorAll(".metric")].forEach((card) => {
      const label = card.querySelector("b")?.textContent || "";
      const match = label.match(/^([^\d]+)\s+(\d+)/);
      if (match) values[match[1].trim()] = Number(match[2]);
    });

    const scale = 6 / run.total;
    run.choices.forEach((choice) => {
      const influence = metricInfluence[choice.family] || metricInfluence.muted;
      Object.entries(influence).forEach(([metric, amount]) => {
        if (metric in values) values[metric] += amount * scale;
      });
    });

    Object.keys(values).forEach((key) => { values[key] = Math.round(clamp(values[key], 10, 100)); });
    metricsEl.innerHTML = ["香氣", "明亮感", "醇厚度", "順口度", "平衡感", "餘韻"]
      .map((key) => `<div class="metric"><b>${key} ${values[key]}</b><span class="beans">${beans(values[key])}</span></div>`).join("");
    return values;
  }

  function buildSummary(run, counts, dominant) {
    const info = familyInfo[dominant];
    const bars = Object.entries(familyInfo).map(([key, family]) => {
      const count = counts[key];
      const width = run.total ? (count / run.total) * 100 : 0;
      return `<div class="family-row"><span class="family-name">${family.icon} ${family.label.replace("系", "")}</span><span class="family-track"><i class="family-fill" style="--family-width:${width}%;--family-color:${family.color}"></i></span><span class="family-count">${count}</span></div>`;
    }).join("");

    const records = run.phaseNames.map((name, phaseIndex) => {
      const stageChoices = run.choices.filter((choice) => Number(choice.phase) === phaseIndex);
      return `<div class="stage-record" style="--stage-color:${stageColors[phaseIndex]}"><strong>${name}</strong><div class="stage-flavors">${stageChoices.map((choice) => `<span class="stage-chip">${choice.cat}・${choice.detail}</span>`).join("")}</div></div>`;
    }).join("");

    const signatures = run.choices.filter((choice) => choice.family === dominant).map((choice) => choice.detail);
    const signatureText = [...new Set(signatures)].slice(0, 3).join("、") || run.choices.slice(0, 3).map((choice) => choice.detail).join("、");

    summaryEl.innerHTML = `
      <div class="summary-title"><span>你的主要風味家族</span><div><b>${info.icon} ${info.label}</b><em>${counts[dominant]} / ${run.total} 次選擇</em></div></div>
      <div class="family-bars">${bars}</div>
      <div class="stage-records">${records}</div>
      <div class="signature-note">代表細項：<b>${signatureText}</b><br>${run.modeLabel}・${run.total} 步的實際選擇已影響分數、咖啡命名、角色與評語。</div>`;
    return signatureText;
  }

  function updateIdentity(run, dominant, signatureText, metricValues) {
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
    quoteEl.innerHTML = `<b>${info.role}</b><br>${descriptions[dominant]}<br><span class="result-mode-chip">${run.modeLabel}・${run.total} 步</span><br>選擇回饋後總評分：<b>${score} / 100</b>`;
    return score;
  }

  function fitLine(text, max = 28) {
    return text.length > max ? `${text.slice(0, max - 1)}…` : text;
  }

  function decorateCanvas(run, dominant, signatureText, score) {
    const snapshot = document.createElement("canvas");
    snapshot.width = canvas.width;
    snapshot.height = canvas.height;
    snapshot.getContext("2d").drawImage(canvas, 0, 0);

    canvas.height = 1450;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(snapshot, 0, 0);
    ctx.fillStyle = "#211511"; ctx.fillRect(54, 1210, 792, 190);
    ctx.strokeStyle = familyInfo[dominant].color; ctx.lineWidth = 6; ctx.strokeRect(68, 1224, 764, 162);
    ctx.textAlign = "left";
    ctx.fillStyle = familyInfo[dominant].color; ctx.font = "bold 27px monospace";
    ctx.fillText(`${familyInfo[dominant].icon} ${familyInfo[dominant].label}・${run.modeLabel}`, 92, 1262);
    ctx.fillStyle = "#fff2cf"; ctx.font = "19px monospace";
    ctx.fillText(`代表風味：${fitLine(signatureText, 24)}`, 92, 1298);
    run.phaseNames.forEach((name, index) => {
      const text = run.choices.filter((choice) => Number(choice.phase) === index).map((choice) => choice.detail).join("・");
      ctx.fillStyle = stageColors[index];
      ctx.fillText(`${name}｜${fitLine(text, 31)}`, 92, 1332 + index * 28);
    });
    ctx.textAlign = "right"; ctx.fillStyle = "#ffd56a"; ctx.font = "bold 30px monospace";
    ctx.fillText(`${score} / 100`, 806, 1382);
  }

  function applyFeedback() {
    if (applied) return;
    const run = currentRun();
    if (!run || run.choices.length !== run.total) return;
    applied = true;
    const counts = familyCounts(run);
    const dominant = dominantFamily(counts);
    const metrics = adjustMetrics(run);
    const signatureText = buildSummary(run, counts, dominant);
    const score = updateIdentity(run, dominant, signatureText, metrics);
    decorateCanvas(run, dominant, signatureText, score);
  }

  const observer = new MutationObserver(() => {
    if (!resultEl.classList.contains("hidden")) setTimeout(applyFeedback, 90);
    else {
      applied = false;
      summaryEl.innerHTML = "";
    }
  });
  observer.observe(resultEl, { attributes: true, attributeFilter: ["class"] });
})();
