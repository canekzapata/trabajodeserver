// Cuántas semillas cambian con el cierre y cuánto crecen. node lasletras/experimentos/cierre-serie.js [N]
const fs=require('fs'),path=require('path');
const js=path.join(__dirname,'..','js'),tmp=path.join(js,'.architecture-cierre.tmp.js');
fs.writeFileSync(tmp,require('./cierre-parche.js').parchar(fs.readFileSync(path.join(js,'architecture.js'),'utf8')));
const M=require(tmp);fs.unlinkSync(tmp);
const N=+process.argv[2]||1000,porEspecie={};let tocadas=0,max=0,maxSeed=0;const crece=[];
for(let i=1;i<=N;i++){
  globalThis.__CIERRE={};const a=M.build({seed:String(i)});
  globalThis.__CIERRE={sinCortes:true,densidad:true};const b=M.build({seed:String(i)});
  const na=a.surface.length,nb=b.surface.length,k=a.meta.speciesKey;
  porEspecie[k]=porEspecie[k]||{n:0,t:0};porEspecie[k].n++;
  if(nb!==na){tocadas++;porEspecie[k].t++;const r=nb/na-1;crece.push(r);if(r>max){max=r;maxSeed=i}}
}
crece.sort((x,y)=>x-y);
console.log('semillas que cambian',tocadas+'/'+N,'('+(100*tocadas/N).toFixed(1)+' %)');
console.log('crecimiento de signos en las que cambian: mediana',(100*crece[crece.length>>1]).toFixed(1)+' %','p90',(100*crece[Math.floor(crece.length*.9)]).toFixed(1)+' %','máx',(100*max).toFixed(0)+' % (semilla '+maxSeed+')');
for(const[k,v]of Object.entries(porEspecie))console.log(' ',k.padEnd(13),v.t+'/'+v.n);
