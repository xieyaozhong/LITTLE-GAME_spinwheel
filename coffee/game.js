(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const E = {
    status: $("status"), stage: $("stage"), desc: $("desc"), count: $("count"),
    game: $("game"), scene: $("scene"), word: $("word"), particles: $("particles"),
    pulse: $("pulse"), hint: $("hint"), hold: $("hold"), result: $("result"),
    title: $("title"), metrics: $("metrics"), tags: $("tags"), quote: $("quote"),
    canvas: $("canvas"), toast: $("toast")
  };

  const stages = [
    { name: "第一口｜聞香", desc: "捕捉咖啡剛靠近時最先浮現的香氣。", hint: "果香、花香、甜香、堅果與發酵香會持續循環。", speed: 1450 },
    { name: "第二口｜啜飲", desc: "感受酸質、甜感、口感、醇厚與烘焙層次。", hint: "讓舌尖辨認酸甜、質地與厚度的細微差異。", speed: 1750 },
    { name: "第三口｜餘韻", desc: "記錄吞嚥後留下的回甘、香料、酒香與尾韻。", hint: "餘韻會反覆循環，錯過喜歡的詞可以再等下一輪。", speed: 2050 }
  ];

  const w = (cat, detail, score, fx) => ({ cat, detail, score, fx });
  const wordSets = [
    [
      w("水感", "稀薄", 18, "muted"), w("清新", "小黃瓜", 42, "muted"),
      w("果香", "青蘋果", 58, "fruit"), w("果香", "西洋梨", 64, "fruit"),
      w("果香", "檸檬", 72, "fruit"), w("果香", "葡萄柚", 86, "fruit"),
      w("果香", "柳橙", 82, "fruit"), w("果香", "佛手柑", 92, "fruit"),
      w("果香", "白葡萄", 88, "fruit"), w("果香", "水蜜桃", 90, "fruit"),
      w("果香", "杏桃", 84, "fruit"), w("果香", "草莓", 94, "fruit"),
      w("果香", "覆盆子", 96, "fruit"), w("果香", "藍莓", 88, "fruit"),
      w("果香", "黑醋栗", 86, "fruit"), w("果香", "鳳梨", 76, "fruit"),
      w("花香", "茉莉", 100, "floral"), w("花香", "橙花", 96, "floral"),
      w("花香", "玫瑰", 92, "floral"), w("花香", "薰衣草", 82, "floral"),
      w("花香", "洋甘菊", 86, "floral"), w("甜香", "蜂蜜", 90, "sweet"),
      w("甜香", "香草", 84, "sweet"), w("甜香", "黑糖", 78, "sweet"),
      w("堅果", "榛果", 66, "body"), w("堅果", "杏仁", 62, "body"),
      w("發酵香", "紅酒", 48, "mature"), w("發酵香", "蘭姆酒", 44, "mature"),
      w("過熟", "熟香蕉", 18, "muted")
    ],
    [
      w("單薄", "茶水感", 18, "muted"), w("輕盈", "白茶感", 48, "muted"),
      w("輕盈", "紅茶感", 54, "muted"), w("酸質", "檸檬酸", 72, "fruit"),
      w("酸質", "柳橙酸", 78, "fruit"), w("酸質", "青蘋果酸", 82, "fruit"),
      w("酸質", "白葡萄酸", 88, "fruit"), w("酸質", "莓果酸", 86, "fruit"),
      w("酸質", "百香果酸", 80, "fruit"), w("甜感", "蜂蜜", 92, "sweet"),
      w("甜感", "楓糖", 90, "sweet"), w("甜感", "蔗糖", 86, "sweet"),
      w("甜感", "黑糖", 84, "sweet"), w("甜感", "太妃糖", 88, "sweet"),
      w("口感", "絲滑", 100, "body"), w("口感", "奶油感", 94, "body"),
      w("口感", "果汁感", 88, "fruit"), w("口感", "糖漿感", 90, "sweet"),
      w("口感", "氣泡感", 80, "fruit"), w("平衡", "酸甜均衡", 96, "body"),
      w("平衡", "柔和圓潤", 94, "body"), w("醇厚", "牛奶巧克力", 90, "body"),
      w("醇厚", "黑巧克力", 80, "body"), w("醇厚", "奶油", 88, "body"),
      w("醇厚", "可可脂", 84, "body"), w("烘焙", "焦糖", 68, "body"),
      w("烘焙", "烤杏仁", 62, "body"), w("香料", "肉桂", 58, "mature"),
      w("苦感", "可可苦", 38, "muted"), w("苦澀", "藥草", 16, "muted")
    ],
    [
      w("短促", "快速消散", 18, "muted"), w("乾淨", "白茶尾韻", 54, "muted"),
      w("乾淨", "紅茶尾韻", 58, "muted"), w("果甜", "蘋果回甜", 72, "fruit"),
      w("果甜", "葡萄回甜", 82, "fruit"), w("果甜", "莓果回甜", 86, "fruit"),
      w("果甜", "桃子回甜", 88, "fruit"), w("柑橘", "佛手柑尾韻", 90, "fruit"),
      w("糖香", "焦糖回甘", 92, "sweet"), w("糖香", "黑糖回甘", 88, "sweet"),
      w("糖香", "楓糖尾韻", 90, "sweet"), w("回甘", "蜂蜜甜感", 100, "sweet"),
      w("回甘", "蔗糖甜感", 94, "sweet"), w("餘韻", "可可綿長", 96, "body"),
      w("餘韻", "堅果悠長", 90, "body"), w("餘韻", "奶油柔順", 94, "body"),
      w("餘韻", "花香回返", 96, "floral"), w("花香", "茉莉回香", 98, "floral"),
      w("香料", "肉桂", 76, "mature"), w("香料", "丁香", 66, "mature"),
      w("香料", "豆蔻", 72, "mature"), w("酒香", "紅酒發酵", 54, "mature"),
      w("酒香", "威士忌桶", 58, "mature"), w("酒香", "蘭姆葡萄", 62, "mature"),
      w("煙燻", "雪松木", 52, "mature"), w("煙燻", "烤木質", 46, "mature"),
      w("乾澀", "茶單寧", 24, "muted"), w("土質", "潮濕泥土", 20, "muted"),
      w("苦澀", "焦苦", 14, "muted")
    ]
  ];

  const S = { started: false, done: false, pressing: false, t0: 0, pulseStart: performance.now(), pulseScale: 0.3, wordIndex: -1, current: null, inputs: [], result: null };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const stageIndex = () => Math.min(2, Math.floor(S.inputs.length / 2));
  const stage = () => stages[stageIndex()];

  function toast(text) {
    E.toast.textContent = text;
    E.toast.classList.add("show");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => E.toast.classList.remove("show"), 950);
  }

  function tone(frequency, duration = 0.07) {
    try {
      tone.ctx = tone.ctx || new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = tone.ctx.createOscillator();
      const gain = tone.ctx.createGain();
      oscillator.type = "square";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.045, tone.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, tone.ctx.currentTime + duration);
      oscillator.connect(gain).connect(tone.ctx.destination);
      oscillator.start();
      oscillator.stop(tone.ctx.currentTime + duration);
    } catch (_) {}
  }

  function updateUI() {
    if (!S.started) {
      E.stage.textContent = "準備品飲";
      E.desc.textContent = "光圈與風味會持續循環，不必急著放開。";
      E.count.textContent = "0 / 6";
      return;
    }
    const currentStage = stage();
    E.stage.textContent = currentStage.name;
    E.desc.textContent = currentStage.desc;
    E.count.textContent = `${S.inputs.length} / 6`;
    E.hint.innerHTML = `<b>${currentStage.hint}</b><span>看到喜歡的大類與細項時放開手指。</span>`;
  }

  function animatePulse(now) {
    if (!S.done) {
      const currentStage = stage();
      const phase = ((now - S.pulseStart) % currentStage.speed) / currentStage.speed;
      const wave = phase < 0.5 ? phase * 2 : (1 - phase) * 2;
      const eased = 0.5 - 0.5 * Math.cos(Math.PI * wave);
      S.pulseScale = 0.28 + eased * 0.92;
      E.pulse.style.transform = `scale(${S.pulseScale})`;
      E.pulse.style.opacity = 0.55 + eased * 0.45;
      requestAnimationFrame(animatePulse);
    }
  }

  function clearFx() {
    E.scene.classList.remove("fx-fruit", "fx-floral", "fx-sweet", "fx-body", "fx-mature", "fx-muted");
    E.particles.innerHTML = "";
  }

  const palettes = {
    fruit: ["#ff6f61", "#ffb347", "#ffd166", "#ff8aa0"],
    floral: ["#f6a6ff", "#ffb8e8", "#e4c3ff", "#ffd2f1"],
    sweet: ["#ffd56a", "#ffbf45", "#fff0a8", "#ffde8a"],
    body: ["#c98145", "#9b5b36", "#dca56d", "#6d3f2a"],
    mature: ["#d679b7", "#8d3d70", "#b5639d", "#6f315f"],
    muted: ["#8ca5b3", "#667983", "#9bb0ba", "#52656e"]
  };

  function setFx(type) {
    clearFx();
    E.scene.classList.add(`fx-${type}`);
    const colors = palettes[type];
    const count = type === "mature" ? 8 : 13;
    for (let i = 0; i < count; i += 1) {
      const particle = document.createElement("i");
      const angle = Math.random() * Math.PI * 2;
      const radius = 72 + Math.random() * 105;
      particle.className = "particle";
      particle.style.setProperty("--x", `${Math.cos(angle) * radius}px`);
      particle.style.setProperty("--y", `${Math.sin(angle) * radius}px`);
      particle.style.setProperty("--delay", `${-Math.random() * 1.5}s`);
      particle.style.setProperty("--scale", `${0.7 + Math.random() * 1.2}`);
      particle.style.setProperty("--pc", colors[i % colors.length]);
      E.particles.appendChild(particle);
    }
  }

  function startGame() {
    S.started = true;
    S.pulseStart = performance.now();
    E.hold.textContent = "按住品嚐・選到喜歡的風味放開";
    updateUI();
    toast("第一口開始");
    tone(440);
  }

  function press(event) {
    event.preventDefault();
    window.getSelection?.()?.removeAllRanges();
    if (!S.started) { startGame(); return; }
    if (S.done || S.pressing) return;

    S.pressing = true;
    S.t0 = performance.now();
    S.wordIndex = -1;
    S.current = null;
    E.scene.classList.add("pressing");
    E.word.classList.add("active");
    E.hold.classList.add("down");
    navigator.vibrate?.(16);

    const loop = () => {
      if (!S.pressing) return;
      const elapsed = performance.now() - S.t0;
      const phase = (elapsed % 2900) / 2900;
      const progress = phase < 0.5 ? phase * 200 : (1 - phase) * 200;
      E.hold.style.setProperty("--progress", `${progress}%`);
      const words = wordSets[stageIndex()];
      const index = Math.floor(elapsed / 390) % words.length;
      const item = words[index];
      if (index !== S.wordIndex) {
        S.wordIndex = index;
        S.current = item;
        E.word.innerHTML = `<span>${item.cat}</span><small>${item.detail}</small>`;
        setFx(item.fx);
        tone(320 + (index % 12) * 24, 0.035);
        navigator.vibrate?.(7);
      }
      requestAnimationFrame(loop);
    };
    loop();
  }

  function release(event) {
    if (!S.pressing || S.done) return;
    event.preventDefault();
    S.pressing = false;
    E.scene.classList.remove("pressing");
    E.word.classList.remove("active");
    E.hold.classList.remove("down");

    const item = S.current || wordSets[stageIndex()][0];
    const duration = performance.now() - S.t0;
    const ring = clamp(1 - Math.abs(S.pulseScale - 0.95) / 0.75, 0, 1);
    const accuracy = clamp(ring * 0.52 + (item.score / 100) * 0.48, 0, 1);
    S.inputs.push({ duration, accuracy, word: `${item.cat}・${item.detail}`, score: item.score, fx: item.fx });

    E.word.innerHTML = `<span>抓到：${item.cat}</span><small>${item.detail}</small>`;
    toast(`${item.cat}・${item.detail}`);
    tone(420 + item.score * 2, 0.08);
    E.count.textContent = `${S.inputs.length} / 6`;
    setTimeout(clearFx, 420);

    if (S.inputs.length >= 6) { setTimeout(finish, 450); return; }
    if (S.inputs.length % 2 === 0) {
      S.pulseStart = performance.now();
      setTimeout(() => {
        updateUI();
        E.word.innerHTML = "<span>按住探索風味</span><small>更多細項會持續循環</small>";
        toast(`進入 ${stage().name}`);
      }, 320);
    }
  }

  function calculateResult() {
    const durations = S.inputs.map((x) => x.duration);
    const accuracies = S.inputs.map((x) => x.accuracy);
    const average = durations.reduce((a, b) => a + b, 0) / 6;
    const accuracyAverage = accuracies.reduce((a, b) => a + b, 0) / 6;
    const shortRatio = durations.filter((x) => x < 700).length / 6;
    const longRatio = durations.filter((x) => x > 1600).length / 6;
    const variance = durations.reduce((sum, x) => sum + (x - average) ** 2, 0) / 6;
    const consistency = clamp(1 - Math.sqrt(variance) / 1300, 0, 1);
    const metrics = {
      香氣: Math.round(clamp(48 + shortRatio * 28 + (accuracies[0] + accuracies[1]) * 14, 20, 100)),
      明亮感: Math.round(clamp(36 + shortRatio * 38 + (1 - longRatio) * 16, 15, 100)),
      醇厚度: Math.round(clamp(34 + longRatio * 34 + average / 55, 20, 100)),
      順口度: Math.round(clamp(38 + accuracyAverage * 48 + consistency * 18, 20, 100)),
      平衡感: Math.round(clamp(42 + consistency * 36 + (1 - Math.abs(shortRatio - longRatio)) * 20, 20, 100)),
      餘韻: Math.round(clamp(38 + (accuracies[4] + accuracies[5]) * 28 + average / 80, 20, 100))
    };
    metrics.甜感 = Math.round(clamp(40 + metrics.平衡感 * 0.25 + metrics.順口度 * 0.2, 20, 100));
    const chosen = [...new Set(S.inputs.map((x) => x.word))].slice(0, 6);
    let name = "焦糖微光咖啡", character = "溫柔小咖啡師", quote = "甜感柔和、層次舒服，是一杯會讓人慢慢放鬆的咖啡。", mood = "happy";
    if (metrics.明亮感 > metrics.醇厚度 + 13) {
      name = "花果晨光咖啡"; character = "果香探險家"; quote = "明亮果酸帶著花香跳躍，入口清爽，細節活潑而鮮明。"; mood = "fruit";
    } else if (metrics.醇厚度 > metrics.明亮感 + 15) {
      name = "絲絨可可咖啡"; character = "可可守護者"; quote = "厚實口感包住舌尖，留下巧克力、焦糖與堅果般的溫暖。"; mood = "body";
    } else if (metrics.平衡感 > 80 && metrics.順口度 > 78) {
      name = "黃金平衡咖啡"; character = "啜飲魔法師"; quote = "酸、甜與醇厚互相襯托，乾淨、完整，又富有層次。"; mood = "gold";
    } else if (metrics.甜感 > 78) {
      name = "蜂蜜抱抱咖啡"; character = "甜感小精靈"; quote = "蜂蜜、焦糖與柔和果甜慢慢融化，圓潤而討喜。"; mood = "sweet";
    }
    const score = Math.round((metrics.香氣 + metrics.順口度 + metrics.平衡感 + metrics.餘韻 + metrics.甜感) / 5);
    return { metrics, chosen, name, character, quote, mood, score };
  }

  const beans = (value) => { const filled = clamp(Math.round(value / 20), 1, 5); return "◆".repeat(filled) + "◇".repeat(5 - filled); };

  function finish() {
    S.done = true;
    S.result = calculateResult();
    const r = S.result;
    E.stage.textContent = "評測完成";
    E.desc.textContent = "你的六次風味選擇已整理成專屬咖啡。";
    E.title.textContent = r.name;
    E.metrics.innerHTML = ["香氣", "明亮感", "醇厚度", "順口度", "平衡感", "餘韻"].map((key) => `<div class="metric"><b>${key} ${r.metrics[key]}</b><span class="beans">${beans(r.metrics[key])}</span></div>`).join("");
    E.tags.innerHTML = r.chosen.map((x) => `<span class="tag"># ${x}</span>`).join("");
    E.quote.innerHTML = `<b>${r.character}</b><br>${r.quote}<br><br>總評分：<b>${r.score} / 100</b>`;
    drawCard(r);
    setTimeout(() => { E.game.classList.add("hidden"); E.status.classList.add("hidden"); E.result.classList.remove("hidden"); E.result.scrollIntoView({ behavior: "smooth" }); }, 350);
    [523, 659, 784].forEach((f, i) => setTimeout(() => tone(f, 0.11), i * 100));
  }

  function wrap(ctx, text, x, y, maxWidth, lineHeight, maxLines = 3) {
    let line = "", row = 0;
    for (const ch of [...text]) {
      if (ctx.measureText(line + ch).width > maxWidth && line) { ctx.fillText(line, x, y + row * lineHeight); line = ch; row += 1; if (row >= maxLines - 1) break; }
      else line += ch;
    }
    ctx.fillText(line, x, y + row * lineHeight);
  }

  function drawCup(ctx, x, y, p, mood) {
    const dark = "#1a100d";
    ctx.fillStyle = dark; ctx.fillRect(x - 8 * p, y, 82 * p, 60 * p); ctx.fillRect(x + 66 * p, y + 12 * p, 28 * p, 36 * p);
    ctx.fillStyle = "#fff2cf"; ctx.fillRect(x, y + 8 * p, 62 * p, 44 * p);
    ctx.fillStyle = "#e9c99f"; ctx.fillRect(x, y + 40 * p, 62 * p, 12 * p);
    ctx.fillStyle = dark; ctx.fillRect(x + 6 * p, y - 8 * p, 50 * p, 20 * p);
    ctx.fillStyle = "#5b2f21"; ctx.fillRect(x + 12 * p, y - 2 * p, 38 * p, 9 * p);
    ctx.fillStyle = dark; ctx.fillRect(x + 16 * p, y + 24 * p, 6 * p, 6 * p); ctx.fillRect(x + 40 * p, y + 24 * p, 6 * p, 6 * p);
    ctx.fillStyle = "#bd6f42"; ctx.fillRect(x + 24 * p, y + 34 * p, 16 * p, 4 * p); ctx.fillRect(x + 28 * p, y + 38 * p, 8 * p, 4 * p);
    const accent = mood === "fruit" ? "#ff8aa0" : mood === "gold" || mood === "sweet" ? "#ffd56a" : "#8fe3c2";
    ctx.fillStyle = accent; ctx.fillRect(x - 18 * p, y - 8 * p, 7 * p, 7 * p); ctx.fillRect(x + 78 * p, y - 20 * p, 7 * p, 7 * p);
  }

  function drawCard(r) {
    const canvas = E.canvas, ctx = canvas.getContext("2d"), W = canvas.width, H = canvas.height;
    ctx.imageSmoothingEnabled = false; ctx.fillStyle = "#211511"; ctx.fillRect(0, 0, W, H); ctx.strokeStyle = "rgba(255,255,255,.035)";
    for (let x = 0; x < W; x += 30) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 30) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    ctx.fillStyle = "#fff2cf"; ctx.fillRect(40, 40, W - 80, H - 80); ctx.fillStyle = "#3a241c"; ctx.fillRect(54, 54, W - 108, H - 108);
    ctx.textAlign = "center"; ctx.fillStyle = "#ffd56a"; ctx.font = "bold 46px monospace"; ctx.fillText("TODAY'S PIXEL COFFEE", W / 2, 135);
    ctx.fillStyle = "#f3d5aa"; ctx.font = "24px monospace"; ctx.fillText("像素咖啡品味所", W / 2, 180); drawCup(ctx, 326, 280, 4, r.mood);
    ctx.fillStyle = "#fff2cf"; ctx.font = "bold 42px monospace"; wrap(ctx, r.name, W / 2, 575, 680, 50, 2);
    ctx.fillStyle = "#8fe3c2"; ctx.font = "bold 24px monospace"; ctx.fillText(r.character, W / 2, 675);
    ctx.textAlign = "left"; ctx.font = "bold 18px monospace"; let x = 105, y = 720;
    r.chosen.slice(0, 6).forEach((flavor, i) => { const text = `#${flavor}`, width = Math.min(320, ctx.measureText(text).width + 28); if (x + width > 795) { x = 105; y += 48; } ctx.fillStyle = i % 2 ? "#7b4a34" : "#7c3d55"; ctx.fillRect(x, y, width, 35); ctx.strokeStyle = "#fff2cf"; ctx.lineWidth = 3; ctx.strokeRect(x, y, width, 35); ctx.fillStyle = "#fff2cf"; ctx.fillText(text, x + 12, y + 24); x += width + 12; });
    ["香氣", "明亮感", "醇厚度", "順口度", "平衡感", "餘韻"].forEach((key, i) => { const xx = i % 2 ? 470 : 110, yy = 840 + Math.floor(i / 2) * 78; ctx.fillStyle = "#f3d5aa"; ctx.font = "bold 21px monospace"; ctx.fillText(`${key} ${r.metrics[key]}`, xx, yy); ctx.fillStyle = "#ffd56a"; ctx.font = "24px monospace"; ctx.fillText(beans(r.metrics[key]), xx, yy + 32); });
    ctx.fillStyle = "#211511"; ctx.fillRect(92, 1070, 716, 72); ctx.fillStyle = "#8fe3c2"; ctx.fillRect(92, 1070, 10, 72);
    ctx.fillStyle = "#ffe9c5"; ctx.font = "19px monospace"; wrap(ctx, r.quote, 120, 1098, 650, 26, 2); ctx.textAlign = "right"; ctx.fillStyle = "#ffd56a"; ctx.font = "bold 28px monospace"; ctx.fillText(`${r.score} / 100`, 780, 1175);
  }

  function reset() {
    S.started = false; S.done = false; S.pressing = false; S.inputs = []; S.current = null; S.result = null; S.wordIndex = -1; S.pulseStart = performance.now(); clearFx();
    E.game.classList.remove("hidden"); E.status.classList.remove("hidden"); E.result.classList.add("hidden"); E.hold.textContent = "開始品飲"; E.hold.style.setProperty("--progress", "0%");
    E.word.innerHTML = "<span>按住探索風味</span><small>更多大類與細項會輪流出現</small>";
    E.hint.innerHTML = '<b>按下「開始品飲」</b><span>每個類別都有不同的色彩、粒子、光圈與文字框效果。</span>';
    updateUI(); scrollTo({ top: 0, behavior: "smooth" });
  }

  E.hold.addEventListener("pointerdown", press);
  addEventListener("pointerup", release);
  addEventListener("pointercancel", release);
  ["contextmenu", "selectstart", "dragstart"].forEach((type) => E.game.addEventListener(type, (event) => event.preventDefault()));
  document.addEventListener("selectionchange", () => { if (S.pressing) window.getSelection?.()?.removeAllRanges(); });
  E.download.onclick = () => { const anchor = document.createElement("a"); anchor.download = `${S.result.name}-咖啡評測.png`; anchor.href = E.canvas.toDataURL("image/png"); anchor.click(); toast("評測圖已產生"); };
  E.restart.onclick = reset;
  updateUI();
  requestAnimationFrame(animatePulse);
})();
