(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const E = {
    app: document.querySelector(".app"), modePicker: $("modePicker"), modeBadge: $("modeBadge"), modeNote: $("modeNote"),
    status: $("status"), stage: $("stage"), desc: $("desc"), count: $("count"), game: $("game"), scene: $("scene"),
    word: $("word"), particles: $("particles"), pulse: $("pulse"), hint: $("hint"), hold: $("hold"),
    actionGuide: $("actionGuide"), actionIcon: $("actionIcon"), actionStep: $("actionStep"), actionText: $("actionText"), actionTip: $("actionTip"),
    result: $("result"), title: $("title"), metrics: $("metrics"), tags: $("tags"), quote: $("quote"),
    canvas: $("canvas"), toast: $("toast"), download: $("download"), restart: $("restart")
  };

  const phaseInfo = [
    { name: "聞香", color: "#ff8aa0", speed: 1450 },
    { name: "啜飲", color: "#8fe3c2", speed: 1750 },
    { name: "餘韻", color: "#ffd56a", speed: 2050 }
  ];

  const modes = {
    simple: {
      label: "簡單版", total: 3, cycle: 560,
      note: "每個階段只做一個核心動作，風味選項以明顯、容易聯想的大類為主。",
      steps: [
        { phase: 0, icon: "👃", action: "把杯子靠近鼻尖，安靜聞香 2–3 秒", tip: "先不要晃杯，選第一個讓你有感覺的香氣。" },
        { phase: 1, icon: "☕", action: "小口啜飲，讓咖啡鋪滿舌面", tip: "先感受酸、甜、苦與厚薄，不用分析太久。" },
        { phase: 2, icon: "⏳", action: "吞下後停一下，感受留下的味道", tip: "選出嘴裡最後還存在的回甘或餘韻。" }
      ]
    },
    expert: {
      label: "專家版", total: 6, cycle: 440,
      note: "每階段分成兩個動作，加入更多水果、甜感、質地與香料細項。",
      steps: [
        { phase: 0, icon: "👃", action: "先不晃杯，聞第一層香氣", tip: "辨認最直接的水果、花或堅果氣味。" },
        { phase: 0, icon: "🌀", action: "輕晃杯子，再聞一次香氣變化", tip: "找出晃動後才出現的甜香、發酵香或更細水果。" },
        { phase: 1, icon: "☕", action: "小口啜飲，先找酸與甜", tip: "讓咖啡經過舌尖與兩側，判斷酸甜輪廓。" },
        { phase: 1, icon: "💨", action: "用吸氣式啜吸，感受口感與厚度", tip: "帶入一點空氣，辨認絲滑、果汁感或巧克力質地。" },
        { phase: 2, icon: "✨", action: "吞下後立即辨認第一個回甘", tip: "記住最先浮現的糖香、果甜或可可尾韻。" },
        { phase: 2, icon: "⏳", action: "等待 5 秒，再確認餘韻", tip: "感受花香、香料、酒香或木質是否仍然存在。" }
      ]
    },
    master: {
      label: "大師版", total: 9, cycle: 350,
      note: "完整九步感官流程，開放全部細項，輪播速度更快，適合細緻辨識。",
      steps: [
        { phase: 0, icon: "👀", action: "先觀察蒸氣與香氣的乾淨度", tip: "暫時不要喝，判斷氣味是明亮、沉穩或帶發酵感。" },
        { phase: 0, icon: "👃", action: "短吸聞香，辨認香氣方向", tip: "用短而輕的吸氣，先決定果香、花香、甜香或堅果。" },
        { phase: 0, icon: "🌀", action: "輕晃後深聞，找出具體細項", tip: "把大類縮小成佛手柑、茉莉、蜂蜜、紅酒等具體味道。" },
        { phase: 1, icon: "☕", action: "第一小口，只判斷酸質與溫度", tip: "先忽略其他味道，辨認酸質是柑橘、蘋果、葡萄或莓果。" },
        { phase: 1, icon: "💨", action: "啜吸帶入空氣，辨認香氣與甜感", tip: "讓香氣進入鼻後腔，找果汁感、蜂蜜、楓糖或花香。" },
        { phase: 1, icon: "👅", action: "含住 2 秒，比較質地與醇厚", tip: "判斷絲滑、奶油、糖漿、氣泡、巧克力或可可脂。" },
        { phase: 2, icon: "✨", action: "吞下後立即記錄第一個尾韻", tip: "捕捉最先留下的果甜、糖香、花香或可可。" },
        { phase: 2, icon: "⏳", action: "等待 5 秒，辨認深層餘韻", tip: "注意香料、酒香、煙燻、木質與茶單寧。" },
        { phase: 2, icon: "🧠", action: "回想整杯，選出代表風味", tip: "用最後一次選擇，決定這杯咖啡最核心的記憶。" }
      ]
    }
  };

  const w = (cat, detail, score, fx) => ({ cat, detail, score, fx });
  const masterPools = [
    [
      w("水感", "稀薄", 18, "muted"), w("清新", "小黃瓜", 42, "muted"), w("果香", "青蘋果", 58, "fruit"),
      w("果香", "西洋梨", 64, "fruit"), w("果香", "檸檬", 72, "fruit"), w("果香", "葡萄柚", 86, "fruit"),
      w("果香", "柳橙", 82, "fruit"), w("果香", "佛手柑", 92, "fruit"), w("果香", "白葡萄", 88, "fruit"),
      w("果香", "水蜜桃", 90, "fruit"), w("果香", "杏桃", 84, "fruit"), w("果香", "草莓", 94, "fruit"),
      w("果香", "覆盆子", 96, "fruit"), w("果香", "藍莓", 88, "fruit"), w("果香", "黑醋栗", 86, "fruit"),
      w("果香", "鳳梨", 76, "fruit"), w("花香", "茉莉", 100, "floral"), w("花香", "橙花", 96, "floral"),
      w("花香", "玫瑰", 92, "floral"), w("花香", "薰衣草", 82, "floral"), w("花香", "洋甘菊", 86, "floral"),
      w("甜香", "蜂蜜", 90, "sweet"), w("甜香", "香草", 84, "sweet"), w("甜香", "黑糖", 78, "sweet"),
      w("堅果", "榛果", 66, "body"), w("堅果", "杏仁", 62, "body"), w("發酵香", "紅酒", 48, "mature"),
      w("發酵香", "蘭姆酒", 44, "mature"), w("過熟", "熟香蕉", 18, "muted")
    ],
    [
      w("單薄", "茶水感", 18, "muted"), w("輕盈", "白茶感", 48, "muted"), w("輕盈", "紅茶感", 54, "muted"),
      w("酸質", "檸檬酸", 72, "fruit"), w("酸質", "柳橙酸", 78, "fruit"), w("酸質", "青蘋果酸", 82, "fruit"),
      w("酸質", "白葡萄酸", 88, "fruit"), w("酸質", "莓果酸", 86, "fruit"), w("酸質", "百香果酸", 80, "fruit"),
      w("甜感", "蜂蜜", 92, "sweet"), w("甜感", "楓糖", 90, "sweet"), w("甜感", "蔗糖", 86, "sweet"),
      w("甜感", "黑糖", 84, "sweet"), w("甜感", "太妃糖", 88, "sweet"), w("口感", "絲滑", 100, "body"),
      w("口感", "奶油感", 94, "body"), w("口感", "果汁感", 88, "fruit"), w("口感", "糖漿感", 90, "sweet"),
      w("口感", "氣泡感", 80, "fruit"), w("平衡", "酸甜均衡", 96, "body"), w("平衡", "柔和圓潤", 94, "body"),
      w("醇厚", "牛奶巧克力", 90, "body"), w("醇厚", "黑巧克力", 80, "body"), w("醇厚", "奶油", 88, "body"),
      w("醇厚", "可可脂", 84, "body"), w("烘焙", "焦糖", 68, "body"), w("烘焙", "烤杏仁", 62, "body"),
      w("香料", "肉桂", 58, "mature"), w("苦感", "可可苦", 38, "muted"), w("苦澀", "藥草", 16, "muted")
    ],
    [
      w("短促", "快速消散", 18, "muted"), w("乾淨", "白茶尾韻", 54, "muted"), w("乾淨", "紅茶尾韻", 58, "muted"),
      w("果甜", "蘋果回甜", 72, "fruit"), w("果甜", "葡萄回甜", 82, "fruit"), w("果甜", "莓果回甜", 86, "fruit"),
      w("果甜", "桃子回甜", 88, "fruit"), w("柑橘", "佛手柑尾韻", 90, "fruit"), w("糖香", "焦糖回甘", 92, "sweet"),
      w("糖香", "黑糖回甘", 88, "sweet"), w("糖香", "楓糖尾韻", 90, "sweet"), w("回甘", "蜂蜜甜感", 100, "sweet"),
      w("回甘", "蔗糖甜感", 94, "sweet"), w("餘韻", "可可綿長", 96, "body"), w("餘韻", "堅果悠長", 90, "body"),
      w("餘韻", "奶油柔順", 94, "body"), w("餘韻", "花香回返", 96, "floral"), w("花香", "茉莉回香", 98, "floral"),
      w("香料", "肉桂", 76, "mature"), w("香料", "丁香", 66, "mature"), w("香料", "豆蔻", 72, "mature"),
      w("酒香", "紅酒發酵", 54, "mature"), w("酒香", "威士忌桶", 58, "mature"), w("酒香", "蘭姆葡萄", 62, "mature"),
      w("煙燻", "雪松木", 52, "mature"), w("煙燻", "烤木質", 46, "mature"), w("乾澀", "茶單寧", 24, "muted"),
      w("土質", "潮濕泥土", 20, "muted"), w("苦澀", "焦苦", 14, "muted")
    ]
  ];

  const poolIndexes = {
    simple: [
      [0, 2, 4, 11, 16, 21, 24, 26],
      [0, 3, 7, 9, 14, 19, 21, 28],
      [0, 2, 5, 8, 11, 13, 18, 26]
    ],
    expert: [
      [0, 1, 2, 3, 4, 5, 7, 8, 9, 11, 12, 16, 17, 18, 20, 21, 22, 24, 26, 28],
      [0, 1, 2, 3, 4, 5, 6, 7, 9, 10, 12, 13, 14, 15, 16, 17, 19, 21, 22, 25, 27, 28],
      [0, 1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 13, 14, 16, 17, 18, 19, 21, 22, 24, 26, 28]
    ],
    master: [
      masterPools[0].map((_, i) => i), masterPools[1].map((_, i) => i), masterPools[2].map((_, i) => i)
    ]
  };

  const S = {
    mode: "simple", started: false, done: false, pressing: false, t0: 0,
    pulseStart: performance.now(), pulseScale: 0.3, wordIndex: -1, current: null, inputs: [], result: null
  };

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const currentMode = () => modes[S.mode];
  const currentStepIndex = () => Math.min(S.inputs.length, currentMode().total - 1);
  const currentStep = () => currentMode().steps[currentStepIndex()];
  const currentPhase = () => currentStep().phase;
  const currentPool = () => poolIndexes[S.mode][currentPhase()].map((index) => masterPools[currentPhase()][index]);

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

  function updateModeUI() {
    document.querySelectorAll(".mode-btn").forEach((button) => button.classList.toggle("active", button.dataset.mode === S.mode));
    E.app.classList.remove("mode-simple", "mode-expert", "mode-master");
    E.app.classList.add(`mode-${S.mode}`);
    E.modeBadge.textContent = `${currentMode().label}・${currentMode().total} 步`;
    E.modeNote.textContent = currentMode().note;
    E.modePicker.classList.toggle("locked", S.started);
  }

  function updateActionGuide() {
    const step = currentStep();
    const number = currentStepIndex() + 1;
    E.actionIcon.textContent = step.icon;
    E.actionStep.textContent = `STEP ${number} / ${currentMode().total}・${phaseInfo[step.phase].name}`;
    E.actionText.textContent = step.action;
    E.actionTip.textContent = step.tip;
  }

  function updateUI() {
    updateModeUI();
    updateActionGuide();
    E.count.textContent = `${S.inputs.length} / ${currentMode().total}`;
    if (!S.started) {
      E.stage.textContent = `準備品飲｜${currentMode().label}`;
      E.desc.textContent = `完成 ${currentMode().total} 個動作，風味選項會依難度增加。`;
      E.hint.innerHTML = `<b>先看上方動作提示</b><span>按下開始後，每一步都照提示操作，再長按選擇當下感受到的風味。</span>`;
      return;
    }
    const step = currentStep();
    E.stage.textContent = `第 ${currentStepIndex() + 1} 步｜${phaseInfo[step.phase].name}`;
    E.desc.textContent = step.action;
    E.hint.innerHTML = `<b>${currentMode().label}：目前有 ${currentPool().length} 個風味選項</b><span>${step.tip}</span>`;
  }

  function animatePulse(now) {
    if (!S.done) {
      const phase = ((now - S.pulseStart) % phaseInfo[currentPhase()].speed) / phaseInfo[currentPhase()].speed;
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
    fruit: ["#ff6f61", "#ffb347", "#ffd166", "#ff8aa0"], floral: ["#f6a6ff", "#ffb8e8", "#e4c3ff", "#ffd2f1"],
    sweet: ["#ffd56a", "#ffbf45", "#fff0a8", "#ffde8a"], body: ["#c98145", "#9b5b36", "#dca56d", "#6d3f2a"],
    mature: ["#d679b7", "#8d3d70", "#b5639d", "#6f315f"], muted: ["#8ca5b3", "#667983", "#9bb0ba", "#52656e"]
  };

  function setFx(type) {
    clearFx();
    E.scene.classList.add(`fx-${type}`);
    const colors = palettes[type];
    const count = S.mode === "simple" ? 8 : S.mode === "expert" ? 11 : 14;
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
    E.hold.textContent = "按住品嚐・選到符合感受的風味放開";
    updateUI();
    toast(`${currentMode().label}開始・共 ${currentMode().total} 步`);
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
    E.actionGuide.classList.add("active");
    navigator.vibrate?.(16);

    const loop = () => {
      if (!S.pressing) return;
      const elapsed = performance.now() - S.t0;
      const phase = (elapsed % 2900) / 2900;
      const progress = phase < 0.5 ? phase * 200 : (1 - phase) * 200;
      E.hold.style.setProperty("--progress", `${progress}%`);
      const words = currentPool();
      const index = Math.floor(elapsed / currentMode().cycle) % words.length;
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
    E.actionGuide.classList.remove("active");

    const stepIndex = currentStepIndex();
    const step = currentStep();
    const item = S.current || currentPool()[0];
    const duration = performance.now() - S.t0;
    const ring = clamp(1 - Math.abs(S.pulseScale - 0.95) / 0.75, 0, 1);
    const accuracy = clamp(ring * 0.52 + (item.score / 100) * 0.48, 0, 1);
    S.inputs.push({
      duration, accuracy, word: `${item.cat}・${item.detail}`, cat: item.cat, detail: item.detail,
      score: item.score, fx: item.fx, phase: step.phase, step: stepIndex, action: step.action, mode: S.mode
    });

    window.__coffeeRun = {
      mode: S.mode, modeLabel: currentMode().label, total: currentMode().total,
      phaseNames: phaseInfo.map((phase) => phase.name), choices: S.inputs.map((input) => ({ ...input }))
    };

    E.word.innerHTML = `<span>抓到：${item.cat}</span><small>${item.detail}</small>`;
    toast(`第 ${S.inputs.length} 步：${item.cat}・${item.detail}`);
    tone(420 + item.score * 2, 0.08);
    E.count.textContent = `${S.inputs.length} / ${currentMode().total}`;
    setTimeout(clearFx, 420);

    if (S.inputs.length >= currentMode().total) { setTimeout(finish, 480); return; }

    S.pulseStart = performance.now();
    setTimeout(() => {
      updateUI();
      E.word.innerHTML = "<span>按住探索風味</span><small>照著目前動作提示進行</small>";
      toast(`下一步：${currentStep().action}`);
    }, 330);
  }

  function phaseAverage(key, phase) {
    const items = S.inputs.filter((input) => input.phase === phase);
    if (!items.length) return 0.5;
    return items.reduce((sum, input) => sum + input[key], 0) / items.length;
  }

  function calculateResult() {
    const total = S.inputs.length;
    const durations = S.inputs.map((input) => input.duration);
    const accuracies = S.inputs.map((input) => input.accuracy);
    const average = durations.reduce((a, b) => a + b, 0) / total;
    const accuracyAverage = accuracies.reduce((a, b) => a + b, 0) / total;
    const shortRatio = durations.filter((value) => value < 700).length / total;
    const longRatio = durations.filter((value) => value > 1600).length / total;
    const variance = durations.reduce((sum, value) => sum + (value - average) ** 2, 0) / total;
    const consistency = clamp(1 - Math.sqrt(variance) / 1300, 0, 1);
    const aromaAccuracy = phaseAverage("accuracy", 0);
    const sipAccuracy = phaseAverage("accuracy", 1);
    const finishAccuracy = phaseAverage("accuracy", 2);

    const metrics = {
      香氣: Math.round(clamp(42 + aromaAccuracy * 43 + shortRatio * 12, 20, 100)),
      明亮感: Math.round(clamp(34 + shortRatio * 32 + aromaAccuracy * 18 + (1 - longRatio) * 10, 15, 100)),
      醇厚度: Math.round(clamp(32 + longRatio * 28 + sipAccuracy * 24 + average / 90, 20, 100)),
      順口度: Math.round(clamp(38 + accuracyAverage * 42 + consistency * 18, 20, 100)),
      平衡感: Math.round(clamp(40 + consistency * 36 + sipAccuracy * 16, 20, 100)),
      餘韻: Math.round(clamp(36 + finishAccuracy * 42 + average / 95, 20, 100))
    };
    metrics.甜感 = Math.round(clamp(38 + metrics.平衡感 * 0.27 + metrics.順口度 * 0.2, 20, 100));

    const chosen = S.inputs.map((input) => input.word);
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
    return { metrics, chosen, name, character, quote, mood, score, mode: S.mode, modeLabel: currentMode().label, total };
  }

  const beans = (value) => {
    const filled = clamp(Math.round(value / 20), 1, 5);
    return "◆".repeat(filled) + "◇".repeat(5 - filled);
  };

  function finish() {
    S.done = true;
    S.result = calculateResult();
    const r = S.result;
    E.stage.textContent = "評測完成";
    E.desc.textContent = `${r.modeLabel} ${r.total} 步已完成，風味選擇已整理成專屬咖啡。`;
    E.title.textContent = r.name;
    E.metrics.innerHTML = ["香氣", "明亮感", "醇厚度", "順口度", "平衡感", "餘韻"]
      .map((key) => `<div class="metric"><b>${key} ${r.metrics[key]}</b><span class="beans">${beans(r.metrics[key])}</span></div>`).join("");
    E.tags.innerHTML = r.chosen.map((flavor, index) => `<span class="tag">${String(index + 1).padStart(2, "0")}・${flavor}</span>`).join("");
    E.quote.innerHTML = `<b>${r.character}</b><br>${r.quote}<br><span class="result-mode-chip">${r.modeLabel}・${r.total} 步</span><br>總評分：<b>${r.score} / 100</b>`;
    drawCard(r);
    setTimeout(() => {
      E.game.classList.add("hidden");
      E.status.classList.add("hidden");
      E.modePicker.classList.add("hidden");
      E.result.classList.remove("hidden");
      E.result.scrollIntoView({ behavior: "smooth" });
    }, 350);
    [523, 659, 784].forEach((frequency, index) => setTimeout(() => tone(frequency, 0.11), index * 100));
  }

  function wrap(ctx, text, x, y, maxWidth, lineHeight, maxLines = 3) {
    let line = "", row = 0;
    for (const ch of [...text]) {
      if (ctx.measureText(line + ch).width > maxWidth && line) {
        ctx.fillText(line, x, y + row * lineHeight);
        line = ch;
        row += 1;
        if (row >= maxLines - 1) break;
      } else line += ch;
    }
    ctx.fillText(line, x, y + row * lineHeight);
  }

  function drawCup(ctx, x, y, p, mood) {
    const dark = "#1a100d";
    ctx.fillStyle = dark; ctx.fillRect(x - 8*p, y, 82*p, 60*p); ctx.fillRect(x + 66*p, y + 12*p, 28*p, 36*p);
    ctx.fillStyle = "#fff2cf"; ctx.fillRect(x, y + 8*p, 62*p, 44*p);
    ctx.fillStyle = "#e9c99f"; ctx.fillRect(x, y + 40*p, 62*p, 12*p);
    ctx.fillStyle = dark; ctx.fillRect(x + 6*p, y - 8*p, 50*p, 20*p);
    ctx.fillStyle = "#5b2f21"; ctx.fillRect(x + 12*p, y - 2*p, 38*p, 9*p);
    ctx.fillStyle = dark; ctx.fillRect(x + 16*p, y + 24*p, 6*p, 6*p); ctx.fillRect(x + 40*p, y + 24*p, 6*p, 6*p);
    ctx.fillStyle = "#bd6f42"; ctx.fillRect(x + 24*p, y + 34*p, 16*p, 4*p); ctx.fillRect(x + 28*p, y + 38*p, 8*p, 4*p);
    const accent = mood === "fruit" ? "#ff8aa0" : mood === "gold" || mood === "sweet" ? "#ffd56a" : "#8fe3c2";
    ctx.fillStyle = accent; ctx.fillRect(x - 18*p, y - 8*p, 7*p, 7*p); ctx.fillRect(x + 78*p, y - 20*p, 7*p, 7*p);
  }

  function drawCard(r) {
    const canvas = E.canvas;
    canvas.width = 900;
    canvas.height = 1200;
    delete canvas.dataset.avatarFeedback;
    const ctx = canvas.getContext("2d"), W = canvas.width, H = canvas.height;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = "#211511"; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "rgba(255,255,255,.035)";
    for (let x = 0; x < W; x += 30) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 30) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    ctx.fillStyle = "#fff2cf"; ctx.fillRect(40, 40, W - 80, H - 80);
    ctx.fillStyle = "#3a241c"; ctx.fillRect(54, 54, W - 108, H - 108);
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffd56a"; ctx.font = "bold 46px monospace"; ctx.fillText("TODAY'S PIXEL COFFEE", W / 2, 135);
    ctx.fillStyle = "#f3d5aa"; ctx.font = "24px monospace"; ctx.fillText(`像素咖啡品味所・${r.modeLabel}`, W / 2, 180);
    drawCup(ctx, 326, 280, 4, r.mood);
    ctx.fillStyle = "#fff2cf"; ctx.font = "bold 42px monospace"; wrap(ctx, r.name, W / 2, 575, 680, 50, 2);
    ctx.fillStyle = "#8fe3c2"; ctx.font = "bold 24px monospace"; ctx.fillText(r.character, W / 2, 675);
    ctx.textAlign = "left"; ctx.font = "bold 16px monospace";
    let x = 90, y = 715;
    r.chosen.forEach((flavor, index) => {
      const text = `${index + 1}.${flavor}`;
      const width = Math.min(245, ctx.measureText(text).width + 24);
      if (x + width > 810) { x = 90; y += 42; }
      ctx.fillStyle = index % 2 ? "#7b4a34" : "#7c3d55";
      ctx.fillRect(x, y, width, 31);
      ctx.strokeStyle = "#fff2cf"; ctx.lineWidth = 2; ctx.strokeRect(x, y, width, 31);
      ctx.fillStyle = "#fff2cf"; ctx.fillText(text, x + 10, y + 21);
      x += width + 9;
    });
    const metricStart = r.total >= 9 ? 860 : r.total >= 6 ? 830 : 800;
    ["香氣", "明亮感", "醇厚度", "順口度", "平衡感", "餘韻"].forEach((key, index) => {
      const xx = index % 2 ? 470 : 110, yy = metricStart + Math.floor(index / 2) * 74;
      ctx.fillStyle = "#f3d5aa"; ctx.font = "bold 20px monospace"; ctx.fillText(`${key} ${r.metrics[key]}`, xx, yy);
      ctx.fillStyle = "#ffd56a"; ctx.font = "23px monospace"; ctx.fillText(beans(r.metrics[key]), xx, yy + 30);
    });
    ctx.fillStyle = "#211511"; ctx.fillRect(92, 1070, 716, 72);
    ctx.fillStyle = "#8fe3c2"; ctx.fillRect(92, 1070, 10, 72);
    ctx.fillStyle = "#ffe9c5"; ctx.font = "18px monospace"; wrap(ctx, r.quote, 120, 1098, 650, 25, 2);
    ctx.textAlign = "right"; ctx.fillStyle = "#ffd56a"; ctx.font = "bold 28px monospace"; ctx.fillText(`${r.score} / 100`, 780, 1175);
  }

  function reset() {
    S.started = false; S.done = false; S.pressing = false; S.inputs = []; S.current = null; S.result = null; S.wordIndex = -1;
    S.pulseStart = performance.now();
    window.__coffeeRun = null;
    clearFx();
    E.game.classList.remove("hidden"); E.status.classList.remove("hidden"); E.modePicker.classList.remove("hidden"); E.result.classList.add("hidden");
    E.hold.textContent = "開始品飲"; E.hold.style.setProperty("--progress", "0%");
    E.word.innerHTML = "<span>按住探索風味</span><small>依難度顯示不同數量的細項</small>";
    updateUI();
    scrollTo({ top: 0, behavior: "smooth" });
  }

  document.querySelectorAll(".mode-btn").forEach((button) => {
    button.addEventListener("click", () => {
      if (S.started) return;
      S.mode = button.dataset.mode;
      S.inputs = [];
      S.pulseStart = performance.now();
      updateUI();
      toast(`${currentMode().label}：${currentMode().total} 步・每階段 ${currentPool().length} 個起始選項`);
      tone(S.mode === "simple" ? 440 : S.mode === "expert" ? 560 : 680, 0.06);
    });
  });

  E.hold.addEventListener("pointerdown", press);
  addEventListener("pointerup", release);
  addEventListener("pointercancel", release);
  ["contextmenu", "selectstart", "dragstart"].forEach((type) => E.game.addEventListener(type, (event) => event.preventDefault()));
  document.addEventListener("selectionchange", () => { if (S.pressing) window.getSelection?.()?.removeAllRanges(); });
  E.download.onclick = () => {
    const anchor = document.createElement("a");
    anchor.download = `${S.result.name}-${S.result.modeLabel}-咖啡評測.png`;
    anchor.href = E.canvas.toDataURL("image/png");
    anchor.click();
    toast("評測圖已產生");
  };
  E.restart.onclick = reset;

  updateUI();
  requestAnimationFrame(animatePulse);
})();
