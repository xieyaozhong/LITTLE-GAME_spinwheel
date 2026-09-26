/* Brief, chance-based refraction after a real enemy hit. */
(() => {
  const teamOf=t=>t?.teamIndex??(t?.index?1:0);
  const alive=t=>!!t&&!t.out&&!t.burst&&(t.energy||0)>0;
  const snapshot=t=>({energy:Number(t.energy)||0,omega:Math.abs(Number(t.omega??t.spin)||0),burst:Number(t.burstMeter)||0});
  const damaged=(t,b)=>b&&(b.energy-(Number(t.energy)||0)>.04||b.omega-Math.abs(Number(t.omega??t.spin)||0)>.035||(Number(t.burstMeter)||0)-b.burst>.04);
  const PreviousTop=Top;
  Top=class Top extends PreviousTop{
    constructor(index,data){super(index,data);this.phaseReactiveCooldown=0;this.phaseReactiveAttemptCooldown=0;this.phaseReactiveActive=false;this.phaseReactiveCount=0}
    beginReactivePhase(){
      if(!this.c.phaseCloak||!alive(this)||this.phaseInvisible||this.charmedBy||this.timeFrozenBy||this.skyJumpGhost||this.energy<=16||Math.abs(this.omega??this.spin)<=10)return false;
      this.phaseInvisible=true;this.phaseReactiveActive=true;this.phaseTimer=rnd(.42,.68);this.phasePulse=1;
      this.phaseReactiveCount++;this.phaseCount=(this.phaseCount||0)+1;this.trail=[];
      this.phaseReactiveCooldown=rnd(3.4,4.8);this.phaseCooldown=Math.max(this.phaseCooldown||0,1.15);
      this.omega*=.993;this.spin=this.omega;
      return true;
    }
    tryReactiveCloak(before){
      if(!this.c.phaseCloak||this.phaseReactiveCooldown>0||this.phaseReactiveAttemptCooldown>0||this.phaseInvisible||!alive(this)||this.energy<=16||Math.abs(this.omega??this.spin)<=10||this.charmedBy||this.timeFrozenBy||this.skyJumpGhost||!damaged(this,before))return false;
      this.phaseReactiveAttemptCooldown=.30;
      return rnd(0,1)<.28?this.beginReactivePhase():false;
    }
    endPhase(){
      if(!this.phaseReactiveActive)return super.endPhase();
      this.phaseInvisible=false;this.phaseTimer=0;this.phaseReactiveActive=false;
      this.rimCooldown=Math.max(this.rimCooldown||0,.14);this.xDashCooldown=Math.max(this.xDashCooldown||0,.20);
    }
    update(dt,opponent){
      this.phaseReactiveCooldown=Math.max(0,this.phaseReactiveCooldown-dt);
      this.phaseReactiveAttemptCooldown=Math.max(0,this.phaseReactiveAttemptCooldown-dt);
      // Observe explicit enemy mutations during an attacker's update, never the victim's own spin decay.
      const watched=alive(this)&&!this.phaseInvisible&&Array.isArray(tops)?tops.filter(t=>t!==this&&t.c?.phaseCloak&&alive(t)&&!t.phaseInvisible&&teamOf(t)!==teamOf(this)).map(t=>[t,snapshot(t)]):[];
      super.update(dt,opponent);
      for(const [victim,before] of watched)victim.tryReactiveCloak?.(before);
    }
  };
  const previousCollide=collide;
  collide=function(a,b){
    const enemy=alive(a)&&alive(b)&&teamOf(a)!==teamOf(b)&&!a.phaseInvisible&&!b.phaseInvisible;
    const d=enemy?Math.hypot(b.x-a.x,b.y-a.y):Infinity,touch=enemy&&d>0&&d<(a.r||0)+(b.r||0)+1.5;
    const beforeA=touch&&a.c.phaseCloak?snapshot(a):null,beforeB=touch&&b.c.phaseCloak?snapshot(b):null;
    previousCollide(a,b);
    if(beforeA)a.tryReactiveCloak?.(beforeA);if(beforeB)b.tryReactiveCloak?.(beforeB);
  };
  if(metaPresets.mirageChameleon)metaPresets.mirageChameleon.rank='相位隱形・受擊折光';
  function describe(id){const box=document.querySelector('#'+id+' .phase-cloak-ability');if(!box||!cfg[id]?.phaseCloak)return;box.innerHTML='<strong>幻霧折光</strong>不定期進入相位隱形；受到敵方攻擊後，另有 28% 機率短暫隱形 0.42–0.68 秒。受擊隱形有獨立冷卻。<div class="combo-tags"><span>相位迴避</span><span>受擊折光</span></div>'}
  const priorPanel=renderPanel;renderPanel=function(id){priorPanel(id);describe(id)};describe('p1');describe('p2');
  document.documentElement.dataset.chameleonReactiveCloak='v1';
})();
