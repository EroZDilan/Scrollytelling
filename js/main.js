const svg = d3.select('#map');
const canvas = document.getElementById('flow');
const ctx = canvas.getContext('2d');
const labelsEl = document.getElementById('labels');
let W = innerWidth, H = innerHeight, projection, land;

// ---- camera keyframes: [progress, lon, lat, zoom]
const KEYS = [
  [0.00, -83.5, 25.0, 1.00],
  [0.05, -83.5, 25.0, 1.05],
  [0.09, -81.6, 22.7, 3.60],
  [0.14, -81.4, 23.0, 3.45],
  [0.19, -81.0, 23.6, 3.30],
  [0.27, -80.5, 24.6, 3.30],
  [0.35, -81.4, 24.8, 3.70],
  [0.43, -80.35, 26.3, 3.90],
  [0.47, -80.45, 26.5, 3.90],
  [0.52, -82.6, 24.2, 2.70],
  [0.56, -83.4, 23.5, 2.90],
  [0.60, -88.2, 25.2, 2.05],
  [0.64, -90.0, 25.0, 2.10],
  [0.69, -95.2, 22.3, 3.00],
  [0.73, -93.8, 20.6, 2.80],
  [0.79, -79.3, 20.85, 3.40],
  [0.83, -79.8, 21.0, 3.30],
  [0.88, -86.5, 24.0, 1.45],
  [0.94, -85.5, 25.0, 1.20],
  [1.00, -86.5, 24.8, 1.15],
];
const smooth = t => t*t*(3-2*t);
function camAt(p){
  if(p<=KEYS[0][0]) return KEYS[0].slice(1);
  for(let i=0;i<KEYS.length-1;i++){
    const a=KEYS[i], b=KEYS[i+1];
    if(p<=b[0]){
      const t=smooth((p-a[0])/(b[0]-a[0]));
      return [a[1]+(b[1]-a[1])*t, a[2]+(b[2]-a[2])*t,
              Math.exp(Math.log(a[3])+(Math.log(b[3])-Math.log(a[3]))*t)];
    }
  }
  return KEYS[KEYS.length-1].slice(1);
}

// ---- gulf stream waypoints (lon,lat)
const STREAM_LL = [
  [-85.6,21.9],[-84.7,22.7],[-83.4,23.35],[-82.2,23.6],[-81.0,23.85],[-80.3,24.35],
  [-79.95,25.0],[-79.85,25.8],[-80.0,26.5],[-80.1,26.9]
];
const STREAM2_LL = [
  [-84.3,24.2],[-86.0,25.6],[-88.0,26.4],[-90.5,26.6],[-93.0,26.0],[-95.0,24.8],
  [-96.3,23.0],[-96.5,21.2],[-95.6,19.8],[-93.8,19.2],[-92.2,19.6]
];
const STREAM3_LL = [
  [-80.25,25.35],[-81.3,24.55],[-82.6,24.05],[-84.0,23.95],[-84.9,23.2],[-84.3,22.45],[-83.2,22.15],[-82.5,22.6]
];
const ISOBATHS = [
  [[-95.5,25.5],[-94,27],[-90,27.5],[-87,27],[-85.5,25.5],[-85,24],[-86.5,22.8],[-90,22.5],[-93.5,22.8],[-95.5,24]],
  [[-93.5,25],[-91,26],[-88.5,25.5],[-87,24.5],[-88,23.5],[-91,23.3],[-93,23.8]],
  [[-85.5,19.5],[-83,19.2],[-80.5,18.8],[-78.5,18.5],[-78.5,17.9],[-81,18.2],[-84,18.6],[-85.5,19.0]]
];
const EDDIES = [{ll:[-87.6,25.9],r:1.55,sp:1.0},{ll:[-91.2,24.7],r:1.9,sp:0.8},{ll:[-94.2,23.2],r:1.25,sp:1.2}].map(E=>(
  {...E, parts:Array.from({length:46},()=>({a:Math.random()*6.283,rr:0.4+Math.random()*0.58,w:0.25+Math.random()*0.5}))}
));
let S1=null, S2=null, S3=null;

