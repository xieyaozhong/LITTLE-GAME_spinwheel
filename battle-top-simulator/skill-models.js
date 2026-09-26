/* Physical skill volumes. Geometry follows current ability state and real movement. */
(() => {
  const TAU=Math.PI*2,reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const u=v=>clamp(Number(v)||0,0,1),active=t=>t&&!t.out&&!t.burst&&(t.energy||0)>0;
  const BONDS={enchantressSiren:'charm',skyPouncer:'sky',bloodrageBerserker:'rage',twinNova:'twin',chronoClockEmperor:'chrono',taijiMysticWheel:'taiji',sevenfoldSwordSovereign:'sword',omniObserver:'morph',mirageChameleon:'phase'};
  function shape(points){ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath()}
  function material(r,color,opacity=.6){const g=ctx.createLinearGradient(-r,-r,r,r);g.addColorStop(0,alpha('#f4fbff',opacity*.8));g.addColorStop(.32,alpha(color,opacity));g.addColorStop(1,alpha(color,opacity*.035));return g}
  function shell(r,color,power=.6,start=-1.08,end=1.08,width=.17){
    ctx.fillStyle=material(r,color,power);ctx.beginPath();ctx.arc(0,0,r,start,end);ctx.arc(-r*.02,0,r*(1-width),end,start,true);ctx.closePath();ctx.fill();
  }
  function wedge(length,width,color,power=.7){
    const f=ctx.createLinearGradient(-length*.28,0,length,0);f.addColorStop(0,alpha(color,0));f.addColorStop(.62,alpha(color,power*.5));f.addColorStop(1,alpha('#f3fbff',power));
    shape([[-length*.26,-width],[length*.67,-width*.46],[length,0],[length*.67,width*.46],[-length*.26,width]]);ctx.fillStyle=f;ctx.fill();
    shape([[length*.18,0],[length*.67,-width*.46],[length,0],[length*.67,width*.13]]);ctx.fillStyle=alpha(color,power*.30);ctx.fill();
  }
  function wake(r,speed,color,power=.4){
    if(speed<45||reduced)return;const length=r*(.7+clamp(speed/220,0,1.25));
    const f=ctx.createLinearGradient(-length-r,0,-r*.55,0);f.addColorStop(0,alpha(color,0));f.addColorStop(1,alpha(color,power));ctx.fillStyle=f;
    ctx.beginPath();ctx.moveTo(-r*.57,-r*.29);ctx.quadraticCurveTo(-r*1.25,-r*.43,-r-length,0);ctx.quadraticCurveTo(-r*1.25,r*.43,-r*.57,r*.29);ctx.closePath();ctx.fill();
  }
  function shield(r,color,power){
    for(let i=0;i<3;i++){ctx.save();ctx.rotate((i-1)*.64);shell(r,color,power,-.27,.27,.16);ctx.restore()}
  }
  function wing(r,side,color,power){
    ctx.fillStyle=material(r,color,power);ctx.beginPath();ctx.moveTo(r*.54,side*r*.30);ctx.quadraticCurveTo(-r*.10,side*r*1.42,-r*1.21,side*r*.80);ctx.lineTo(-r*.51,side*r*.43);ctx.quadraticCurveTo(r*.06,side*r*.76,r*.54,side*r*.30);ctx.closePath();ctx.fill();
  }
  function grain(r,color,power,angle=0){
    for(let i=0;i<(reduced?1:3);i++){const a=angle+i*2.4,d=r*(.85+i*.14);ctx.save();ctx.translate(Math.cos(a)*d,Math.sin(a)*d*.65);ctx.rotate(a);ctx.fillStyle=alpha(color,power*(.25-i*.04));ctx.fillRect(-r*.07,-r*.03,r*.14,r*.06);ctx.restore()}
  }
  function motif(t,kind,r,power,angle,speed){
    const c=t.c||{},color=c.primary||'#83dfff',accent=c.accent||'#eefaff',state=t.skillModelState||'',spin=Math.sign(t.omega??t.spin)||1;
    if(kind==='phase'){
      if(!t.phaseInvisible&&!t.relayBondPhaseTimer)return;
      ctx.globalAlpha*=.22;ctx.save();ctx.translate(-r*.18,0);shell(r*1.03,color,.36,-1.4,1.1,.045);ctx.restore();return;
    }
    if(kind==='twin'){
      if(t.twinInheritanceMode==='guardian'){shield(r*1.20,color,.30+power*.25)}
      else if(t.twinInheritanceMode==='hunter'){ctx.save();ctx.translate(r*.53,0);wedge(r*.98,r*.19,c.secondary||color,.55);ctx.restore();wake(r,speed,c.secondary||color,.22)}
      else if(t.twinCharmBetrayal){shell(r*1.16,'#c673cf',.42,.3,2.8,.18)}
      else if(!t.splitPart){const charge=u(Math.max((t.lastEnemyImpact||0)/100,(t.burstMeter||0)/38));if(charge>.15){for(const side of [-1,1]){ctx.save();ctx.rotate(side*Math.PI/2);shell(r*(1.04-charge*.09),side<0?color:c.secondary,.15+charge*.26,-.45,.45,.10);ctx.restore()}}}
    }else if(kind==='sky'){
      const state=t.skyJumpState||'idle',h=u((t.skyJumpHeight||0)/1.35);if(state==='idle')return;
      if(state==='air'||state==='direct'){ctx.save();ctx.translate(r*.65,0);wedge(r*(.85+h*.38),r*.25,accent,.45);ctx.restore();wake(r,speed,color,.28)}
      else{wing(r*(1+h*.12),-1,color,.30);wing(r*(1+h*.12),1,accent,.27);wake(r,speed,color,.18)}
    }else if(kind==='charm'){
      const cast=u((t.charmCastPulse||0)/1.8);if(cast<=.01&&!t.skillModelBond)return;
      shell(r*(1.07+(1-cast)*.38),color,.20+cast*.32,-1.42,1.42,.16);grain(r*1.13,accent,cast,angle);
    }else if(kind==='rage'){
      const state=t.rageSkillState||'idle',rage=u((t.rageStageSeen||0)/4),heat=rage>.5?'#ffdb91':color;
      if(state==='hunt'){for(const side of [-1,1]){ctx.save();ctx.translate(r*.70,side*r*.31);ctx.rotate(side*.10);wedge(r*.65,r*.12,heat,.53);ctx.restore()}wake(r,speed,color,.16)}
      else if(state==='smashCharge'){const load=u(1-(t.rageSkillTimer||0)/.68);shell(r*(1.22-load*.16),heat,.25+load*.35,-.86,.86,.24)}
      else if(state==='smashRush'){shell(r*1.22,heat,.64,-.77,.77,.30);wake(r,speed,color,.34);grain(r*1.3,heat,.55,t.angle||0)}
    }else if(kind==='morph'){
      const mode=t.morphMode||'scan';
      if(mode==='aegis')shield(r*1.23,color,.43);
      else if(mode==='swift'){wake(r,speed,color,.27);wing(r*.85,1,accent,.18);wing(r*.85,-1,accent,.18)}
      else if(mode==='viper'){for(const side of [-1,1]){ctx.save();ctx.translate(r*.66,side*r*.42);ctx.rotate(-side*.19);wedge(r*.66,r*.13,color,.46);ctx.restore()}}
      else if(mode==='reaper'){ctx.save();ctx.rotate(spin*.3);shell(r*1.29,color,.52,-1.5,.68,.22);ctx.restore()}
      else{shell(r*1.03,color,.16,-.32,.32,.07)}
    }else if(kind==='taiji'){
      const chi=u((t.taijiChi||0)/100);if(t.taijiMode==='yang'){ctx.save();ctx.translate(r*.12,0);shell(r*1.18,'#ffe2a0',.22+chi*.24,-1.0,1.0,.14+chi*.06);ctx.restore()}
      else{ctx.save();ctx.rotate(spin*.18);shell(r*1.15,'#c4e6e4',.19+chi*.17,-.1,2.5,.13);ctx.restore()}
    }else if(kind==='sword'){
      const state=t.swordState||'idle',art=t.swordArt||'flash';if(state==='idle')return;
      const load=state==='windup'?u(t.swordWindupProgress):1;ctx.globalAlpha*=.36+load*.64;
      if(art==='guard'||state==='guard'){shield(r*1.22,accent,.49)}
      else if(art==='pierce'){ctx.save();ctx.translate(r*.58,0);wedge(r*1.47,r*.105,accent,.68);ctx.restore();wake(r,speed,color,.24)}
      else if(art==='swallow'){for(const side of [-1,1]){ctx.save();ctx.translate(r*.35,side*r*.28);ctx.rotate(side*.43);shell(r*1.04,side<0?color:accent,.44,-.68,.68,.13);ctx.restore()}}
      else if(art==='shadow'){for(let i=0;i<2;i++){ctx.save();ctx.translate(-r*i*.54,-r*i*.22);wedge(r*1.34,r*.14,color,.42-i*.15);ctx.restore()}}
      else{const reach=art==='draw'?1.48:art==='moon'?1.30:1.19;ctx.save();ctx.rotate((Number(t.swordFxAngle)||angle)-angle);shell(r*reach,art==='draw'?accent:color,.58,art==='moon'?-.2:-1.3,art==='moon'?2.8:.88,art==='draw'?.21:.12);ctx.restore()}
    }else if(kind==='chrono'){
      const state=t.chronoState||'idle';if(state==='idle')return;
      if(state==='releaseRush'){ctx.save();ctx.translate(r*.65,0);wedge(r*1.22,r*.12,accent,.64);ctx.restore();wake(r,speed,color,.21)}
      else{const closing=state==='stop'?1:state==='releaseCharge'?.65:.40;for(let i=0;i<4;i++){ctx.save();ctx.rotate(i*Math.PI/2-angle);shell(r*(1.29-closing*.14),color,.25+closing*.18,-.39,.39,.11+closing*.09);ctx.restore()}}
    }else if(kind==='breaker'){
      const charge=u(Math.max(t.breakerCharge||t.counterCharge||0,t.breakerFx||0));for(const side of [-1,1]){ctx.save();ctx.translate(r*(.53+charge*.13),side*r*.41);ctx.rotate(-side*.19);wedge(r*(.54+charge*.35),r*.17,color,.24+charge*.33);ctx.restore()}if(t.breakerLungeWindow>0)wake(r,speed,color,.26);
    }else if(kind==='wooden'){
      if(!(t.woodAuraCooldown>0))return;const f=ctx.createRadialGradient(0,0,r*.66,0,0,r*1.43);f.addColorStop(0,'#d3b38300');f.addColorStop(.50,'#d3b38321');f.addColorStop(1,'#d3b38300');ctx.fillStyle=f;ctx.beginPath();ctx.ellipse(0,r*.19,r*1.43,r*.59,0,0,TAU);ctx.fill();grain(r*1.3,accent,.30,t.angle||0);
    }
  }
  function draw(t,kind){
    if(!active(t))return;
    const speed=Math.hypot(t.vx||0,t.vy||0),angle=speed>1?Math.atan2(t.vy,t.vx):Number(t.angle)||0;
    const lift=kind==='sky'?(t.skyJumpHeight||0)*24:0;
    ctx.save();try{ctx.translate(t.x,t.y-lift);ctx.rotate(angle);ctx.globalCompositeOperation='source-over';ctx.globalAlpha=reduced?.65:1;
      if(kind!=='colossus'&&(!t.phaseInvisible||kind==='phase'))motif(t,kind,t.r,.6,angle,speed);
      if(t.charmedBy&&!t.phaseInvisible){ctx.save();ctx.rotate((t.charmOrbitPhase||0)-angle);shell(t.r*1.17,t.charmedBy.c?.primary||'#ed83c6',.35,-.9,.9,.15);ctx.restore()}
      if(!t.phaseInvisible){
        const marks=clamp(t.breakerMarkCount||0,0,3),seal=u(t.breakerSealPulse),bite=u(t.breakerBiteFx);
        for(let i=0;i<marks;i++){ctx.save();ctx.rotate(-angle-Math.PI/2+(i-1)*.34);ctx.translate(t.r*1.12,0);wedge(t.r*.20,t.r*.05,t.breakerMarkColor||'#7cecff',.48);ctx.restore()}
        if(seal>.02||bite>.02){ctx.save();ctx.rotate(-angle);shell(t.r*1.16,t.breakerMarkColor||'#7cecff',.18+Math.max(seal,bite)*.35,-.88,.88,.12);ctx.rotate(Math.PI);shell(t.r*1.16,'#defaff',.12+bite*.36,-.88,.88,.12);ctx.restore()}
      }
      if(t.timeFrozenBy&&!t.phaseInvisible){ctx.rotate(-angle);shield(t.r*1.15,t.timeFrozenBy.c?.primary||'#a7e6ff',.28);ctx.rotate(Math.PI);shield(t.r*1.15,'#dcefff',.22)}
    }finally{ctx.restore()}
  }
  function bondKind(bond){return BONDS[bond?.key]||BONDS[bond?.core]||''}
  function bond(t){
    const b=t.relayCoreBondData;if(!b||!active(t)||t.phaseInvisible)return;
    const power=u(Math.max(t.relayBondSkillPulse||0,t.relayBondLocalFx||0)),shielded=t.relayBondShieldTimer>0,phased=t.relayBondPhaseTimer>0||t.relayBondAfterimage>0;
    if(power<.03&&!shielded&&!phased)return;
    const target=t.relayBondLocalTarget,dx=(target?.x??t.relayBondLocalTargetX)-t.x,dy=(target?.y??t.relayBondLocalTargetY)-t.y;
    const speed=Math.hypot(t.vx||0,t.vy||0),angle=Number.isFinite(dx)&&Number.isFinite(dy)?Math.atan2(dy,dx):Math.atan2(t.vy||0,t.vx||1),color=t.relayBondColor||b.color||t.c.primary;
    const partner=metaPresets[b.partnerKey],kind=bondKind(b),proxy={...t,c:{...t.c,primary:color,accent:partner?.primary||t.c.accent},skillModelBond:true};
    Object.assign(proxy,{charmCastPulse:power*1.8,skyJumpState:'direct',rageSkillState:'hunt',morphMode:shielded?'aegis':t.relayBondAdaptation||'swift',taijiMode:t.relayBondTaijiYang?'yang':'yin',swordState:'flash',swordArt:'flash',chronoState:'releaseRush',phaseInvisible:phased});
    ctx.save();try{ctx.translate(t.x,t.y);ctx.rotate(angle);ctx.globalAlpha=.35+power*.40;ctx.globalCompositeOperation='source-over';
      if(shielded)shield(t.r*1.29,color,.42);else if(phased)motif(proxy,'phase',t.r*1.1,power,angle,speed);else motif(proxy,kind,t.r*1.12,power,angle,speed);
    }finally{ctx.restore()}
  }
  function burst(fx,r,power,progress){
    const kind=fx.kind,proxy={c:{primary:fx.color,accent:fx.secondary,secondary:fx.secondary},omega:fx.spinSign,angle:0,energy:80,skillModelBond:fx.bond};
    const state=String(fx.state||'');Object.assign(proxy,{phaseInvisible:kind==='phase',charmCastPulse:power*1.8,skyJumpState:state||'direct',rageSkillState:state||'smashRush',rageSkillTimer:(1-progress)*.68,morphMode:state||'scan',taijiMode:state||'yang',taijiChi:power*100,swordState:state.split(':')[1]||'flash',swordArt:state.split(':')[0]||'flash',chronoState:state||'releaseRush',counterCharge:power,woodAuraCooldown:power,lastEnemyImpact:power*100});
    ctx.save();try{ctx.globalAlpha*=power*(kind==='phase'?.22:.55);motif(proxy,kind,r*.62,power,0,fx.speed||0)}finally{ctx.restore()}
  }
  window.ArenaSkillModels=Object.freeze({draw,bond,burst,bondKind});
  document.documentElement.dataset.skillModels='forge-v10';
})();
