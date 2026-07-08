const actionCaption=document.querySelector('#actionCaption');

const reactionLines={
  cat:{rare:'哇！貓掌抓到大獎了喵！',normal:'不錯喵，這個也很好！',retry:'還能再玩一次喵！',miss:'尾巴不要垂下來，下次一定行喵！'},
  bear:{rare:'熊熊一推就推出大獎！',normal:'穩穩拿下這一格！',retry:'再蓄一次力！',miss:'沒關係，熊熊陪你再挑戰。'},
  rabbit:{rare:'咻！大獎被我追到了！',normal:'速度剛剛好！',retry:'再跳一次！',miss:'剛剛跑過頭啦，下次更快！'},
  akira:{rare:'果然，勝負從第一手就決定了。',normal:'這是計算之內的結果。',retry:'局面還沒結束，再下一手。',miss:'失手也要記住，下一局會更準。'},
  sai:{rare:'啊！這就是神之一手的光芒！',normal:'命運落在這一格，也很美呢。',retry:'棋局尚未終結，再來一手吧！',miss:'唔……此局未成，下一手一定更精彩！'},
  lucy:{
    rare:'高價值目標已鎖定。資料寫入完成。',
    normal:'目標已解碼，結果已確認。',
    retry:'重新建立連線，準備再次掃描。',
    miss:'訊號受到干擾，重新校準後再試。'
  }
};

const reactionCaptions={
  rare:'JACKPOT REACTION',
  normal:'NICE LANDING',
  retry:'BONUS TURN',
  miss:'NEXT CHANCE'
};

const actionLabels={
  cat:'PAW POWER',
  bear:'HEAVY PUSH',
  rabbit:'SPEED RUSH',
  akira:'PRECISION READ',
  sai:'SPIRIT DRIVE',
  lucy:'NEURAL LINK'
};

characters.akira.description='雙轉型：第一次停下後，還會再精準補轉一次。';
characters.akira.start='先看第一個落點。';
characters.sai.description='加速型：輪盤不停變快，最後像落子般瞬間停止。';
characters.sai.start='輪盤啊，不斷加速吧！';

function setAction(text){
  if(actionCaption)actionCaption.textContent=text;
}

function outcomeType(winner){
  const name=winner.name.toLowerCase();
  if(/再抽|重抽|重來|try\s*again|again/.test(name))return'retry';
  if(/銘謝|謝謝|未中|沒中|落空|再接再厲|thanks|thank\s*you/.test(name))return'miss';
  const minimum=Math.min(...prizes.map(item=>item.probability));
  if(winner.probability<=Math.max(.1,minimum+1e-9))return'rare';
  return'normal';
}

function wait(ms){
  return new Promise(resolve=>setTimeout(resolve,ms));
}

function targetRotation(prize,extraLoops){
  const center=(prize.startDeg+prize.endDeg)/2;
  const target=(360-center)%360;
  const current=((rotation%360)+360)%360;
  const delta=(target-current+360)%360;
  return rotation+extraLoops*360+delta;
}

function animateWheel(to,duration,ease,options={}){
  const from=rotation;
  const tickStep=options.tickStep||12;
  const baseTone=options.baseTone||520;

  return new Promise(resolve=>{
    const started=performance.now();
    let lastTick=-1;

    function frame(now){
      const progress=Math.min((now-started)/duration,1);
      const eased=ease(progress);
      rotation=from+(to-from)*eased;
      canvas.style.transform=`rotate(${rotation}deg)`;

      const tick=Math.floor(rotation/tickStep);
      if(tick!==lastTick){
        lastTick=tick;
        const tone=options.tone
          ? options.tone(progress)
          : baseTone+Math.min(progress*240,240);
        beep(tone,options.beepLength||.024,options.volume||.025);
      }

      options.onProgress?.(progress);

      if(progress<1)requestAnimationFrame(frame);
      else{
        rotation=to;
        resolve();
      }
    }

    requestAnimationFrame(frame);
  });
}

function drawLucyLockOverlay(prize,intensity=1){
  draw();

  const size=canvas.width;
  const center=size/2;
  const radius=center-26;
  const start=-Math.PI/2+prize.startDeg*Math.PI/180;
  const end=-Math.PI/2+prize.endDeg*Math.PI/180;

  ctx.save();
  ctx.translate(center,center);
  ctx.beginPath();
  ctx.moveTo(0,0);
  ctx.arc(0,0,radius,start,end);
  ctx.closePath();

  ctx.shadowColor='#82e2bc';
  ctx.shadowBlur=12+30*intensity;
  ctx.fillStyle=`rgba(130,226,188,${.12+.22*intensity})`;
  ctx.fill();

  ctx.lineWidth=6+8*intensity;
  ctx.strokeStyle=`rgba(255,233,77,${.55+.45*intensity})`;
  ctx.stroke();

  ctx.restore();
}

