/*!
 * https://github.com/havelessbemore/1brc-nodejs
 *
 * MIT License
 *
 * Copyright (C) 2024-2024 Michael Rojas <dev.michael.rojas@gmail.com> (https://github.com/havelessbemore)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

"use strict";var V=require("node:os"),j=require("node:url"),N=require("node:worker_threads"),L=require("node:fs"),z=require("fs/promises"),J=require("worker_threads"),X=typeof document<"u"?document.currentScript:null;const U=1e4,Q=100,x=107,ee=16384,te=1048576,re=1048576,ne=152e-6,oe=16384,se=1,ae=512,ie=45,P=10,W=59,C=48,q=32,_e=216;function k(e,n,r){return e>n?e<=r?e:r:n}async function ce(e,n,r,l=0){const i=await z.open(e);try{const s=(await i.stat()).size,f=Math.max(l,Math.floor(s/n)),u=Buffer.allocUnsafe(r),o=[];let a=0;for(let c=f;c<s;c+=f){const I=await i.read(u,0,r,c),_=u.indexOf(P);_>=0&&_<I.bytesRead&&(c+=_+1,o.push([a,c]),a=c)}return a<s&&o.push([a,s]),o}finally{await i.close()}}function ue(e){return e*=ne,e=Math.round(Math.log2(e)),e=2**e,k(e,ee,te)}const Ee=655360,fe=1.6180339887,le=1,D=le,Ie=1,O=1,Re=1,H=Ie+Re,Me=0,Te=1,m=1,de=1,y=2,v=_e,F=D*v,S=Te+de+F,h=0,p=0,he=1,g=1,we=S,B=g+Me,b=he+we;function Ae(e,n,r,l){let i=g;for(;r<l;){i+=y+(n[r++]-q);let s=e[i];s===h&&(s=e[p],s+S>e.length&&(e=Z(e,s+S)),e[p]+=S,e[i]=s,e[s]=e[B]),i=s}return[e,i]}function K(e=0,n=Ee){n=Math.max(b,n);const r=new Int32Array(new SharedArrayBuffer(n<<2));return r[p]=b,r[B]=e,r}function Z(e,n=0){const r=e[p];n=Math.max(n,Math.ceil(r*fe));const l=new Int32Array(new SharedArrayBuffer(n<<2));for(let i=0;i<r;++i)l[i]=e[i];return l}function me(e,n,r,l){const i=new Set,s=[[n,g,r,g]];do{const f=s.length;for(let u=0;u<f;++u){let[o,a,c,I]=s[u];const _=e[c][I+m];if(_!==h){const R=e[o][a+m];R!==h?l(R,_):e[o][a+m]=_}a+=y,I+=y;const T=I+F;for(;I<T;){let R=e[c][I];if(R!==h){const w=e[c][R];c!==w&&(R=e[c][R+O]);let t=e[o][a];if(t===h)t=e[o][p],t+H>e[o].length&&(e[o]=Z(e[o],t+H),i.add(o)),e[o][p]+=H,e[o][a]=t,e[o][t]=w,e[o][t+O]=R;else{const E=e[o][t];o!==E&&(t=e[o][t+O]),s.push([E,t,w,R])}}a+=D,I+=D}}s.splice(0,f)}while(s.length>0);return Array.from(i)}function pe(e,n,r,l,i="",s){const f=new Array(n.length+1);f[0]=[r,g+y,0];let u=0,o=!1;do{let[a,c,I]=f[u];if(I>=v){--u;continue}f[u][1]+=D,++f[u][2];let _=e[a][c];if(_===h)continue;const T=e[a][_];a!==T&&(_=e[a][_+O],a=T),n[u]=I+q,f[++u]=[a,_+y,0];const R=e[a][_+m];R!==h&&(o&&l.write(i),o=!0,s(l,n,u,R))}while(u>=0)}function ye(e){const n=new J.Worker(e);return n.on("error",r=>{throw r}),n.on("messageerror",r=>{throw r}),n.on("exit",r=>{if(r>1||r<0)throw new Error(`Worker ${n.threadId} exited with code ${r}`)}),n}function G(e,n){return new Promise(r=>{e.once("message",r),e.postMessage(n)})}async function ge(e,n,r,l=""){r=k(r,se,ae);const i=await ce(e,r,x,oe);r=i.length;const s=new SharedArrayBuffer(U*r+1<<4),f=new Int16Array(s),u=new Int16Array(s,2),o=new Uint32Array(s,4),a=new Float64Array(s,8),c=new Array(r),I=new Array(r);for(let t=0;t<r;++t)I[t]=ye(n);const _=new Array(r);for(let t=0;t<r;++t)_[t]=G(I[t],{type:"process_request",counts:o,end:i[t][1],filePath:e,id:t,maxes:u,mins:f,start:i[t][0],sums:a}).then(E=>{c[E.id]=E.trie});for(let t=_.length-1;t>0;--t){const E=t-1>>1,d=t;_[E]=_[E].then(()=>_[d]).then(()=>G(I[E],{type:"merge_request",a:E,b:d,counts:o,maxes:u,mins:f,sums:a,tries:c})).then(M=>{for(const A of M.ids)c[A]=M.tries[A]})}for(let t=0;t<r;++t)_[t]=_[t].then(()=>I[t].terminate());await Promise.all(_);const T=L.createWriteStream(l,{fd:l.length<1?1:void 0,flags:"a",highWaterMark:re}),R=Buffer.allocUnsafe(Q);T.write("{"),pe(c,R,0,T,", ",w),T.end(`}
`);function w(t,E,d,M){const A=Math.round(a[M<<1]/o[M<<2]);t.write(E.toString("utf8",0,d)),t.write("="),t.write((f[M<<3]/10).toFixed(1)),t.write("/"),t.write((A/10).toFixed(1)),t.write("/"),t.write((u[M<<3]/10).toFixed(1))}}const Y=11*C,$=111*C;function Ne(e,n,r){return e[n]===ie?(++n,n+4>r?-(10*e[n]+e[n+2]-Y):-(100*e[n]+10*e[n+1]+e[n+3]-$)):n+4>r?10*e[n]+e[n+2]-Y:100*e[n]+10*e[n+1]+e[n+3]-$}async function De({end:e,filePath:n,id:r,start:l,counts:i,maxes:s,mins:f,sums:u}){if(l>=e)return{type:"process_response",id:r,trie:K(r,0)};let o=K(r),a=r*U+1;const c=Buffer.allocUnsafe(x),I=L.createReadStream(n,{start:l,end:e-1,highWaterMark:ue(e-l)});let _=0,T;for await(const t of I){const E=t.length;for(let d=0;d<E;++d){if(t[d]!==P){c[_++]=t[d];continue}let M=_-4;c[M-2]===W?M-=2:c[M-1]===W&&(M-=1);const A=Ne(c,M+1,_);_=0,[o,T]=Ae(o,c,0,M),o[T+m]!==h?w(o[T+m],A):(o[T+m]=a,R(a++,A))}}function R(t,E){f[t<<3]=E,s[t<<3]=E,i[t<<2]=1,u[t<<1]=E}function w(t,E){t<<=3,f[t]=f[t]<=E?f[t]:E,s[t]=s[t]>=E?s[t]:E,++i[t>>1],u[t>>2]+=E}return{type:"process_response",id:r,trie:o}}function Oe({a:e,b:n,tries:r,counts:l,maxes:i,mins:s,sums:f}){function u(o,a){o<<=3,a<<=3,s[o]=Math.min(s[o],s[a]),i[o]=Math.max(i[o],i[a]),l[o>>1]+=l[a>>1],f[o>>2]+=f[a>>2]}return{type:"merge_response",ids:me(r,e,n,u),tries:r}}if(N.isMainThread){const e=j.fileURLToPath(typeof document>"u"?require("url").pathToFileURL(__filename).href:X&&X.src||new URL("index.cjs",document.baseURI).href);ge(process.argv[2],e,V.availableParallelism())}else N.parentPort.addListener("message",async e=>{if(e.type==="process_request")N.parentPort.postMessage(await De(e));else if(e.type==="merge_request")N.parentPort.postMessage(Oe(e));else throw new Error("Unknown message type")});
//# sourceMappingURL=index.cjs.map
