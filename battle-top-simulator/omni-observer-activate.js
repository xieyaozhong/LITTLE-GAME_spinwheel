/* Ensure Omni Observer is immediately visible and selected on mobile layouts */
(() => {
 const OBSERVER_KEY='omniObserver';
 const BERSERKER_KEY='bloodrageBerserker';
 const observer=metaPresets?.[OBSERVER_KEY];
 if(!observer){
  console.error('Omni Observer preset failed to load.');
  return;
 }

 // Mobile layout shows the blue panel first, so place the observer there.
 cfg.p1={...observer,preset:OBSERVER_KEY};
 if(metaPresets?.[BERSERKER_KEY])cfg.p2={...metaPresets[BERSERKER_KEY],preset:BERSERKER_KEY};

 renderPanel('p1');
 renderPanel('p2');
 const n1=document.querySelector('#n1'),n2=document.querySelector('#n2');
 if(n1)n1.textContent=cfg.p1.name;
 if(n2)n2.textContent=cfg.p2.name;
 document.documentElement.dataset.omniObserver='active';
})();
