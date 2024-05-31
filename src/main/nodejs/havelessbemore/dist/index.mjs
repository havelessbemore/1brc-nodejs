import{availableParallelism as J}from"node:os";import{fileURLToPath as z}from"node:url";import{isMainThread as ee,parentPort as w}from"node:worker_threads";import{closeSync as K,createWriteStream as V,fstatSync as Q,openSync as $}from"node:fs";import{stdout as j}from"node:process";function h(e,r,t){return e>r?e<=t?e:t:r}function N(e){return e=Math.ceil(e*1),e+=16384-e%16384,h(e,16384,16777216)}function P(e,r){return e=Math.ceil(e/r),e+=16384-e%16384,h(e,16384,16777216)}function T(e,r,t){for(;--t>=0;)if(e[t]===r)return t;return-1}function O(e,r,t,a){let f=1;for(;t<a;){f+=2+1*(r[t++]-32);let I=e[f+0];I===0&&(I=e[0],I+218>e.length&&(e=U(e,I+218)),e[0]+=218,e[f+0]=I,e[I+0]=e[1]),f=I}return[e,f]}function C(e=0,r=655360){r=Math.max(219,r);let t=new Int32Array(new SharedArrayBuffer(r<<2));return t[0]=219,t[1]=e,t}function U(e,r=0){let t=e[0];r=Math.max(r,Math.ceil(t*1.618033988749895));let a=new Int32Array(new SharedArrayBuffer(r<<2));for(let f=0;f<t;++f)a[f]=e[f];return a}function q(e,r,t,a){let f=[],I=[[r,1,t,1]];do{let m=I.length;for(let i=0;i<m;++i){let[n,s,R,E]=I[i],p=e[R][E+1];if(p!==0){let c=e[n][s+1];c!==0?a(c,p):e[n][s+1]=p}s+=2,E+=2;let D=E+216;for(;E<D;){let c=e[R][E+0];if(c!==0){let u=e[R][c+0];R!==u&&(c=e[R][c+1]);let o=e[n][s+0];if(o===0)o=e[n][0],o+2>e[n].length&&(e[n]=U(e[n],o+2),f.push(n)),e[n][0]+=2,e[n][s+0]=o,e[n][o+0]=u,e[n][o+1]=c;else{let l=e[n][o+0];n!==l&&(o=e[n][o+1]),I.push([l,o,u,c])}}s+=1,E+=1}}I.splice(0,m)}while(I.length>0);return f}function Z(e,r,t,a,f="",I){let m=new Array(r.length+1);m[0]=[t,3,0];let i=0,n=!1;do{let[s,R,E]=m[i];if(E>=216){--i;continue}m[i][1]+=1,++m[i][2];let p=e[s][R+0];if(p===0)continue;let D=e[s][p+0];s!==D&&(p=e[s][p+1],s=D),r[i]=E+32,m[++i]=[s,p+2,0];let c=e[s][p+1];c!==0&&(n&&a.write(f),n=!0,I(a,r,i,c))}while(i>=0)}import{Worker as F}from"node:worker_threads";function B(e){let r=new F(e);return r.on("error",t=>{throw t}),r.on("messageerror",t=>{throw t}),r.on("exit",t=>{if(t>1||t<0)throw new Error(`Worker ${r.threadId} exited with code ${t}`)}),r}function b(e,r){return new Promise(t=>{e.once("message",t),e.postMessage(r)})}async function H(e,r,t,a=""){t=h(t,1,256);let f=$(e,"r"),m=Q(f).size,i=P(m,t),n=N(i),s=new SharedArrayBuffer(1e4*t+1<<4),R=new Uint32Array(s,0,1),E=new Int16Array(s),p=new Int16Array(s,2),D=new Uint32Array(s,4),c=new Float64Array(s,8),u=new Array(t),o=[],l=new Array(t);for(let _=0;_<t;++_){let S=B(r);l[_]=b(S,{type:0,id:_,fd:f,fileSize:m,pageSize:i,chunkSize:n,counts:D,maxes:p,mins:E,page:R,sums:c}).then(async g=>{let y=g.id;for(u[y]=g.trie;o.length>0;){let d=await b(S,{type:1,a:y,b:o.pop(),counts:D,maxes:p,mins:E,sums:c,tries:u});for(let L of d.ids)u[L]=d.tries[L]}return o.push(y),S.terminate()})}await Promise.all(l),K(f);let A=V(a,{fd:a.length<1?j.fd:void 0,flags:"a",highWaterMark:1048576}),M=Buffer.allocUnsafe(100);A.write("{"),Z(u,M,o[0],A,", ",X),A.end(`}
`);function X(_,S,g,y){let d=Math.round(c[y<<1]/D[y<<2]);_.write(S.toString("utf8",0,g)),_.write("="),_.write((E[y<<3]/10).toFixed(1)),_.write("/"),_.write((d/10).toFixed(1)),_.write("/"),_.write((p[y<<3]/10).toFixed(1))}}import{readSync as v}from"fs";var k=11*48,W=111*48;function G(e,r,t){return e[r]===45?(++r,r+4>t?k-10*e[r]-e[r+2]:W-100*e[r]-10*e[r+1]-e[r+3]):r+4>t?10*e[r]+e[r+2]-k:100*e[r]+10*e[r+1]+e[r+3]-W}function x({id:e,fd:r,fileSize:t,pageSize:a,chunkSize:f,counts:I,maxes:m,mins:i,page:n,sums:s}){let R=(u,o)=>{i[u<<3]=o,m[u<<3]=o,I[u<<2]=1,s[u<<1]=o},E=(u,o)=>{u<<=3,i[u]=i[u]<=o?i[u]:o,m[u]=m[u]>=o?m[u]:o,++I[u>>1],s[u>>2]+=o},p=Buffer.allocUnsafe(f+16384),D=e*1e4,c=C(e);for(;;){let u=a*Atomics.add(n,0,1);if(u>=t)break;let o=u>0?16384:0;v(r,p,0,o,u-o);let l=T(p,10,o),A=Math.min(t,u+a);for(++l;u<A;u+=f){let M=16384-o+l;for(p.copyWithin(M,l,o),o=16384,l=M,M=Math.min(f,A-u),M=v(r,p,o,M,u),M+=o;o<M;++o){if(p[o]!==10)continue;let X=o-5;p[X]!==59&&(X+=1|1+~(p[X-1]===59));let _;[c,_]=O(c,p,l,X),l=o+1;let S=G(p,X+1,o);_+=1,c[_]!==0?E(c[_],S):(c[_]=++D,R(D,S))}}}return{id:e,trie:c}}function Y({a:e,b:r,tries:t,counts:a,maxes:f,mins:I,sums:m}){return{ids:q(t,e,r,(n,s)=>{n<<=3,s<<=3,I[n]=I[n]<=I[s]?I[n]:I[s],f[n]=f[n]>=f[s]?f[n]:f[s],a[n>>1]+=a[s>>1],m[n>>2]+=m[s>>2]}),tries:t}}if(ee){let e=z(import.meta.url);H(process.argv[2],e,J())}else w.addListener("message",e=>{if(e.type===0)w.postMessage(x(e));else if(e.type===1)w.postMessage(Y(e));else throw new Error("Unknown message type")});
//# sourceMappingURL=index.mjs.map