function clearLucyLockOverlay(){
  draw();
}

function lockGame(){
  spinning=true;
  settingsPanel.open=false;
  spinBtn.disabled=updateBtn.disabled=true;
  characterGrid.querySelectorAll('button').forEach(button=>button.disabled=true);
  wheelBox.classList.remove(
    'reaction-rare',
    'reaction-normal',
    'reaction-retry',
    'reaction-miss',
    'sudden-stop',
    'lucy-scanning',
    'lucy-locking'
  );
  wheelBox.classList.add('is-spinning');
  wheelBox.style.setProperty('--charge','0');
  setAction(actionLabels[currentCharacter]||'SPINNING');
}

function unlockGame(){
  spinning=false;
  spinBtn.disabled=updateBtn.disabled=false;
  characterGrid.querySelectorAll('button').forEach(button=>button.disabled=false);
  wheelBox.classList.remove(
    'is-spinning',
    'sai-accelerating',
    'akira-second-spin',
    'lucy-hacking',
    'lucy-scanning',
    'lucy-locking'
  );
  wheelBox.style.removeProperty('--charge');
}

function showReaction(characterKey,winner){
  const type=outcomeType(winner);
  const lines=reactionLines[characterKey]||reactionLines.cat;
  const line=lines[type];

  helperBubble.textContent=line;
  setAction(reactionCaptions[type]);
  wheelBox.classList.remove(
    'reaction-rare',
    'reaction-normal',
    'reaction-retry',
    'reaction-miss'
  );
  wheelBox.classList.add(`reaction-${type}`);

  setTimeout(()=>{
    wheelBox.classList.remove(`reaction-${type}`);
    if(characterKey==='lucy')clearLucyLockOverlay();
  },1900);

  screen.innerHTML=
    `恭喜抽中！<strong>${esc(winner.name)}</strong>`+
    `<small>${characters[characterKey].name}・${line}</small>`;

  const finishTones={
    cat:[784,988],
    bear:[523,659],
    rabbit:[988,1174],
    akira:[659,880],
    sai:[880,1320],
    lucy:[1046,1568]
  }[characterKey]||[784,988];

  beep(finishTones[0],.12,.06);
  setTimeout(()=>beep(finishTones[1],.16,.06),120);

  if(type==='rare'||type==='retry')celebrate();
}

async function normalCharacterSpin(characterKey,winner){
  const role=characters[characterKey];
  const loops=
    role.minSpins+
    Math.floor(Math.random()*(role.maxSpins-role.minSpins+1));

  await wait(role.windup);
  await animateWheel(
    targetRotation(winner,loops),
    role.duration,
    role.ease,
    {
      tickStep:role.tickStep,
      baseTone:role.baseTone,
      volume:characterKey==='bear'?.035:.025
    }
  );
}

async function akiraDoubleSpin(winner,winnerIndex){
  const available=prizes.length-1;
  const offset=1+Math.floor(Math.random()*Math.max(1,available));
  const decoyIndex=(winnerIndex+offset)%prizes.length;
  const decoy=prizes[
    decoyIndex===winnerIndex
      ? (winnerIndex+1)%prizes.length
      : decoyIndex
  ];

  setAction('FIRST READING');
  helperBubble.textContent='先確認第一個落點。';
  screen.innerHTML='塔矢亮正在計算第一手…';

  await wait(500);
  await animateWheel(
    targetRotation(decoy,3+Math.floor(Math.random()*2)),
    3000,
    p=>1-Math.pow(1-p,4),
    {tickStep:14,baseTone:590}
  );

  wheelBox.classList.remove('is-spinning');
  helperBubble.textContent='……還沒結束。';
  setAction('FALSE LANDING');
  screen.innerHTML=`第一次停在「${esc(decoy.name)}」<br><strong>再轉一次</strong>`;
  beep(440,.11,.045);

  await wait(850);
  wheelBox.classList.add('is-spinning','akira-second-spin');
  helperBubble.textContent='這才是最後一手。';
  setAction('SECOND MOVE');

  await animateWheel(
    targetRotation(winner,1+Math.floor(Math.random()*2)),
    2200,
    p=>1-Math.pow(1-p,4.5),
    {tickStep:11,baseTone:660,volume:.03}
  );
}

