/* Sky Pouncer stamina-loss fix: zero energy is an immediate stamina defeat even during flight or high-speed motion */
(() => {
  function isExhaustedSky(top){
    return !!top?.c?.skyPouncer&&!top.out&&!top.burst&&((top.energy||0)<=0||top.skyStaminaDefeated);
  }
  function forceExhaustion(top){
    if(!isExhaustedSky(top))return false;
    const first=!top.skyStaminaDefeated;
    top.skyStaminaDefeated=true;
    top.energy=0;
    top.omega=0;top.spin=0;
    top.vx=0;top.vy=0;
    top.skyJumpState='idle';
    top.skyJumpGhost=false;
    top.skyJumpHeight=0;
    top.skyDiveImpact=0;
    top.skyStrikePower=0;
    top.skyDirectTimer=0;
    top.skyOrbitTimer=0;
    top.skyClimbTimer=0;
    top.lift=0;
    top.impactBoost=0;
    if(first){
      emit(top.x,top.y,top.c.primary,28,.72,'streak');
      wave(top.x,top.y,top.c.accent,54);
      top.skyEndurancePulse=1;
    }
    return true;
  }

  const PreviousTop=Top;
  Top=class Top extends PreviousTop{
    constructor(index,data){
      super(index,data);
      this.skyStaminaDefeated=false;
    }
    update(dt,opponent){
      if(this.c?.skyPouncer&&this.skyStaminaDefeated){
        forceExhaustion(this);
        return;
      }
      super.update(dt,opponent);
      if(this.c?.skyPouncer&&(this.energy||0)<=0)forceExhaustion(this);
    }
  };

  const previousResult=result;
  result=function(){
    if(Array.isArray(tops))tops.forEach(forceExhaustion);
    return previousResult();
  };

  document.documentElement.dataset.skyPouncerStaminaLossFix='v1';
})();
