/* Sky Pouncer: three-mode boundary flight and aerial assault attacker */
(() => {
 const SKY_KEY='skyPouncer';
 const SKY_POUNCER={
  label:'[SPECIAL] 天墜獵鷹｜Sky Pouncer',
  name:'天墜獵鷹',englishName:'Sky Pouncer',
  combo:'4-70 Jump Talon',
  rank:'三段飛行戰術・中飛／大飛／假起飛突擊',tier:'SPECIAL',type:'attack',
  a:94,d:70,s:76,w:78,b:88,spin:'R',shape:'skyPouncer',
  skyPouncer:true,
  primary:'#36d8ff',secondary:'#ff9f43',accent:'#fff2a6',metal:'#dcecff'
 };
 metaPresets[SKY_KEY]=SKY_POUNCER;

 const previousRenderPanel=renderPanel;
 renderPanel=function(id){
  previousRenderPanel(id);
  const host=document.querySelector('#'+id),c=cfg[id];
  if(!host||!c?.skyPouncer)return;
  const combo=host.querySelector('.combo-box');
  const ability=document.createElement('div');
  ability.className='combo-box sky-pouncer-ability';
  ability.innerHTML='<strong>飛鷹三式飛行機構</strong>每次攀上外圈時會重新選擇戰術：爬升後中飛俯衝、沿邊界盤旋蓄力後大飛，或假裝起飛並突然貼地直攻。<div class="combo-tags"><span>中飛俯衝</span><span>盤旋大飛</span><span>假起飛突擊</span></div>';
  if(combo)combo.insertAdjacentElement('afterend',ability);else host.appendChild(ability);
 };

 function isActive(top){return !!top&&!top.out&&!top.burst&&top.energy>0}
 function teamOf(top){return top?.teamIndex??(top?.index?1:0)}
 function sameTeam(a,b){return teamOf(a)===teamOf(b)}
 function scheduleNextJump(top){
  const fatigue=clamp((55-top.energy)/55,0,1);
  top.skyJumpCooldown=rnd(2.7,5.9)+fatigue*1.4;
 }
 function clampInsideArena(point,radius=innerR*.78){
  const cx=W/2,cy=H/2,dx=point.x-cx,dy=point.y-cy,d=mag(dx,dy)||1;
  if(d<=radius)return point;
  return {x:cx+dx/d*radius,y:cy+dy/d*radius};
 }
 function chooseFlightMode(top){
  const roll=Math.random();
  if(top.energy<38)return roll<.62?'mid':'feint';
  if(roll<.44)return 'mid';
  if(roll<.76)return 'grand';
  return 'feint';
 }
 function modeLabel(mode){
  return mode==='grand'?'盤旋大飛':mode==='feint'?'假起飛突擊':'爬升中飛';
 }

 const PreviousTop=Top;
 Top=class Top extends PreviousTop{
  constructor(index,data){
   super(index,data);
   this.skyJumpState='idle';
   this.skyJumpCooldown=data.skyPouncer?rnd(2.2,4.6):999;
   this.skyFlightMode='mid';
   this.skyClimbTimer=0;
   this.skyOrbitTimer=0;
   this.skyOrbitDuration=0;
   this.skyOrbitAngle=0;
   this.skyOrbitDirection=1;
   this.skyDirectTimer=0;
   this.skyAirElapsed=0;
   this.skyAirDuration=.72;
   this.skyAirPeak=1;
   this.skyJumpHeight=0;
   this.skyJumpGhost=false;
   this.skyStart=null;
   this.skyControl=null;
   this.skyTarget=null;
   this.skyDiveImpact=0;
   this.skyStrikePower=1;
   this.skyStrikeMode='mid';
   this.skyStrikeLock=0;
   this.skyJumpCount=0;
  }
  isSkyPouncer(){return !!this.c.skyPouncer}
  beginSkyClimb(opponent){
   if(!this.isSkyPouncer()||!isActive(opponent)||this.skyJumpState!=='idle')return;
   this.skyFlightMode=chooseFlightMode(this);
   this.skyStrikeMode=this.skyFlightMode;
   this.skyJumpState='climb';
   this.skyClimbTimer=this.skyFlightMode==='feint'?rnd(.48,.78):rnd(.62,1.02);
   this.rimCooldown=Math.max(this.rimCooldown,.32);
   this.xDashCooldown=Math.max(this.xDashCooldown,.30);
   emit(this.x,this.y,this.c.primary,16,.68,'streak');
   wave(this.x,this.y,this.c.accent,30);
   if(performance.now()-lastZoneLog>650){
    addLog(`${this.c.name} 改變路線，開始攀上外圈邊界！飛行戰術正在判定……`);
    lastZoneLog=performance.now();
   }
  }
  updateSkyClimb(dt,opponent){
   this.skyClimbTimer-=dt;
   const cx=W/2,cy=H/2,dx=this.x-cx,dy=this.y-cy,d=mag(dx,dy)||1;
   const nx=dx/d,ny=dy/d,sign=Math.sign(this.omega)||1,tx=-ny*sign,ty=nx*sign;
   const outward=138+this.c.a*.68;
   this.vx+=(nx*outward+tx*38)*dt;
   this.vy+=(ny*outward+ty*38)*dt;
   this.rimCooldown=Math.max(this.rimCooldown,.20);
   this.xDashCooldown=Math.max(this.xDashCooldown,.20);
   this.lift=clamp(this.lift+.40*dt,0,.20);
   const railR=outerR*.755;
   if(d>railR){
    this.x=cx+nx*railR;
    this.y=cy+ny*railR;
   }
   if(d>=outerR*.70||this.skyClimbTimer<=0){
    if(this.skyFlightMode==='grand')this.beginSkyOrbit(opponent);
    else if(this.skyFlightMode==='feint')this.launchSkyDirectAttack(opponent);
    else this.launchSkyDive(opponent,'mid');
   }
  }
  beginSkyOrbit(opponent){
   if(this.skyJumpState!=='climb')return;
   const cx=W/2,cy=H/2;
   this.skyJumpState='orbit';
   this.skyOrbitDuration=rnd(.78,1.18);
   this.skyOrbitTimer=this.skyOrbitDuration;
   this.skyOrbitAngle=Math.atan2(this.y-cy,this.x-cx);
   this.skyOrbitDirection=Math.sign(this.omega)||1;
   this.skyJumpGhost=true;
   this.skyJumpHeight=.10;
   this.vx=0;this.vy=0;
   this.omega*=.975;this.spin=this.omega;
   emit(this.x,this.y,this.c.accent,30,.92,'streak');
   wave(this.x,this.y,this.c.primary,52);
   shake=Math.max(shake,4.8);
   addLog(`${this.c.name} 沒有立刻俯衝，而是沿外圈盤旋蓄力，準備發動「蒼穹大飛」！`);
  }
  updateSkyOrbit(dt,opponent){
   if(this.out||this.burst)return;
   this.skyOrbitTimer-=dt;
   const cx=W/2,cy=H/2;
   const progress=clamp(1-this.skyOrbitTimer/Math.max(.01,this.skyOrbitDuration),0,1);
   const angularSpeed=3.05+this.c.a*.0045;
   this.skyOrbitAngle+=this.skyOrbitDirection*angularSpeed*dt;
   const radius=outerR*(.715+.022*Math.sin(progress*Math.PI*2));
   this.x=cx+Math.cos(this.skyOrbitAngle)*radius;
   this.y=cy+Math.sin(this.skyOrbitAngle)*radius;
   this.skyJumpHeight=.10+Math.sin(Math.PI*progress)*.16;
   this.angle+=this.omega*dt*(1.08+this.skyJumpHeight*.35);
   this.omega*=Math.exp(-.055*dt);this.spin=this.omega;
   this.energy=Math.max(0,this.energy-dt*1.45);
   this.trail.push({x:this.x,y:this.y,l:1});
   if(this.trail.length>42)this.trail.shift();
   this.trail.forEach(point=>point.l-=dt*1.65);
   this.trail=this.trail.filter(point=>point.l>0);
   if(Math.random()<dt*19)emit(this.x,this.y,this.c.accent,1,.40,'streak');
   if(this.skyOrbitTimer<=0)this.launchSkyDive(opponent,'grand');
  }
  launchSkyDive(opponent,mode='mid'){
   if(this.skyJumpState!=='climb'&&this.skyJumpState!=='orbit')return;
   const grand=mode==='grand';
   const leadMin=grand?.30:.18,leadMax=grand?.48:.32;
   const predicted=isActive(opponent)?{
    x:opponent.x+opponent.vx*rnd(leadMin,leadMax),
    y:opponent.y+opponent.vy*rnd(leadMin,leadMax)
   }:{x:W/2,y:H/2};
   const target=clampInsideArena(predicted,innerR*(grand?.68:.74));
   const sx=this.x,sy=this.y,dx=target.x-sx,dy=target.y-sy,d=mag(dx,dy)||1;
   const side=(this.index?1:-1)*(Math.random()<.5?-1:1);
   this.skyStart={x:sx,y:sy};
   this.skyTarget=target;
   this.skyControl={
    x:(sx+target.x)/2-dy/d*outerR*(grand?.20:.12)*side,
    y:(sy+target.y)/2+dx/d*outerR*(grand?.20:.12)*side
   };
   this.skyAirElapsed=0;
   this.skyAirDuration=grand?rnd(1.02,1.30):rnd(.62,.82);
   this.skyAirPeak=grand?1.72:1;
   this.skyStrikePower=grand?1.32:1;
   this.skyStrikeMode=mode;
   this.skyJumpState='air';
   this.skyJumpGhost=true;
   this.skyJumpHeight=0;
   this.zone='inner';
   this.vx=0;this.vy=0;
   this.omega*=grand?.94:.965;this.spin=this.omega;
   emit(this.x,this.y,this.c.accent,grand?40:26,grand?1.08:.86,'streak');
   wave(this.x,this.y,this.c.primary,grand?68:46);
   shake=Math.max(shake,grand?6.8:4.2);
   addLog(grand
    ?`${this.c.name} 完成盤旋蓄力，高高躍起發動「蒼穹大飛」！`
    :`${this.c.name} 爬升後進入中空，鎖定敵方位置發動「天墜中飛」！`);
  }
  updateSkyAir(dt,opponent){
   if(this.out||this.burst)return;
   this.skyAirElapsed+=dt;
   const p=clamp(this.skyAirElapsed/this.skyAirDuration,0,1),q=1-p;
   this.x=q*q*this.skyStart.x+2*q*p*this.skyControl.x+p*p*this.skyTarget.x;
   this.y=q*q*this.skyStart.y+2*q*p*this.skyControl.y+p*p*this.skyTarget.y;
   this.skyJumpHeight=Math.sin(Math.PI*p)*this.skyAirPeak;
   this.angle+=this.omega*dt*(1+this.skyJumpHeight*.70);
   this.omega*=Math.exp(-(this.skyStrikeMode==='grand'?.060:.045)*dt);this.spin=this.omega;
   const airCost=this.skyStrikeMode==='grand'?1.85:1.05;
   this.energy=Math.max(0,this.energy-dt*(airCost+this.skyJumpHeight*.75));
   this.trail.push({x:this.x,y:this.y,l:1});
   if(this.trail.length>(this.skyStrikeMode==='grand'?48:36))this.trail.shift();
   this.trail.forEach(point=>point.l-=dt*(this.skyStrikeMode==='grand'?1.55:2.0));
   this.trail=this.trail.filter(point=>point.l>0);
   if(Math.random()<dt*(this.skyStrikeMode==='grand'?22:15))emit(this.x,this.y,this.c.primary,1,.34,'streak');
   if(p>=1)this.landSkyDive(opponent);
  }
  landSkyDive(opponent){
   const grand=this.skyStrikeMode==='grand';
   this.skyJumpState='idle';
   this.skyJumpGhost=false;
   this.skyJumpHeight=0;
   this.skyJumpCount++;
   scheduleNextJump(this);
   const target=isActive(opponent)?opponent:{x:W/2,y:H/2,vx:0,vy:0};
   const dx=target.x-this.x,dy=target.y-this.y,d=mag(dx,dy)||1;
   const landingSpeed=grand?178+this.c.a*.70:145+this.c.a*.55;
   this.vx=dx/d*landingSpeed;
   this.vy=dy/d*landingSpeed;
   this.lift=grand?.15:.10;
   this.tiltVel+=grand?.15:.10;
   this.rimCooldown=.18;
   this.xDashCooldown=.32;
   this.skyDiveImpact=grand?.68:.48;
   emit(this.x,this.y,this.c.accent,grand?58:42,grand?1.34:1.08,'streak');
   emit(this.x,this.y,this.c.primary,grand?42:30,grand?1.12:.92);
   wave(this.x,this.y,this.c.accent,grand?104:76);
   shake=Math.max(shake,grand?13:9);flash=Math.max(flash,grand?.48:.30);
   if(isActive(opponent)&&mag(opponent.x-this.x,opponent.y-this.y)<=this.r+opponent.r+(grand?34:26)){
    applySkyStrike(this,opponent);
   }else{
    addLog(grand
     ?`${this.c.name} 從高空重返戰圈，蒼穹落差將轉化為下一次追擊！`
     :`${this.c.name} 從中空落入戰圈，準備以落地速度追擊！`);
   }
  }
  launchSkyDirectAttack(opponent){
   if(this.skyJumpState!=='climb')return;
   const predicted=isActive(opponent)?{
    x:opponent.x+opponent.vx*rnd(.08,.15),
    y:opponent.y+opponent.vy*rnd(.08,.15)
   }:{x:W/2,y:H/2};
   const target=clampInsideArena(predicted,innerR*.90);
   const dx=target.x-this.x,dy=target.y-this.y,d=mag(dx,dy)||1;
   const speed=225+this.c.a*.82;
   this.skyJumpState='direct';
   this.skyJumpGhost=false;
   this.skyJumpHeight=0;
   this.skyDirectTimer=rnd(.38,.56);
   this.skyStrikePower=1.08;
   this.skyStrikeMode='feint';
   this.skyDiveImpact=.60;
   this.vx=dx/d*speed;
   this.vy=dy/d*speed;
   this.lift=.05;
   this.omega*=.982;this.spin=this.omega;
   this.energy=Math.max(0,this.energy-2.4);
   this.rimCooldown=.18;
   this.xDashCooldown=.42;
   emit(this.x,this.y,this.c.secondary,34,.95,'streak');
   wave(this.x,this.y,this.c.accent,58);
   shake=Math.max(shake,6.5);
   addLog(`${this.c.name} 突然取消起飛！以「獵鷹假升」從外圈貼地直攻敵方！`);
  }
  updateSkyDirect(dt,opponent){
   this.skyDirectTimer-=dt;
   if(isActive(opponent)&&this.skyDiveImpact>0){
    const predicted={x:opponent.x+opponent.vx*.06,y:opponent.y+opponent.vy*.06};
    const dx=predicted.x-this.x,dy=predicted.y-this.y,d=mag(dx,dy)||1;
    const currentSpeed=Math.max(205,mag(this.vx,this.vy));
    const desiredX=dx/d*currentSpeed,desiredY=dy/d*currentSpeed;
    const steer=clamp(dt*4.6,0,.22);
    this.vx+=(desiredX-this.vx)*steer;
    this.vy+=(desiredY-this.vy)*steer;
   }
   if(Math.random()<dt*24)emit(this.x,this.y,this.c.secondary,1,.42,'streak');
   if(this.skyDirectTimer<=0||this.skyDiveImpact<=0){
    const missed=this.skyDiveImpact>0;
    this.skyJumpState='idle';
    this.skyDiveImpact=0;
    this.skyJumpCount++;
    scheduleNextJump(this);
    if(missed)addLog(`${this.c.name} 的假起飛突擊掠過戰圈，重新整理飛行路線。`);
   }
  }
  update(dt,opponent){
   if(!this.isSkyPouncer())return super.update(dt,opponent);
   this.skyStrikeLock=Math.max(0,this.skyStrikeLock-dt);
   this.skyDiveImpact=Math.max(0,this.skyDiveImpact-dt);
   if(this.skyJumpState==='air'){
    this.updateSkyAir(dt,opponent);
    return;
   }
   if(this.skyJumpState==='orbit'){
    this.updateSkyOrbit(dt,opponent);
    return;
   }
   if(this.skyJumpState==='climb'){
    this.rimCooldown=Math.max(this.rimCooldown,.22);
    this.xDashCooldown=Math.max(this.xDashCooldown,.22);
   }
   super.update(dt,opponent);
   if(this.out||this.burst)return;
   if(this.skyJumpState==='climb'){
    this.updateSkyClimb(dt,opponent);
    return;
   }
   if(this.skyJumpState==='direct'){
    this.updateSkyDirect(dt,opponent);
    return;
   }
   if(this.skyJumpState!=='idle')return;
   const spinReady=Math.abs(this.omega)>18,energyReady=this.energy>28;
   if(isActive(opponent)&&spinReady&&energyReady){
    this.skyJumpCooldown-=dt;
    if(this.skyJumpCooldown<=0)this.beginSkyClimb(opponent);
   }
  }
  bladeCount(){return this.c.shape==='skyPouncer'?3:super.bladeCount()}
  bladeRadius(i){
   if(this.c.shape==='skyPouncer'){
    const profile=[1.22,.76,.92,.70];
    return this.r*profile[i%profile.length];
   }
   return super.bladeRadius(i);
  }
  drawModel(speed){
   if(!this.isSkyPouncer())return super.drawModel(speed);
   const originalY=this.y,originalR=this.r,h=this.skyJumpHeight||0;
   if(h>0){
    ctx.save();
    ctx.translate(this.x,originalY+5+h*14);
    ctx.scale(1,.42);
    const shadowRadius=originalR*clamp(1.25-h*.35,.55,1.25);
    const shadow=ctx.createRadialGradient(0,0,1,0,0,shadowRadius);
    shadow.addColorStop(0,`rgba(0,0,0,${clamp(.52-h*.20,.14,.52)})`);
    shadow.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=shadow;
    ctx.beginPath();ctx.arc(0,0,originalR*1.35,0,Math.PI*2);ctx.fill();
    ctx.restore();
    this.y=originalY-h*24;
    this.r=originalR*(1+h*.16);
   }
   super.drawModel(speed);
   this.y=originalY;this.r=originalR;
   ctx.save();
   ctx.translate(this.x,originalY-h*24);
   ctx.rotate(this.angle*.72);
   ctx.globalCompositeOperation='screen';
   ctx.strokeStyle=alpha(this.c.accent,.75);
   ctx.lineWidth=Math.max(1.1,originalR*.065);
   ctx.shadowBlur=12;ctx.shadowColor=this.c.primary;
   ctx.beginPath();
   ctx.moveTo(-originalR*.72,originalR*.10);
   ctx.lineTo(0,-originalR*.42);
   ctx.lineTo(originalR*.72,originalR*.10);
   ctx.stroke();
   if(h>0){
    ctx.strokeStyle=alpha(this.c.primary,.30+clamp(h,0,1)*.35);
    ctx.beginPath();ctx.arc(0,0,originalR*(1.05+h*.28),0,Math.PI*2);ctx.stroke();
   }
   ctx.restore();
  }
 };

 function applySkyStrike(attacker,victim){
  if(!attacker?.c?.skyPouncer||attacker.skyDiveImpact<=0||attacker.skyStrikeLock>0||!isActive(victim)||sameTeam(attacker,victim))return false;
  const dx=victim.x-attacker.x,dy=victim.y-attacker.y,d=mag(dx,dy)||1,nx=dx/d,ny=dy/d;
  const spinRatio=clamp(Math.abs(attacker.omega)/Math.max(1,attacker.omega0||40),.35,1.15);
  const power=clamp(attacker.skyStrikePower||1,.85,1.40);
  const force=(78+attacker.c.a*.62+spinRatio*42)*power;
  victim.vx+=nx*force;victim.vy+=ny*force;
  victim.omega*=clamp(.87-(power-1)*.10,.82,.90);victim.spin=victim.omega;
  victim.energy=Math.max(0,victim.energy-(6+spinRatio*5)*(.78+power*.22));
  victim.tiltVel+=(.28+.17*spinRatio)*power/Math.max(.70,victim.tip?.stability||1);
  victim.lift=clamp((victim.lift||0)+(.18+.10*spinRatio)*power,0,1);
  victim.impactBoost=Math.max(victim.impactBoost||0,(86+spinRatio*34)*power);
  victim.burstMeter=(victim.burstMeter||0)+(7+spinRatio*5)*power;
  attacker.omega*=power>1.2?.94:.955;attacker.spin=attacker.omega;
  attacker.energy=Math.max(0,attacker.energy-(3.5+(power-1)*3));
  attacker.skyDiveImpact=0;attacker.skyStrikeLock=.55;
  const cx=(attacker.x+victim.x)/2,cy=(attacker.y+victim.y)/2;
  emit(cx,cy,attacker.c.accent,attacker.skyStrikeMode==='grand'?66:48,attacker.skyStrikeMode==='grand'?1.48:1.22,'streak');
  emit(cx,cy,'#ffffff',attacker.skyStrikeMode==='grand'?36:26,.90);
  wave(cx,cy,attacker.c.primary,attacker.skyStrikeMode==='grand'?116:84);
  shake=Math.max(shake,attacker.skyStrikeMode==='grand'?17:13);flash=Math.max(flash,attacker.skyStrikeMode==='grand'?.68:.52);
  const strikeName=attacker.skyStrikeMode==='grand'?'蒼穹大飛':attacker.skyStrikeMode==='feint'?'獵鷹假升':'天墜中飛';
  addLog(`${attacker.c.name} 的「${strikeName}」命中！削減對手角速度並造成強力擊飛！`);
  return true;
 }

 const previousCollide=collide;
 collide=function(a,b){
  if(a?.skyJumpGhost||b?.skyJumpGhost)return;
  const dx=b.x-a.x,dy=b.y-a.y,d=mag(dx,dy),min=a.r+b.r;
  let contact=false;
  if(d&&d<min){
   const nx=dx/d,ny=dy/d;
   contact=-((b.vx-a.vx)*nx+(b.vy-a.vy)*ny)>0;
  }
  previousCollide(a,b);
  if(!contact||sameTeam(a,b))return;
  if(a.skyDiveImpact>0)applySkyStrike(a,b);
  if(b.skyDiveImpact>0)applySkyStrike(b,a);
 };

 const style=document.createElement('style');
 style.textContent='.sky-pouncer-ability{border-color:#36d8ff55;background:linear-gradient(135deg,#36d8ff13,#ff9f4314)}';
 document.head.appendChild(style);

 cfg.p2={...SKY_POUNCER,preset:SKY_KEY};
 renderPanel('p1');renderPanel('p2');
 document.querySelector('#n1').textContent=cfg.p1.name;
 document.querySelector('#n2').textContent=cfg.p2.name;
 document.querySelector('#log').textContent='「天墜獵鷹」飛行系統已升級：每次攀升都可能進入中飛、盤旋大飛，或取消起飛改用貼地直攻。';
})();