async function saiAcceleratingSpin(winner){
  helperBubble.textContent='更快……還要更快！';
  setAction('SPIRIT CHARGE 0%');
  screen.innerHTML='佐為正在喚起棋靈之力…<br><strong>速度持續上升</strong>';
  wheelBox.classList.add('sai-accelerating');

  await wait(420);

  let announced=false;
  let lastPercent=-1;
  const loops=11+Math.floor(Math.random()*4);

  await animateWheel(
    targetRotation(winner,loops),
    4300,
    p=>Math.pow(p,2.65),
    {
      tickStep:8,
      baseTone:620,
      beepLength:.018,
      volume:.02,
      tone:p=>620+Math.floor(1250*Math.pow(p,2)),
      onProgress:p=>{
        wheelBox.style.setProperty('--charge',p.toFixed(3));
        const percent=Math.floor(p*10)*10;

        if(percent!==lastPercent){
          lastPercent=percent;
          setAction(`SPIRIT CHARGE ${percent}%`);
        }

        if(p>.62&&!announced){
          announced=true;
          helperBubble.textContent='不要停——！';
          screen.innerHTML='輪盤仍在加速！<br><strong>最後一手即將落下</strong>';
        }
      }
    }
  );

  wheelBox.classList.remove('sai-accelerating');
  wheelBox.classList.add('sudden-stop');
  setAction('DIVINE STOP');
  beep(150,.16,.08);
  setTimeout(()=>wheelBox.classList.remove('sudden-stop'),260);
}

async function lucyNetrunnerSpin(winner,winnerIndex){
  helperBubble.textContent='掃描序列啟動。';
  setAction('NEON SCAN 0%');
  screen.innerHTML='露西正在掃描獎格…<br><strong>神經連線已建立</strong>';

  wheelBox.classList.add('lucy-hacking','lucy-scanning');
  wheelBox.style.setProperty('--charge','0');

  const prizeCount=prizes.length;
  const scanSteps=Math.max(20,prizeCount*4);
  let scanIndex=Math.floor(Math.random()*prizeCount);

  for(let step=0;step<scanSteps;step++){
    const progress=(step+1)/scanSteps;
    scanIndex=(scanIndex+1)%prizeCount;

    drawLucyLockOverlay(prizes[scanIndex],.32+.28*progress);
    wheelBox.style.setProperty('--charge',(progress*.72).toFixed(3));

    const percent=Math.min(70,Math.floor(progress*70/10)*10);
    setAction(`NEON SCAN ${percent}%`);

    if(progress>.32&&progress<.58){
      helperBubble.textContent='正在比對機率分布。';
      screen.innerHTML='掃描中…<br><strong>分析所有獎格訊號</strong>';
    }else if(progress>=.58){
      helperBubble.textContent='偵測到穩定訊號。';
      screen.innerHTML='資料同步中…<br><strong>準備鎖定目標</strong>';
    }

    beep(720+step*18,.018,.018);

    const delay=
      step<scanSteps*.62
        ? 58
        : 58+Math.floor((step-scanSteps*.62)*9);

    await wait(delay);
  }

  wheelBox.classList.remove('lucy-scanning');
  wheelBox.classList.add('lucy-locking');

  helperBubble.textContent='目標訊號確認。';
  screen.innerHTML=`目標已標記<br><strong>${esc(winner.name)}</strong>`;
  setAction('TARGET LOCK 80%');

  for(let pulse=0;pulse<3;pulse++){
    drawLucyLockOverlay(winner,pulse%2===0?1:.48);
    wheelBox.style.setProperty('--charge',(.8+pulse*.08).toFixed(3));
    beep(1120+pulse*150,.07,.04);
    await wait(pulse%2===0?170:120);
  }

  drawLucyLockOverlay(winner,1);
  wheelBox.style.setProperty('--charge','1');
  setAction('LOCK CONFIRMED');
  helperBubble.textContent='鎖定完成，結果已寫入。';
  screen.innerHTML=`鎖定成功！<br><strong>${esc(winner.name)}</strong>`;

  wheelBox.classList.add('sudden-stop');
  beep(1460,.1,.055);
  setTimeout(()=>beep(1740,.14,.05),100);
  setTimeout(()=>wheelBox.classList.remove('sudden-stop'),260);

  await wait(360);
}

spin=async function(){
  if(spinning||prizes.length<2)return;

  const characterKey=currentCharacter;
  const role=characters[characterKey];
  const winnerIndex=choose();
  const winner=prizes[winnerIndex];

  lockGame();
  helperBubble.textContent=role.start;

  if(characterKey==='lucy'){
    screen.innerHTML=`${role.name} 正在建立連線…<br>SCANNING`;
  }else{
    screen.innerHTML=`${role.name} 正在轉動…<br>GOOD LUCK!`;
  }

  try{
    if(characterKey==='akira'){
      await akiraDoubleSpin(winner,winnerIndex);
    }else if(characterKey==='sai'){
      await saiAcceleratingSpin(winner);
    }else if(characterKey==='lucy'){
      await lucyNetrunnerSpin(winner,winnerIndex);
    }else{
      await normalCharacterSpin(characterKey,winner);
    }

    unlockGame();
    showReaction(characterKey,winner);
  }catch(error){
    console.error(error);
    unlockGame();
    clearLucyLockOverlay();
    setAction('TRY AGAIN');
    helperBubble.textContent='系統暫時中斷，請重新執行。';
    screen.textContent='轉盤發生錯誤，請重新抽獎';
  }
};

spinBtn.onclick=spin;