const LABELS = [
  {n:'GOLFO DE MÉXICO', ll:[-90.5,25.0], c:'water', s:16, k:[0,2.2]},
  {n:'MAR CARIBE', ll:[-78.5,17.5], c:'water', s:15, k:[0,2.4]},
  {n:'OCÉANO ATLÁNTICO', ll:[-72.5,29.5], c:'water', s:15, k:[0,99]},
  {n:'CUBA', ll:[-78.9,21.7], c:'land', s:15, k:[0,99]},
  {n:'FLORIDA', ll:[-81.7,28.1], c:'land', s:12, k:[1.6,99]},
  {n:'ESTADOS UNIDOS', ll:[-83.5,32.9], c:'land', s:13, k:[0,99]},
  {n:'YUCATÁN', ll:[-89.0,20.1], c:'land', s:11, k:[0,3]},
  {n:'MÉXICO', ll:[-100.0,24.5], c:'land', s:13, k:[0,99]},
  {n:'B. DE CAMPECHE', ll:[-94.3,20.8], c:'water', s:12, k:[1.8,99]},
  {n:'Veracruz', ll:[-96.13,19.17], c:'city', s:11, k:[2.2,99]},
  {n:'Tampico', ll:[-97.86,22.25], c:'city', s:11, k:[2.4,99]},
  {n:'La Habana', ll:[-82.36,23.11], c:'city', s:11, k:[2.4,99]},
  {n:'Miami', ll:[-80.19,25.76], c:'city', s:11, k:[2.0,99]},
  {n:'Palm Beach', ll:[-80.04,26.71], c:'city', s:11, k:[2.6,99]},
  {n:'C. Cañaveral', ll:[-80.6,28.4], c:'city', s:11, k:[2.2,99]},
  {n:'Cayo Hueso', ll:[-81.78,24.55], c:'city', s:11, k:[2.6,99]},
  {n:'Cancún', ll:[-86.85,21.16], c:'city', s:11, k:[2.2,99]},
  {n:'Mérida', ll:[-89.62,20.97], c:'city', s:11, k:[2.6,99]},
  {n:'Cd. del Carmen', ll:[-91.83,18.65], c:'city', s:11, k:[2.4,99]},
  {n:'Matanzas', ll:[-81.58,23.05], c:'city', s:11, k:[3.2,99]},
  {n:'Jardines de la Reina', ll:[-79.1,20.55], c:'site', s:11, k:[2.0,99]},
  {n:'Guanahacabibes', ll:[-84.3,21.75], c:'site', s:11, k:[2.4,99]},
  {n:'Dry Tortugas', ll:[-82.87,24.63], c:'site', s:11, k:[2.6,99]},
  {n:'CANAL DE YUCATÁN', ll:[-85.8,21.6], c:'water', s:11, k:[1.8,99]},
  {n:'CUENCA DEL GOLFO · −3 700 m', ll:[-90.6,24.2], c:'depth', s:10, k:[1.4,3.4]},
  {n:'FOSA DE CAIMÁN · −7 000 m', ll:[-81.5,18.9], c:'depth', s:10, k:[1.4,3.4]},
];
let labelNodes = [];

