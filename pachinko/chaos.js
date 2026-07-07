((G)=>{
  const now=()=>performance.now();
  const field=G.field={
    type:'',
    until:0,
    nextAt:now()+9000,
    launches:0,
    lastType:'',
    portals:[],
    coins:[],
    second:-1
  };

  const events={
    gravity:{label:'GRAVITY FLIP',color:G.p.cyan,duration:7000,message:'重力反轉！彈珠會向上墜落'},
    vortex:{label:'VORTEX',color:G.p.green,duration:8000,message:'中央渦流出現，彈珠會被捲向中心'},
    energy:{label:'ENERGY RUSH',color:G.p.yellow,duration:9000,message:'能量暴走！所有 SLOT 能量獲得量 ×2'},
    portal:{label:'PORTAL GATE',color:G.p.pink,duration:9000,message:'傳送門開啟！穿越後改變位置與方向'},
    frenzy:{label:'BUMPER FRENZY',color:G.p.red,duration:8500,message:'彩色轉盤開始移動，命中獎勵提高'},
    coin:{label:'PIXEL RAIN',color:'#ffe45c',duration:9000,message:'像素金幣雨！碰到金幣即可加分與能量'}
  };

  const eventKeys=Object.keys(events);
  const isActive=type=>field.type===type&&now()<field.until;

  function chooseEvent(){
    const pool=eventKeys.filter(type=>type!==field.lastType);
    return pool[Math.floor(G.rand()*pool.length)];
  }

  function resetBumpers(){
    for(const bumper of G.bumpers){
      if(Number.isFinite(bumper.homeX))bumper.x=bumper.homeX;
      if(Number.isFinite(bumper.homeY))bumper.y=bumper.homeY;
    }
  }

  function prepareEvent(type){
    if(type==='portal'){
      field.portals=[
        {x:155,y:420,r:28,color:G.p.pink,target:1},
        {x:520,y:245,r:28,color:G.p.cyan,target:0}
      ];
    }else field.portals=[];

    if(type==='coin'){
      field.coins=Array.from({length:G.compact?7:11},(_,i)=>({
        x:90+G.rand()*500,
        y:175+G.rand()*500,
        vy:.18+G.rand()*.22,
        phase:i*1.7,
        collected:false
      }));
    }else field.coins=[];
  }

  G.startFieldEvent=(type=chooseEvent(),reason='場上事件')=>{
    if(!events[type])type=chooseEvent();
    const event=events[type];
    resetBumpers();
    field.type=type;
    field.lastType=type;
    field.until=now()+event.duration;
    field.nextAt=field.until+11000+G.rand()*7000;
    field.second=-1;
    prepareEvent(type);
    G.ui.wrap.dataset.fieldEvent=type;
    G.ui.marquee.textContent=`${reason}：${event.message}`;
    G.ui.slotStatus.textContent=`FIELD EVENT：${event.label}`;
    G.haptic([18,20,35]);
  };

  function stopEvent(){
    resetBumpers();
    field.type='';
    field.until=0;
    field.portals=[];
    field.coins=[];
    delete G.ui.wrap.dataset.fieldEvent;
    G.ui.marquee.textContent='場上事件結束，回到正常重力';
  }

  const baseEnergy=G.energy;
  G.energy=(amount,source='')=>baseEnergy(isActive('energy')?amount*2:amount,source);

  const baseLaunch=G.launch;
  G.launch=()=>{
    const before=G.s.ballsLive.length;
    baseLaunch();
    if(G.s.ballsLive.length<=before)return;
    field.launches++;
    if(!field.type&&field.launches%6===0)G.startFieldEvent(chooseEvent(),'發射連鎖');
  };

  const baseApplyForces=G.applyBallForces;
  G.applyBallForces=(ball,dt)=>{
    baseApplyForces?.(ball,dt);

    if(ball.type==='magnet'){
      let target=null;
      if(ball.y>600){
        target={x:340,y:850};
      }else{
        let best=260;
        for(const bumper of G.bumpers){
          const distance=Math.hypot(bumper.x-ball.x,bumper.y-ball.y);
          if(distance<best){best=distance;target=bumper}
        }
      }
      if(target){
        const dx=target.x-ball.x,dy=target.y-ball.y,d=Math.max(1,Math.hypot(dx,dy));
        ball.vx+=dx/d*.075*dt;
        ball.vy+=dy/d*.075*dt;
      }
    }

    if(isActive('vortex')){
      const cx=350,cy=455,dx=cx-ball.x,dy=cy-ball.y,d=Math.max(45,Math.hypot(dx,dy));
      const pull=Math.min(.13,18/d)*dt;
      ball.vx+=dx/d*pull;
      ball.vy+=dy/d*pull;
      ball.vx+=-dy/d*.035*dt;
      ball.vy+=dx/d*.035*dt;
    }
  };

  const baseShouldHitPin=G.shouldHitPin;
  G.shouldHitPin=(ball,pin)=>{
    if((pin.disabledUntil||0)>now())return false;
    return baseShouldHitPin?baseShouldHitPin(ball,pin):true;
  };

  const basePinHit=G.onPinHit;
  G.onPinHit=(pin,ball)=>{
    basePinHit?.(pin,ball);

    if(ball.type==='heavy'){
      let smashed=0;
      for(const nearby of G.pins){
        if(Math.hypot(nearby.x-pin.x,nearby.y-pin.y)<72){
          nearby.disabledUntil=now()+2300;
          smashed++;
        }
      }
      if(smashed){
        G.s.score+=smashed*12;
        G.float(pin.x,pin.y-12,`SMASH +${smashed*12}`,'#ff9966');
        G.particles(pin.x,pin.y,'#ff9966',G.compact?8:14);
      }
    }

    if(ball.type==='speed'){
      const velocity=Math.hypot(ball.vx,ball.vy);
      if(velocity<25){ball.vx*=1.028;ball.vy*=1.028}
      if(ball.pinHits%4===0){
        G.s.score+=80;
        G.float(pin.x,pin.y-10,'DASH +80',G.p.cyan);
      }
    }

    if(ball.type==='lucky'&&ball.pinHits%6===0){
      G.energy(1,'幸運連鎖');
      G.float(pin.x,pin.y-10,'★ ENERGY',G.p.yellow);
    }

    if(ball.type==='thunder'&&ball.pinHits%4===0){
      G.s.score+=120;
      G.float(pin.x,pin.y-10,'⚡ CHAIN +120',G.p.pink);
      for(const bumper of G.bumpers)bumper.flash=7;
    }
  };

  function spawnBombShards(ball,bumper){
    if(ball.shardsSpawned)return;
    ball.shardsSpawned=true;
    const speedCfg=G.ballTypes.speed;
    for(const dir of [-1,1]){
      G.s.ballsLive.push({
        type:'speed',label:'爆裂碎片',x:bumper.x+dir*12,y:bumper.y-8,
        vx:dir*(3.6+G.rand()*1.8),vy:-5-G.rand()*3,r:6,
        gravityMul:.82,bounce:.84,pinScore:2,bumperMult:.65,kick:1.3,
        energyPerBumper:1,color:'#ffe0c2',core:G.p.red,trailColor:'255,90,95',
        alive:true,trail:[],super:false,exploded:true,pinHits:0,bumperHits:0,
        phaseSeed:Math.floor(G.rand()*9999),fragment:true
      });
    }
  }

  const baseBumperHit=G.onBumperHit;
  G.onBumperHit=(bumper,ball)=>{
    const wasExploded=ball.exploded;
    baseBumperHit?.(bumper,ball);

    if(ball.type==='bomb'&&!wasExploded&&ball.exploded){
      spawnBombShards(ball,bumper);
      for(const pin of G.pins){
        if(Math.hypot(pin.x-bumper.x,pin.y-bumper.y)<135)pin.disabledUntil=now()+3200;
      }
      G.s.score+=400;
      G.float(bumper.x,bumper.y-55,'✹ SPLIT +400',G.p.red);
    }

    if(ball.type==='thunder'){
      let chain=0;
      for(const other of G.bumpers){
        if(other===bumper)continue;
        other.flash=10;
        G.particles(other.x,other.y,G.p.pink,G.compact?5:8);
        chain+=other.value;
      }
      G.s.score+=Math.floor(chain*.55);
      G.float(bumper.x,bumper.y-54,`⚡ CHAIN +${Math.floor(chain*.55)}`,G.p.pink);
    }

    if(ball.type==='lucky'&&G.rand()<.16){
      G.s.balls++;
      G.float(bumper.x,bumper.y-52,'★ +1 BALL',G.p.yellow);
    }

    if(isActive('frenzy')){
      const bonus=bumper.value*2;
      G.s.score+=bonus;
      G.float(bumper.x,bumper.y-52,`FRENZY +${bonus}`,G.p.red);
      G.energy(1,'FRENZY');
    }
  };

  function handleGhostRevive(){
    for(const ball of G.s.ballsLive){
      if(ball.type==='ghost'&&!ball.revived&&ball.alive&&ball.y>790){
        ball.revived=true;
        ball.x=100+G.rand()*470;
        ball.y=165;
        ball.vx=(G.rand()-.5)*4;
        ball.vy=1.5;
        ball.phaseSeed=Math.floor(G.rand()*9999);
        G.float(ball.x,ball.y,'◇ PHASE RETURN','#d6c7ff');
        G.particles(ball.x,ball.y,'#a996ff',G.compact?14:24);
      }
    }
  }

  function updatePortals(){
    if(!isActive('portal'))return;
    for(const ball of G.s.ballsLive){
      if(!ball.alive||(ball.portalCooldown||0)>now())continue;
      for(let i=0;i<field.portals.length;i++){
        const entry=field.portals[i];
        if(Math.hypot(ball.x-entry.x,ball.y-entry.y)>entry.r+ball.r)continue;
        const exit=field.portals[entry.target];
        ball.x=exit.x+(G.rand()-.5)*18;
        ball.y=exit.y+(G.rand()-.5)*18;
        const oldVx=ball.vx;
        ball.vx=-ball.vy*.75;
        ball.vy=oldVx*.75-1.5;
        ball.portalCooldown=now()+750;
        G.particles(entry.x,entry.y,entry.color,G.compact?12:20);
        G.particles(exit.x,exit.y,exit.color,G.compact?12:20);
        G.s.score+=180;
        G.float(exit.x,exit.y-35,'PORTAL +180',exit.color);
        break;
      }
    }
  }

  function updateCoins(dt){
    if(!isActive('coin'))return;
    for(const coin of field.coins){
      if(coin.collected)continue;
      coin.y+=coin.vy*dt;
      coin.x+=Math.sin(now()/350+coin.phase)*.18*dt;
      if(coin.y>760){coin.y=175;coin.x=90+G.rand()*500}
      for(const ball of G.s.ballsLive){
        if(!ball.alive||Math.hypot(ball.x-coin.x,ball.y-coin.y)>ball.r+12)continue;
        coin.collected=true;
        G.s.score+=250;
        G.energy(1,'像素金幣');
        G.float(coin.x,coin.y,'◆ +250','#ffe45c');
        G.particles(coin.x,coin.y,'#ffe45c',G.compact?10:18);
        break;
      }
    }
    if(field.coins.every(coin=>coin.collected)){
      G.s.balls+=2;
      G.ui.marquee.textContent='PIXEL RAIN 全收集！額外獲得 2 顆彈珠';
      field.coins=[];
    }
  }

  const baseUpdate=G.update;
  G.update=dt=>{
    const time=now();
    if(field.type&&time>=field.until)stopEvent();
    if(!field.type&&time>=field.nextAt)G.startFieldEvent();

    handleGhostRevive();

    const originalGravity=G.gravity;
    if(isActive('gravity'))G.gravity=-.115;

    if(isActive('frenzy')){
      for(let i=0;i<G.bumpers.length;i++){
        const bumper=G.bumpers[i];
        if(!Number.isFinite(bumper.homeX)){bumper.homeX=bumper.x;bumper.homeY=bumper.y}
        bumper.x=bumper.homeX+Math.sin(time/420+i*1.4)*26;
        bumper.y=bumper.homeY+Math.cos(time/520+i)*10;
      }
    }else resetBumpers();

    try{baseUpdate(dt)}finally{G.gravity=originalGravity}
    updatePortals();
    updateCoins(dt);

    const seconds=field.type?Math.max(0,Math.ceil((field.until-time)/1000)):0;
    if(seconds!==field.second){field.second=seconds;G.s.hud=true}
  };

  const baseDrawBoard=G.drawBoard;
  G.drawBoard=()=>{
    baseDrawBoard();

    const time=now();
    for(const pin of G.pins){
      if((pin.disabledUntil||0)>time){
        G.rect(pin.x-5,pin.y-5,10,10,'#252343');
      }
    }

    if(isActive('vortex')){
      const cx=350,cy=455;
      G.ctx.save();
      G.ctx.strokeStyle=G.p.green;
      G.ctx.lineWidth=4;
      G.ctx.globalAlpha=.72;
      for(let i=0;i<4;i++){
        G.ctx.beginPath();
        G.ctx.arc(cx,cy,34+i*18,(time/550)+i,Math.PI*1.5+(time/550)+i);
        G.ctx.stroke();
      }
      G.ctx.restore();
    }

    if(isActive('portal')){
      for(const portal of field.portals){
        G.ctx.save();
        G.ctx.strokeStyle=portal.color;
        G.ctx.lineWidth=6;
        G.ctx.globalAlpha=.82;
        G.ctx.beginPath();
        G.ctx.arc(portal.x,portal.y,portal.r+Math.sin(time/120)*3,0,Math.PI*2);
        G.ctx.stroke();
        G.ctx.restore();
        G.text('PORTAL',portal.x,portal.y,9,portal.color);
      }
    }

    if(isActive('coin')){
      for(const coin of field.coins){
        if(coin.collected)continue;
        const pulse=2+Math.sin(time/100+coin.phase)*2;
        G.rect(coin.x-7-pulse/2,coin.y-7-pulse/2,14+pulse,14+pulse,'#ffe45c',G.p.white,2);
        G.rect(coin.x-2,coin.y-2,4,4,G.p.pink);
      }
    }

    if(field.type){
      const event=events[field.type];
      const seconds=Math.max(0,Math.ceil((field.until-time)/1000));
      G.rect(220,135,280,30,'rgba(8,6,21,.88)',event.color,3);
      G.text(`${event.label}  ${seconds}s`,360,150,13,event.color);
    }
  };

  const baseReset=G.reset;
  G.reset=()=>{
    baseReset();
    resetBumpers();
    field.type='';
    field.until=0;
    field.nextAt=now()+9000;
    field.launches=0;
    field.portals=[];
    field.coins=[];
    delete G.ui.wrap.dataset.fieldEvent;
  };

  field.nextAt=now()+7500;
})(window.PG);
