const cv=document.getElementById('c'),g=cv.getContext('2d');
let W,H,dpr,u;
function size(){
  dpr=Math.min(devicePixelRatio||1,2);W=innerWidth;H=innerHeight;
  cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);
  g.setTransform(dpr,0,0,dpr,0,0);
  u=Math.max(.45,Math.min(1.4,Math.min(W,H)/700)); // glyph scale
}
addEventListener('resize',size);size();
let wins=[],nightT=0,nextMeteor=10;const meteors=[];
function build(){
  wins=[];nightT=0;
  const R=Math.random,cell=Math.max(4,Math.round(4*u)),ww=cell-2,snap=v=>Math.round(v/cell)*cell;
  function fill(x,bw,y0,y1,bd){
    for(let yy=y0;yy<y1;yy+=cell)for(let xx=x;xx<x+bw-cell/2;xx+=cell){
      if(R()<.6)wins.push({x:xx,y:yy,c:`${232+R()*23|0},${232+R()*23|0},${232+R()*23|0}`,d:bd+R()*16,m:.45+R()*.55,p:R()*6.28,v:.05+R()*.15,tw:R()<.3});
    }
  }
  function tower(x,bw,bh){
    const bd=R()*50;
    fill(x,bw,H-bh,H,bd);
    if(bw>cell*5&&R()<.5){ // stepped crown
      const cw=snap(bw*(.4+R()*.3)),ch=snap(H*(.03+R()*.09)),cx=x+snap((bw-cw)/2);
      fill(cx,cw,H-bh-ch,H-bh,bd+4);
      if(R()<.5)bh+=ch,x=cx,bw=cw;
    }
    if(bh>H*.28&&R()<.55){ // antenna with blinking lamp
      const ax=x+snap(bw/2),top=H-bh-cell*7;
      for(let i=1;i<7;i++)wins.push({x:ax,y:top+i*cell,c:'240,240,240',d:bd+20,m:.5,p:0,v:.1,tw:false});
      wins.push({x:ax,y:top,c:'40,255,70',d:bd+22,m:1,p:R()*6.28,v:.1,tw:false,bl:true});
    }
  }
  let x=snap(W*.01);
  while(x<W){
    const k=R();let bw,bh;
    if(k<.28){bw=cell*(4+(R()*4|0));bh=H*(.2+R()*.32)}
    else if(k<.65){bw=cell*(8+(R()*9|0));bh=H*(.08+R()*.26)}
    else{bw=cell*(14+(R()*16|0));bh=H*(.04+R()*.13)}
    bw=Math.min(bw,W-x);bh=snap(bh);
    if(bw>cell*2)tower(x,bw,bh);
    x+=bw+cell*(R()*6|0);
  }
  wins.ww=ww;
}
addEventListener('resize',build);build();

const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
const sm=(a,b,v)=>{v=clamp((v-a)/(b-a));return v*v*(3-2*v)};
const mix=(a,b,k)=>a.map((v,i)=>v+(b[i]-v)*k);
const rgb=(c,a=1)=>`rgba(${c[0]|0},${c[1]|0},${c[2]|0},${a})`;

// sky: black (night) -> computer blue (day)
function sky(t){const k=sm(.02,.5,t),c=mix([0,0,0],[0,0,170],k);return [c,c]}

let t=0.95,dir=0;
const drops=Array.from({length:300},()=>({x:Math.random(),y:Math.random(),s:14+Math.random()*14,v:.7+Math.random()*.6}));

function draw(now,dt){
  const r=sm(.5,.62,t)*(1-sm(.8,.92,t));
  let [top,bot]=sky(t);

  const sg=g.createLinearGradient(0,0,0,H);
  sg.addColorStop(0,rgb(top));sg.addColorStop(1,rgb(bot));
  g.fillStyle=sg;g.fillRect(0,0,W,H);

  // night skyline of dotted windows
  const ca=1-sm(.12,.34,t);
  if(ca>0){
    const T=now/1000,q0=wins.ww;nightT+=dt;
    for(const w of wins){
      const f=clamp((nightT-w.d)/6);if(f<=0)continue;
      let k=w.tw?sm(.15,.85,.5+.5*Math.sin(T*w.v+w.p)):.85+.15*Math.sin(T*w.v*3+w.p);
      if(w.bl)k=Math.sin(T*1.2+w.p)>.6?1:.08;
      const a=ca*f*f*w.m*k;if(a<.02)continue;
      g.fillStyle=`rgba(${w.c},${a})`;g.fillRect(w.x,w.y,q0,q0);
    }
    nextMeteor-=dt;
    if(nextMeteor<=0&&ca>.6&&nightT>6&&meteors.length<1){
      nextMeteor=18+Math.random()*30;
      meteors.push({x:W*(.35+Math.random()*.65),y:H*Math.random()*.3,a:2.65+Math.random()*.3,v:W*(.35+Math.random()*.2),l:0,d:1.3+Math.random()*.6});
    }
    for(let i=meteors.length-1;i>=0;i--){
      const m=meteors[i];m.l+=dt;m.x+=Math.cos(m.a)*m.v*dt;m.y+=Math.sin(m.a)*m.v*dt;
      const f=m.l/m.d;if(f>=1){meteors.splice(i,1);continue}
      const q=Math.max(2,Math.round(2*u));
      for(let k=0;k<22;k++){g.fillStyle=`rgba(110,130,255,${ca*Math.sin(f*Math.PI)*(1-k/22)})`;g.fillRect(Math.round(m.x-Math.cos(m.a)*k*q*2),Math.round(m.y-Math.sin(m.a)*k*q*2),q,q)}
    }
  }else nightT=0;

  // rain
  if(r>.02){
    const n=Math.floor(drops.length*r);
    g.fillStyle=`rgba(0,0,0,${.7*r})`;
    for(let i=0;i<n;i++){
      const d=drops[i];
      d.y+=d.v*dt*.9;d.x-=d.v*dt*.9*(H/W)*.6;
      if(d.y>1.05){d.y=-.05;d.x=Math.random()*1.4}
      if(d.x<-.05)d.x+=1.1;
      const L=d.s*u*.8;g.fillRect(Math.round(d.x*W),Math.round(d.y*H),1,1);
      for(let k=0;k<L;k+=2){g.fillRect(Math.round(d.x*W+k*.45),Math.round(d.y*H-k),Math.max(1,Math.round(u)),2)}
    }
  }
}

let last=performance.now();
function frame(now){
  const dt=Math.min(.05,(now-last)/1000);last=now;
  if(dir)t=clamp(t+dir*dt*.2);
  draw(now,dt);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// arrow keys (hold)
addEventListener('keydown',e=>{
  if(e.key==='ArrowUp'){dir=1;e.preventDefault()}
  else if(e.key==='ArrowDown'){dir=-1;e.preventDefault()}
});
addEventListener('keyup',e=>{
  if((e.key==='ArrowUp'&&dir===1)||(e.key==='ArrowDown'&&dir===-1))dir=0;
});
addEventListener('blur',()=>dir=0);

// trackpad / mouse wheel: scroll down toward night, up toward day
addEventListener('wheel',e=>{
  e.preventDefault();
  const k=e.deltaMode===1?.03:.0015;
  t=clamp(t-e.deltaY*k);
},{passive:false});

// touch drag
let ty=null;
cv.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'){ty=e.clientY;cv.setPointerCapture(e.pointerId)}});
cv.addEventListener('pointermove',e=>{if(ty!==null){t=clamp(t+(ty-e.clientY)*.003);ty=e.clientY}});
['pointerup','pointercancel'].forEach(ev=>cv.addEventListener(ev,()=>ty=null));