function fitProjection(){
  W = innerWidth; H = innerHeight;
  const box = {type:'MultiPoint', coordinates:[[-97,15],[-64,15],[-64,37],[-97,37]]};
  projection = d3.geoMercator().fitExtent([[W*0.04,H*0.06],[W*0.96,H*0.94]], box);
  canvas.width = W * devicePixelRatio; canvas.height = H * devicePixelRatio;
  canvas.style.width = W+'px'; canvas.style.height = H+'px';
  ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);
  S1=buildStream(STREAM_LL); S2=buildStream(STREAM2_LL); S3=buildStream(STREAM3_LL);
  if(land) drawWorld();
}
function buildStream(LL){
  const raw = LL.map(d=>projection(d));
  const dense = [];
  for(let i=0;i<raw.length-1;i++){
    const p0=raw[Math.max(0,i-1)],p1=raw[i],p2=raw[i+1],p3=raw[Math.min(raw.length-1,i+2)];
    for(let j=0;j<28;j++){
      const t=j/28,t2=t*t,t3=t2*t;
      dense.push([
        .5*(2*p1[0]+(-p0[0]+p2[0])*t+(2*p0[0]-5*p1[0]+4*p2[0]-p3[0])*t2+(-p0[0]+3*p1[0]-3*p2[0]+p3[0])*t3),
        .5*(2*p1[1]+(-p0[1]+p2[1])*t+(2*p0[1]-5*p1[1]+4*p2[1]-p3[1])*t2+(-p0[1]+3*p1[1]-3*p2[1]+p3[1])*t3)
      ]);
    }
  }
  dense.push(raw[raw.length-1]);
  const cum=[0];
  for(let i=1;i<dense.length;i++) cum.push(cum[i-1]+Math.hypot(dense[i][0]-dense[i-1][0],dense[i][1]-dense[i-1][1]));
  const total=cum[cum.length-1], N=420, pts=[], ns=[];
  let j=0;
  for(let i=0;i<N;i++){
    const s=total*i/(N-1);
    while(j<cum.length-2 && cum[j+1]<s) j++;
    const t=(s-cum[j])/((cum[j+1]-cum[j])||1);
    pts.push([dense[j][0]+(dense[j+1][0]-dense[j][0])*t, dense[j][1]+(dense[j+1][1]-dense[j][1])*t]);
  }
  for(let i=0;i<N;i++){
    const a=pts[Math.max(0,i-1)], b=pts[Math.min(N-1,i+1)];
    const dx=b[0]-a[0], dy=b[1]-a[1], l=Math.hypot(dx,dy)||1;
    ns.push([-dy/l,dx/l,dx/l,dy/l]); // normal + tangent
  }
  return {pts,ns};
}
function pathAt(S, u, off){
  u = Math.min(0.9999, Math.max(0, u));
  const f = u*(S.pts.length-1), i=Math.floor(f), t=f-i;
  const p=S.pts[i], q=S.pts[i+1]||p, n=S.ns[i];
  return [p[0]+(q[0]-p[0])*t + n[0]*off, p[1]+(q[1]-p[1])*t + n[1]*off, Math.atan2(n[3],n[2])];
}

let landPath2D=null, gratPath2D=null, isoPaths=[];
function drawWorld(){
  const path = d3.geoPath(projection);
  landPath2D = new Path2D(path(land));
  gratPath2D = new Path2D(path(d3.geoGraticule().step([5,5])()));
  isoPaths = ISOBATHS.map(loop=>{
    const pts=loop.map(d=>projection(d)), n=pts.length, p=new Path2D();
    const mid=(a,b)=>[(a[0]+b[0])/2,(a[1]+b[1])/2];
    let m=mid(pts[n-1],pts[0]); p.moveTo(m[0],m[1]);
    for(let i=0;i<n;i++){const m2=mid(pts[i],pts[(i+1)%n]);p.quadraticCurveTo(pts[i][0],pts[i][1],m2[0],m2[1]);}
    p.closePath(); return p;
  });
  // labels
  labelsEl.innerHTML=''; labelNodes=[];
  LABELS.forEach(L=>{
    const el=document.createElement('div');
    el.className='maplabel '+L.c; el.textContent=L.n;
    labelsEl.appendChild(el);
    labelNodes.push({el, xy:projection(L.ll), s:L.s, k:L.k});
  });
}

