/* Enchantress Siren: irregular charm control with enhanced moon-song visuals */
(() => {
 const CHARM_KEY='enchantressSiren';
 const ENCHANTRESS_SIREN={
  label:'[SPECIAL] 魅月海妖｜Enchantress Siren',
  name:'魅月海妖',englishName:'Enchantress Siren',
  combo:'5-70 Siren Orb',
  rank:'不定期魅惑・牽引敵方軌道',tier:'SPECIAL',type:'balance',
  a:69,d:81,s:87,w:78,b:91,spin:'L',shape:'enchantressSiren',
  charmAura:true,
  primary:'#ff68c8',secondary:'#744cff',accent:'#fff0fb',metal:'#d9e2f2'
 };
 metaPresets[CHARM_KEY]=ENCHANTRESS_SIREN;

 const previousRenderPanel=renderPanel;
 renderPanel=function(id){
  previousRenderPanel(id);
  const host=document.querySelector('#'+id),c=cfg[id];
  if(!host||!c?.charmAura)return;
  const combo=host.querySelector('.combo-box');
  const ability=document.createElement('div');
  ability.className='combo-box charm-ability';
  ability.innerHTML='<strong>月歌魅惑機構</strong>會在不固定時間鎖定一名可見敵人，使其短暫停止攻擊魅惑者並繞著魅惑者移動。魅惑期間會出現月波、歌聲絲帶與魅惑封印；隱形或飛行中的陀螺不會被鎖定。<div class="combo-tags"><span>隨機魅惑</span><span>月歌牽引</span><span>魅惑封印</span></div>';
  if(combo)combo.insertAdjacentElement('afterend',ability);else host.appendChild(ability);
 };

 function teamOf(top){return top?.teamIndex??(top?.index?1:0)}
 function combatReady(top){
  return !!top&&!top.out&&!top.burst&&!top.phaseInvisible&&!top.skyJumpGhost&&top.energy>0;
 }
 function charmEligible(source,target){
  return combatReady(source)&&combatReady(target)&&source!==target&&teamOf(source)!==teamOf(target)&&!target.charmedBy;
 }
 function nearestCharmTarget(source,preferred){
  if(charmEligible(source,preferred))return preferred;
  let best=null,bestDistance=Infinity;
  tops.forEach(target=>{
   if(!charmEligible(source,target))return;
   const distance=mag(target.x-source.x,target.y-source.y);
   if(distance<bestDistance){best=target;bestDistance=distance}
  });
  return best;
 }
 function scheduleCharm(top,first=false){
  const fatigue=clamp((45-top.energy)/45,0,1);
  top.charmCooldown=(first?rnd(3.1,5.8):rnd(5.0,8.4))+fatigue*1.25;
 }
 function clearCharm(target,reason=''){
  if(!target?.charmedBy)return;
  const source=target.charmedBy;
  target.charmedBy=null;
  target.charmTimer=0;
  target.charmGrace=.22;
  target.charmReleasePulse=1;
  target.rimCooldown=Math.max(target.rimCooldown||0,.12);
  target.xDashCooldown=Math.max(target.xDashCooldown||0,.18);
  emit(target.x,target.y,target.c.secondary||'#fff',22,.62,'streak');
  emit(target.x,target.y,source?.c?.accent||'#fff0fb',12,.42);
  wave(target.x,target.y,source?.c?.primary||'#ff8ad8',42);
  if(reason)addLog(`${target.c.name} ${reason}，解除魅惑並恢復自主軌道。`);
 }

 function drawCrescent(x,y,r,rotation,color,opacity){
  ctx.save();
  ctx.translate(x,y);ctx.rotate(rotation);
  ctx.globalCompositeOperation='screen';
  ctx.strokeStyle=alpha(color,opacity);
  ctx.lineWidth=Math.max(1,r*.16);
  ctx.beginPath();ctx.arc(0,0,r,-Math.PI*.68,Math.PI*.68);ctx.stroke();
  ctx.restore();
 }

 function drawCharmRibbon(source,target,color){
  if(!source||!target||source.out||target.out||source.burst||target.burst)return;
  const dx=target.x-source.x,dy=target.y-source.y,d=mag(dx,dy)||1;
  const px=-dy/d,py=dx/d;
  const midX=(source.x+target.x)/2,midY=(source.y+target.y)/2;
  const curve=Math.sin(time*6.2+target.angle)*Math.min(18,7+d*.045);

  ctx.save();
  ctx.globalCompositeOperation='screen';
  ctx.lineCap='round';

  ctx.strokeStyle=alpha(color,.10);
  ctx.shadowBlur=18;ctx.shadowColor=color;
  ctx.lineWidth=9;
  ctx.beginPath();ctx.moveTo(source.x,source.y);
  ctx.quadraticCurveTo(midX+px*curve,midY+py*curve,target.x,target.y);ctx.stroke();

  ctx.shadowBlur=10;
  ctx.strokeStyle=alpha(color,.42);
  ctx.lineWidth=2.2;
  ctx.beginPath();ctx.moveTo(source.x,source.y);
  ctx.quadraticCurveTo(midX+px*curve,midY+py*curve,target.x,target.y);ctx.stroke();

  for(let i=0;i<5;i++){
   const t=(i/5+(time*.62)%1)%1,q=1-t;
   const x=q*q*source.x+2*q*t*(midX+px*curve)+t*t*target.x;
   const y=q*q*source.y+2*q*t*(midY+py*curve)+t*t*target.y;
   const rr=2.7-i*.24;
   ctx.fillStyle=alpha(i%2?source.c.accent:'#ffffff',.62-i*.07);
   ctx.beginPath();ctx.arc(x,y,rr,0,Math.PI*2);ctx.fill();
  }
  ctx.restore();
 }

 function drawSirenAura(top,pulse){
  const charge=clamp(1-(top.charmCooldown||99)/1.25,0,1);
  const cast=clamp(top.charmCastPulse||0,0,1.8);
  const glow=.18+.16*pulse+.20*charge+.22*cast;
  ctx.save();
  ctx.translate(top.x,top.y);
  ctx.rotate(time*.42);
  ctx.globalCompositeOperation='screen';
  ctx.shadowBlur=15+charge*8;ctx.shadowColor=top.c.primary;

  ctx.strokeStyle=alpha(top.c.primary,glow);
  ctx.lineWidth=1.5+charge*.8;
  ctx.beginPath();ctx.arc(0,0,top.r*(1.16+.05*pulse+.09*charge),0,Math.PI*2);ctx.stroke();

  ctx.rotate(-time*.86);
  ctx.strokeStyle=alpha(top.c.secondary,.13+.15*pulse+.22*charge+.16*cast);
  ctx.setLineDash([top.r*.14,top.r*.18]);
  ctx.beginPath();ctx.arc(0,0,top.r*(1.42+.08*pulse+.12*charge),0,Math.PI*2);ctx.stroke();
  ctx.setLineDash([]);

  for(let i=0;i<4;i++){
   const a=i*Math.PI/2+time*.72;
   const x=Math.cos(a)*top.r*.79,y=Math.sin(a)*top.r*.79;
   ctx.save();ctx.translate(x,y);ctx.rotate(a+Math.PI/2);
   ctx.strokeStyle=alpha(top.c.accent,.18+.13*pulse+.20*charge);
   ctx.beginPath();ctx.ellipse(0,0,top.r*.17,top.r*.40,0,0,Math.PI*2);ctx.stroke();ctx.restore();
  }

  if(charge>.04){
   for(let i=0;i<3;i++){
    const a=i*Math.PI*2/3-time*(1.1+i*.12),rr=top.r*(1.20+.18*charge);
    drawCrescent(Math.cos(a)*rr,Math.sin(a)*rr,top.r*(.12+.04*charge),a+Math.PI/2,top.c.accent,.16+.34*charge);
   }
  }
  ctx.restore();
 }

 function drawCharmedSeal(top,color){
  const pulse=.5+.5*Math.sin(time*9+top.angle);
  ctx.save();
  ctx.translate(top.x,top.y);
  ctx.rotate(-time*1.75);
  ctx.globalCompositeOperation='screen';
  ctx.shadowBlur=13;ctx.shadowColor=color;

  ctx.strokeStyle=alpha(color,.34+.18*pulse);
  ctx.lineWidth=1.8;
  ctx.beginPath();ctx.arc(0,0,top.r*1.24,0,Math.PI*2);ctx.stroke();

  ctx.strokeStyle=alpha('#fff0fb',.23+.18*pulse);
  ctx.setLineDash([top.r*.12,top.r*.16]);
  ctx.beginPath();ctx.arc(0,0,top.r*1.43,0,Math.PI*2);ctx.stroke();
  ctx.setLineDash([]);

  for(let i=0;i<3;i++){
   const a=i*Math.PI*2/3+time*2.15;
   const x=Math.cos(a)*top.r*1.16,y=Math.sin(a)*top.r*1.16;
   ctx.fillStyle=alpha(color,.42);
   ctx.beginPath();ctx.arc(x,y,2.2,0,Math.PI*2);ctx.fill();
   drawCrescent(x,y,top.r*.12,a+Math.PI/2,'#fff0fb',.30+.18*pulse);
  }
  ctx.restore();
 }

 const PreviousTop=Top;
 Top=class Top extends PreviousTop{
  constructor(index,data){
   super(index,data);
   this.charmCooldown=999;
   this.charmCastPulse=0;
   this.charmMarkPulse=0;
   this.charmReleasePulse=0;
   this.charmCount=0;
   this.charmedBy=null;
   this.charmTimer=0;
   this.charmOrbitDir=1;
   this.charmOrbitPhase=rnd(0,Math.PI*2);
   this.charmGrace=0;
   if(data.charmAura)scheduleCharm(this,true);
  }
  isCharmCaster(){return !!this.c.charmAura}
  castCharm(target){
   if(!this.isCharmCaster()||!charmEligible(this,target)||this.charmGrace>0)return false;
   target.charmedBy=this;
   target.charmTimer=rnd(1.05,1.55);
   target.charmOrbitDir=Math.random()<.5?-1:1;
   target.charmOrbitPhase=Math.atan2(target.y-this.y,target.x-this.x);
   target.xDashCooldown=Math.max(target.xDashCooldown||0,.36);
   target.charmMarkPulse=1.4;
   this.charmCount++;
   this.charmCastPulse=1.8;
   this.omega*=.987;this.spin=this.omega;
   scheduleCharm(this,false);
   emit(this.x,this.y,this.c.primary,42,.92,'streak');
   emit(this.x,this.y,this.c.secondary,24,.72,'streak');
   emit(target.x,target.y,this.c.accent,30,.74,'streak');
   emit(target.x,target.y,this.c.primary,14,.52);
   wave(this.x,this.y,this.c.secondary,72);
   wave(this.x,this.y,this.c.primary,52);
   wave(target.x,target.y,this.c.primary,58);
   shake=Math.max(shake,5.4);flash=Math.max(flash,.20);
   addLog(`${this.c.name} 發動「月歌魅惑」：月波與歌聲絲帶纏繞 ${target.c.name}，迫使其進入魅惑軌道！`);
   return true;
  }
  updateCharmedMotion(dt){
   const source=this.charmedBy;
   if(!combatReady(source)||this.phaseInvisible||this.skyJumpGhost){
    clearCharm(this,'脫離控制');
    return false;
   }
   this.charmTimer-=dt;
   this.charmOrbitPhase+=dt*(2.0+.35*this.charmOrbitDir)*this.charmOrbitDir;
   this.xDashCooldown=Math.max(this.xDashCooldown||0,.20);
   super.update(dt,null);
   if(this.phaseInvisible||this.skyJumpGhost){
    clearCharm(this,'進入不可鎖定狀態');
    return true;
   }

   const dx=source.x-this.x,dy=source.y-this.y,d=mag(dx,dy)||1;
   const nx=dx/d,ny=dy/d,tx=-ny*this.charmOrbitDir,ty=nx*this.charmOrbitDir;
   const desired=source.r+this.r+24;
   const radial=clamp((d-desired)*1.35,-44,82);
   const pull=34+Math.max(0,radial);
   const orbit=42+Math.min(24,d*.08);
   this.vx+=(nx*pull+tx*orbit)*dt;
   this.vy+=(ny*pull+ty*orbit)*dt;
   this.omega*=Math.exp(-.048*dt);this.spin=this.omega;
   this.tiltVel*=Math.exp(-.28*dt);
   const speed=mag(this.vx,this.vy),limit=172;
   if(speed>limit){this.vx=this.vx/speed*limit;this.vy=this.vy/speed*limit}
   if(Math.random()<dt*6)emit(this.x,this.y,source.c.primary,1,.24,'streak');
   if(this.charmTimer<=0||Math.abs(this.omega)<9||this.energy<12){
    clearCharm(this,'從月歌中清醒');
   }
   return true;
  }
  update(dt,opponent){
   this.charmCastPulse=Math.max(0,this.charmCastPulse-dt*1.7);
   this.charmMarkPulse=Math.max(0,this.charmMarkPulse-dt*1.35);
   this.charmReleasePulse=Math.max(0,this.charmReleasePulse-dt*1.8);
   this.charmGrace=Math.max(0,this.charmGrace-dt);
   if(this.charmedBy){
    this.updateCharmedMotion(dt);
    return;
   }

   super.update(dt,opponent?.phaseInvisible?null:opponent);
   if(!this.isCharmCaster()||this.out||this.burst||this.phaseInvisible||this.skyJumpGhost)return;
   if(this.energy<=25||Math.abs(this.omega)<15)return;
   this.charmCooldown-=dt;
   if(this.charmCooldown<=1.25&&Math.random()<dt*7){
    emit(this.x,this.y,Math.random()<.5?this.c.primary:this.c.accent,1,.20,'streak');
   }
   if(this.charmCooldown<=0){
    const target=nearestCharmTarget(this,opponent);
    if(target&&mag(target.x-this.x,target.y-this.y)<=outerR*1.05)this.castCharm(target);
   }
  }
  bladeCount(){return this.c.shape==='enchantressSiren'?5:super.bladeCount()}
  bladeRadius(i){
   if(this.c.shape==='enchantressSiren'){
    const profile=[1.08,.79,.96,.74,.91];
    return this.r*profile[i%profile.length];
   }
   return super.bladeRadius(i);
  }
  draw(){
   super.draw();
   if(this.out||this.burst)return;

   const charmed=!!this.charmedBy,caster=this.isCharmCaster();
   if(!charmed&&!caster&&!this.charmReleasePulse&&!this.charmMarkPulse)return;
   const pulse=.5+.5*Math.sin(time*4.2);
   const charmedColor=this.charmedBy?.c?.primary||'#ff68c8';

   if(caster){
    drawSirenAura(this,pulse);
    if(this.charmCastPulse>0){
     const cast=clamp(this.charmCastPulse,0,1.8)/1.8;
     ctx.save();ctx.translate(this.x,this.y);
     ctx.globalCompositeOperation='screen';
     ctx.shadowBlur=18;ctx.shadowColor=this.c.accent;
     for(let i=0;i<2;i++){
      ctx.strokeStyle=alpha(i?this.c.primary:this.c.accent,(.15+.24*cast)*(1-i*.2));
      ctx.lineWidth=2.2-i*.5;
      ctx.beginPath();ctx.arc(0,0,this.r*(1.42+i*.22+(1-cast)*.62),0,Math.PI*2);ctx.stroke();
     }
     ctx.restore();
    }
   }

   if(charmed){
    drawCharmRibbon(this.charmedBy,this,charmedColor);
    drawCharmedSeal(this,this.charmedBy?.c?.primary||charmedColor);
   }

   if(this.charmMarkPulse>0){
    const mark=clamp(this.charmMarkPulse,0,1.4)/1.4;
    ctx.save();ctx.translate(this.x,this.y);ctx.globalCompositeOperation='screen';
    ctx.strokeStyle=alpha('#fff0fb',.36*mark);ctx.shadowBlur=18;ctx.shadowColor=charmedColor;
    ctx.lineWidth=2.4;ctx.beginPath();ctx.arc(0,0,this.r*(1.1+(1-mark)*.75),0,Math.PI*2);ctx.stroke();ctx.restore();
   }

   if(this.charmReleasePulse>0){
    const release=clamp(this.charmReleasePulse,0,1);
    ctx.save();ctx.translate(this.x,this.y);ctx.globalCompositeOperation='screen';
    ctx.strokeStyle=alpha('#fff0fb',.26*release);ctx.shadowBlur=14;ctx.shadowColor='#ff68c8';
    ctx.lineWidth=1.8;ctx.beginPath();ctx.arc(0,0,this.r*(1.2+.92*(1-release)),0,Math.PI*2);ctx.stroke();ctx.restore();
   }
  }
 };

 // 被魅惑者與施術者之間暫時不產生碰撞，因此目標不能反擊，施術者也不能趁控制期間直接撞擊目標。
 const previousCollide=collide;
 collide=function(a,b){
  if(a?.charmGrace>0||b?.charmGrace>0){
   previousCollide(a,b);
   return;
  }
  if(a?.charmedBy===b||b?.charmedBy===a)return;
  previousCollide(a,b);
 };

 const style=document.createElement('style');
 style.textContent='.charm-ability{border-color:#ff68c855;background:linear-gradient(135deg,#ff68c812,#744cff18);box-shadow:inset 0 0 22px #ff68c80c}';
 document.head.appendChild(style);

 cfg.p2={...ENCHANTRESS_SIREN,preset:CHARM_KEY};
 renderPanel('p1');renderPanel('p2');
 document.querySelector('#n1').textContent=cfg.p1.name;
 document.querySelector('#n2').textContent=cfg.p2.name;
 document.querySelector('#log').textContent='「魅月海妖」特效已強化：施法前會凝聚月波，魅惑時產生歌聲絲帶、旋轉封印與月牙光點。';
})();