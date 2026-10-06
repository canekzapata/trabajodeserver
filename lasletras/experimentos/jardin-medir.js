// Construye jardines con la copia parchada y mide. node lasletras/experimentos/jardin-medir.js [N]
const fs=require('fs'),path=require('path');
const js=path.join(__dirname,'..','js'),tmp=path.join(js,'.architecture-jardin.tmp.js');
const src=require('./jardin-parche.js').parchar(fs.readFileSync(path.join(js,'architecture.js'),'utf8'),fs.readFileSync(path.join(__dirname,'jardin-motor.js'),'utf8'));
fs.writeFileSync(tmp,src);let M;try{M=require(tmp)}finally{fs.unlinkSync(tmp)}
module.exports=M;
if(require.main===module){
  const N=+process.argv[2]||200,piezas={},sig=[],ms=[];
  for(let i=1;i<=N;i++){const t=Date.now();const p=M.buildGarden({seed:String(i)});ms.push(Date.now()-t);
    sig.push(p.surface.filter(s=>s.glyph).length);p.geometry.pieces.forEach(k=>piezas[k.replace(/ DE \d+ PRISMAS/,'')]=(piezas[k.replace(/ DE \d+ PRISMAS/,'')]||0)+1);
    if(p.surface.some(s=>!isFinite(s.rawX)||!isFinite(s.rawY)))throw new Error('coordenada inválida en '+i);}
  sig.sort((a,b)=>a-b);ms.sort((a,b)=>a-b);
  console.log('signos p10/50/90',sig[Math.floor(N*.1)],sig[N>>1],sig[Math.floor(N*.9)],'· ms p50/max',ms[N>>1],ms[N-1]);
  console.log(Object.entries(piezas).sort((a,b)=>b[1]-a[1]).map(([k,v])=>k+' '+v).join(' · '));
}
