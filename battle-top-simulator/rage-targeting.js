/* Bloodrage Berserker V5 add-on: health-weighted skills with counterplay and recovery windows */
(() => {
 const isRager=top=>!!top?.c?.rageEngine;
 const teamOf=top=>top?.teamIndex??(top?.index?1:0);
 const rageOf=top=>{
  if(!isRager(top))return 0;
  const missing=clamp(1-clamp(top.energy,0,100)/100,0,1);
  return Math.pow(missing,1.12);
 };
 const stageOf=top=>{
  const energy=clamp(top?.energy??100,0,100);
  return energy<=20?3:energy<=40?2:energy<=65?1:0;
 };
 const attackOf=top=>{
  const base=clamp(top?.c?.a??0,0,100),rage=rageOf(top);
  return clamp(base+rage*(72+22*rage),base,200);
 };
 const validEnemy=(source,target)=>!!target&&source!==target&&teamOf(source)!==teamOf(target)&&!target.out&&!target.burst&&!target.phaseInvisible&&!target.skyJumpGhost&&target.energy>0;

 function clampAimPoint(point,radius=outerR*.78){
  const cx=W/2,cy=H/2,dx=point.x-cx,dy=point.y-cy,d=mag(dx,dy)||1;
  if(d<=radius)return point;
  return {x:cx+dx/d*radius,y:cy+dy/d*radius};
 }

 function chooseTarget(source,preferred,current){
  if(validEnemy(source,current))return current;
  let best=null,bestScore=Infinity;
  tops.forEach(target=>{
   if(!validEnemy(source,target))return;
   const d=mag(target.x-source.x,target.y-source.y);
   const vulnerable=clamp(100-(target.energy||0),0,100);
   const speed=mag(target.vx||0,target.vy||0);
   let score=d-vulnerable*.20+speed*.035;
   if(target===preferred)score-=30;
   if(target.c?.splitTop||target.splitPart)score+=8;
   if(score<bestScore){best=target;bestScore=score}
  });
  return best;
 }

 function inheritedTarget(source,preferred){
  if(validEnemy(source,preferred))return preferred;
  let best=null,bestDistance=Infinity;
  tops.forEach(target=>{
   if(!validEnemy(source,target))return;
   const distance=mag(target.x-source.x,target.y-source.y);
   if(distance<bestDistance){best=target;bestDistance=distance}
  });
  return best;
 }

 function nextSkillDelay(top){
  const rage=rageOf(top);
  return clamp(rnd(4.25,7.05)-rage*1.30,2.90,7.05);
 }

 function huntChance(top){
  const hp=clamp(top.energy,0,100);
  let chance=hp>70?.72:hp>45?.58:hp>25?.42:.25;
  if(top.rageLastSkill==='hunt')chance-=.12;
  if(top.rageLastSkill==='smash')chance+=.10;
  return clamp(chance,.16,.82);
 }

 function neutralizeInheritedChase(top,dt,preferred){
  const rage=rageOf(top);
  if(rage<=.02)return;
  const target=inheritedTarget(top,preferred);
  if(!target)return;
  const dx=target.x-top.x,dy=target.y-top.y,d=mag(dx,dy)||1;
  const nx=dx/d,ny=dy/d,sign=Math.sign(top.omega)||1,tx=-ny*sign,ty=nx*sign;
  const attack=attackOf(top),overcap=Math.max(0,attack-100);
  const chase=26+rage*(40+attack*.22)+overcap*.10;
  const weave=11+rage*28;
  const acceleration=1+dt*(.05+rage*.34+overcap*.0012);
  top.vx-=(nx*chase+tx*weave)*dt*acceleration;
  top.vy-=(ny*chase+ty*weave)*dt*acceleration;
 }

 function defenderScale(victim,aegisReady=false){
  let scale=1;
  const type=victim?.c?.type;
  if(type==='defense')scale*=.80;
  else if(type==='stamina')scale*=.88;
  if(victim?.splitPart)scale*=.88;
  if(victim?.twinInheritanceMode==='guardian')scale*=.76;
  if(victim?.morphMode==='aegis'||aegisReady)scale*=.68;
  return clamp(scale,.46,1);
 }

 function enhancePanel(id){
  const host=document.querySelector('#'+id),c=cfg[id];
  if(!host||!c?.rageEngine)return;
  const ability=host.querySelector('.rage-ability');
  if(!ability)return;
  ability.innerHTML='<strong>血怒雙技・攻防往返</strong>狂戰士會依剩餘能量不定期選擇血獵索敵或破滅重擊。重擊具有清楚蓄力與技能後疲勞，能被閃避、魅惑或強碰撞打斷；防禦型、雙生守核與玄甲形態能降低重擊傷害。<div class="combo-tags"><span>蓄力可反制</span><span>命中不再雙算</span><span>技能後疲勞</span><span>防禦互動</span></div>';
 }
 const previousRenderPanel=renderPanel;
 renderPanel=function(id){previousRenderPanel(id);enhancePanel(id)};

 const PreviousTop=Top;
 Top=class Top extends PreviousTop{
  constructor(index,data){
   super(index,data);
   this.rageSkillState='idle';
   this.rageSkillCooldown=data.rageEngine?rnd(3.15,5.15):999;
   this.rageSkillTimer=0;
   this.rageSkillPulse=0;
   this.rageSkillTarget=null;
   this.rageLeadPoint=null;
   this.rageLastSkill='';
   this.rageHuntBurstCooldown=0;
   this.rageSmashPower=1;
   this.rageSmashHitWindow=0;
   this.rageSmashHit=false;
   this.rageRecoveryTimer=0;
   this.rageRecoveryPulse=0;
   this.rageChargeInterrupted=false;
  }
  selectRageSkill(preferred){
   const target=chooseTarget(this,preferred,null);
   if(!target)return false;
   this.rageSkillTarget=target;
   if(Math.random()<huntChance(this))this.beginRageHunt(target);
   else this.beginRageSmash(target);
   return true;
  }
  beginRageHunt(target){
   const rage=rageOf(this),stage=stageOf(this);
   this.rageSkillState='hunt';
   this.rageSkillTimer=rnd(1.45,1.90)+rage*.58;
   this.rageHuntBurstCooldown=.28;
   this.rageSkillPulse=1;
   this.rageLastSkill='hunt';
   this.rageSkillTarget=target;
   emit(this.x,this.y,this.c.primary,18+stage*5,.56+rage*.26,'streak');
   wave(this.x,this.y,this.c.secondary,42+rage*28);
   addLog(`${this.c.name} 啟動「血獵索敵」：短時間預判軌跡；索敵結束後會出現可反擊空窗。`);
  }
  beginRageSmash(target){
   const rage=rageOf(this),stage=stageOf(this);
   this.rageSkillState='smashCharge';
   this.rageSkillTimer=clamp(rnd(.48,.68)-rage*.06,.40,.68);
   this.rageSmashPower=1+rage*.42+stage*.06;
   this.rageSmashHitWindow=0;
   this.rageSmashHit=false;
   this.rageChargeInterrupted=false;
   this.rageSkillPulse=1;
   this.rageLastSkill='smash';
   this.rageSkillTarget=target;
   this.vx*=.82;this.vy*=.82;
   emit(this.x,this.y,this.c.accent,18+stage*6,.48+rage*.24);
   wave(this.x,this.y,this.c.primary,46+rage*34);
   addLog(`${this.c.name} 壓縮血怒，準備「破滅重擊」！蓄力期間可被閃避或強碰撞打斷。`);
  }
  finishRageSkill(missed=false,interrupted=false){
   const ended=this.rageSkillState;
   if(missed&&ended==='smashRush')addLog(`${this.c.name} 的「破滅重擊」落空，進入較長疲勞空窗。`);
   if(interrupted)addLog(`${this.c.name} 的血怒蓄力被強行打斷，暫時失去進攻節奏！`);
   this.rageSkillState='idle';
   this.rageSkillTimer=0;
   this.rageSmashHitWindow=0;
   this.rageSkillTarget=null;
   this.rageLeadPoint=null;
   const recovery=interrupted?1.05:(ended==='smashRush'?(missed?.95:.68):(ended==='hunt'?.42:.52));
   this.rageRecoveryTimer=Math.max(this.rageRecoveryTimer,recovery);
   this.rageRecoveryPulse=1;
   this.rageSkillCooldown=nextSkillDelay(this)+recovery*.55;
  }
  cancelRageSkillByControl(){
   if(this.rageSkillState==='idle')return;
   this.rageSkillState='idle';
   this.rageSkillTimer=0;
   this.rageSmashHitWindow=0;
   this.rageSkillTarget=null;
   this.rageLeadPoint=null;
   this.rageRecoveryTimer=Math.max(this.rageRecoveryTimer,.82);
   this.rageRecoveryPulse=1;
   this.rageSkillCooldown=Math.max(this.rageSkillCooldown,4.2);
   addLog(`${this.c.name} 的血怒技能受到控制干擾而中止，對手取得反擊時間。`);
  }
  updateRageHunt(dt,preferred){
   this.rageSkillTimer-=dt;
   this.rageHuntBurstCooldown=Math.max(0,this.rageHuntBurstCooldown-dt);
   const target=chooseTarget(this,preferred,this.rageSkillTarget);
   this.rageSkillTarget=target;
   if(!target||this.rageSkillTimer<=0){this.finishRageSkill(false);return}
   const rage=rageOf(this),stage=stageOf(this),attack=attackOf(this);
   const dx0=target.x-this.x,dy0=target.y-this.y,d0=mag(dx0,dy0)||1;
   const relativeSpeed=Math.max(105,mag((this.vx||0)-(target.vx||0),(this.vy||0)-(target.vy||0))+72);
   const leadTime=clamp(d0/relativeSpeed*.36,.06,.38)*(.74+rage*.46);
   const aim=clampAimPoint({x:target.x+(target.vx||0)*leadTime,y:target.y+(target.vy||0)*leadTime});
   this.rageLeadPoint=aim;
   let ax=aim.x-this.x,ay=aim.y-this.y,ad=mag(ax,ay)||1,nx=ax/ad,ny=ay/ad;
   const cx=W/2,cy=H/2,cdx=this.x-cx,cdy=this.y-cy,centreDistance=mag(cdx,cdy)||1;
   const edge=clamp((centreDistance-innerR*.76)/Math.max(1,outerR-innerR*.76),0,1);
   if(edge>0){
    const inwardX=-cdx/centreDistance,inwardY=-cdy/centreDistance,inwardMix=edge*(.25+rage*.18);
    nx=nx*(1-inwardMix)+inwardX*inwardMix;
    ny=ny*(1-inwardMix)+inwardY*inwardMix;
    const nd=mag(nx,ny)||1;nx/=nd;ny/=nd;
   }
   const desiredSpeed=clamp(176+attack*.42+rage*52,180,320);
   const turnRate=2.85+rage*4.35+stage*.54;
   const blend=clamp(dt*turnRate,0,.30);
   this.vx+=(nx*desiredSpeed-this.vx)*blend;
   this.vy+=(ny*desiredSpeed-this.vy)*blend;
   const speed=mag(this.vx,this.vy)||1,alignment=(this.vx/speed)*nx+(this.vy/speed)*ny;
   if(alignment>.82&&d0>this.r+target.r+28&&d0<innerR*1.42&&this.rageHuntBurstCooldown<=0){
    const impulse=17+rage*34+stage*4;
    this.vx+=nx*impulse;this.vy+=ny*impulse;
    this.rageHuntBurstCooldown=clamp(.94-rage*.16,.70,.94);
    this.rageSkillPulse=1;
    emit(this.x,this.y,this.c.primary,8+stage*3,.34+rage*.24,'streak');
   }
  }
  updateRageSmashCharge(dt,preferred){
   neutralizeInheritedChase(this,dt,preferred);
   this.rageSkillTimer-=dt;
   const target=chooseTarget(this,preferred,this.rageSkillTarget);
   this.rageSkillTarget=target;
   if(!target){this.finishRageSkill(false);return}
   const rage=rageOf(this),dx=target.x-this.x,dy=target.y-this.y,d=mag(dx,dy)||1;
   const desiredX=dx/d*(66+rage*28),desiredY=dy/d*(66+rage*28),blend=clamp(dt*2.55,0,.12);
   this.vx+=(desiredX-this.vx)*blend;
   this.vy+=(desiredY-this.vy)*blend;
   this.rageLeadPoint={x:target.x,y:target.y};
   if(this.rageSkillTimer<=0)this.launchRageSmash(target);
  }
  launchRageSmash(target){
   const rage=rageOf(this),stage=stageOf(this),attack=attackOf(this);
   const lead=clamp(.065+rage*.10,.065,.17);
   const aim=clampAimPoint({x:target.x+(target.vx||0)*lead,y:target.y+(target.vy||0)*lead},innerR*.92);
   const dx=aim.x-this.x,dy=aim.y-this.y,d=mag(dx,dy)||1;
   const speed=clamp(215+attack*.50+rage*48,235,350);
   this.rageSkillState='smashRush';
   this.rageSkillTimer=.46+rage*.14;
   this.rageSmashHitWindow=this.rageSkillTimer;
   this.rageLeadPoint=aim;
   this.vx=dx/d*speed;this.vy=dy/d*speed;
   this.impactBoost=Math.max(this.impactBoost||0,78+rage*52);
   this.energy=Math.max(0,this.energy-(2.2+rage*2.8));
   this.omega*=1-(.006+rage*.012);this.spin=this.omega;
   emit(this.x,this.y,this.c.secondary,28+stage*7,.82+rage*.32,'streak');
   wave(this.x,this.y,this.c.accent,62+rage*42);
   shake=Math.max(shake,5+rage*3);
  }
  updateRageSmashRush(dt){
   this.rageSkillTimer-=dt;
   this.rageSmashHitWindow=Math.max(0,this.rageSmashHitWindow-dt);
   this.rageSkillPulse=1;
   if(Math.random()<dt*(14+rageOf(this)*14))emit(this.x,this.y,this.c.secondary,1,.36+rageOf(this)*.22,'streak');
   if(this.rageSkillTimer<=0||this.rageSmashHitWindow<=0)this.finishRageSkill(!this.rageSmashHit);
  }
  update(dt,opponent){
   super.update(dt,opponent);
   this.rageSkillPulse=Math.max(0,this.rageSkillPulse-dt*1.8);
   this.rageRecoveryPulse=Math.max(0,this.rageRecoveryPulse-dt*1.5);
   this.rageRecoveryTimer=Math.max(0,this.rageRecoveryTimer-dt);
   if(!isRager(this)||this.out||this.burst)return;
   if(this.charmedBy){
    this.cancelRageSkillByControl();
    return;
   }
   if(this.phaseInvisible||this.skyJumpGhost)return;
   if(this.rageSkillState==='idle'){
    neutralizeInheritedChase(this,dt,opponent);
    this.rageSkillCooldown-=dt;
    if(this.rageRecoveryTimer>0){
     this.vx*=Math.exp(-.30*dt);this.vy*=Math.exp(-.30*dt);
     this.tiltVel+=.012*dt;
     return;
    }
    const ready=this.energy>10&&Math.abs(this.omega)>12&&chooseTarget(this,opponent,null);
    if(this.rageSkillCooldown<=0&&ready&&!this.selectRageSkill(opponent))this.rageSkillCooldown=.9;
    return;
   }
   if(this.rageSkillState==='hunt'){this.updateRageHunt(dt,opponent);return}
   if(this.rageSkillState==='smashCharge'){this.updateRageSmashCharge(dt,opponent);return}
   if(this.rageSkillState==='smashRush'){this.updateRageSmashRush(dt);return}
  }
  draw(){
   super.draw();
   if(!isRager(this)||this.out||this.burst)return;
   const recovering=this.rageSkillState==='idle'&&this.rageRecoveryTimer>0;
   if(this.rageSkillState==='idle'&&!recovering)return;
   const rage=rageOf(this),pulse=.5+.5*Math.sin(time*(this.rageSkillState==='hunt'?7.8:10.5));
   const target=this.rageSkillTarget;
   ctx.save();ctx.globalCompositeOperation='screen';
   if(recovering){
    ctx.translate(this.x,this.y);ctx.rotate(time*.55);
    ctx.strokeStyle=alpha('#ffcf9a',.22+.20*pulse);ctx.lineWidth=1.2;ctx.setLineDash([3,8]);
    ctx.beginPath();ctx.arc(0,0,this.r*(1.22+pulse*.05),0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
   }else if(this.rageSkillState==='hunt'&&validEnemy(this,target)&&this.rageLeadPoint){
    const rr=(target.r||this.r)*(1.30+pulse*.12);
    ctx.strokeStyle=alpha(this.c.primary,.30+rage*.34);ctx.lineWidth=1;ctx.setLineDash([4,7]);
    ctx.beginPath();ctx.moveTo(this.x,this.y);ctx.lineTo(this.rageLeadPoint.x,this.rageLeadPoint.y);ctx.stroke();ctx.setLineDash([]);
    ctx.translate(target.x,target.y);ctx.rotate(-time*(1.6+rage*2));ctx.strokeStyle=alpha(this.c.accent,.54+rage*.30);ctx.lineWidth=1.3+rage*1.1;ctx.shadowBlur=12+rage*10;ctx.shadowColor=this.c.primary;
    for(let i=0;i<4;i++){const a=i*Math.PI/2;ctx.beginPath();ctx.arc(0,0,rr,a+.12,a+Math.PI/2-.12);ctx.stroke()}
   }else if(this.rageSkillState==='smashCharge'){
    ctx.translate(this.x,this.y);ctx.rotate(time*(2.1+rage*1.8));ctx.shadowBlur=18+rage*15;ctx.shadowColor=this.c.secondary;
    for(let i=0;i<3;i++){
     ctx.strokeStyle=alpha(i===2?this.c.accent:this.c.secondary,.28+rage*.24+pulse*.14);ctx.lineWidth=1.5+i*.5;
     ctx.beginPath();ctx.arc(0,0,this.r*(1.20+i*.20-pulse*.05),i*.7,Math.PI*1.55+i*.7);ctx.stroke();
    }
   }else if(this.rageSkillState==='smashRush'){
    const speed=mag(this.vx,this.vy)||1,nx=this.vx/speed,ny=this.vy/speed;
    ctx.strokeStyle=alpha(this.c.accent,.58+rage*.24);ctx.lineWidth=this.r*.38;ctx.lineCap='round';ctx.shadowBlur=16;ctx.shadowColor=this.c.primary;
    ctx.beginPath();ctx.moveTo(this.x-nx*this.r*.4,this.y-ny*this.r*.4);ctx.lineTo(this.x-nx*this.r*(2.15+rage*.72),this.y-ny*this.r*(2.15+rage*.72));ctx.stroke();
   }
   ctx.restore();
  }
 };

 function applyRageSmash(attacker,victim,dirX,dirY,aegisReady=false){
  if(!isRager(attacker)||attacker.rageSkillState!=='smashRush'||attacker.rageSmashHitWindow<=0||attacker.rageSmashHit||!validEnemy(attacker,victim))return false;
  const rage=rageOf(attacker),attack=attackOf(attacker),stage=stageOf(attacker),power=clamp(attacker.rageSmashPower||1,1,1.62);
  const guard=defenderScale(victim,aegisReady);
  const force=(70+attack*.42+rage*55)*power*guard;
  victim.vx+=dirX*force;victim.vy+=dirY*force;
  victim.omega*=clamp(1-(.045+rage*.055+(power-1)*.025)*guard,.80,.96);victim.spin=victim.omega;
  victim.energy=Math.max(0,victim.energy-(5+attack*.020+rage*5.2)*power*guard);
  victim.tiltVel+=(.12+rage*.18)*power*guard/Math.max(.76,victim.tip?.stability||1);
  victim.lift=clamp((victim.lift||0)+(.08+rage*.13)*power*guard,0,1);
  victim.impactBoost=Math.max(victim.impactBoost||0,(78+rage*62+(power-1)*30)*guard);
  victim.burstMeter=(victim.burstMeter||0)+(5+rage*6.5)*power*guard;
  attacker.omega*=1-(.015+rage*.020)*power;attacker.spin=attacker.omega;
  attacker.energy=Math.max(0,attacker.energy-(3.0+rage*3.2));
  attacker.rageSmashHit=true;attacker.rageSmashHitWindow=0;attacker.rageImpactFlash=1;attacker.rageOvercapPulse=1;
  const cx=(attacker.x+victim.x)/2,cy=(attacker.y+victim.y)/2;
  emit(cx,cy,attacker.c.primary,34+stage*8,.92+rage*.32,'streak');
  emit(cx,cy,attacker.c.accent,16+stage*5,.72+rage*.24);
  wave(cx,cy,attacker.c.secondary,72+rage*48);
  shake=Math.max(shake,8+rage*6);flash=Math.max(flash,.26+rage*.18);
  if(aegisReady||victim.morphMode==='aegis'){
   attacker.vx-=dirX*(30+rage*24);attacker.vy-=dirY*(30+rage*24);
   attacker.tiltVel+=(.055+rage*.045);
   attacker.rageRecoveryTimer=Math.max(attacker.rageRecoveryTimer,.92);
   addLog(`${victim.c.name} 以玄甲結構削弱「破滅重擊」並反震狂戰士！`);
  }else if(guard<.72){
   addLog(`${victim.c.name} 的防禦結構吸收部分「破滅重擊」，成功保留反擊空間。`);
  }else{
   addLog(`${attacker.c.name} 的「破滅重擊」命中，但攻擊後將進入疲勞空窗！`);
  }
  attacker.finishRageSkill(false);
  return true;
 }

 function interruptCharge(victim,closing){
  if(!isRager(victim)||victim.rageSkillState!=='smashCharge'||closing<68)return;
  victim.rageChargeInterrupted=true;
  victim.vx*=.78;victim.vy*=.78;
  victim.tiltVel+=(.045+closing*.00035);
  victim.finishRageSkill(false,true);
  emit(victim.x,victim.y,victim.c.accent,18,.48,'streak');
  wave(victim.x,victim.y,victim.c.primary,34);
 }

 const previousCollide=collide;
 collide=function(a,b){
  const protectedState=a?.phaseInvisible||b?.phaseInvisible||a?.skyJumpGhost||b?.skyJumpGhost||a?.charmedBy===b||b?.charmedBy===a;
  const same=teamOf(a)===teamOf(b);
  const dx=b.x-a.x,dy=b.y-a.y,d=mag(dx,dy),min=(a.r||0)+(b.r||0);
  let contact=false,nx=0,ny=0,closing=0;
  if(!protectedState&&!same&&d&&d<min){
   nx=dx/d;ny=dy/d;
   closing=-((b.vx-a.vx)*nx+(b.vy-a.vy)*ny);
   contact=closing>0;
  }
  const smashA=contact&&isRager(a)&&a.rageSkillState==='smashRush'&&a.rageSmashHitWindow>0&&!a.rageSmashHit;
  const smashB=contact&&isRager(b)&&b.rageSkillState==='smashRush'&&b.rageSmashHitWindow>0&&!b.rageSmashHit;
  const aegisA=!!(a?.morphMode==='aegis'&&a.morphCounterReady);
  const aegisB=!!(b?.morphMode==='aegis'&&b.morphCounterReady);
  const savedA=smashA?a.c.rageEngine:null,savedB=smashB?b.c.rageEngine:null;
  if(smashA)a.c.rageEngine=false;
  if(smashB)b.c.rageEngine=false;
  try{previousCollide(a,b)}finally{
   if(smashA)a.c.rageEngine=savedA;
   if(smashB)b.c.rageEngine=savedB;
  }
  if(!contact)return;
  interruptCharge(a,closing);
  interruptCharge(b,closing);
  if(smashA)applyRageSmash(a,b,nx,ny,aegisB);
  if(smashB)applyRageSmash(b,a,-nx,-ny,aegisA);
  if(isRager(a)&&a.rageRecoveryTimer>0&&!smashA){a.omega*=.992;a.spin=a.omega;a.tiltVel+=.012}
  if(isRager(b)&&b.rageRecoveryTimer>0&&!smashB){b.omega*=.992;b.spin=b.omega;b.tiltVel+=.012}
 };

 enhancePanel('p1');enhancePanel('p2');
 const log=document.querySelector('#log');
 if(log)log.textContent='「血怒狂戰士」完成互動平衡：重擊不再疊加普通血怒傷害，蓄力可打斷，防禦形態可減傷，技能後會留下反擊空窗。';
 document.documentElement.dataset.rageTargeting='balanced-counterplay-v5';
})();
