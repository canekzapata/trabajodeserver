// Mide las cintas del motor: paso entre muestras y cortes. node lasletras/experimentos/cierre-medir.js [N]
const fs=require('fs'),path=require('path'),os=require('os');
const js=path.join(__dirname,'..','js');
const src=require('./cierre-parche.js').parchar(fs.readFileSync(path.join(js,'architecture.js'),'utf8'));
const tmp=path.join(js,'.architecture-cierre.tmp.js');fs.writeFileSync(tmp,src);
const M=require(tmp);fs.unlinkSync(tmp);
const N=+process.argv[2]||600,porClave={};
globalThis.__CIERRE={registro:[]};
for(let i=1;i<=N;i++){globalThis.__CIERRE.registro=[];M.build({seed:String(i)});
  globalThis.__CIERRE.registro.forEach(r=>{(porClave[r.key]=porClave[r.key]||[]).push(r)})}
const q=(a,p)=>{a=[...a].sort((x,y)=>x-y);return a[Math.floor(p*(a.length-1))]};
console.log('cinta'.padEnd(26),'n'.padStart(4),'paso p50','p90','  (≈0.8 = vóxel)  cortes');
Object.entries(porClave).sort((a,b)=>q(b[1].map(r=>r.paso),.9)-q(a[1].map(r=>r.paso),.9)).forEach(([k,v])=>{
  console.log(k.padEnd(26),String(v.length).padStart(4),q(v.map(r=>r.paso),.5).toFixed(2).padStart(8),q(v.map(r=>r.paso),.9).toFixed(2).padStart(5),'                ',v[0].cortes?'sí':'no')});
