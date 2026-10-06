// Mide la serie: node lasletras/experimentos/medir.js [N]
const M=require(require('path').join(__dirname,'..','js','architecture.js'));
const N=+process.argv[2]||1500;
const inc=(m,k)=>m[k]=(m[k]||0)+1;
const sp={},st={},cr={},al={},ph={},lang={},asm={},combo={},instr={},col={};
let glyphs=[],ms=[],sizes=[],fill=[];
for(let i=1;i<=N;i++){
 const t=Date.now();const p=M.build({seed:String(i)});ms.push(Date.now()-t);
 inc(sp,p.meta.speciesKey);inc(al,p.meta.palette);inc(ph,p.meta.phrase);inc(col,p.colors.generativa?'GEN':p.colors.nombre);
 const g=p.geometry;
 if(p.meta.speciesKey==='gramatica'){inc(st,g.genealogy.structure);inc(cr,g.genealogy.crown);inc(lang,g.genealogy.language);}
 if(p.meta.speciesKey==='escultura')inc(asm,g.assembly);
 inc(instr,p.interpretation.nombres.join('+'));
 const n=p.surface.filter(s=>s.glyph).length;glyphs.push(n);
 // ocupación
 let a=1e9,b=-1e9,c=1e9,d=-1e9;p.surface.forEach(s=>{const x=s.rawX+s.perturbX,y=s.rawY+s.perturbY;a=Math.min(a,x);b=Math.max(b,x);c=Math.min(c,y);d=Math.max(d,y)});
 const w=b-a,h=d-c,sc=Math.min(924/w,924/h,3.75);sizes.push(Math.max(9,Math.min(34,13*sc)));
 fill.push(Math.min(w,h)*sc/924);
}
const top=(m,k=40)=>Object.entries(m).sort((a,b)=>b[1]-a[1]).slice(0,k).map(([a,b])=>`${a}:${(100*b/N).toFixed(1)}%`).join(' | ');
const q=(arr,p)=>{const s=[...arr].sort((a,b)=>a-b);return s[Math.floor(p*(s.length-1))]};
console.log('ESPECIES',top(sp));
console.log('ESTRUCTURAS (gramática)',top(st));
console.log('CUBIERTAS',top(cr));
console.log('LENGUAJE',top(lang));
console.log('ENSAMBLAJES',top(asm));
console.log('ALFABETOS',top(al));
console.log('COLOR',top(col,8));
console.log('frases distintas',Object.keys(ph).length,'max rep',Math.max(...Object.values(ph)));
console.log('INSTRUCCIONES',top(instr,10));
console.log('glifos p10/50/90/max',q(glyphs,.1),q(glyphs,.5),q(glyphs,.9),Math.max(...glyphs));
console.log('cuerpo letra p10/50/90',q(sizes,.1).toFixed(1),q(sizes,.5).toFixed(1),q(sizes,.9).toFixed(1));
console.log('ocupación eje corto p10/50',q(fill,.1).toFixed(2),q(fill,.5).toFixed(2));
console.log('ms p50/p90/max',q(ms,.5),q(ms,.9),Math.max(...ms));
