/* Enchantress Siren: irregular charm control */
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
  ability.innerHTML='<strong>月歌魅惑機構</strong>會在不固定時間鎖定一名可見敵人，使其短暫停止攻擊魅惑者並繞著魅惑者移動。魅惑期間目標會略微損失角速度；隱形或飛行中的陀螺不會被鎖定。<div class="combo-tags"><span>隨機魅惑</span><span>軌道牽引</span><span>短暫停戰</span></div>';
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
  target.rimCooldown=Math.max(target.rimCooldown||0,.12);
  target.xDashCooldown=Math.max(target.xDashCooldown||0,.18);
  emit(target.x,target.y,target.c.secondary||'#fff',14,.48,'streak');
  wave(target.x,target.y,source?.c?.primary||'#ff8ad8',30);
  if(reason)addLog(`${target.c.name} ${reason}，解除魅惑並恢復自主軌道。`);
 }

 const PreviousTop=Top;
 Top=class Top extends PreviousTop{
  constructor(index,data){
   super(index,data);
   this.charmCooldown=999;
   this.charmCastPulse=0;
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
   this.charmCount++;
   this.charmCastPulse=1;
   this.omega*=.987;this.spin=this.omega;
   scheduleCharm(this,false);
   emit(this.x,this.y,this.c.primary,28,.72,'streak');
   emit(target.x,target.y,this.c.accent,18,.58,'streak');
   wave(this.x,this.y,this.c.secondary,54);
   wave(target.x,target.y,this.c.primary,42);
   shake=Math.max(shake,3.8);
   addLog(`${this.c.name} 發動「月歌魅惑」：${target.c.name} 暫時停止攻擊並被牽引至魅惑軌道！`);
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
   if(this.charmTimer<=0||Math.abs(this.omega)<9||this.energy<12){
    clearCharm(this,'從月歌中清醒');
   }
   return true;
  }
  update(dt,opponent){
   this.charmCastPulse=Math.max(0,this.charmCastPulse-dt*1.7);
   this.charmGrace=Math.max(0,this.charmGrace-dt);
   if(this.charmedBy){
    this.updateCharmedMotion(dt);
    return;
   }

   super.update(dt,opponent?.phaseInvisible?null:opponent);
   if(!this.isCharmCaster()||this.out||this.burst||this.phaseInvisible||this.skyJumpGhost)return;
   if(this.energy<=25||Math.abs(this.omega)<15)return;
   this.charmCooldown-=dt;
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
   if(!charmed&&!caster)return;
   const pulse=charmed?(.5+.5*Math.sin(time*10+this.angle)):(.5+.5*Math.sin(time*4.2));
   const color=charmed?(this.charmedBy?.c?.primary||'#ff68c8'):this.c.primary;
   ctx.save();
   ctx.translate(this.x,this.y);
   ctx.rotate((charmed?-1:1)*time*(charmed?2.8:1.1));
   ctx.globalCompositeOperation='screen';
   ctx.strokeStyle=alpha(color,charmed?.42:.16+.12*pulse+.18*this.charmCastPulse);
   ctx.shadowBlur=12;ctx.shadowColor=color;
   ctx.lineWidth=charmed?2:1.2;
   ctx.setLineDash(charmed?[this.r*.18,this.r*.12]:[this.r*.10,this.r*.24]);
   ctx.beginPath();ctx.arc(0,0,this.r*(charmed?1.28:1.12+.06*pulse),0,Math.PI*2);ctx.stroke();
   ctx.setLineDash([]);
   if(charmed){
    for(let i=0;i<3;i++){
     const a=i*Math.PI*2/3+time*2.1;
     ctx.fillStyle=alpha(color,.38);
     ctx.beginPath();ctx.arc(Math.cos(a)*this.r*1.12,Math.sin(a)*this.r*1.12,1.8,0,Math.PI*2);ctx.fill();
    }
   }
   ctx.restore();
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
 style.textContent='.charm-ability{border-color:#ff68c855;background:linear-gradient(135deg,#ff68c812,#744cff18)}';
 document.head.appendChild(style);

 cfg.p2={...ENCHANTRESS_SIREN,preset:CHARM_KEY};
 renderPanel('p1');renderPanel('p2');
 document.querySelector('#n1').textContent=cfg.p1.name;
 document.querySelector('#n2').textContent=cfg.p2.name;
 document.querySelector('#log').textContent='「魅月海妖」已加入：它會不定期魅惑一名可見敵人，使對方停止攻擊並短暫繞著海妖移動。';
})();