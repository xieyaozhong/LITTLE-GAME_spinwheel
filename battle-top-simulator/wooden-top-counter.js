/* Traditional wooden top: anti-custom counter */
(() => {
 const WOODEN_KEY='woodenSage';
 const WOODEN_TOP={
  label:'[ANTI-CUSTOM] Traditional Wooden Top',
  name:'Traditional Wooden Top',
  combo:'Wood Core 0-70 Balance',
  rank:'自訂陀螺剋星・木紋制衡',
  tier:'COUNTER',
  type:'defense',
  a:58,d:93,s:92,w:74,b:98,
  spin:'R',shape:'wooden',counterTarget:'customTop',
  primary:'#8a5a2b',secondary:'#d5a56a',accent:'#fff0d0',metal:'#b98d58'
 };

 metaPresets[WOODEN_KEY]=WOODEN_TOP;

 function averageStats(top){
  if(!top||!top.c)return 0;
  return (top.c.a+top.c.d+top.c.s+top.c.w+top.c.b)/5;
 }
 function isWoodenCounter(top){return !!(top&&top.c&&top.c.counterTarget==='customTop')}
 function isCustomTarget(top){
  if(!top||!top.c)return false;
  const c=top.c,text=`${c.name||''} ${c.combo||''} ${c.rank||''}`;
  const customLike=c.preset==='custom'||/自訂|自由調整能力/i.test(text);
  const highCount=[c.a,c.d,c.s,c.w,c.b].filter(v=>v>=96).length;
  return customLike||highCount>=3||averageStats(top)>=92;
 }

 const PreviousTop=Top;
 Top=class Top extends PreviousTop{
  constructor(index,data){
   super(index,data);
   this.woodAuraCooldown=0;
  }
  update(dt,opponent){
   super.update(dt,opponent);
   this.woodAuraCooldown=Math.max(0,this.woodAuraCooldown-dt);
   if(!isWoodenCounter(this)||!isCustomTarget(opponent)||this.out||this.burst||opponent.out||opponent.burst)return;

   const cx=W/2,cy=H/2,dx=this.x-cx,dy=this.y-cy,d=mag(dx,dy)||1,nx=dx/d,ny=dy/d;
   const inflation=clamp((averageStats(opponent)-82)/18,0,1.4);

   // 傳統木陀螺守住中央，以穩定姿態消耗亂拉數值的暴衝自訂陀螺。
   const recenter=18+this.c.d*.12+inflation*7;
   this.vx-=nx*recenter*dt;
   this.vy-=ny*recenter*dt;
   this.tiltVel*=Math.exp(-(1.45+inflation*.25)*dt);
   this.lift*=Math.exp(-1.1*dt);
   this.energy=clamp(this.energy+dt*(.45+.35*inflation),0,100);

   if(this.woodAuraCooldown<=0&&opponent.impactBoost>18){
    opponent.impactBoost*=clamp(.76-inflation*.13,.53,.76);
    opponent.xDashCooldown=Math.max(opponent.xDashCooldown,.38+.16*inflation);
    this.woodAuraCooldown=.58;
    if(performance.now()-lastZoneLog>700){
     addLog(`${this.c.name} 展開「木紋制衡」，壓制自訂陀螺的灌水暴衝！`);
     lastZoneLog=performance.now();
    }
   }
  }
  bladeCount(){return this.c.shape==='wooden'?8:super.bladeCount()}
  bladeRadius(i){
   if(this.c.shape==='wooden')return this.r*(.92+.05*Math.cos(i*.8));
   return super.bladeRadius(i);
  }
 };

 const previousCollide=collide;
 collide=function(a,b){
  if(a.out||b.out||a.burst||b.burst)return;
  const dx=b.x-a.x,dy=b.y-a.y,d=mag(dx,dy),min=a.r+b.r;
  if(!d||d>=min){previousCollide(a,b);return}
  const nx=dx/d,ny=dy/d,closing=-((b.vx-a.vx)*nx+(b.vy-a.vy)*ny);
  previousCollide(a,b);
  if(closing<=0)return;

  function woodDiscipline(wood,custom,dirX,dirY){
   if(!isWoodenCounter(wood)||!isCustomTarget(custom)||custom.out||custom.burst)return;
   const force=clamp(closing/170,.55,1.45);
   const inflation=clamp((averageStats(custom)-82)/18,0,1.4);

   // 數值越誇張，反制越強；一般預設陀螺不會觸發這段效果。
   custom.omega*=1-(.045+.035*force+.055*inflation);
   custom.spin=custom.omega;
   custom.energy=Math.max(0,custom.energy-(2.5+3.5*force+5*inflation));
   custom.tiltVel+=(.18+.17*force)*(1+inflation*.5)/Math.max(.72,custom.tip.stability);
   custom.lift=clamp(custom.lift+.06+.07*force,0,1);
   custom.impactBoost*=clamp(.58-inflation*.18,.30,.58);
   custom.xDashCooldown=Math.max(custom.xDashCooldown,.42+.16*inflation);
   custom.vx+=dirX*(14+18*force);
   custom.vy+=dirY*(14+18*force);

   wood.energy=clamp(wood.energy+.8+.5*inflation,0,100);
   wood.omega*=.994;
   wood.spin=wood.omega;
   wood.tiltVel*=.82;

   const cx=(wood.x+custom.x)/2,cy=(wood.y+custom.y)/2;
   emit(cx,cy,wood.c.accent,22,.92,'streak');
   emit(cx,cy,wood.c.primary,14,.72);
   wave(cx,cy,wood.c.accent,50);
   shake=Math.max(shake,6.2);
   flash=Math.max(flash,.20);
   addLog(`${wood.c.name} 以「返璞歸真」削弱自訂陀螺的灌水數值！`);
  }

  woodDiscipline(a,b,nx,ny);
  woodDiscipline(b,a,-nx,-ny);
 };
})();
