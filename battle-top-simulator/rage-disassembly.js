/* Bloodrage failure state: zero energy causes automatic structural disassembly */
(() => {
 const PreviousTop=Top;
 Top=class Top extends PreviousTop{
  constructor(index,data){
   super(index,data);
   this.rageDisassembled=false;
  }
  triggerRageDisassembly(){
   if(this.rageDisassembled||!this.c.rageEngine||this.out||this.burst)return;
   this.rageDisassembled=true;
   this.energy=0;
   this.omega=0;this.spin=0;
   this.vx*=.16;this.vy*=.16;
   this.burstMeter=100;
   this.burst=true;
   emit(this.x,this.y,this.c.primary,72,1.55,'streak');
   emit(this.x,this.y,this.c.secondary,48,1.25,'streak');
   emit(this.x,this.y,this.c.metal||'#d7dde5',42,1.10);
   emit(this.x,this.y,this.c.accent||'#fff',24,.92,'streak');
   wave(this.x,this.y,this.c.primary,92);
   wave(this.x,this.y,this.c.accent||'#fff0cf',66);
   shake=Math.max(shake,17);flash=Math.max(flash,.92);
   addLog(`${this.c.name} 的血怒核心耗盡，過載結構無法維持並自行解體！`);
  }
  update(dt,opponent){
   if(this.rageDisassembled)return;
   super.update(dt,opponent);
   if(this.c.rageEngine&&!this.out&&!this.burst&&this.energy<=0)this.triggerRageDisassembly();
  }
 };

 const previousCollide=collide;
 collide=function(a,b){
  if(a?.rageDisassembled||b?.rageDisassembled)return;
  previousCollide(a,b);
 };
})();