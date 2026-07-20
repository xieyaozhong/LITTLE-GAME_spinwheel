/* Chrono name override: rename the time-stop top without changing its internal key or mechanics */
(() => {
 const KEY='chronoClockEmperor';
 const OLD_ZH='時界鐘皇';
 const OLD_EN='Chrono Clock Emperor';
 const NAME_ZH='零時帝輪';
 const NAME_EN='Zero Hour Emperor';
 const LABEL=`[SPECIAL] ${NAME_ZH}｜${NAME_EN}`;

 function renameConfig(c){
  if(!c||(!c.timeStopEngine&&c.preset!==KEY))return;
  c.name=NAME_ZH;
  c.englishName=NAME_EN;
  c.label=LABEL;
 }

 if(metaPresets?.[KEY])renameConfig(metaPresets[KEY]);
 if(typeof cfg==='object'){
  renameConfig(cfg.p1);
  renameConfig(cfg.p2);
 }
 if(Array.isArray(tops))tops.forEach(renameConfig);

 const previousAddLog=addLog;
 addLog=function(message){
  const renamed=String(message)
   .replaceAll(OLD_ZH,NAME_ZH)
   .replaceAll(OLD_EN,NAME_EN);
  return previousAddLog(renamed);
 };

 document.querySelectorAll('option').forEach(option=>{
  if(option.value===KEY||option.textContent.includes(OLD_ZH)||option.textContent.includes(OLD_EN)){
   option.textContent=LABEL;
  }
 });

 ['p1','p2'].forEach(id=>{
  if(cfg?.[id]?.timeStopEngine&&typeof renderPanel==='function')renderPanel(id);
  const nameNode=document.querySelector(id==='p1'?'#n1':'#n2');
  if(nameNode&&cfg?.[id]?.timeStopEngine)nameNode.textContent=NAME_ZH;
 });

 document.documentElement.dataset.chronoDisplayName='zero-hour-emperor-v1';
})();
