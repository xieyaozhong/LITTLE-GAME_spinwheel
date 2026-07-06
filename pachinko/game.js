(() => {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");

  const scoreEl = document.getElementById("score");
  const ballsEl = document.getElementById("balls");
  const comboEl = document.getElementById("combo");
  const highEl = document.getElementById("high");
  const marquee = document.getElementById("marquee");
  const powerSlider = document.getElementById("powerSlider");
  const powerValue = document.getElementById("powerValue");
  const launchBtn = document.getElementById("launchBtn");
  const autoBtn = document.getElementById("autoBtn");
  const resetBtn = document.getElementById("resetBtn");

  const W = canvas.width;
  const H = canvas.height;
  const gravity = 0.18;
  const friction = 0.995;
  const bounce = 0.72;

  let score = 0;
  let ballsLeft = 50;
  let combo = 1;
  let highScore = getStoredHighScore();
  let launchPower = 0.55;
  let autoMode = false;
  let lastAuto = 0;
  let shake = 0;
  let particles = [];
  let activeBalls = [];
  let floatingTexts = [];
  let pointerDown = false;
  let pointerStartY = 0;
  let pointerMoved = false;
  let hudDirty = true;

  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  const compactDevice = window.matchMedia?.("(max-width: 600px)").matches ?? false;

  function getStoredHighScore(){
    try { return Number(localStorage.getItem("pixelPachinkoHigh") || 0); }
    catch { return 0; }
  }

  function saveHighScore(value){
    try { localStorage.setItem("pixelPachinkoHigh", String(value)); }
    catch { /* localStorage may be unavailable in private browsing */ }
  }

  function haptic(pattern=8){
    if("vibrate" in navigator) navigator.vibrate(pattern);
  }

  const palette = {
    bg:"#091333",
    rail:"#3b2e78",
    white:"#fff6d6",
    pink:"#ff4f9a",
    cyan:"#4ee9ff",
    yellow:"#ffd84d",
    green:"#56e39f",
    red:"#ff5a5f",
    shadow:"#080615"
  };

  const pins = [];
  const bumpers = [];
  const slots = [];

  function buildBoard(){
    pins.length = 0;
    bumpers.length = 0;
    slots.length = 0;

    for(let row = 0; row < 11; row++){
      const y = 170 + row * 55;
      const offset = row % 2 === 0 ? 72 : 104;
      for(let x = offset; x < 615; x += 66){
        if(x > 535 && row < 3) continue;
        pins.push({x,y,r:7,flash:0});
      }
    }

    bumpers.push(
      {x:230,y:300,r:30,color:palette.cyan,label:"20",value:20,flash:0},
      {x:410,y:350,r:34,color:palette.pink,label:"50",value:50,flash:0},
      {x:300,y:500,r:28,color:palette.yellow,label:"30",value:30,flash:0},
      {x:500,y:560,r:30,color:palette.green,label:"40",value:40,flash:0},
      {x:165,y:615,r:26,color:palette.red,label:"25",value:25,flash:0}
    );

    const values = [50,100,250,1000,250,100,50];
    const colors = [palette.cyan,palette.green,palette.yellow,palette.pink,palette.yellow,palette.green,palette.cyan];
    const slotW = 84;
    const startX = 46;
    for(let i=0;i<7;i++){
      slots.push({
        x:startX+i*slotW,
        y:830,
        w:slotW,
        h:74,
        value:values[i],
        color:colors[i],
        label:i===3 ? "JACKPOT" : String(values[i])
      });
    }
  }

  function updateHud(){
    scoreEl.textContent = String(score).padStart(6,"0");
    ballsEl.textContent = ballsLeft;
    comboEl.textContent = "x" + combo;
    highEl.textContent = String(highScore).padStart(6,"0");
    const powerPercent = Math.round(launchPower*100);
    powerSlider.value = String(powerPercent);
    powerValue.textContent = `${powerPercent}%`;
    launchBtn.disabled = ballsLeft <= 0;
    hudDirty = false;
  }

  function markHudDirty(){
    hudDirty = true;
  }

  function resetGame(){
    score = 0;
    ballsLeft = 50;
    combo = 1;
    activeBalls = [];
    particles = [];
    floatingTexts = [];
    autoMode = false;
    autoBtn.innerHTML = '<span class="button-icon">∞</span>自動：關';
    autoBtn.classList.remove("auto-on");
    autoBtn.setAttribute("aria-pressed", "false");
    marquee.textContent = "新的挑戰開始！";
    haptic(15);
    updateHud();
  }

  function launchBall(){
    if(ballsLeft <= 0){
      marquee.textContent = activeBalls.length ? "等待最後的彈珠落下！" : "彈珠用完了，按重新開始！";
      return;
    }

    ballsLeft--;
    const p = launchPower;
    activeBalls.push({
      x:655,
      y:790,
      vx:-0.6 - Math.random()*0.25,
      vy:-11.5 - p*9,
      r:9,
      alive:true,
      trail:[]
    });

    createParticles(655,790,palette.cyan,compactDevice?5:8);
    haptic(6);
    marquee.textContent = ["發射！","好球！","命運啟動！","衝向 JACKPOT！"][Math.floor(Math.random()*4)];
    updateHud();
  }

  function createParticles(x,y,color,count=10){
    for(let i=0;i<count;i++){
      particles.push({
        x,y,
        vx:(Math.random()-.5)*5,
        vy:(Math.random()-.5)*5,
        life:(compactDevice?16:20)+Math.random()*(compactDevice?14:20),
        color,
        size:2+Math.floor(Math.random()*4)
      });
    }
  }

  function addFloatingText(x,y,text,color=palette.yellow){
    floatingTexts.push({x,y,text,color,life:60});
  }

  function collideCircle(ball,obj,extra=0){
    const dx = ball.x-obj.x;
    const dy = ball.y-obj.y;
    const dist = Math.hypot(dx,dy);
    const minDist = ball.r+obj.r+extra;
    if(dist < minDist && dist > 0){
      const nx = dx/dist;
      const ny = dy/dist;
      const overlap = minDist-dist;
      ball.x += nx*overlap;
      ball.y += ny*overlap;
      const dot = ball.vx*nx + ball.vy*ny;
      ball.vx -= (1+bounce)*dot*nx;
      ball.vy -= (1+bounce)*dot*ny;
      ball.vx += (Math.random()-.5)*0.35;
      return true;
    }
    return false;
  }

  function award(points,x,y,color=palette.yellow){
    const gained = points*combo;
    score += gained;
    if(score > highScore){
      highScore = score;
      saveHighScore(highScore);
    }
    addFloatingText(x,y,`+${gained}`,color);
    updateHud();
  }

  function finishBall(ball){
    if(!ball.alive) return;
    ball.alive = false;

    const slot = slots.find(s =>
      ball.x >= s.x && ball.x < s.x+s.w && ball.y > s.y-5
    );

    if(slot){
      award(slot.value,ball.x,slot.y-10,slot.color);
      combo = Math.min(combo+1,9);
      shake = slot.value >= 1000 ? 18 : 6;
      createParticles(ball.x,slot.y,slot.color,slot.value>=1000?(compactDevice?28:50):(compactDevice?12:18));

      if(slot.value >= 1000){
        ballsLeft += 10;
        marquee.textContent = "★ JACKPOT！獎勵 10 顆彈珠！★";
        haptic([45,35,90]);
      }else{
        marquee.textContent = `得分槽 ${slot.value}！COMBO x${combo}`;
        haptic(12);
      }
    }else{
      combo = 1;
      marquee.textContent = "差一點！COMBO 重置";
    }
    updateHud();
  }

  function update(dt){
    for(const p of pins) p.flash = Math.max(0,p.flash-dt);
    for(const b of bumpers) b.flash = Math.max(0,b.flash-dt);

    for(const ball of activeBalls){
      if(!ball.alive) continue;

      ball.trail.push({x:ball.x,y:ball.y,life:12});
      if(ball.trail.length > 10) ball.trail.shift();
      for(const t of ball.trail) t.life -= dt;

      ball.vy += gravity*dt;
      ball.vx *= Math.pow(friction,dt);
      ball.vy *= Math.pow(friction,dt);
      ball.x += ball.vx*dt;
      ball.y += ball.vy*dt;

      if(ball.x+ball.r > 680){
        ball.x = 680-ball.r;
        ball.vx *= -bounce;
      }
      if(ball.x-ball.r < 38){
        ball.x = 38+ball.r;
        ball.vx *= -bounce;
      }
      if(ball.y-ball.r < 68){
        ball.y = 68+ball.r;
        ball.vy *= -bounce;
      }

      if(ball.y < 145 && ball.x > 590){
        ball.vx -= 0.28*dt;
      }

      for(const pin of pins){
        if(collideCircle(ball,pin)){
          pin.flash = 5;
          score += 1;
          markHudDirty();
          if(Math.random()<(compactDevice?0.08:0.15)) createParticles(pin.x,pin.y,palette.white,compactDevice?2:3);
        }
      }

      for(const bumper of bumpers){
        if(collideCircle(ball,bumper,2)){
          bumper.flash = 8;
          award(bumper.value,bumper.x,bumper.y-30,bumper.color);
          createParticles(bumper.x,bumper.y,bumper.color,compactDevice?7:10);
          shake = 4;
          const dx = ball.x-bumper.x;
          const dy = ball.y-bumper.y;
          const d = Math.max(1,Math.hypot(dx,dy));
          ball.vx += dx/d*2.2;
          ball.vy += dy/d*2.2;
        }
      }

      if(ball.y > 822 || ball.y > H+50){
        finishBall(ball);
      }
    }

    activeBalls = activeBalls.filter(b => b.alive || b.y < H+80);

    particles.forEach(p=>{
      p.x += p.vx*dt;
      p.y += p.vy*dt;
      p.vy += 0.06*dt;
      p.life -= dt;
    });
    particles = particles.filter(p=>p.life>0);

    floatingTexts.forEach(t=>{
      t.y -= .7*dt;
      t.life -= dt;
    });
    floatingTexts = floatingTexts.filter(t=>t.life>0);

    shake *= reducedMotion ? .45 : .88;

    if(hudDirty) updateHud();

    if(autoMode && performance.now()-lastAuto > 650){
      lastAuto = performance.now();
      launchBall();
      if(ballsLeft<=0) toggleAuto(false);
    }
  }

  function rect(x,y,w,h,fill,stroke=null,line=1){
    ctx.fillStyle=fill;
    ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));
    if(stroke){
      ctx.strokeStyle=stroke;
      ctx.lineWidth=line;
      ctx.strokeRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));
    }
  }

  function pixelText(text,x,y,size,color,align="center"){
    ctx.save();
    ctx.font=`bold ${size}px "Courier New", monospace`;
    ctx.textAlign=align;
    ctx.textBaseline="middle";
    ctx.fillStyle=palette.shadow;
    ctx.fillText(text,x+3,y+3);
    ctx.fillStyle=color;
    ctx.fillText(text,x,y);
    ctx.restore();
  }

  function drawBoard(){
    rect(0,0,W,H,palette.bg);

    for(let i=0;i<55;i++){
      const x=(i*137)%W;
      const y=(i*83)%H;
      const s=i%4===0?4:2;
      rect(x,y,s,s,i%3===0?palette.cyan:"#343a78");
    }

    ctx.strokeStyle=palette.rail;
    ctx.lineWidth=24;
    ctx.beginPath();
    ctx.moveTo(35,820);
    ctx.lineTo(35,105);
    ctx.quadraticCurveTo(35,52,90,52);
    ctx.lineTo(615,52);
    ctx.quadraticCurveTo(680,52,680,120);
    ctx.lineTo(680,820);
    ctx.stroke();

    ctx.strokeStyle=palette.white;
    ctx.lineWidth=4;
    ctx.stroke();

    ctx.strokeStyle=palette.cyan;
    ctx.lineWidth=5;
    ctx.beginPath();
    ctx.moveTo(615,810);
    ctx.lineTo(615,155);
    ctx.quadraticCurveTo(615,90,560,80);
    ctx.stroke();

    pixelText("▲",654,740,22,palette.yellow);
    pixelText("POWER",654,775,13,palette.cyan);

    for(const p of pins){
      const c=p.flash>0?palette.yellow:palette.white;
      rect(p.x-6,p.y-6,12,12,palette.shadow);
      rect(p.x-4,p.y-4,8,8,c);
    }

    for(const b of bumpers){
      ctx.beginPath();
      ctx.arc(b.x,b.y,b.r+6,0,Math.PI*2);
      ctx.fillStyle=palette.shadow;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(b.x,b.y,b.r,0,Math.PI*2);
      ctx.fillStyle=b.flash>0?palette.white:b.color;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(b.x,b.y,b.r-8,0,Math.PI*2);
      ctx.fillStyle=palette.bg;
      ctx.fill();

      pixelText(b.label,b.x,b.y,15,b.color);
    }

    for(let i=0;i<7;i++){
      const x=46+i*84;
      ctx.strokeStyle=palette.white;
      ctx.lineWidth=4;
      ctx.beginPath();
      ctx.moveTo(x,790);
      ctx.lineTo(x,910);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(46+7*84,790);
    ctx.lineTo(46+7*84,910);
    ctx.stroke();

    for(const s of slots){
      rect(s.x,s.y,s.w,s.h,"#121041",s.color,4);
      pixelText(s.label,s.x+s.w/2,s.y+36,s.label==="JACKPOT"?12:18,s.color);
    }

    pixelText("LUCKY PIXEL ZONE",W/2,110,23,palette.yellow);
  }

  function drawBalls(){
    for(const ball of activeBalls){
      if(!ball.alive) continue;

      for(let i=0;i<ball.trail.length;i++){
        const t=ball.trail[i];
        if(t.life<=0) continue;
        const alpha=(i+1)/ball.trail.length*.35;
        ctx.fillStyle=`rgba(78,233,255,${alpha})`;
        ctx.fillRect(t.x-4,t.y-4,8,8);
      }

      rect(ball.x-10,ball.y-10,20,20,palette.shadow);
      rect(ball.x-8,ball.y-8,16,16,palette.white);
      rect(ball.x-5,ball.y-5,8,8,palette.cyan);
      rect(ball.x-5,ball.y-5,4,4,"#ffffff");
    }
  }

  function drawEffects(){
    for(const p of particles){
      ctx.globalAlpha=Math.max(0,p.life/40);
      rect(p.x,p.y,p.size,p.size,p.color);
    }
    ctx.globalAlpha=1;

    for(const t of floatingTexts){
      ctx.globalAlpha=Math.min(1,t.life/20);
      pixelText(t.text,t.x,t.y,18,t.color);
    }
    ctx.globalAlpha=1;
  }

  let last = performance.now();
  function loop(now){
    const dt=Math.min(2,(now-last)/16.6667);
    last=now;
    update(dt);

    ctx.save();
    if(shake>0 && !reducedMotion){
      ctx.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);
    }
    drawBoard();
    drawBalls();
    drawEffects();
    ctx.restore();

    requestAnimationFrame(loop);
  }

  function pointerPower(e){
    const rect = canvas.getBoundingClientRect();
    const y=(e.clientY-rect.top)/rect.height;
    launchPower=Math.max(.2,Math.min(1,1-y));
    updateHud();
  }

  function toggleAuto(force){
    autoMode = typeof force === "boolean" ? force : !autoMode;
    autoBtn.innerHTML = `<span class="button-icon">∞</span>自動：${autoMode?"開":"關"}`;
    autoBtn.classList.toggle("auto-on",autoMode);
    autoBtn.setAttribute("aria-pressed", String(autoMode));
    if(autoMode && ballsLeft > 0) haptic(10);
  }

  canvas.addEventListener("pointerdown",e=>{
    pointerDown=true;
    pointerStartY=e.clientY;
    pointerMoved=false;
    canvas.setPointerCapture?.(e.pointerId);
  });

  canvas.addEventListener("pointermove",e=>{
    if(!pointerDown) return;
    if(Math.abs(e.clientY-pointerStartY)>8) pointerMoved=true;
    if(pointerMoved) pointerPower(e);
  });

  canvas.addEventListener("pointerup",e=>{
    if(!pointerDown) return;
    pointerDown=false;
    canvas.releasePointerCapture?.(e.pointerId);
    if(!pointerMoved) launchBall();
  });

  canvas.addEventListener("pointercancel",()=>{ pointerDown=false; });

  powerSlider.addEventListener("input",()=>{
    launchPower=Number(powerSlider.value)/100;
    updateHud();
  });

  launchBtn.addEventListener("click",launchBall);
  autoBtn.addEventListener("click",()=>toggleAuto());
  resetBtn.addEventListener("click",resetGame);

  window.addEventListener("keydown",e=>{
    if(e.code==="Space"){
      e.preventDefault();
      launchBall();
    }
    if(e.key==="ArrowUp"){
      launchPower=Math.min(1,launchPower+.05);
      updateHud();
    }
    if(e.key==="ArrowDown"){
      launchPower=Math.max(.2,launchPower-.05);
      updateHud();
    }
  });

  document.addEventListener("visibilitychange",()=>{
    if(!document.hidden) last=performance.now();
  });

  buildBoard();
  updateHud();
  requestAnimationFrame(loop);
})();
