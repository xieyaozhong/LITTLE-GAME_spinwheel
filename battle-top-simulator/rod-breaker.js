/* Rod Breaker V3: reliable Wizard Rod counter with predictive hunt and spin-seal marks */
(() => {
 const KEY='rodBreaker';
 const PRESET={
  label:'[COUNTER] 弒杖獠牙｜Rod Breaker',
  name:'弒杖獠牙',englishName:'Rod Breaker',
  combo:'3-60 Low Rush',
  rank:'神杖獵殺・預判突進・三重獠印封轉',
  tier:'COUNTER',type:'attack',
  a:96,d:76,s:74,w:93,b:86,
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
 const targetPriority=target=>isWizard(target)?1.62:isStamina(target)?1.18:1;
 const nearestEnemy=(source,preferred)=>{
  if(validEnemy(source,preferred))return preferred;
  let best=null,bestScore=Infinity;
  (Array.isArray(tops)?tops:[]).forEach(target=>{
   if(!validEnemy(source,target))return;
   const d=mag(target.x-source.x,target.y-source.y);
   const score=d/targetPriority(target);
   if(score<bestScore){best=target;bestScore=score}
  });
  return best;
 };

 const previousRenderPanel=renderPanel;
 renderPanel=function(id){
  previousRenderPanel(id);
  const host=document.querySelector('#'+id),c=cfg[id];
  if(!host||!c?.rodBreakerEngine)return;
  const combo=host.querySelector('.combo-box');
  const ability=document.createElement('div');
  ability.className='combo-box rod-breaker-ability';
  ability.innerHTML='<strong>神杖狩獵・三重獠印封轉</strong>弒杖獠牙會預判高轉速敵人的下一個位置並貼地突進。獠襲命中神杖時一次留下兩層獠印；獠印會暫時破壞中心穩定與續轉，三層後觸發「斷軸咬殺」。<div class="combo-tags"><span>預判追擊</span><span>神杖雙獠印</span><span>中心封鎖</span></div>';
  if(combo)combo.insertAdjacentElement('afterend',ability);else host.appendChild(ability);
 };

 const PreviousTop=Top;
 Top=class Top extends PreviousTop{
  constructor(index,data){
   super(index,data);
   this.breakerCharge=0;
   this.breakerLungeCooldown=.42;
   this.breakerImpactCooldown=0;
   this.breakerLungeWindow=0;
   this.breakerTarget=null;
   this.breakerFx=0;
   this.breakerBiteFx=0;
   this.breakerHitFx=0;
   this.breakerMarkCount=0;
   this.breakerMarkTimer=0;
   this.breakerMarkColor='';
   this.breakerSealTimer=0;
   this.breakerSealStacks=0;
   this.breakerSealPulse=0;
   this.breakerCoreBreak=0;
  }
  applyBreakerSeal(dt){
   if((this.breakerSealTimer||0)<=0||!active(this))return;
   const stacks=clamp(this.breakerSealStacks||0,1,3),wizard=isWizard(this),sign=Math.sign(this.omega)||1;
   this.breakerSealTimer=Math.max(0,this.breakerSealTimer-dt);
   this.breakerSealPulse=Math.max(0,(this.breakerSealPulse||0)-dt*1.35);
   this.breakerCoreBreak=Math.max(0,(this.breakerCoreBreak||0)-dt);

   const lossPerSecond=(wizard?.72:.34)*stacks*(this.breakerCoreBreak>0?1.35:1);
   this.omega-=sign*Math.min(Math.abs(this.omega),lossPerSecond*dt);
   this.spin=this.omega;
   const stability=Math.max(.72,this.tip?.stability||1);
   this.tiltVel+=sign*(wizard?.026:.012)*stacks*dt/stability;

   if(wizard){
    const cx=W/2,cy=H/2,dx=this.x-cx,dy=this.y-cy,d=mag(dx,dy)||1;
    if(d<innerR*.46){
     const pressure=(8+4.5*stacks)*(1-d/(innerR*.46));
     this.vx+=dx/d*pressure*dt;
     this.vy+=dy/d*pressure*dt;
    }
   }
   if(this.breakerSealTimer<=0){this.breakerSealStacks=0;this.breakerCoreBreak=0}
  }
  update(dt,opponent){
   super.update(dt,opponent);
   this.applyBreakerSeal(dt);
   this.breakerLungeCooldown=Math.max(0,(this.breakerLungeCooldown||0)-dt);
   this.breakerImpactCooldown=Math.max(0,(this.breakerImpactCooldown||0)-dt);
   this.breakerLungeWindow=Math.max(0,(this.breakerLungeWindow||0)-dt);
   this.breakerFx=Math.max(0,(this.breakerFx||0)-dt*1.75);
   this.breakerBiteFx=Math.max(0,(this.breakerBiteFx||0)-dt*2.0);
   this.breakerHitFx=Math.max(0,(this.breakerHitFx||0)-dt*2.6);
   this.breakerMarkTimer=Math.max(0,(this.breakerMarkTimer||0)-dt);
   if(this.breakerMarkTimer<=0)this.breakerMarkCount=0;
   if(!isBreaker(this)||!active(this))return;

   const target=nearestEnemy(this,opponent);
   this.breakerTarget=target;
   if(!target)return;

   const rawDx=target.x-this.x,rawDy=target.y-this.y,rawD=mag(rawDx,rawDy)||1;
   const wizard=isWizard(target),priority=targetPriority(target);
   const leadTime=clamp(rawD/(wizard?310:360),.06,wizard?.32:.24);
   const aimX=target.x+(target.vx||0)*leadTime;
   const aimY=target.y+(target.vy||0)*leadTime;
   const dx=aimX-this.x,dy=aimY-this.y,d=mag(dx,dy)||1,nx=dx/d,ny=dy/d;
   const spinRatio=clamp(Math.abs(this.omega)/Math.max(1,Math.abs(this.omega0||this.omega||1)),0,1);
   const enemySpin=clamp(Math.abs(target.omega)/Math.max(1,Math.abs(target.omega0||target.omega||1)),0,1);
   const marked=clamp((target.breakerMarkCount||0)/3,0,1);

   this.breakerCharge=clamp((this.breakerCharge||0)+dt*(.38+.30*spinRatio+.22*enemySpin+.10*marked)*priority,0,1);

   const pursuit=(18+this.c.a*.13)*priority*(.76+.24*this.breakerCharge);
   this.vx+=nx*pursuit*dt;
   this.vy+=ny*pursuit*dt;

   if(wizard&&rawD<this.r+target.r+54&&this.breakerCharge>.58){
    const directX=rawDx/rawD,directY=rawDy/rawD;
    const closing=(this.vx-(target.vx||0))*directX+(this.vy-(target.vy||0))*directY;
    if(closing<35){this.vx+=directX*24*dt;this.vy+=directY*24*dt}
    const tangentX=-directY,tangentY=directX,tangent=this.vx*tangentX+this.vy*tangentY;
    this.vx-=tangentX*tangent*.48*dt;
    this.vy-=tangentY*tangent*.48*dt;
   }

   const minRange=this.r+target.r+5;
   if(this.breakerCharge>=1&&this.breakerLungeCooldown<=0&&rawD>minRange&&rawD<innerR*.98){
    const lunge=(64+this.c.a*.30)*priority;
    this.vx=this.vx*.68+nx*lunge;
    this.vy=this.vy*.68+ny*lunge;
    this.omega*=wizard?.988:.976;this.spin=this.omega;
    this.tiltVel+=(Math.sign(this.omega)||1)*(wizard?.020:.030);
    this.breakerCharge=0;
    this.breakerLungeCooldown=wizard?.72:1.05;
    this.breakerLungeWindow=wizard?.66:.50;
    this.breakerFx=1;
    this.impactBoost=Math.max(this.impactBoost||0,wizard?42:25+(priority-1)*24);
    emit(this.x,this.y,this.c.primary,wizard?16:12,.58,'streak');
    wave(this.x,this.y,this.c.accent,wizard?38:32);
    if(performance.now()-lastZoneLog>780){
     addLog(`${this.c.name} 預判${wizard?'神杖':'高轉速敵人'}重心，發動「獠牙突進」！`);
     lastZoneLog=performance.now();
    }
   }
  }
  bladeCount(){return this.c.shape==='breaker'?3:super.bladeCount()}
  bladeRadius(i){
   if(this.c.shape==='breaker'){
    const profile=[1.29,.84,.70,.96];
    return this.r*profile[i%4]*(i%8<4?1:.968);
   }
   return super.bladeRadius(i);
  }
  drawBreakerFx(){
   if(isBreaker(this)&&active(this)){
    const charge=clamp(this.breakerCharge||0,0,1),lunge=clamp(this.breakerFx||0,0,1);
    if(charge>.03||lunge>0){
     const pulse=.5+.5*Math.sin(time*6.2);
     ctx.save();ctx.translate(this.x,this.y);ctx.globalCompositeOperation='screen';ctx.rotate(this.angle||0);
     ctx.strokeStyle=alpha(this.c.accent,.10+charge*.32+lunge*.30);ctx.lineWidth=1+charge*1.7+lunge*1.9;ctx.shadowBlur=7+charge*11;ctx.shadowColor=this.c.accent;
     for(let i=0;i<3;i++){
      const a=i*Math.PI*2/3;ctx.save();ctx.rotate(a);
      const reach=this.r*(1.22+charge*.43+lunge*.25);
      ctx.beginPath();ctx.moveTo(this.r*.62,-this.r*.17);ctx.lineTo(reach,0);ctx.lineTo(this.r*.62,this.r*.17);ctx.stroke();ctx.restore();
     }
     ctx.setLineDash([4,6]);ctx.beginPath();ctx.arc(0,0,this.r*(1.31+charge*.19+pulse*.025),0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);ctx.restore();
    }
   }

   const hit=clamp(this.breakerHitFx||0,0,1),bite=clamp(this.breakerBiteFx||0,0,1),seal=clamp(this.breakerSealPulse||0,0,1),marks=clamp(this.breakerMarkCount||0,0,3);
   if(hit<=0&&bite<=0&&seal<=0&&marks<=0)return;
   const color=this.breakerMarkColor||'#7cecff';
   ctx.save();ctx.translate(this.x,this.y);ctx.globalCompositeOperation='screen';ctx.shadowColor=color;ctx.shadowBlur=10;
   if(marks>0){
    for(let i=0;i<marks;i++){
     const a=-Math.PI/2+(i-1)*.48;
     ctx.strokeStyle=alpha(color,.20+.14*Math.sin(time*5+i));ctx.lineWidth=1.5;
     ctx.beginPath();ctx.moveTo(Math.cos(a-.12)*this.r*1.42,Math.sin(a-.12)*this.r*1.42);ctx.lineTo(Math.cos(a)*this.r*1.72,Math.sin(a)*this.r*1.72);ctx.lineTo(Math.cos(a+.12)*this.r*1.42,Math.sin(a+.12)*this.r*1.42);ctx.stroke();
    }
   }
   if(seal>0){
    ctx.strokeStyle=alpha('#8beeff',seal*.38);ctx.lineWidth=1+seal*1.8;ctx.setLineDash([3,5]);
    ctx.beginPath();ctx.arc(0,0,this.r*(1.14+(1-seal)*.38),0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
   }
   if(hit>0){
    ctx.strokeStyle=alpha(color,hit*.58);ctx.lineWidth=1+hit*2.6;
    for(let i=0;i<2;i++){ctx.beginPath();ctx.arc(0,0,this.r*(1.05+(1-hit)*(.38+i*.22)),0,Math.PI*2);ctx.stroke()}
   }
   if(bite>0){
    ctx.strokeStyle=alpha('#fff2d2',bite*.80);ctx.lineWidth=2+bite*3.5;
    ctx.beginPath();ctx.arc(0,0,this.r*(1.18+(1-bite)*.35),-.92,.92);ctx.stroke();
    ctx.beginPath();ctx.arc(0,0,this.r*(1.18+(1-bite)*.35),Math.PI-.92,Math.PI+.92);ctx.stroke();
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
   const lunging=(counter.breakerLungeWindow||0)>0,wizard=isWizard(target);
   const force=clamp(closing/165,.45,1.42);
   if(!lunging&&force<(wizard?.62:.72))return;

   const priority=targetPriority(target);
   const attackScale=(lunging?1:.64)*priority;
   const spinCut=((lunging?.026:.014)+(lunging?.023:.012)*force)*attackScale;
   target.omega*=Math.max(wizard?.84:.88,1-spinCut);target.spin=target.omega;
   target.tiltVel+=(Math.sign(target.omega)||1)*(.10+.115*force)*attackScale/Math.max(.72,target.tip?.stability||1);
   target.lift=clamp((target.lift||0)+(.030+.050*force)*attackScale,0,1);
   target.vx+=dirX*(15+25*force)*attackScale;
   target.vy+=dirY*(15+25*force)*attackScale;
   target.burstMeter=(target.burstMeter||0)+(.85+1.40*force)*attackScale;

   const markGain=wizard&&lunging?2:1;
   target.breakerMarkCount=Math.min(3,(target.breakerMarkCount||0)+markGain);
   target.breakerMarkTimer=wizard?4.4:3.3;
   target.breakerMarkColor=counter.c.accent;
   target.breakerHitFx=1;
   target.breakerSealStacks=Math.min(3,(target.breakerSealStacks||0)+(wizard&&lunging?2:1));
   target.breakerSealTimer=Math.max(target.breakerSealTimer||0,wizard?4.2:2.5);
   target.breakerSealPulse=1;

   counter.omega*=wizard?(lunging?.993:.997):(lunging?.985:.992);counter.spin=counter.omega;
   counter.tiltVel+=(Math.sign(counter.omega)||1)*(lunging?.015:.009);
   counter.breakerImpactCooldown=lunging?(wizard?.20:.28):.40;
   counter.breakerLungeWindow=0;

   const cx=(counter.x+target.x)/2,cy=(counter.y+target.y)/2;
   emit(cx,cy,counter.c.accent,lunging?(wizard?24:18):10,.70,'streak');
   emit(cx,cy,counter.c.primary,lunging?12:6,.52);
   wave(cx,cy,counter.c.accent,lunging?(wizard?52:44):28);
   shake=Math.max(shake,lunging?(wizard?5.2:4.2):2.0);
   flash=Math.max(flash,lunging?(wizard?.13:.10):.045);

   if(target.breakerMarkCount>=3){
    target.breakerMarkCount=0;target.breakerMarkTimer=0;target.breakerBiteFx=1;
    const finisher=wizard?1.62:isStamina(target)?1.16:1;
    target.omega*=1-.068*finisher;target.spin=target.omega;
    target.energy=Math.max(0,(target.energy||0)-(wizard?1.05:.42)*finisher);
    target.tiltVel+=(Math.sign(target.omega)||1)*.105*finisher/Math.max(.72,target.tip?.stability||1);
    target.burstMeter=(target.burstMeter||0)+1.65*finisher;
    target.breakerSealStacks=3;
    target.breakerSealTimer=wizard?5.0:3.2;
    target.breakerCoreBreak=wizard?1.65:.75;
    target.breakerSealPulse=1;
    counter.omega*=wizard?.997:.992;counter.spin=counter.omega;
    emit(target.x,target.y,'#fff2d2',wizard?28:18,.78,'streak');wave(target.x,target.y,counter.c.primary,wizard?64:52);
    shake=Math.max(shake,wizard?7.2:5.8);flash=Math.max(flash,wizard?.18:.14);
    addLog(`${counter.c.name} 集滿三重獠印，發動「斷軸咬殺」${wizard?'，封鎖神杖中心續轉！':'！'}`);
   }else if(wizard&&lunging&&performance.now()-lastZoneLog>720){
    addLog(`${counter.c.name} 咬住神杖重心，一次刻下 ${markGain} 層獠印。`);
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
 document.querySelector('#log').textContent='弒杖獠牙 V3 已就緒：預判神杖重心、雙層獠印命中、封鎖中心續轉，再以斷軸咬殺完成反耐力終結。';
 document.documentElement.dataset.rodBreaker='v3';
})();