/* Bloodrage Berserker: lower energy grants more speed and collision power */
(() => {
 const RAGE_KEY='bloodrageBerserker';
 const BLOODRAGE_BERSERKER={
  label:'[SPECIAL] 血怒狂戰士｜Bloodrage Berserker',
  name:'血怒狂戰士',englishName:'Bloodrage Berserker',
  combo:'3-60 Rage Rush',
  rank:'低能量狂化・攻擊與移速提升',tier:'SPECIAL',type:'attack',
  a:84,d:66,s:74,w:86,b:84,spin:'R',shape:'bloodrageBerserker',
  rageEngine:true,
  primary:'#e93636',secondary:'#ff8a24',accent:'#fff0cf',metal:'#cfd5dc'
 };
 metaPresets[RAGE_KEY]=BLOODRAGE_BERSERKER;

 const previousRenderPanel=renderPanel;
 renderPanel=function(id){
  previousRenderPanel(id);
  const host=document.querySelector('#'+id),c=cfg[id];
  if(!host||!c?.rageEngine)return;
  const combo=host.querySelector('.combo-box');
  const ability=document.createElement('div');
  ability.className='combo-box rage-ability';
  ability.innerHTML='<strong>血怒狂化機構</strong>能量越低，追擊加速度、最高移動速度與碰撞衝擊越高。進入低能量階段後會產生更強烈的赤焰，但狂化也會加速自身角速度消耗。<div class="combo-tags"><span>低血增傷</span><span>低血加速</span><span>自我消耗</span></div>';
  if(combo)combo.insertAdjacentElement('afterend',ability);else host.appendChild(ability);
 };

 function teamOf(top){return top?.teamIndex??(top?.index?1:0)}
 function rageRatio(top){
  if(!top?.c?.rageEngine)return 0;
  const missing=clamp(1-clamp(top.energy,0,100)/100,0,1);
  return Math.pow(missing,1.12);
 }
 function rageStage(top){
  const energy=clamp(top?.energy??100,0,100);
  return energy<=20?3:energy<=40?2:energy<=65?1:0;
 }
 function validEnemy(source,target){
  return !!target&&source!==target&&teamOf(source)!==teamOf(target)&&!target.out&&!target.burst&&!target.phaseInvisible&&!target.skyJumpGhost&&target.energy>0;
 }
 function nearestEnemy(source,preferred){
  if(validEnemy(source,preferred))return preferred;
  let best=null,bestDistance=Infinity;
  tops.forEach(target=>{
   if(!validEnemy(source,target))return;
   const distance=mag(target.x-source.x,target.y-source.y);
   if(distance<bestDistance){best=target;bestDistance=distance}
  });
  return best;
 }

 const PreviousTop=Top;
 Top=class Top extends PreviousTop{
  constructor(index,data){
   super(index,data);
   this.ragePulse=0;
   this.rageStageSeen=0;
   this.rageImpactFlash=0;
  }
  update(dt,opponent){
   super.update(dt,opponent);
   this.ragePulse+=dt*(2.4+rageRatio(this)*5.2);
   this.rageImpactFlash=Math.max(0,this.rageImpactFlash-dt*2.8);
   if(!this.c.rageEngine||this.out||this.burst||this.phaseInvisible||this.skyJumpGhost||this.charmedBy)return;

   const rage=rageRatio(this);
   const stage=rageStage(this);
   if(stage>this.rageStageSeen){
    this.rageStageSeen=stage;
    const stageName=stage===1?'血怒甦醒':stage===2?'狂戰沸騰':'瀕危暴走';
    emit(this.x,this.y,this.c.primary,18+stage*8,.58+stage*.13,'streak');
    wave(this.x,this.y,this.c.secondary,34+stage*13);
    shake=Math.max(shake,2.5+stage*1.7);
    addLog(`${this.c.name} 進入「${stageName}」：剩餘能量越低，攻擊與移動速度越高！`);
   }

   if(rage<=.02)return;
   const target=nearestEnemy(this,opponent);
   if(target){
    const dx=target.x-this.x,dy=target.y-this.y,d=mag(dx,dy)||1;
    const nx=dx/d,ny=dy/d,sign=Math.sign(this.omega)||1,tx=-ny*sign,ty=nx*sign;
    const chase=24+rage*(42+this.c.a*.18);
    const weave=10+rage*23;
    this.vx+=(nx*chase+tx*weave)*dt;
    this.vy+=(ny*chase+ty*weave)*dt;
   }

   const speed=mag(this.vx,this.vy);
   if(speed>12){
    const acceleration=1+dt*(.045+rage*.30);
    this.vx*=acceleration;this.vy*=acceleration;
   }
   const maxSpeed=230+this.c.a*.95+(this.impactBoost||0)+rage*72;
   const boostedSpeed=mag(this.vx,this.vy);
   if(boostedSpeed>maxSpeed){this.vx=this.vx/boostedSpeed*maxSpeed;this.vy=this.vy/boostedSpeed*maxSpeed}

   const extraDrain=(.010+rage*.022+rage*rage*.018)*dt;
   this.omega*=Math.exp(-extraDrain);this.spin=this.omega;
   if(Math.random()<dt*(2+rage*10))emit(this.x,this.y,Math.random()<.65?this.c.primary:this.c.secondary,1,.22+rage*.22,'streak');
  }
  bladeCount(){return this.c.shape==='bloodrageBerserker'?4:super.bladeCount()}
  bladeRadius(i){
   if(this.c.shape==='bloodrageBerserker'){
    const profile=[1.20,.72,1.04,.76];
    return this.r*profile[i%profile.length];
   }
   return super.bladeRadius(i);
  }
  draw(){
   super.draw();
   if(!this.c.rageEngine||this.out||this.burst)return;
   const rage=rageRatio(this),stage=rageStage(this);
   if(rage<=.015)return;
   const pulse=.5+.5*Math.sin(this.ragePulse);
   ctx.save();ctx.translate(this.x,this.y);ctx.rotate(-time*(1.2+rage*2.4));
   ctx.globalCompositeOperation='screen';ctx.shadowBlur=10+rage*18;ctx.shadowColor=this.c.primary;

   for(let ring=0;ring<2;ring++){
    ctx.strokeStyle=alpha(ring?this.c.secondary:this.c.primary,.10+rage*(ring?.28:.38)+pulse*.07);
    ctx.lineWidth=1.2+rage*(ring?1.1:2.0);
    ctx.setLineDash([this.r*(.12+ring*.05),this.r*(.18-ring*.03)]);
    ctx.beginPath();ctx.arc(0,0,this.r*(1.10+ring*.23+rage*.12),0,Math.PI*2);ctx.stroke();
   }
   ctx.setLineDash([]);

   const flames=4+stage*2;
   for(let i=0;i<flames;i++){
    const a=i*Math.PI*2/flames+time*(1.1+rage*1.7);
    const inner=this.r*(.92+rage*.08),outer=this.r*(1.18+rage*(.30+.07*Math.sin(this.ragePulse+i)));
    ctx.strokeStyle=alpha(i%2?this.c.secondary:this.c.primary,.12+rage*.40);
    ctx.lineWidth=1.2+rage*1.8;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a)*inner,Math.sin(a)*inner);
    ctx.quadraticCurveTo(Math.cos(a+.14)*outer*.88,Math.sin(a+.14)*outer*.88,Math.cos(a+.25)*outer,Math.sin(a+.25)*outer);
    ctx.stroke();
   }

   if(this.rageImpactFlash>0){
    ctx.strokeStyle=alpha(this.c.accent,.55*this.rageImpactFlash);
    ctx.lineWidth=2.4;
    ctx.beginPath();ctx.arc(0,0,this.r*(1.20+(1-this.rageImpactFlash)*.65),0,Math.PI*2);ctx.stroke();
   }
   ctx.restore();
  }
 };

 const previousCollide=collide;
 collide=function(a,b){
  const protectedState=a?.phaseInvisible||b?.phaseInvisible||a?.skyJumpGhost||b?.skyJumpGhost||a?.charmedBy===b||b?.charmedBy===a;
  const same=teamOf(a)===teamOf(b);
  const dx=b.x-a.x,dy=b.y-a.y,d=mag(dx,dy),min=(a.r||0)+(b.r||0);
  let contact=false,nx=0,ny=0;
  if(!protectedState&&!same&&d&&d<min){
   nx=dx/d;ny=dy/d;
   contact=-((b.vx-a.vx)*nx+(b.vy-a.vy)*ny)>0;
  }
  previousCollide(a,b);
  if(!contact)return;

  function applyRageHit(attacker,victim,dirX,dirY){
   if(!attacker?.c?.rageEngine||attacker.out||attacker.burst||attacker.phaseInvisible||attacker.skyJumpGhost||attacker.charmedBy)return;
   const rage=rageRatio(attacker);
   if(rage<=.03||victim.out||victim.burst)return;
   const force=rage*(34+attacker.c.a*.44);
   victim.vx+=dirX*force;victim.vy+=dirY*force;
   victim.omega*=1-rage*.065;victim.spin=victim.omega;
   victim.tiltVel+=(.055+rage*.13)/Math.max(.76,victim.tip?.stability||1);
   victim.lift=clamp((victim.lift||0)+rage*.075,0,1);
   victim.impactBoost=Math.max(victim.impactBoost||0,34+rage*48);
   victim.burstMeter=(victim.burstMeter||0)+rage*4.8;
   attacker.omega*=1-rage*.0045;attacker.spin=attacker.omega;
   attacker.rageImpactFlash=1;
   if(rage>.58){
    const cx=(attacker.x+victim.x)/2,cy=(attacker.y+victim.y)/2;
    emit(cx,cy,attacker.c.primary,12+Math.round(rage*18),.48+rage*.45,'streak');
    wave(cx,cy,attacker.c.secondary,34+rage*28);
    shake=Math.max(shake,3.5+rage*4.5);
   }
  }

  applyRageHit(a,b,nx,ny);
  applyRageHit(b,a,-nx,-ny);
 };

 const style=document.createElement('style');
 style.textContent='.rage-ability{border-color:#e9363655;background:linear-gradient(135deg,#e9363615,#ff8a2415);box-shadow:inset 0 0 22px #e936360d}';
 document.head.appendChild(style);

 cfg.p2={...BLOODRAGE_BERSERKER,preset:RAGE_KEY};
 renderPanel('p1');renderPanel('p2');
 document.querySelector('#n1').textContent=cfg.p1.name;
 document.querySelector('#n2').textContent=cfg.p2.name;
 document.querySelector('#log').textContent='「血怒狂戰士」已加入：能量越低，追擊速度、最高移速與碰撞攻擊越高，但自身角速度也會加速消耗。';
})();