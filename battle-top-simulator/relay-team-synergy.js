/* Relay Team Synergy V1: named two-top combinations grant persistent team bonuses */
(() => {
  const state=window.__relayBattleState;
  if(!state)return;

  const $q=selector=>document.querySelector(selector);
  const textOf=c=>`${c?.preset||''} ${c?.name||''} ${c?.englishName||''} ${c?.label||''} ${c?.shape||''}`.toLowerCase();
  const named=(...tokens)=>c=>tokens.some(token=>textOf(c).includes(token.toLowerCase()));
  const flagged=flag=>c=>!!c?.[flag];
  const pairMatch=(pair,a,b)=>pair.length===2&&((a(pair[0])&&b(pair[1]))||(a(pair[1])&&b(pair[0])));

  const isSky=flagged('skyPouncer');
  const isAero=named('aero pegasus','aeropegasus');
  const isCobalt=named('cobalt dragoon','cobaltdragoon');
  const isMeteor=named('meteor dragoon','meteordragoon');
  const isKnight=c=>c?.shape==='mail'||named('knight mail','knightt1')(c);
  const isGolem=c=>c?.shape==='golem'||named('golem rock','golemt1')(c);
  const isWizard=named('wizard rod','wizardrod');
  const isWolf=named('silver wolf','silverwolf');
  const isShark=c=>c?.shape==='shark'||named('shark scale','sharkscale')(c);
  const isWhale=c=>c?.shape==='whale'||named('whale wave','whalet1')(c);
  const isPhoenix=c=>c?.shape==='phoenix'||named('phoenix wing','phoenixt1')(c);
  const isTyranno=c=>c?.shape==='tyranno'||named('tyranno beat','tyrannot1')(c);
  const isSword=flagged('sevenSword');
  const isChrono=flagged('timeStopEngine');
  const isTaiji=c=>!!(c?.taijiV2||c?.taijiMystic||c?.taijiWheel);

  const SYNERGIES=[
    {
      key:'skyWings',name:'蒼穹雙翼',color:'#6fe7ff',icon:'翼',
      match:pair=>pairMatch(pair,isSky,isAero),
      detail:'攻擊 +5、耐力 +4、發射速度 +8%、轉速損失回收 8%',
      stats:{a:5,s:4},launch:1.08,spinRetention:.08,tiltDamping:.10
    },
    {
      key:'twinDragons',name:'雙龍逆流',color:'#7f89ff',icon:'龍',
      match:pair=>pairMatch(pair,isCobalt,isMeteor),
      detail:'攻擊 +5、耐力 +5、初始自轉 +5%、轉速損失回收 12%',
      stats:{a:5,s:5},spinStart:1.05,spinRetention:.12,impact:20
    },
    {
      key:'stoneFortress',name:'雙岩城塞',color:'#d6a56b',icon:'城',
      match:pair=>pairMatch(pair,isKnight,isGolem),
      detail:'防禦 +7、爆裂抗性 +6、重量 +3，減少 15% 爆裂累積',
      stats:{d:7,b:6,w:3},burstGuard:.15,tiltDamping:.42
    },
    {
      key:'eternalOrbit',name:'永續旋環',color:'#a9f2ff',icon:'環',
      match:pair=>pairMatch(pair,isWizard,isWolf),
      detail:'耐力 +7、防禦 +3、轉速損失回收 15%、低轉速穩定提升',
      stats:{s:7,d:3},spinRetention:.15,tiltDamping:.28
    },
    {
      key:'abyssTide',name:'深海獵潮',color:'#38cfe8',icon:'潮',
      match:pair=>pairMatch(pair,isShark,isWhale),
      detail:'攻擊 +7、重量 +3、發射速度 +8%，初次衝擊強化',
      stats:{a:7,w:3},launch:1.08,impact:34,spinRetention:.04
    },
    {
      key:'blazingTyrant',name:'赤焰暴龍',color:'#ff8a4d',icon:'炎',
      match:pair=>pairMatch(pair,isPhoenix,isTyranno),
      detail:'攻擊 +6、重量 +3、發射速度 +7%、爆發衝擊 +26',
      stats:{a:6,w:3},launch:1.07,impact:26,burstGuard:.05
    },
    {
      key:'swordAegis',name:'七曜鐵壁',color:'#9bdcff',icon:'盾',
      match:pair=>pairMatch(pair,isSword,isKnight),
      detail:'攻擊 +4、防禦 +6、爆裂抗性 +5，格擋與穩定性提升',
      stats:{a:4,d:6,b:5},burstGuard:.10,tiltDamping:.34,impact:12
    },
    {
      key:'chronoArcane',name:'時輪法陣',color:'#9c8cff',icon:'時',
      match:pair=>pairMatch(pair,isChrono,isWizard),
      detail:'耐力 +5、防禦 +4、爆裂抗性 +3、轉速損失回收 10%',
      stats:{s:5,d:4,b:3},spinRetention:.10,tiltDamping:.20
    },
    {
      key:'yinMoon',name:'陰陽銀月',color:'#c8ffe9',icon:'月',
      match:pair=>pairMatch(pair,isTaiji,isWolf),
      detail:'防禦 +5、耐力 +5，轉速損失回收 8%、傾斜抑制提升',
      stats:{d:5,s:5},spinRetention:.08,tiltDamping:.48,burstGuard:.06
    }
  ];

  const activeSynergies=[null,null];
  const teamLead=team=>team===0?cfg.p1:cfg.p2;
  const teamPair=team=>{
    const lead=teamLead(team);
    if(!lead||lead.relayDoubleSlot)return lead?[lead]:[];
    const key=state.reserveKeys?.[team];
    const reserve=key&&metaPresets?.[key]?{...metaPresets[key],preset:key}:null;
    return reserve?[lead,reserve]:[lead];
  };
  const findSynergy=pair=>SYNERGIES.find(synergy=>synergy.match(pair))||null;
  const currentSynergy=team=>findSynergy(teamPair(team));

  function boostedData(data,synergy){
    const c={...data};
    if(!synergy)return c;
    Object.entries(synergy.stats||{}).forEach(([key,value])=>c[key]=clamp((c[key]||0)+value,0,100));
    c.relayTeamSynergy=synergy.key;
    c.relayTeamSynergyName=synergy.name;
    return c;
  }

  function renderSynergyCard(team){
    const host=$q(team===0?'#p1':'#p2');
    if(!host)return;
    host.querySelector(':scope > .relay-synergy-card')?.remove();
    if($q('#relayBattleMode')?.value!=='relay')return;
    const synergy=currentSynergy(team);
    if(!synergy)return;
    const card=document.createElement('div');
    card.className='relay-synergy-card';
    card.style.setProperty('--synergy-color',synergy.color);
    card.innerHTML=`<div class="relay-synergy-mark">${synergy.icon}</div><div><strong>隊伍羈絆・${synergy.name}</strong><p>${synergy.detail}</p></div>`;
    const reserve=host.querySelector(':scope > .relay-reserve-box');
    if(reserve)host.insertBefore(card,reserve);else host.appendChild(card);
  }
  function renderAllSynergies(){renderSynergyCard(0);renderSynergyCard(1)}

  const previousRenderPanel=renderPanel;
  renderPanel=function(id){
    previousRenderPanel(id);
    queueMicrotask(()=>renderSynergyCard(id==='p1'?0:1));
  };

  document.addEventListener('change',event=>{
    if(event.target.matches('#relayBattleMode,.relay-reserve-select,[data-k="preset"]'))setTimeout(renderAllSynergies,0);
  },true);

  const PreviousTop=Top;
  Top=class Top extends PreviousTop{
    constructor(index,data){
      const team=index?1:0,synergy=activeSynergies[team];
      super(index,boostedData(data,synergy));
      this.relaySynergy=synergy?.key||'';
      this.relaySynergyName=synergy?.name||'';
      this.relaySynergyColor=synergy?.color||'';
      this.relaySynergyPulse=synergy?1:0;
      this.relaySynergyData=synergy||null;
      if(synergy){
        const launch=synergy.launch||1;
        this.vx*=launch;this.vy*=launch;
        if(synergy.spinStart){this.omega*=synergy.spinStart;this.spin=this.omega;this.omega0=Math.max(Math.abs(this.omega),Math.abs(this.omega0||0))}
        if(synergy.impact)this.impactBoost=Math.max(this.impactBoost||0,synergy.impact);
      }
    }
    update(dt,opponent){
      const beforeOmega=this.omega||0,beforeBurst=this.burstMeter||0;
      super.update(dt,opponent);
      const synergy=this.relaySynergyData;
      this.relaySynergyPulse=Math.max(0,(this.relaySynergyPulse||0)-dt*.24);
      if(!synergy||this.out||this.burst||this.skyStaminaDefeated||this.skyEnergyDepletedLatch||(this.energy||0)<=0)return;
      const absBefore=Math.abs(beforeOmega),absAfter=Math.abs(this.omega||0);
      if(synergy.spinRetention&&absAfter<absBefore){
        const sign=Math.sign(this.omega)||Math.sign(beforeOmega)||1;
        const cap=Math.max(absBefore,Math.abs(this.omega0||absBefore)*1.10);
        this.omega=sign*Math.min(cap,absAfter+(absBefore-absAfter)*synergy.spinRetention);
        this.spin=this.omega;
      }
      if(synergy.burstGuard&&(this.burstMeter||0)>beforeBurst)this.burstMeter-=((this.burstMeter||0)-beforeBurst)*synergy.burstGuard;
      if(synergy.tiltDamping)this.tiltVel*=Math.exp(-synergy.tiltDamping*dt);
      if(synergy.key==='skyWings'&&this.c?.skyPouncer&&['climb','orbit','air','direct'].includes(this.skyJumpState)){
        this.energy=clamp((this.energy||0)+dt*.10,0,100);
      }
    }
    draw(){
      super.draw();
      if(!this.relaySynergy||this.out||this.burst)return;
      const pulse=.5+.5*Math.sin(time*4.6),strong=Math.min(1,this.relaySynergyPulse||0);
      ctx.save();ctx.translate(this.x,this.y);ctx.rotate(time*.24*(this.index?1:-1));ctx.globalCompositeOperation='screen';
      ctx.strokeStyle=alpha(this.relaySynergyColor,.16+pulse*.10+strong*.24);ctx.lineWidth=1.2+strong*1.5;ctx.shadowBlur=10+strong*10;ctx.shadowColor=this.relaySynergyColor;
      ctx.setLineDash([4,7]);ctx.beginPath();ctx.arc(0,0,this.r*(1.40+pulse*.04),0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
      for(let i=0;i<2;i++){const a=i*Math.PI;ctx.beginPath();ctx.arc(Math.cos(a)*this.r*1.22,Math.sin(a)*this.r*1.22,this.r*.12,0,Math.PI*2);ctx.fillStyle=alpha(this.relaySynergyColor,.28+strong*.30);ctx.fill()}
      ctx.restore();
    }
  };

  const start=$q('#start');
  const previousStart=start?.onclick;
  if(start)start.onclick=()=>{
    if($q('#relayBattleMode')?.value==='relay'){
      activeSynergies[0]=currentSynergy(0);activeSynergies[1]=currentSynergy(1);
    }else activeSynergies[0]=activeSynergies[1]=null;
    const result=previousStart?.();
    if(running){
      const active=activeSynergies.map((synergy,team)=>synergy?`${team===0?'藍隊':'紅隊'}「${synergy.name}」`:null).filter(Boolean);
      if(active.length){
        const log=$q('#log'),base=log?.textContent||'';
        addLog(`${base}${base?'｜':''}隊伍羈絆啟動：${active.join('、')}！`);
      }
    }
    return result;
  };

  const style=document.createElement('style');
  style.textContent=`
    .relay-synergy-card{--synergy-color:#9fe8ff;display:flex;align-items:center;gap:10px;margin:10px 0 0;padding:10px 11px;border:1px solid color-mix(in srgb,var(--synergy-color) 48%,transparent);border-left:3px solid var(--synergy-color);border-radius:14px;background:linear-gradient(135deg,color-mix(in srgb,var(--synergy-color) 13%,transparent),#ffffff04);box-shadow:inset 0 0 22px color-mix(in srgb,var(--synergy-color) 8%,transparent)}
    .relay-synergy-mark{display:grid;place-items:center;flex:0 0 34px;width:34px;height:34px;border-radius:50%;border:1px solid color-mix(in srgb,var(--synergy-color) 55%,transparent);background:color-mix(in srgb,var(--synergy-color) 13%,#101625);color:#fff;font-size:15px;font-weight:1000;box-shadow:0 0 16px color-mix(in srgb,var(--synergy-color) 22%,transparent)}
    .relay-synergy-card strong{display:block;color:#fff;font-size:12px}.relay-synergy-card p{margin:3px 0 0;color:#aebbd1;font-size:10px;line-height:1.45}
  `;
  document.head.appendChild(style);
  setTimeout(renderAllSynergies,0);
  window.__relayTeamSynergy={definitions:SYNERGIES,active:activeSynergies,currentSynergy};
  document.documentElement.dataset.relayTeamSynergy='v1';
})();
