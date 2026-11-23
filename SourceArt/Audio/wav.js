// tiny WAV writer: writeWav(path, Float32Array samples in [-1,1], rate)
const fs=require('fs');
function writeWav(path,s,rate=44100){const n=s.length,b=Buffer.alloc(44+n*2);
b.write('RIFF',0);b.writeUInt32LE(36+n*2,4);b.write('WAVE',8);b.write('fmt ',12);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);
b.writeUInt32LE(rate,24);b.writeUInt32LE(rate*2,28);b.writeUInt16LE(2,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(n*2,40);
for(let i=0;i<n;i++){const v=Math.max(-1,Math.min(1,s[i]));b.writeInt16LE(Math.round(v*32767),44+i*2)}fs.writeFileSync(path,b)}
module.exports={writeWav};
if(require.main===module){const r=44100,s=new Float32Array(r*0.1);for(let i=0;i<s.length;i++)s[i]=0.3*Math.sin(2*Math.PI*440*i/r);writeWav(process.argv[2],s,r)}
