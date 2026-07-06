((G)=>{
  const ui={
    panel:document.querySelector('.ball-panel'),
    rack:document.getElementById('ballRack'),
    name:document.getElementById('selectedBallName'),
    desc:document.getElementById('selectedBallDesc'),
    supplyFill:document.getElementById('ballSupplyFill'),
    supplyText:document.getElementById('ballSupplyText')
  };

  G.ballTypes={
    normal:{label:'標準',icon:'●',desc:'平衡型彈珠，可無限使用',r:9,speed:1,gravity:1,bounce:.72,pinScore:1,bumperMult:1,kick:1,energy:1,color:'#fff6d6',core:'#4ee9ff',trail:'78,233,255'},
    heavy:{label:'重力',icon:'⬢',desc:'體積較大，彩色轉盤得分 x2、彈跳較低',r:12,speed:.88,gravity:1.28,bounce:.5,pinScore:1,bumperMult:2,kick:.82,energy:1,color:'#ffd0aa',core:'#ff7a45',trail:'255,122,69'},
    speed:{label:'疾速',icon:'➤',desc:'尺寸小、速度快，撞釘得分 x3',r:7,speed:1.3,gravity:.88,bounce:.82,pinScore:3,bumperMult:1,kick:1.25,energy:1,color:'#d8fbff',core:'#4ee9ff',trail:'78,233,255'},
    lucky:{label:'幸運',icon:'★',desc:'撞彩色轉盤獲得雙倍 SLOT 能量，入槽可能補球',r:9,speed:1,gravity:1,bounce:.75,pinScore:1,bumperMult:1,kick:1,energy:2,color:'#fff1a6',core:'#ffd84d',trail:'255,216,77'},
    bomb:{label:'爆裂',icon:'✹',desc:'第一次撞到彩色轉盤時爆炸，額外得分與能量',r:10,speed:.95,gravity:1.05,bounce:.66,pinScore:1,bumperMult:1.15,kick:1.1,energy:1,color:'#ffd0d3',core:'#ff5a5f',trail:'255,90,95'},
    ghost:{label:'幽靈',icon:'◇',desc:'穿過大部分釘子，落空時不會重置 COMBO',r:8,speed:1.05,gravity:.9,bounce:.78,pinScore:1,bumperMult:1,kick:1,energy:1,color:'#eee8ff',core:'#a996ff',trail:'169,150,255'},
    magnet:{label:'磁力',icon:'⊕',desc:'接近彩色轉盤時會自動彎曲吸附',r:9,speed:1,gravity:1,bounce:.74,pinScore:1,bumperMult:1,kick:1.05,energy:1,color:'#d9ffe9',core:'#56e39f',trail:'86,227,159'},
    thunder:{label:'雷霆',icon:'⚡',desc:'免費超級彈珠：高速、撞釘 x3、轉盤 x2',r:11,speed:1.25,gravity:.95,bounce:.85,pinScore:3,bumperMult:2,kick:1.55,energy:2,color:'#fff39a',core:'#ff4f9a',trail:'255,79,154'}
  };

  const initialAmmo={heavy:3,speed:3,lucky:2,bomb:1,ghost:2,magnet:2};
  const specialKeys=Object.keys(initialAmmo);
  let ammo={...initialAmmo};
  let selected='normal';
  let supplyHits=0;
  const supplyNeed=12;
  let lastLevel=G.play?.level||1;
  const rewardedMissions=new WeakSet();

  function getCfg(type){return G.ballTypes[type]||G.ballTypes.normal}

  function randomSpecial(){return specialKeys[Math.floor(G.rand()*specialKeys.length)]}

  function updateBallUI(){
    if(!ui.rack)return;
    const cfg=getCfg(selected);
    ui.name.textContent=`${cfg.icon} ${cfg.label}彈珠`;
    ui.desc.textContent=cfg.desc;

    ui.rack.querySelectorAll('.ball-choice').forEach(button=>{
      const type=button.dataset.ball;
      const amount=type==='normal'?Infinity:(ammo[type]||0);
      button.classList.toggle('active',type===selected);
      button.classList.toggle('empty',amount<=0);
      button.setAttribute('aria-pressed',String(type===selected));
      const count=button.querySelector('.ball-count');
      if(count)count.textContent=type==='normal'?'∞':`×${amount}`;
    });

    ui.supplyFill.style.width=`${supplyHits/supplyNeed*100}%`;
    ui.supplyText.textContent=`${supplyHits}/${supplyNeed}`;
  }

  G.addBallAmmo=(type,amount=1,reason='彈珠補給')=>{
    if(!ammo.hasOwnProperty(type)||amount<=0)return;
    ammo[type]+=amount;
    const cfg=getCfg(type);
    G.ui.slotStatus.textContent=`${reason}：${cfg.icon} ${cfg.label} +${amount}`;
    updateBallUI();
  };

  function awardRandomBall(reason,amount=1){
    const type=randomSpecial();
    G.addBallAmmo(type,amount,reason);
    G.haptic(14);
  }

  G.selectBall=type=>{
    if(!G.ballTypes[type]||type==='thunder')return;
    if(type!=='normal'&&(ammo[type]||0)<=0){
      G.ui.marquee.textContent=`${getCfg(type).label}彈珠已用完，完成任務或撞擊補給可取得`;
      G.haptic(10);
      return;
    }
    selected=type;
    G.ui.marquee.textContent=`已裝填 ${getCfg(type).icon} ${getCfg(type).label}彈珠`;
    updateBallUI();
  };

  ui.rack?.addEventListener('click',event=>{
    const button=event.target.closest('.ball-choice');
    if(button)G.selectBall(button.dataset.ball);
  });

  const baseCollide=G.collide;
  G.collide=(ball,obj,extra=0)=>{
    const old=G.bounce;
    G.bounce=Number.isFinite(ball?.bounce)?ball.bounce:old;
    const hit=baseCollide(ball,obj,extra);
    G.bounce=old;
    return hit;
  };

  G.shouldHitPin=(ball,pin)=>{
    if(ball.type!=='ghost')return true;
    const value=(Math.floor(pin.x)*31+Math.floor(pin.y)*17+(ball.phaseSeed||0))%100;
    return value>=72;
  };

  G.applyBallForces=(ball,dt)=>{
    if(ball.type!=='magnet')return;
    let target=null,best=190;
    for(const bumper of G.bumpers){
      const dx=bumper.x-ball.x,dy=bumper.y-ball.y,d=Math.hypot(dx,dy);
      if(d<best){best=d;target=bumper}
    }
    if(!target||best<1)return;
    const force=(1-best/190)*.065*dt;
    ball.vx+=(target.x-ball.x)/best*force;
    ball.vy+=(target.y-ball.y)/best*force;
  };

  const baseBumperHit=G.onBumperHit;
  G.onBumperHit=(bumper,ball)=>{
    baseBumperHit?.(bumper,ball);

    supplyHits++;
    if(supplyHits>=supplyNeed){
      supplyHits-=supplyNeed;
      awardRandomBall('撞擊補給箱');
    }

    if(ball.type==='bomb'&&!ball.exploded){
      ball.exploded=true;
      G.directScore(500+(G.play?.level||1)*60,'✹ 爆裂 +BONUS',G.p.red);
      G.energy(2,'爆裂彈珠');
      G.particles(bumper.x,bumper.y,G.p.red,G.compact?34:60);
      G.s.shake=18;
      G.haptic([35,20,80]);
    }

    updateBallUI();
  };

  const baseFinish=G.finish;
  G.finish=ball=>{
    const landed=G.slots.some(slot=>ball.x>=slot.x&&ball.x<slot.x+slot.w&&ball.y>slot.y-5);
    const oldCombo=G.s.combo;
    baseFinish(ball);

    if(ball.type==='ghost'&&!landed){
      G.s.combo=oldCombo;
      G.ui.marquee.textContent=`◇ 幽靈彈珠穿越落空，COMBO x${oldCombo} 保留`;
    }

    if(ball.type==='lucky'&&landed){
      G.energy(1,'幸運彈珠加成');
      if(G.rand()<.28){
        G.s.balls++;
        G.ui.marquee.textContent='★ 幸運彈珠觸發：額外補回 1 顆球！';
      }
    }

    G.updateHud();
  };

  G.launch=()=>{
    const s=G.s;
    const free=s.superShots>0;
    let type=free?'thunder':selected;

    if(!free&&s.balls<=0){
      G.ui.marquee.textContent=s.ballsLive.length?'等待最後的彈珠落下！':'彈珠用完了，按重新開始！';
      return;
    }

    if(!free&&type!=='normal'&&(ammo[type]||0)<=0){
      type='normal';
      selected='normal';
    }

    const cfg=getCfg(type);

    if(free)s.superShots--;
    else{
      s.balls--;
      if(type!=='normal'){
        ammo[type]--;
        if(ammo[type]<=0)selected='normal';
      }
    }

    const speed=cfg.speed||1;
    const ball={
      type,
      label:cfg.label,
      x:655,
      y:790,
      vx:(-.65-Math.random()*.28)*speed,
      vy:(-11.5-s.power*9)*speed,
      r:cfg.r,
      gravityMul:cfg.gravity,
      bounce:cfg.bounce,
      pinScore:cfg.pinScore,
      bumperMult:cfg.bumperMult,
      kick:cfg.kick,
      energyPerBumper:cfg.energy,
      color:cfg.color,
      core:cfg.core,
      trailColor:cfg.trail,
      alive:true,
      trail:[],
      super:type==='thunder',
      exploded:false,
      phaseSeed:Math.floor(G.rand()*9999)
    };

    s.ballsLive.push(ball);
    G.particles(655,790,cfg.core,type==='thunder'?14:(G.compact?6:10));
    G.haptic(type==='thunder'?[12,20,22]:7);
    G.ui.marquee.textContent=`${cfg.icon} ${cfg.label}彈珠發射！`;
    G.updateHud();
    updateBallUI();
  };

  const basePlayTick=G.playTick;
  G.playTick=()=>{
    basePlayTick?.();

    const level=G.play?.level||1;
    if(level>lastLevel){
      awardRandomBall(`LEVEL ${level} 補給`,Math.max(1,level-lastLevel));
      lastLevel=level;
    }

    const mission=G.play?.mission;
    if(mission?.completed&&!rewardedMissions.has(mission)){
      rewardedMissions.add(mission);
      awardRandomBall('任務彈珠箱');
    }
  };

  const baseApplySlot=G.applySlot;
  G.applySlot=result=>{
    baseApplySlot(result);
    const triple=result[0]===result[1]&&result[1]===result[2];
    if(!triple)return;

    const rewards={
      '7':['lucky',2],
      '★':['lucky',2],
      '♛':['ghost',2],
      '⚡':['speed',3],
      '♥':['magnet',2],
      '◆':['heavy',2],
      '●':['bomb',2]
    };
    const reward=rewards[result[0]];
    if(reward)G.addBallAmmo(reward[0],reward[1],'老虎機彈珠獎勵');
  };

  const baseReset=G.reset;
  G.reset=()=>{
    baseReset();
    ammo={...initialAmmo};
    selected='normal';
    supplyHits=0;
    lastLevel=1;
    updateBallUI();
  };

  G.getSelectedBall=()=>selected;
  G.getBallAmmo=()=>({...ammo});
  updateBallUI();
})(window.PG);
