/* Bloodrage Berserker counterplay patch: charging and recovery cannot trade passive rage damage */
(() => {
 const isRager=top=>!!top?.c?.rageEngine;
 const teamOf=top=>top?.teamIndex??(top?.index?1:0);
 const previousCollide=collide;
 collide=function(a,b){
  const protectedState=a?.phaseInvisible||b?.phaseInvisible||a?.skyJumpGhost||b?.skyJumpGhost||a?.charmedBy===b||b?.charmedBy===a;
  const same=teamOf(a)===teamOf(b);
  const dx=b.x-a.x,dy=b.y-a.y,d=mag(dx,dy),min=(a.r||0)+(b.r||0);
  let contact=false;
  if(!protectedState&&!same&&d&&d<min){
   const nx=dx/d,ny=dy/d;
   contact=-((b.vx-a.vx)*nx+(b.vy-a.vy)*ny)>0;
  }
  const suppressA=contact&&isRager(a)&&(a.rageSkillState==='smashCharge'||a.rageRecoveryTimer>0);
  const suppressB=contact&&isRager(b)&&(b.rageSkillState==='smashCharge'||b.rageRecoveryTimer>0);
  const savedA=suppressA?a.c.rageEngine:null,savedB=suppressB?b.c.rageEngine:null;
  if(suppressA)a.c.rageEngine=false;
  if(suppressB)b.c.rageEngine=false;
  try{previousCollide(a,b)}finally{
   if(suppressA)a.c.rageEngine=savedA;
   if(suppressB)b.c.rageEngine=savedB;
  }
 };
 document.documentElement.dataset.rageCounterplayFix='v1';
})();
