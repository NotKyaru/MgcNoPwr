// Procedural SFX for the arena. Usage: node synth.js <outDir>
const {writeWav}=require('./wav.js');const R=44100;const out=process.argv[2];
let seed=1234567;const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};const noise=()=>rnd()*2-1;
const buf=s=>new Float32Array(Math.round(s*R));
function lp(x,fc){const a=1-Math.exp(-2*Math.PI*fc/R);let y=0;return x.map(v=>y+=a*(v-y))}
function hp(x,fc){const l=lp(x,fc);return x.map((v,i)=>v-l[i])}
function norm(x,peak){let m=0;for(const v of x)m=Math.max(m,Math.abs(v));return m?x.map(v=>v*peak/m):x}
function mix(...xs){const n=Math.max(...xs.map(x=>x.length)),o=new Float32Array(n);for(const x of xs)for(let i=0;i<x.length;i++)o[i]+=x[i];return o}
function fadeOut(x,s){const n=Math.round(s*R);for(let i=0;i<n;i++)x[x.length-1-i]*=i/n;return x}
// pitched thump: frequency glides f0->f1 with time constant tg, amplitude decays with ta
function thump(len,f0,f1,tg,ta){const x=buf(len);let ph=0;for(let i=0;i<x.length;i++){const t=i/R,f=f1+(f0-f1)*Math.exp(-t/tg);ph+=2*Math.PI*f/R;x[i]=Math.sin(ph)*Math.exp(-t/ta)}return x}
function burst(len,ta,fc){const x=buf(len);for(let i=0;i<x.length;i++)x[i]=noise()*Math.exp(-i/R/ta);return lp(x,fc)}
function whoosh(len,f0,f1,peakAt){const x=buf(len);for(let i=0;i<x.length;i++)x[i]=noise();const y=new Float32Array(x.length);let s1=0,s2=0;
  for(let i=0;i<x.length;i++){const t=i/x.length,fc=f0+(f1-f0)*Math.sin(Math.PI*t),g=2*Math.sin(Math.PI*fc/R);const hpv=x[i]-s1*0.7-s2;const bp=g*hpv+s1;const lpv=g*bp+s2;s1=bp;s2=lpv;
    const env=t<peakAt?t/peakAt:Math.pow(1-(t-peakAt)/(1-peakAt),1.6);y[i]=bp*env}return y}
const S={};
S.SFX_PunchWhoosh=norm(whoosh(0.22,700,2600,0.35),0.55);
S.SFX_PunchImpact=norm(fadeOut(mix(thump(0.25,150,55,0.035,0.06),burst(0.25,0.018,3500).map(v=>v*0.8),burst(0.01,0.002,9000).map(v=>v*0.5)),0.03),0.9);
S.SFX_ChargedImpact=norm(fadeOut(mix(thump(0.75,120,34,0.06,0.2),burst(0.75,0.12,1400).map(v=>v*0.9),thump(0.75,60,30,0.3,0.35).map(v=>v*0.6)).map(v=>Math.tanh(v*1.6)),0.1),0.95);
(()=>{const len=0.9,x=buf(len),parts=[[523,1,0.5],[1307,0.7,0.35],[2091,0.55,0.28],[2780,0.4,0.2],[3920,0.3,0.15],[5200,0.2,0.1]];
  for(let i=0;i<x.length;i++){const t=i/R;let v=0;for(const [f,a,tau] of parts)v+=a*Math.sin(2*Math.PI*f*t*(1+0.002*Math.sin(2*Math.PI*6*t)))*Math.exp(-t/tau);x[i]=v}
  S.SFX_ParryClang=norm(fadeOut(mix(x,hp(burst(0.02,0.003,12000),2000).map(v=>v*1.5)),0.08),0.8)})();
(()=>{const w=whoosh(0.35,400,1100,0.3).map(v=>v*0.9);const land=new Float32Array(Math.round(0.35*R));const th=thump(0.1,110,60,0.02,0.03),b=burst(0.1,0.02,1200);const o=Math.round(0.24*R);
  for(let i=0;i<th.length&&o+i<land.length;i++)land[o+i]=th[i]*0.6+b[i]*0.4;S.SFX_Roll=norm(mix(w,land),0.6)})();
S.SFX_PlayerHurt=norm(fadeOut(mix(thump(0.3,100,45,0.04,0.07),burst(0.3,0.05,1200).map(v=>v*0.7)).map(v=>Math.tanh(v*2.2)),0.05),0.85);
// cave ambience: brown-noise rumble + slow swell + water drips + faint distant crackle, crossfaded into a seamless 24 s loop
(()=>{const L=24,X=1.0,n=Math.round((L+X)*R),x=new Float32Array(n);let br=0;
  for(let i=0;i<n;i++){br=0.995*br+0.05*noise();x[i]=br}
  let y=lp(x,220);for(let i=0;i<n;i++)y[i]*=0.6+0.4*Math.sin(2*Math.PI*i/R/((L+X)/2));
  y=norm(y,0.35);
  const drip=(at,f)=>{const s=Math.round(at*R);for(let k=0;k<0.12*R&&s+k<n;k++){const t=k/R,v=Math.sin(2*Math.PI*(f*(1+1.5*Math.exp(-t/0.01)))*t)*Math.exp(-t/0.035)*0.22;y[s+k]+=v;const e=s+k+Math.round(0.19*R);if(e<n)y[e]+=v*0.3}};
  [1.3,4.8,7.1,9.9,13.4,15.2,18.7,21.6].forEach((t,i)=>drip(t,1500+i*137%900));
  for(let i=0;i<n;i++){if(rnd()<6/R){const a=0.04+0.08*rnd();for(let k=0;k<200&&i+k<n;k++)y[i+k]+=noise()*a*Math.exp(-k/40)}}
  const N=Math.round(L*R),Xn=Math.round(X*R),o=new Float32Array(N);for(let i=0;i<N;i++)o[i]=y[i];
  for(let i=0;i<Xn;i++){const g=i/Xn;o[i]=y[i]*g+y[N+i]*(1-g)}S.SFX_CaveAmbience=norm(o,0.5)})();

// bomb: big low boom with a rumbling noise tail and scattered debris crackle
(()=>{const len=2.2;const boom=thump(len,90,28,0.08,0.45);const body=burst(len,0.35,900);const crack=buf(len);
  for(let i=0;i<crack.length;i++){if(rnd()<40/R*Math.exp(-i/R/0.6)){const a=0.3+0.5*rnd();for(let k=0;k<300&&i+k<crack.length;k++)crack[i+k]+=noise()*a*Math.exp(-k/60)}}
  S.SFX_BombExplosion=norm(fadeOut(mix(boom.map(v=>v*1.2),body,hp(crack,1500).map(v=>v*0.4)).map(v=>Math.tanh(v*1.8)),0.3),0.95)})();
// magic shot: quick rising zap with a soft noise breath
(()=>{const len=0.3,x=buf(len);let ph=0;for(let i=0;i<x.length;i++){const t=i/R,f=420+1400*(1-Math.exp(-t/0.05));ph+=2*Math.PI*f/R;x[i]=(Math.sin(ph)+0.35*Math.sin(2*ph))*Math.exp(-t/0.07)}
  S.SFX_Shoot=norm(mix(x,whoosh(len,1500,4000,0.15).map(v=>v*0.5)),0.6)})();
const ONLY=(process.argv[3]||"").split(",").filter(Boolean);
for(const k in S){if(ONLY.length&&!ONLY.includes(k))continue;writeWav(out+'/'+k+'.wav',S[k],R);console.log(k,(S[k].length/R).toFixed(2)+'s')}
