// Mide cuántos encimados visibles cambian con el orden de profundidad.
// Par visible: dos signos a menos de 0.45 cuerpos, de distinto color o glifo.
// "Al revés": hoy el de atrás (y mayor) se pinta encima del de adelante.
// node lasletras/experimentos/profundidad.js [N]
const M=require(require('path').join(__dirname,'..','js','architecture.js'));
// fitToPage() sobrescribe item.x / item.y con coordenadas de página, así que la
// profundidad 3D se recupera invirtiendo project(): conocidos rawX, rawY y z,
// se resuelve el sistema 2×2 para (x, y) del espacio. y mayor = más lejos.
function depthOf(s,t){var p=Math.max(0,Math.min(1,t.perspective/100)),u=15,
  dX=u*(0.035+(0.8-0.035)*p)*t.direction,dY=u*(0.015+(0.36-0.015)*p),tl=t.tilt||0,
  det=u*dY+dX*u*tl;return (u*(-s.rawY-s.z*u)+u*tl*s.rawX)/det}
const N=+process.argv[2]||400,res={};
const col=(p,s)=>s.anomaly?'A':(s.forcedColor||s.face+(s.body||''));
for(let i=1;i<=N;i++){const p=M.build({seed:String(i)});const S=p.surface.filter(s=>s.glyph);
 let a=1e9,b=-1e9,c=1e9,d=-1e9;S.forEach(t=>{const x=t.rawX+t.perturbX,y=t.rawY+t.perturbY;a=Math.min(a,x);b=Math.max(b,x);c=Math.min(c,y);d=Math.max(d,y)});
 const sc=Math.min(924/(b-a),924/(d-c),3.75),fs=Math.max(9,Math.min(34,13*sc)),cell=fs,g=new Map();
 const P=S.map((t,k)=>({k,x:(t.rawX+t.perturbX)*sc,y:(t.rawY+t.perturbY)*sc,z:depthOf(t,p.traits),c:col(p,t),gl:t.glyph}));
 P.forEach(q=>{const key=Math.floor(q.x/cell)+','+Math.floor(q.y/cell);(g.get(key)||g.set(key,[]).get(key)).push(q)});
 let pares=0,reves=0;P.forEach(q=>{const cx=Math.floor(q.x/cell),cy=Math.floor(q.y/cell);
  for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++){const L=g.get((cx+dx)+','+(cy+dy));if(!L)continue;
   for(const r of L){if(r.k<=q.k)continue;if(Math.hypot(r.x-q.x,r.y-q.y)>=0.45*fs)continue;
    if(r.c===q.c&&r.gl===q.gl)continue;if(r.z===q.z)continue;pares++;if(r.z>q.z)reves++;}}});
 const k=p.meta.speciesKey;(res[k]=res[k]||[]).push(pares?reves/pares:0);}
for(const[k,v]of Object.entries(res)){v.sort((a,b)=>a-b);console.log(k.padEnd(14),'n',String(v.length).padStart(3),'pares visibles al revés: mediana',(100*v[v.length>>1]).toFixed(0)+'%','p90',(100*v[Math.floor(v.length*.9)]).toFixed(0)+'%')}