// ---- particles & fish
const mkParts=n=>Array.from({length:n},()=>({
  u:Math.random(), off:(Math.random()*2-1), sp:0.00035+Math.random()*0.00075, tr:0.006+Math.random()*0.014
}));
const PARTS = mkParts(380), PARTS2 = mkParts(300), PARTS3 = mkParts(220);
const mkFish=(n,cols)=>Array.from({length:n},(_,i)=>({
  du:-0.06 + i*(0.24/n) + Math.random()*0.02, off:(Math.random()*2-1)*0.55, ph:Math.random()*6.28,
  size:0.8+Math.random()*0.5, col: cols[i%cols.length]
}));
const FISH = mkFish(7,['#E4A84D','#E4A84D','#E2725B']);
const FISH2 = mkFish(5,['#E2725B','#E4A84D']);
const FISH3 = mkFish(5,['#5FC2C0','#E4A84D']);
function bandHalf(u){ return 6 + 10*Math.sin(Math.PI*Math.min(1,u*1.1)); } // map-unit half width

function drawFish(x,y,ang,len,wig,col,alpha){
  ctx.save();ctx.translate(x,y);ctx.rotate(ang);ctx.globalAlpha=alpha;
  const l=len,h=len*0.36;
  ctx.beginPath();ctx.moveTo(l*.5,0);
  ctx.quadraticCurveTo(l*.08,-h,-l*.32,-h*.3);ctx.quadraticCurveTo(-l*.48,0,-l*.32,h*.3);
  ctx.quadraticCurveTo(l*.08,h,l*.5,0);
  ctx.fillStyle=col;ctx.fill();
  ctx.strokeStyle='rgba(11,35,52,.5)';ctx.lineWidth=Math.max(.6,l*.03);ctx.stroke();
  ctx.save();ctx.translate(-l*.32,0);ctx.rotate(wig);
  ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(-l*.3,-h*.55);ctx.lineTo(-l*.22,0);ctx.lineTo(-l*.3,h*.55);
  ctx.closePath();ctx.fillStyle=col;ctx.fill();ctx.restore();
  ctx.beginPath();ctx.arc(l*.28,-h*.14,Math.max(1,l*.045),0,7);ctx.fillStyle='#0B2334';ctx.fill();
  ctx.restore();ctx.globalAlpha=1;
}

// ---- fades
const fade=(p,a,b,m=0.035)=>Math.max(0,Math.min(1,Math.min(a<=0?1:(p-a)/m, b>=1?1:(b-p)/m, 1)));
const ramp=(p,a,b)=>Math.max(0,Math.min(1,(p-a)/(b-a)));
const CARDS=[
  ['title',0.00,0.05],['ch1',0.075,0.135],['ch2',0.16,0.22],['ch3',0.245,0.30],
  ['chm',0.325,0.38],['ch4',0.405,0.46],['chr',0.485,0.545],['chl',0.575,0.635],
  ['ch5',0.66,0.715],['chp',0.765,0.82],['chc',0.85,0.90],['chmet',0.925,0.96],
  ['ch6',0.98,1.01,0.02]
];

