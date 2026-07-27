/* Rod Breaker V2: anti-stamina pursuit, fang lunge, and three-mark spin break */
(() => {
 const KEY='rodBreaker';
 const PRESET={
  label:'[COUNTER] 弒杖獠牙｜Rod Breaker',
  name:'弒杖獠牙',englishName:'Rod Breaker',
  combo:'3-60 Low Rush',
  rank:'高轉速獵殺・三重獠印斷轉',
  tier:'COUNTER',type:'attack',
  a:94,d:75,s:72,w:92,b:84,
  spin:'R',shape:'breaker',counterTarget:'wizardRod',rodBreakerEngine:true,
  primary:'#b8142f',secondary:'#151923',accent:'#7cecff',metal:'#d7dde4'
 };
 metaPresets[KEY]=PRESET;

 const active=top=>!!top&&!top.out&&!top.burst&&!top.skyStaminaDefeated&&!top.skyEnergyDepletedLatch&&(top.energy||0)>0;
 const teamOf=top=>top?.teamIndex??(top?.index?1:0);
 const isBreaker=top=>!!top?.c?.rodBreakerEngine||top?.c?.counterTarget==='wizardRod';
 const isWizard=top=>!!top?.c&&(top.c.shape==='rod'||/wizard\s*rod|神杖/i.test(`${top.c.name||''} ${top.c.englishName||''}`));
 const isStamina=top=>top?.c?.type==='stamina';
 const validEnemy=(source,target)=>active(target)&&source!==target&&teamOf(source)!==teamOf(target)&&!target.phaseInvisible;
 const nearestEnemy=(source,preferred)=>{
  if(validEnemy(source,preferred))return preferred;
  let best=null,bestD=Infinity;
  (Array.isArray(tops)?tops:[]).forEach(target=>{
   if(!validEnemy(source,target))return;
   const d=mag(target.x-source.x,target.y-source.y);
   if(d<bestD){best=target;bestD=d}
  });
  return best;
 };
 const targetPriority=target=>isWizard(target)?1.32:isStamina(target)?1.14:1;

 const previousRenderPanel=renderPanel;
 renderPanel=function(id){
  previousRenderPanel(id);
  const host=document.querySelector('#'+id),c=cfg[id];
  if(!host||!c?.rodBreakerEngine)return;
  const combo=host.querySelector('.combo-box');
  const ability=document.createElement('div');
  ability.className='combo-box rod-breaker-ability';
  ability.innerHTML='<strong>三重獠印・斷轉咬合</strong>弒杖獠牙會鎖定高轉速敵人，蓄滿後發動貼地獠襲。每次有效重擊留下獠印；三層獠印會觸發一次斷轉咬合。對神杖效果較強，但失誤突進會消耗自身轉速。<div class="combo-tags"><span>高轉速鎖定</span><span>三層獠印</span><span>斷轉咬合</span></div>';
  if(combo)combo.insertAdjacentElement('afterend',ability);else host.appendChild(ability);
 };

 const PreviousTop=Top;
 Top=class Top extends PreviousTop{
  constructor(index,data){
   super(index,data);
   this.breakerCharge=0;
   this.breakerLungeCooldown=.55;
   this.breakerImpactCooldown=0;
   this.breakerLungeWindow=0;
   this.breakerTarget=null;
   this.breakerFx=0;
   this.breakerBiteFx=0;
   this.breakerHitFx=0;
   this.breakerMarkCount=0;
   this.breakerMarkTimer=0;
   this.breakerMarkColor='';
  }
  update(dt,opponent){
   super.update(dt,opponent);
   this.breakerLungeCooldown=Math.max(0,(this.breakerLungeCooldown||0)-dt);
   this.breakerImpactCooldown=Math.max(0,(this.breakerImpactCooldown||0)-dt);
   this.breakerLungeWindow=Math.max(0,(this.breakerLungeWindow||0)-dt);
   this.breakerFx=Math.max(0,(this.breakerFx||0)-dt*1.75);
   this.breakerBiteFx=Math.max(0,(this.breakerBiteFx||0)-dt*2.2);
   this.breakerHitFx=Math.max(0,(this.breakerHitFx||0)-dt*2.8);
   this.breakerMarkTimer=Math.max(0,(this.breakerMarkTimer||0)-dt);
   if(this.breakerMarkTimer<=0)this.breakerMarkCount=0;
   if(!isBreaker(this)||!active(this))return;

   const target=nearestEnemy(this,opponent);
   this.breakerTarget=target;
   if(!target)return;
   const dx=target.x-this.x,dy=target.y-this.y,d=mag(dx,dy)||1,nx=dx/d,ny=dy/d;
   const spinRatio=clamp(Math.abs(this.omega)/Math.max(1,Math.abs(this.omega0||this.omega||1)),0,1);
   const enemySpin=clamp(Math.abs(target.omega)/Math.max(1,Math.abs(target.omega0||target.omega||1)),0,1);
   const priority=targetPriority(target);

   this.breakerCharge=clamp((this.breakerCharge||0)+dt*(.34+.28*spinRatio+.18*enemySpin)*priority,0,1);

   const pursuit=(17+this.c.a*.12)*priority*(.78+.22*this.breakerCharge);
   this.vx+=nx*pursuit*dt;
   this.vy+=ny*pursuit*dt;

   const minRange=this.r+target.r+7;
   if(this.breakerCharge>=1&&this.breakerLungeCooldown<=0&&d>minRange&&d<innerR*.96){
    const lunge=(61+this.c.a*.28)*priority;
    this.vx=this.vx*.76+nx*lunge;
    this.vy=this.vy*.76+ny*lunge;
    this.omega*=.973;this.spin=this.omega;
    this.tiltVel+=(Math.sign(this.omega)||1)*.032;
    this.breakerCharge=0;
    this.breakerLungeCooldown=1.12;
    this.breakerLungeWindow=.48;
    this.breakerFx=1;
    this.impactBoost=Math.max(this.impactBoost||0,22+(priority-1)*28);
    emit(this.x,this.y,this.c.primary,12,.56,'streak');
    wave(this.x,this.y,this.c.accent,32);
    if(performance.now()-lastZoneLog>850){
     addLog(`${this.c.name} 鎖定高轉速重心，發動「獠牙突進」！`);
     lastZoneLog=performance.now();
    }
   }
  }
  bladeCount(){return this.c.shape==='breaker'?3:super.bladeCount()}
  bladeRadius(i){
   if(this.c.shape==='breaker'){
    const profile=[1.26,.82,.69,.94];
    return this.r*profile[i%4]*(i%8<4?1:.965);
   }
   return super.bladeRadius(i);
  }
  drawBreakerFx(){
   if(isBreaker(this)&&active(this)){
    const charge=clamp(this.breakerCharge||0,0,1),lunge=clamp(this.breakerFx||0,0,1);
    if(charge>.03||lunge>0){
     const pulse=.5+.5*Math.sin(time*6.2);
     ctx.save();ctx.translate(this.x,this.y);ctx.globalCompositeOperation='screen';ctx.rotate(this.angle||0);
     ctx.strokeStyle=alpha(this.c.accent,.10+charge*.31+lunge*.28);ctx.lineWidth=1+charge*1.6+lunge*1.8;ctx.shadowBlur=7+charge*10;ctx.shadowColor=this.c.accent;
     for(let i=0;i<3;i++){
      const a=i*Math.PI*2/3;
      ctx.save();ctx.rotate(a);
      const reach=this.r*(1.20+charge*.40+lunge*.22);
      ctx.beginPath();ctx.moveTo(this.r*.64,-this.r*.16);ctx.lineTo(reach,0);ctx.lineTo(this.r*.64,this.r*.16);ctx.stroke();
      ctx.restore();
     }
     ctx.setLineDash([4,6]);ctx.beginPath();ctx.arc(0,0,this.r*(1.30+charge*.18+pulse*.025),0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
     ctx.restore();
    }
   }

   const hit=clamp(this.breakerHitFx||0,0,1),bite=clamp(this.breakerBiteFx||0,0,1),marks=clamp(this.breakerMarkCount||0,0,3);
   if(hit<=0&&bite<=0&&marks<=0)return;
   const color=this.breakerMarkColor||'#7cecff';
   ctx.save();ctx.translate(this.x,this.y);ctx.globalCompositeOperation='screen';ctx.shadowColor=color;ctx.shadowBlur=10;
   if(marks>0){
    for(let i=0;i<marks;i++){
     const a=-Math.PI/2+(i-1)*.48;
     ctx.strokeStyle=alpha(color,.18+.12*Math.sin(time*5+i));ctx.lineWidth=1.4;
     ctx.beginPath();ctx.moveTo(Math.cos(a-.12)*this.r*1.42,Math.sin(a-.12)*this.r*1.42);ctx.lineTo(Math.cos(a)*this.r*1.68,Math.sin(a)*this.r*1.68);ctx.lineTo(Math.cos(a+.12)*this.r*1.42,Math.sin(a+.12)*this.r*1.42);ctx.stroke();
    }
   }
   if(hit>0){
    ctx.strokeStyle=alpha(color,hit*.56);ctx.lineWidth=1+hit*2.5;
    for(let i=0;i<2;i++){ctx.beginPath();ctx.arc(0,0,this.r*(1.05+(1-hit)*(.38+i*.22)),0,Math.PI*2);ctx.stroke()}
   }
   if(bite>0){
    ctx.strokeStyle=alpha('#fff2d2',bite*.75);ctx.lineWidth=2+bite*3.2;
    ctx.beginPath();ctx.arc(0,0,this.r*(1.18+(1-bite)*.32),-.90,.90);ctx.stroke();
    ctx.beginPath();ctx.arc(0,0,this.r*(1.18+(1-bite)*.32),Math.PI-.90,Math.PI+.90);ctx.stroke();
   }
   ctx.restore();
  }
  draw(){super.draw();this.drawBreakerFx()}
 };

 const physicalCollide=collide;
 collide=function(a,b){
  if(a.out||b.out||a.burst||b.burst)return;
  const dx=b.x-a.x,dy=b.y-a.y,d=mag(dx,dy),min=a.r+b.r;
  if(!d||d>=min){physicalCollide(a,b);return}
  const nx=dx/d,ny=dy/d;
  const closing=-((b.vx-a.vx)*nx+(b.vy-a.vy)*ny);
  physicalCollide(a,b);
  if(closing<=0)return;

  function applyFangHit(counter,target,dirX,dirY){
   if(!isBreaker(counter)||!validEnemy(counter,target)||counter.breakerImpactCooldown>0)return;
   const lunging=(counter.breakerLungeWindow||0)>0;
   const force=clamp(closing/170,.45,1.35);
   if(!lunging&&force<.72)return;

   const priority=targetPriority(target);
   const attackScale=(lunging?1:.66)*priority;
   const spinCut=(.018+.017*force)*attackScale;
   target.omega*=Math.max(.89,1-spinCut);target.spin=target.omega;
   target.tiltVel+=(Math.sign(target.omega)||1)*(.095+.105*force)*attackScale/Math.max(.72,target.tip?.stability||1);
   target.lift=clamp((target.lift||0)+(.025+.045*force)*attackScale,0,1);
   target.vx+=dirX*(13+22*force)*attackScale;
   target.vy+=dirY*(13+22*force)*attackScale;
   target.burstMeter=(target.burstMeter||0)+(.7+1.25*force)*attackScale;

   target.breakerMarkCount=Math.min(3,(target.breakerMarkCount||0)+1);
   target.breakerMarkTimer=3.2;
   target.breakerMarkColor=counter.c.accent;
   target.breakerHitFx=1;

   counter.omega*=lunging?.985:.992;counter.spin=counter.omega;
   counter.tiltVel+=(Math.sign(counter.omega)||1)*(lunging?.018:.010);
   counter.breakerImpactCooldown=lunging?.28:.42;
   counter.breakerLungeWindow=0;

   const cx=(counter.x+target.x)/2,cy=(counter.y+target.y)/2;
   emit(cx,cy,counter.c.accent,lunging?18:10,.68,'streak');
   emit(cx,cy,counter.c.primary,lunging?10:6,.50);
   wave(cx,cy,counter.c.accent,lunging?44:28);
   shake=Math.max(shake,lunging?4.2:2.0);
   flash=Math.max(flash,lunging?.10:.045);

   if(target.breakerMarkCount>=3){
    target.breakerMarkCount=0;target.breakerMarkTimer=0;target.breakerBiteFx=1;
    const finisher=isWizard(target)?1.26:isStamina(target)?1.12:1;
    target.omega*=1-.045*finisher;target.spin=target.omega;
    target.energy=Math.max(0,(target.energy||0)-.34*finisher);
    target.tiltVel+=(Math.sign(target.omega)||1)*.075*finisher/Math.max(.72,target.tip?.stability||1);
    target.burstMeter=(target.burstMeter||0)+1.15*finisher;
    counter.omega*=.991;counter.spin=counter.omega;
    emit(target.x,target.y,'#fff2d2',18,.72,'streak');wave(target.x,target.y,counter.c.primary,52);
    shake=Math.max(shake,5.8);flash=Math.max(flash,.14);
    addLog(`${counter.c.name} 集滿三重獠印，發動「斷轉咬合」！`);
   }else if(isWizard(target)&&lunging&&performance.now()-lastZoneLog>850){
    addLog(`${counter.c.name} 的獠刃咬住神杖，留下第 ${target.breakerMarkCount} 層獠印。`);
    lastZoneLog=performance.now();
   }
  }

  applyFangHit(a,b,nx,ny);
  applyFangHit(b,a,-nx,-ny);
 };

 cfg.p2={...PRESET,preset:KEY};
 renderPanel('p1');renderPanel('p2');
 document.querySelector('#n1').textContent=cfg.p1.name;
 document.querySelector('#n2').textContent=cfg.p2.name;
 document.querySelector('#log').textContent='弒杖獠牙已就緒：鎖定高轉速敵人，以獠牙突進累積三重獠印，再以斷轉咬合破壞角速度與平衡。';
 document.documentElement.dataset.rodBreaker='v2';
})();