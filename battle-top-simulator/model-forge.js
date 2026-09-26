/* Layered battle models: shared, deterministic Canvas geometry for arena and loadout. */
(() => {
  const TAU=Math.PI*2,unit=v=>clamp(Number(v)||0,0,1);
  // [segments, blade reach, sweep, hub size, chassis depth]; silhouettes stay inside collision scale.
  const PROFILES={
    balanced:[6,.94,.12,.36,.16],shark:[5,1.04,.36,.30,.14],rod:[6,.98,.04,.46,.18],
    pegasus:[4,1.06,.29,.33,.15],dran:[3,1.07,.40,.30,.18],dragoon:[4,1.04,-.32,.35,.18],
    wolf:[7,.98,.08,.43,.22],meteor:[4,1.03,-.22,.36,.19],phoenix:[3,1.06,.33,.32,.18],
    tyranno:[3,1.07,.16,.31,.22],mail:[5,1.00,.02,.42,.25],whale:[3,1.02,-.14,.39,.24],golem:[6,.98,.02,.43,.28],
    breaker:[3,1.07,.38,.30,.19],wooden:[12,.97,0,.30,.25],twinNova:[6,1.02,.15,.45,.18],
    twinNovaChild:[3,1.03,.20,.43,.16],skyPouncer:[3,1.06,.38,.29,.14],mirageChameleon:[6,.98,-.21,.38,.15],
    enchantressSiren:[5,1.01,.29,.39,.16],bloodrageBerserker:[4,1.06,.11,.35,.27],
    omniObserver:[6,1.01,.14,.40,.20],taijiMysticWheel:[8,.99,.03,.48,.17],
    sevenfoldSword:[7,1.04,.30,.31,.15],chronoClock:[12,.99,.02,.47,.21],worldpressColossus:[6,1.03,.02,.42,.32]
  };
  function path(g,points){g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath()}
  function disc(g,x,y,r,color){g.fillStyle=color;g.beginPath();g.arc(x,y,Math.max(.001,r),0,TAU);g.fill()}
  function ring(g,r,w,color){g.strokeStyle=color;g.lineWidth=w;g.beginPath();g.arc(0,0,r,0,TAU);g.stroke()}
  function linear(g,r,a,b,c){const f=g.createLinearGradient(-r,-r,r,r);f.addColorStop(0,a);f.addColorStop(.46,b);f.addColorStop(1,c);return f}
  function lens(g,x,y,r,color){
    const f=g.createRadialGradient(x-r*.32,y-r*.38,r*.03,x,y,r);
    f.addColorStop(0,'#f3ffff');f.addColorStop(.18,color);f.addColorStop(.64,color);f.addColorStop(1,'#07111f');
    disc(g,x,y,r,f);disc(g,x-r*.25,y-r*.30,r*.14,'#ffffffc9');
  }
  function outline(g,r,p,dir){
    const [count,reach,sweep]=p,points=[];
    for(let i=0;i<count;i++)for(const [phase,depth] of [[0,.76],[.18,reach],[.56,reach*.98],[.83,.80]]){
      const a=(i+phase)*TAU/count+sweep*dir*(depth-.72);points.push([Math.cos(a)*r*depth,Math.sin(a)*r*depth]);
    }
    path(g,points);
  }
  function petals(g,r,count,primary,secondary,angle,spread=0,sweep=.16){
    for(let i=0;i<count;i++){
      const a=i*TAU/count,lit=.5+.5*Math.cos(a+angle+2.3);
      g.save();g.rotate(a);g.translate(spread*r,0);
      path(g,[[r*.34,-r*.14],[r*.68,-r*.22],[r*.93,-r*sweep],[r*.81,r*.15],[r*.47,r*.19]]);
      g.fillStyle=linear(g,r,lit>.62?'#c1ccd6':secondary,primary,'#101824');g.fill();
      path(g,[[r*.68,-r*.22],[r*.93,-r*sweep],[r*.84,-r*sweep+r*.055],[r*.59,-r*.15]]);
      g.fillStyle=`rgba(241,250,255,${.18+lit*.48})`;g.fill();
      path(g,[[r*.48,r*.10],[r*.78,r*.08],[r*.81,r*.15],[r*.47,r*.19]]);g.fillStyle='#02060a88';g.fill();g.restore();
    }
  }
  function core(g,t,r,p,angle){
    const c=t.c,shape=c.shape,primary=c.primary||'#50cfff',secondary=c.secondary||'#283d6f',accent=c.accent||'#ecf7ff',hub=r*p[3];
    disc(g,0,0,hub+r*.065,'#09111b');ring(g,hub+r*.035,r*.045,linear(g,r,'#edf4f9','#6f7d8b','#202b39'));
    disc(g,0,0,hub,linear(g,r,secondary,'#14212e','#03080e'));
    if(shape==='twinNova'||shape==='twinNovaChild'){
      const child=!!t.splitPart||shape==='twinNovaChild';
      if(child){lens(g,0,0,hub*.72,t.splitPart==='β'?secondary:primary);if(t.twinInheritanceMode==='guardian'){ring(g,hub*.91,r*.05,accent)}
        if(t.twinInheritanceMode==='hunter'){path(g,[[hub*.3,-hub*.55],[hub*.95,0],[hub*.3,hub*.55]]);g.fillStyle=accent;g.fill()}}
      else{g.save();g.rotate(-angle*.12);lens(g,-hub*.40,0,hub*.49,primary);lens(g,hub*.40,0,hub*.49,secondary);g.fillStyle='#dce8f5';g.fillRect(-r*.025,-hub*.76,r*.05,hub*1.52);g.restore()}
    }else if(shape==='chronoClock'){
      for(let i=0;i<12;i++){g.save();g.rotate(i*TAU/12);g.fillStyle=i%3?primary:accent;g.fillRect(-r*.016,-hub*.89,r*.032,hub*(i%3?.10:.19));g.restore()}
      const stopped=t.chronoState==='stop'||t.timeFrozenBy,clockAngle=stopped?-Math.PI/2:angle*.16;
      g.save();g.rotate(clockAngle-angle);path(g,[[-r*.025,r*.05],[0,-hub*.71],[r*.025,r*.05]]);g.fillStyle=accent;g.fill();g.rotate(1.8);g.fillRect(-r*.022,-hub*.49,r*.044,hub*.52);g.restore();lens(g,0,0,r*.09,primary);
    }else if(shape==='taijiMysticWheel'){
      const rr=hub*.89;g.save();g.rotate(-angle*.14);disc(g,0,0,rr,'#dce9e5');g.fillStyle='#172428';g.beginPath();g.arc(0,0,rr,Math.PI/2,Math.PI*1.5);g.arc(0,-rr*.5,rr*.5,-Math.PI/2,Math.PI/2);g.arc(0,rr*.5,rr*.5,-Math.PI/2,Math.PI/2,true);g.fill();disc(g,0,-rr*.5,rr*.14,'#dce9e5');disc(g,0,rr*.5,rr*.14,primary);g.restore();
    }else if(shape==='mirageChameleon'){
      g.save();g.rotate(-angle*.24);path(g,[[-hub*.92,0],[-hub*.30,-hub*.54],[hub*.65,-hub*.32],[hub*.94,0],[hub*.35,hub*.52],[-hub*.56,hub*.31]]);g.fillStyle=linear(g,hub,accent,primary,secondary);g.fill();lens(g,hub*.1,0,hub*.36,secondary);g.restore();
    }else if(shape==='enchantressSiren'){
      g.save();g.rotate(-.4);g.fillStyle=accent;g.beginPath();g.arc(0,0,hub*.83,-1.3,1.3);g.arc(hub*.38,0,hub*.62,1.4,-1.4,true);g.closePath();g.fill();lens(g,-hub*.18,0,hub*.34,primary);g.restore();
    }else if(shape==='omniObserver'){
      g.save();g.rotate(-angle*.2);for(let i=0;i<6;i++){g.save();g.rotate(i*TAU/6);path(g,[[r*.025,0],[hub*.85,-hub*.16],[hub*.45,hub*.62]]);g.fillStyle=i%2?secondary:primary;g.fill();g.restore()}lens(g,0,0,hub*.34,accent);g.restore();
    }else if(shape==='bloodrageBerserker'){
      const heat=unit((t.rageStageSeen||0)/4);path(g,[[-hub*.72,-hub*.66],[hub*.72,-hub*.66],[hub*.46,hub*.62],[0,hub*.87],[-hub*.46,hub*.62]]);g.fillStyle=linear(g,hub,'#77838a','#202934','#080d15');g.fill();
      for(const side of [-1,1]){path(g,[[side*hub*.12,-hub*.1],[side*hub*.68,-hub*.3],[side*hub*.53,hub*.12],[side*hub*.13,hub*.26]]);g.fillStyle=heat>.55?'#fff0ae':primary;g.fill()}
    }else if(shape==='worldpressColossus'){
      g.save();g.rotate(Math.PI/6);path(g,Array.from({length:6},(_,i)=>[Math.cos(i*TAU/6)*hub*.86,Math.sin(i*TAU/6)*hub*.86]));g.fillStyle=linear(g,hub,accent,secondary,'#121322');g.fill();g.restore();lens(g,0,0,hub*.43,primary);
    }else if(shape==='wooden'){
      disc(g,0,0,hub,linear(g,hub,'#f3d7a6','#bc8347','#59331a'));disc(g,0,0,hub*.30,'#6e472d');
    }else{
      const n=shape==='sevenfoldSword'?7:shape==='skyPouncer'?3:shape==='breaker'?3:4;
      g.save();g.rotate(.25);path(g,Array.from({length:n*2},(_,i)=>{const a=i*Math.PI/n,rr=hub*(i%2?.42:.88);return [Math.cos(a)*rr,Math.sin(a)*rr]}));g.fillStyle=linear(g,hub,accent,primary,secondary);g.fill();lens(g,0,0,hub*.30,accent);g.restore();
    }
  }
  function mechanisms(g,t,r,p,angle){
    const c=t.c,primary=c.primary||'#50cfff',accent=c.accent||'#fff',shape=c.shape;
    // Each moving part is mounted to the chassis; animation uses existing gameplay state only.
    if(shape==='skyPouncer'){
      const lift=unit((t.skyJumpHeight||0)/1.35);for(const side of [-1,1]){g.save();g.rotate(side*(.34+lift*.30));path(g,[[r*.10,side*r*.22],[-r*.54,side*r*(.64+lift*.20)],[-r*.95,side*r*(.39+lift*.20)],[-r*.38,side*r*.24]]);g.fillStyle=linear(g,r,accent,primary,'#18334c');g.fill();g.restore()}
    }else if(shape==='bloodrageBerserker'){
      const power=unit((t.rageStageSeen||0)/4),charge=t.rageSkillState==='smashCharge',rush=t.rageSkillState==='smashRush';
      for(let i=0;i<4;i++){g.save();g.rotate(i*Math.PI/2);g.translate(r*(charge?-.045:rush?.065:0),0);path(g,[[r*.58,-r*.14],[r*.95,-r*.18],[r*.98,r*.16],[r*.63,r*.20]]);g.fillStyle=linear(g,r,'#9aa2a8','#39404a','#171b25');g.fill();g.fillStyle=power>.55?'#ffe0a0':primary;g.fillRect(r*.64,-r*.07,r*.20,r*(.035+power*.05));g.restore()}
    }else if(shape==='sevenfoldSword'){
      const arts=['flash','moon','pierce','swallow','shadow','draw','guard'],selected=Math.max(0,arts.indexOf(t.swordArt)),engaged=t.swordState&&t.swordState!=='idle';
      for(let i=0;i<7;i++){g.save();g.rotate(i*TAU/7);const reach=r*(.95+(engaged&&i===selected?.13:0));path(g,[[r*.48,-r*.052],[reach,-r*.065],[reach+r*.08,0],[reach,r*.065],[r*.48,r*.052]]);g.fillStyle=i===selected?linear(g,r,accent,primary,'#4f6e88'):'#b0bfcb';g.fill();g.restore()}
    }else if(shape==='worldpressColossus'){
      const crouch=t.colossusSkillState==='quakeCrouch'?unit(1-(t.colossusQuakeWindup||0)/.22):0,vortex=unit(t.colossusVortexStrength);
      for(let i=0;i<6;i++){g.save();g.rotate(i*TAU/6-vortex*.12);g.fillStyle='#0b0c13';g.fillRect(r*.53,-r*.12,r*.38,r*.24);g.fillStyle=linear(g,r,accent,'#8b819c','#373142');g.fillRect(r*(.59-crouch*.04),-r*.105,r*.28,r*.21);g.fillStyle=primary;g.fillRect(r*.60,-r*.03,r*(.16+vortex*.08),r*.06);g.restore()}
    }else if(shape==='wooden'){
      for(let i=0;i<5;i++){g.save();g.translate(r*.018*Math.sin(i),r*.012*Math.cos(i));ring(g,r*(.40+i*.105),r*.012,i%2?'#e6b97966':'#58341988');g.restore()}ring(g,r*.77,r*.055,'#8b2826');
    }else if(shape==='mirageChameleon'){
      for(let i=0;i<3;i++){g.save();g.rotate(i*TAU/3);path(g,[[r*.44,-r*.12],[r*.76,-r*.21],[r*.86,r*.04],[r*.48,r*.12]]);g.fillStyle=linear(g,r,accent,primary,c.secondary);g.fill();g.restore()}
    }
    if(t.relayCoreBondData){const power=unit(Math.max(t.relayBondSkillPulse||0,t.relayBondLocalFx||0));for(const side of [-1,1])lens(g,side*r*.56,0,r*(.065+power*.035),side<0?t.relayBondColor||primary:c.secondary||primary)}
  }
  function render(g,t){
    if(!t?.c||t.out||t.burst)return;
    const c=t.c,r=Math.max(2,Number(t.r)||18),angle=Number(t.angle)||0,dir=c.spin==='L'?-1:1,p=PROFILES[c.shape]||PROFILES.balanced;
    const primary=c.primary||'#50cfff',secondary=c.secondary||'#283d6f',metal=c.metal||'#b9c8d4';
    const tilt=clamp(Number(t.tilt)||0,0,.92),precession=Number(t.precession)||0,depth=r*p[4],wood=c.shape==='wooden';
    g.save();
    try{
      g.translate(Number(t.x)||0,Number(t.y)||0);
      // Must be the FIRST fill: existing jump wrappers suppress precisely this ground shadow.
      g.save();g.translate(r*.10,r*.24);g.scale(1,.46);const sh=g.createRadialGradient(0,0,r*.16,0,0,r*1.26);sh.addColorStop(0,c.skyPouncer&&t.skyJumpHeight>0?'#00000000':'#00000099');sh.addColorStop(1,'#00000000');disc(g,0,0,r*1.26,sh);g.restore();
      g.translate(Math.cos(precession)*tilt*r*.12,-depth*.34+Math.sin(precession)*tilt*r*.12);
      g.scale(1,1-tilt*.28);
      // Axle and underside remain visible along the lower lip.
      disc(g,0,depth*.70,r*.42,linear(g,r,'#8496a4','#263442','#091018'));
      for(const offset of [depth,depth*.48,0]){g.save();g.translate(0,offset);g.rotate(angle);outline(g,r,p,dir);g.fillStyle=offset?linear(g,r,wood?'#a27242':'#7b8997',wood?'#523119':'#323e4c','#080e17'):linear(g,r,wood?'#e4bc82':'#f0f5f8',wood?'#a86e38':metal,wood?'#68401e':'#4b5c6e');g.fill();g.restore()}
      g.save();g.rotate(angle);
      let spread=0,count=p[0],sweep=p[2];
      if(c.adaptiveMorph){const mode=t.morphMode||'scan';spread=mode==='aegis'?.015:mode==='reaper'?.07:mode==='viper'?.055:mode==='swift'?-.045:0;count=mode==='reaper'?3:mode==='viper'?4:p[0];sweep=mode==='aegis'?.03:mode==='swift'?.35:p[2]}
      if(!wood)petals(g,r,count,primary,secondary,angle,spread,sweep*dir);
      mechanisms(g,t,r,p,angle);core(g,t,r,p,angle);
      // Recessed fasteners sit outside the hub and catch the same fixed key light.
      if(!wood)for(let i=0;i<Math.min(6,p[0]);i++){const a=i*TAU/Math.min(6,p[0]),x=Math.cos(a)*r*.54,y=Math.sin(a)*r*.54;disc(g,x,y,r*.028,'#0c1420');disc(g,x-r*.007,y-r*.009,r*.012,'#a7b7c4')}
      g.restore();
      // Two small rim highlights, never a full neon outline.
      g.strokeStyle=wood?'#f4d6a066':'#e6f3ff88';g.lineWidth=r*.018;g.beginPath();g.arc(0,0,r*.96,3.72,4.60);g.stroke();
      if(t.team){g.strokeStyle=alpha(t.team,.48);g.lineWidth=r*.038;g.beginPath();g.arc(0,depth*.40,r*.88,.45,1.15);g.stroke()}
    }finally{g.restore()}
  }
  window.ArenaModels=Object.freeze({render,profiles:PROFILES});
  VisualTop.prototype.drawModel=function(){render(ctx,this)};

  function refreshPreview(id){
    const host=document.querySelector('#'+id+' .model-preview'),c=cfg[id];if(!host||!c)return;
    host.classList.add('forged-preview');host.dataset.mark='';
    let canvas=host.querySelector('canvas');if(!canvas){canvas=document.createElement('canvas');canvas.width=520;canvas.height=240;canvas.setAttribute('role','img');host.replaceChildren(canvas)}
    canvas.setAttribute('aria-label',c.name+' 陀螺模型');const g=canvas.getContext('2d');if(!g)return;g.clearRect(0,0,520,240);
    render(g,{c,x:260,y:106,r:83,angle:-.36,energy:100,tilt:.16,precession:.5,team:id==='p1'?'#4acfff':'#ff5d83'});
  }
  const oldPanel=renderPanel;renderPanel=function(id){oldPanel(id);refreshPreview(id)};
  const style=document.createElement('style');style.textContent='.model-preview.forged-preview{height:154px;display:grid;place-items:center;background:radial-gradient(ellipse at 50% 65%,#23324570,transparent 64%),linear-gradient(145deg,#101b28,#070d17);overflow:hidden}.forged-preview:before,.forged-preview:after{display:none!important}.forged-preview canvas{display:block;width:100%;height:100%;object-fit:contain}';document.head.appendChild(style);
  for(const id of ['p1','p2']){refreshPreview(id);document.querySelector('#'+id)?.addEventListener('input',()=>refreshPreview(id))}
  document.documentElement.dataset.arenaModels='forge-v10';
})();
