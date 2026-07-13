/* Rod Breaker custom counter preset */
(() => {
 const ROD_BREAKER_KEY='rodBreaker';
 const ROD_BREAKER={
  label:'[COUNTER] Rod Breaker｜弒杖獠牙',
  name:'Rod Breaker',
  combo:'3-60 Low Rush',
  rank:'神杖特攻・破壞平衡與角速度',
  tier:'COUNTER',
  type:'attack',
  a:96,d:76,s:70,w:94,b:84,
  spin:'R',shape:'breaker',counterTarget:'wizardRod',
  primary:'#b8142f',secondary:'#151923',accent:'#7cecff',metal:'#d7dde4'
 };

 metaPresets[ROD_BREAKER_KEY]=ROD_BREAKER;

 function isWizardRod(top){
  if(!top||!top.c)return false;
  return top.c.shape==='rod'||/wizard\s*rod|神杖/i.test(top.c.name||'');
 }
 function isRodBreaker(top){return !!(top&&top.c&&top.c.counterTarget==='wizardRod')}

 const LaunchTop=Top;
 Top=class Top extends LaunchTop{
  constructor(index,data){
   super(index,data);
   this.counterCharge=0;
   this.counterLungeCooldown=.45;
   this.counterImpactCooldown=0;
   this.counterHits=0;
  }
  update(dt,opponent){
   super.update(dt,opponent);
   this.counterLungeCooldown=Math.max(0,this.counterLungeCooldown-dt);
   this.counterImpactCooldown=Math.max(0,this.counterImpactCooldown-dt);
   if(!isRodBreaker(this)||!isWizardRod(opponent)||this.out||this.burst||opponent.out||opponent.burst)return;

   const ox=opponent.x-this.x,oy=opponent.y-this.y,d=mag(ox,oy)||1,nx=ox/d,ny=oy/d;
   const spinRatio=clamp(Math.abs(this.omega)/(this.omega0||1),0,1);
   this.counterCharge=clamp(this.counterCharge+dt*(.50+.35*spinRatio),0,1);

   // 神杖通常穩守中央；弒杖獠牙會收窄路線並持續追擊其重心。
   const pursuit=(24+this.c.a*.20)*(opponent.c.type==='stamina'?1.18:1);
   this.vx+=nx*pursuit*dt;
   this.vy+=ny*pursuit*dt;

   if(this.counterCharge>=1&&this.counterLungeCooldown<=0&&d>this.r+opponent.r+8&&d<innerR*.94){
    const lunge=76+this.c.a*.36;
    this.vx+=nx*lunge;
    this.vy+=ny*lunge;
    this.omega*=.965;
    this.spin=this.omega;
    this.tiltVel+=.055;
    this.counterCharge=0;
    this.counterLungeCooldown=1.05;
    emit(this.x,this.y,this.c.primary,18,.78,'streak');
    wave(this.x,this.y,this.c.accent,38);
    if(performance.now()-lastZoneLog>700){
     addLog(`${this.c.name} 鎖定神杖重心，發動「斷杖突進」！`);
     lastZoneLog=performance.now();
    }
   }
  }
  bladeCount(){return this.c.shape==='breaker'?3:super.bladeCount()}
  bladeRadius(i){
   if(this.c.shape==='breaker'){
    const profile=[1.22,.80,.67,.91];
    return this.r*profile[i%4]*(i%8<4?1:.96);
   }
   return super.bladeRadius(i);
  }
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

  function rodBreak(counter,rod,dirX,dirY){
   if(!isRodBreaker(counter)||!isWizardRod(rod)||counter.counterImpactCooldown>0||rod.out||rod.burst)return;
   const force=clamp(closing/165,.55,1.45);

   // 三枚外重刃把神杖由水平旋轉轉成傾斜進動，並直接削減角速度。
   rod.omega*=1-(.052+.025*force);
   rod.spin=rod.omega;
   rod.tiltVel+=(.27+.24*force)/Math.max(.72,rod.tip.stability);
   rod.lift=clamp(rod.lift+.10+.10*force,0,1);
   rod.vx+=dirX*(24+30*force);
   rod.vy+=dirY*(24+30*force);
   rod.impactBoost=Math.max(rod.impactBoost,38+42*force);
   rod.burstMeter+=5+7*force;

   counter.omega*=.978;
   counter.spin=counter.omega;
   counter.tiltVel+=.035;
   counter.counterImpactCooldown=.34;
   counter.counterHits++;

   const cx=(counter.x+rod.x)/2,cy=(counter.y+rod.y)/2;
   emit(cx,cy,counter.c.accent,24,.95,'streak');
   emit(cx,cy,counter.c.primary,18,.82);
   wave(cx,cy,counter.c.accent,54);
   shake=Math.max(shake,7.5);
   flash=Math.max(flash,.24);
   addLog(`${counter.c.name} 的破平衡重刃命中神杖，削弱角速度並放大傾斜！`);
  }

  rodBreak(a,b,nx,ny);
  rodBreak(b,a,-nx,-ny);
 };

 // 預設直接展示神杖與剋星的對決；雙方仍可從選單切換其他陀螺。
 cfg.p2={...ROD_BREAKER,preset:ROD_BREAKER_KEY};
 renderPanel('p1');
 renderPanel('p2');
 document.querySelector('#n1').textContent=cfg.p1.name;
 document.querySelector('#n2').textContent=cfg.p2.name;
 document.querySelector('#log').textContent='反神杖陀螺已就緒：Rod Breaker 會追擊 Wizard Rod 的中央穩定路線，並以重刃破壞其角速度與平衡。';
})();
