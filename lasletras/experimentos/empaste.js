// Empaste: fracción de signos con un vecino a menos de 0.45 cuerpos. node lasletras/experimentos/empaste.js
const M=require(require('path').join(__dirname,'..','js','architecture.js'));const N=600;const res={};
for(let i=1;i<=N;i++){const p=M.build({seed:String(i)});const s=p.surface.filter(x=>x.glyph);
let a=1e9,b=-1e9,c=1e9,d=-1e9;s.forEach(t=>{const x=t.rawX+t.perturbX,y=t.rawY+t.perturbY;a=Math.min(a,x);b=Math.max(b,x);c=Math.min(c,y);d=Math.max(d,y)});
const sc=Math.min(924/(b-a),924/(d-c),3.75),fs=Math.max(9,Math.min(34,13*sc));
const pts=s.map(t=>[(t.rawX+t.perturbX)*sc,(t.rawY+t.perturbY)*sc]);
// grid hash
const cell=fs,g=new Map();pts.forEach((q,k)=>{const key=Math.floor(q[0]/cell)+','+Math.floor(q[1]/cell);(g.get(key)||g.set(key,[]).get(key)).push(k)});
let close=0;pts.forEach((q,k)=>{const cx=Math.floor(q[0]/cell),cy=Math.floor(q[1]/cell);let hit=false;
for(let dx=-1;dx<=1&&!hit;dx++)for(let dy=-1;dy<=1&&!hit;dy++){const L=g.get((cx+dx)+','+(cy+dy));if(L)for(const j of L){if(j!==k&&Math.hypot(pts[j][0]-q[0],pts[j][1]-q[1])<0.45*fs){hit=true;break}}}
if(hit)close++});
const k=p.meta.speciesKey+(p.geometry.genealogy?':'+p.geometry.genealogy.language:'');(res[k]=res[k]||[]).push(close/pts.length);}
for(const[k,v]of Object.entries(res)){v.sort((a,b)=>a-b);console.log(k.padEnd(40),'n',v.length,'empaste mediana',(v[v.length>>1]*100).toFixed(0)+'%','p90',(v[Math.floor(v.length*.9)]*100).toFixed(0)+'%')}