let cam={lon:-83.5,lat:25.0,k:1}, prog=0, tPrev=0;
function frame(t){
  requestAnimationFrame(frame);
  const dt=Math.min(50,t-tPrev); tPrev=t;
  const max=document.body.scrollHeight-innerHeight;
  prog = max>0 ? Math.min(1, scrollY/max) : 0;
  document.getElementById('progressbar').style.width=(prog*100)+'%';
  const [lon,lat,k]=camAt(prog);
  const e=1-Math.pow(0.0018,dt/1000);
  cam.lon+=(lon-cam.lon)*e; cam.lat+=(lat-cam.lat)*e;
  cam.k=Math.exp(Math.log(cam.k)+(Math.log(k)-Math.log(cam.k))*e);
  if(Math.abs(cam.lon-lon)<0.002&&Math.abs(cam.lat-lat)<0.002&&Math.abs(cam.k-k)<0.002){cam.lon=lon;cam.lat=lat;cam.k=k;}
  const camKey=cam.lon.toFixed(4)+','+cam.lat.toFixed(4)+','+cam.k.toFixed(4)+','+prog.toFixed(4);
  const flowOn=ramp(prog,0.17,0.24)>0;
  if(camKey===window._camKey && !flowOn){return;}  // idle: nothing animating
  window._camKey=camKey;
  if(!projection) return;
  const c=projection([cam.lon,cam.lat]);
  const K=cam.k, tx=W/2-c[0]*K, ty=H/2-c[1]*K;
  const scr=p=>[p[0]*K+tx, p[1]*K+ty];
  // ---- map on canvas
  ctx.clearRect(0,0,W,H);
  if(landPath2D){
    ctx.save();ctx.translate(tx,ty);ctx.scale(K,K);
    ctx.lineJoin='round';
    ctx.strokeStyle='#C9DCE5';ctx.globalAlpha=.12;ctx.lineWidth=.5/K;ctx.stroke(gratPath2D);
    ctx.setLineDash([6/K,5/K]);
    ctx.strokeStyle='#7FA0B0';ctx.globalAlpha=.26;ctx.lineWidth=.9/K;
    isoPaths.forEach(p=>ctx.stroke(p));
    ctx.setLineDash([]);
    ctx.strokeStyle='#6FA3BC';
    for(const [w,o] of [[11,.07],[5.5,.12],[2.4,.2]]){ctx.globalAlpha=o;ctx.lineWidth=w/K;ctx.stroke(landPath2D);}
    ctx.globalAlpha=1;ctx.fillStyle='#EDE3CC';ctx.fill(landPath2D);
    ctx.strokeStyle='#B99C6B';ctx.lineWidth=1/K;ctx.stroke(landPath2D);
    ctx.restore();
  }
  // labels
  labelNodes.forEach(L=>{
    const [x,y]=scr(L.xy);
    const vis=(K>=L.k[0]&&K<=L.k[1]&&x>-100&&x<W+100&&y>-40&&y<H+40)?1:0;
    const dim=0.06+0.94*ramp(prog,0.05,0.14);
    L.el.style.opacity=vis*0.9*dim;
    L.el.style.fontSize=L.s*(0.85+0.3*Math.min(K,3)/3)+'px';
    L.el.style.left=x+'px'; L.el.style.top=y+'px';
  });
  // coords readout
  document.getElementById('coords').textContent=
    `${Math.abs(cam.lat).toFixed(0)}°${String(Math.round(Math.abs(cam.lat)%1*60)).padStart(2,'0')}′ N · `+
    `${Math.abs(cam.lon).toFixed(0)}°${String(Math.round(Math.abs(cam.lon)%1*60)).padStart(2,'0')}′ O · ×${K.toFixed(1)}`;
  const flow1A=ramp(prog,0.17,0.24),
        flow3A=ramp(prog,0.47,0.52)*fade(prog,0.46,0.60,0.05),
        flow2A=ramp(prog,0.63,0.70),
        eddyA=fade(prog,0.56,0.92,0.05);
  ctx.lineCap='round';
  if(S1 && flow1A>0){
    const travel=ramp(prog,0.20,0.44);
    const fishA=flow1A*fade(prog,0.18,0.50,0.06);
    drawLeg(S1,PARTS,FISH,flow1A,travel,fishA,'228,168,77',scr,K,dt,t);
  }
  if(S3 && flow3A>0){
    const travel=ramp(prog,0.49,0.565);
    drawLeg(S3,PARTS3,FISH3,flow3A,travel,flow3A,'95,194,192',scr,K,dt,t);
  }
  drawEddies(scr,K,t,eddyA);
  if(S2 && flow2A>0){
    const travel=ramp(prog,0.655,0.745);
    const fishA=flow2A*fade(prog,0.63,0.80,0.06);
    drawLeg(S2,PARTS2,FISH2,flow2A,travel,fishA,'95,194,192',scr,K,dt,t);
  }
  // cards
  for(const [id,a,b,m] of CARDS){
    const el=document.getElementById(id), o=fade(prog,a,b,m);
    el.style.opacity=o;
    el.style.visibility=o>0?'visible':'hidden';
    if(id!=='title'){
      const base=innerWidth<=720?'translateX(-50%)':(el.classList.contains('center')?'translate(-50%,-50%)':'translateY(-50%)');
      el.style.transform=`${base} translateY(${Math.round((1-o)*26)}px)`;
    }
  }
}
function drawLeg(S,parts,fishes,flowA,travel,fishA,rgb,scr,K,dt,t){
  for(const P of parts){
    P.u+=P.sp*dt*0.06; if(P.u>1)P.u-=1;
    const half=bandHalf(P.u);
    const a1=pathAt(S,P.u-P.tr,P.off*half), a2=pathAt(S,P.u,P.off*half);
    const [x1,y1]=scr(a1), [x2,y2]=scr(a2);
    if((x1<-50&&x2<-50)||(x1>W+50&&x2>W+50)||(y1<-50&&y2<-50)||(y1>H+50&&y2>H+50)) continue;
    const edge=1-Math.abs(P.off);
    ctx.strokeStyle=`rgba(${rgb},${(0.10+0.45*edge)*flowA})`;
    ctx.lineWidth=Math.max(.7,Math.min(2.6,0.55*K))*(0.6+0.8*edge);
    ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();
  }
  if(fishA<=0 || travel<=0.01) return;
  for(const F of fishes){
    const u=Math.min(0.985,Math.max(0.01,travel*0.97+F.du));
    const half=bandHalf(u);
    const sway=Math.sin(t/900+F.ph)*0.18;
    const p=pathAt(S,u,(F.off+sway*0.3)*half*0.7);
    const [x,y]=scr(p);
    const len=Math.max(18,Math.min(58,14*K))*F.size;
    drawFish(x,y,p[2]+sway*0.25,len,Math.sin(t/140+F.ph)*0.35,F.col,fishA);
  }
}
function drawEddies(scr,K,t,alpha){
  if(alpha<=0||!projection) return;
  for(const E of EDDIES){
    const c0=projection(E.ll), c=scr(c0);
    const p2=projection([E.ll[0]+E.r,E.ll[1]]);
    const R=Math.hypot(p2[0]-c0[0],p2[1]-c0[1])*K;
    if(c[0]<-R||c[0]>W+R||c[1]<-R||c[1]>H+R) continue;
    for(const P of E.parts){
      const ang=P.a+t*0.00045*E.sp*(1.6-P.rr);
      ctx.beginPath();ctx.arc(c[0],c[1],P.rr*R,ang,ang+0.30);
      ctx.strokeStyle=`rgba(228,168,77,${Math.max(0,(0.06+0.26*(1-Math.abs(P.rr-0.72)*2.2)))*alpha})`;
      ctx.lineWidth=Math.max(.6,.45*K)*P.w*2;
      ctx.stroke();
    }
  }
}
fetch('https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-50m.json')
  .then(r=>r.json())
  .then(topo=>{
    const all = topojson.feature(topo, topo.objects.countries);
    land = {type:'FeatureCollection', features: all.features.filter(f=>{
      if(f.properties && /United States/.test(f.properties.name||'')) return true;
      const b=d3.geoBounds(f);
      return b[0][0]<-52 && b[1][0]>-102 && b[0][1]<47 && b[1][1]>6;
    })};
    fitProjection(); drawWorld();
    const ld=document.getElementById('loading');
    ld.style.opacity=0; setTimeout(()=>ld.remove(),600);
    requestAnimationFrame(frame);
  })
  .catch(()=>{
    const ld=document.getElementById('loading');
    ld.textContent='No se pudo cargar la carta náutica — revisa la conexión.';
  });
addEventListener('resize',()=>{ if(land){ fitProjection(); } });
// compass needle follows the cursor
const needle=document.getElementById('needle');
let needleAng=0, needleTarget=0;
addEventListener('pointermove',e=>{
  const r=document.getElementById('compass').getBoundingClientRect();
  const cx=r.left+r.width/2, cy=r.top+r.height/2;
  let a=Math.atan2(e.clientX-cx,-(e.clientY-cy))*180/Math.PI; // 0 = up, clockwise
  let d=a-needleAng; d=((d+540)%360)-180; needleTarget=needleAng+d;
  needleAng=needleTarget;
  needle.style.transform=`rotate(${needleAng}deg)`;
},{passive:true});
