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

import{availableParallelism as Y}from"node:os";import{fileURLToPath as $}from"node:url";import{isMainThread as V,parentPort as H}from"node:worker_threads";import{createWriteStream as z,createReadStream as j}from"node:fs";import{open as J}from"fs/promises";import{Worker as Q}from"worker_threads";const X=1e4,tt=100,L=107,et=16384,rt=1048576,nt=1048576,ot=152e-6,st=16384,at=1,it=512,_t=45,x=10,U=59,W=48,P=32,ct=216;function C(t,n,r){return t>n?t<=r?t:r:n}async function Et(t,n,r,I=0){const i=await J(t);try{const s=(await i.stat()).size,l=Math.max(I,Math.floor(s/n)),E=Buffer.allocUnsafe(r),o=[];let a=0;for(let c=l;c<s;c+=l){const u=await i.read(E,0,r,c),_=E.indexOf(x);_>=0&&_<u.bytesRead&&(c+=_+1,o.push([a,c]),a=c)}return a<s&&o.push([a,s]),o}finally{await i.close()}}function ft(t){return t*=ot,t=Math.round(Math.log2(t)),t=2**t,C(t,et,rt)}const lt=655360,It=1.6180339887,ut=1,N=ut,Rt=1,D=1,Mt=1,S=Rt+Mt,Tt=0,ht=1,d=1,mt=1,g=2,F=ct,k=N*F,O=ht+mt+k,m=0,p=0,wt=1,y=1,At=O,B=y+Tt,K=wt+At;function dt(t,n,r,I){let i=y;for(;r<I;){i+=g+(n[r++]-P);let s=t[i];s===m&&(s=t[p],s+O>t.length&&(t=b(t,s+O)),t[p]+=O,t[i]=s,t[s]=t[B]),i=s}return[t,i]}function Z(t=0,n=lt){n=Math.max(K,n);const r=new Int32Array(new SharedArrayBuffer(n<<2));return r[p]=K,r[B]=t,r}function b(t,n=0){const r=t[p];n=Math.max(n,Math.ceil(r*It));const I=new Int32Array(new SharedArrayBuffer(n<<2));for(let i=0;i<r;++i)I[i]=t[i];return I}function pt(t,n,r,I){const i=new Set,s=[[n,y,r,y]];do{const l=s.length;for(let E=0;E<l;++E){let[o,a,c,u]=s[E];const _=t[c][u+d];if(_!==m){const R=t[o][a+d];R!==m?I(R,_):t[o][a+d]=_}a+=g,u+=g;const T=u+k;for(;u<T;){let R=t[c][u];if(R!==m){const w=t[c][R];c!==w&&(R=t[c][R+D]);let e=t[o][a];if(e===m)e=t[o][p],e+S>t[o].length&&(t[o]=b(t[o],e+S),i.add(o)),t[o][p]+=S,t[o][a]=e,t[o][e]=w,t[o][e+D]=R;else{const f=t[o][e];o!==f&&(e=t[o][e+D]),s.push([f,e,w,R])}}a+=N,u+=N}}s.splice(0,l)}while(s.length>0);return Array.from(i)}function gt(t,n,r,I,i="",s){const l=new Array(n.length+1);l[0]=[r,y+g,0];let E=0,o=!1;do{let[a,c,u]=l[E];if(u>=F){--E;continue}l[E][1]+=N,++l[E][2];let _=t[a][c];if(_===m)continue;const T=t[a][_];a!==T&&(_=t[a][_+D],a=T),n[E]=u+P,l[++E]=[a,_+g,0];const R=t[a][_+d];R!==m&&(o&&I.write(i),o=!0,s(I,n,E,R))}while(E>=0)}function yt(t){const n=new Q(t);return n.on("error",r=>{throw r}),n.on("messageerror",r=>{throw r}),n.on("exit",r=>{if(r>1||r<0)throw new Error(`Worker ${n.threadId} exited with code ${r}`)}),n}function G(t,n){return new Promise(r=>{t.once("message",r),t.postMessage(n)})}async function Nt(t,n,r,I=""){r=C(r,at,it);const i=await Et(t,r,L,st);r=i.length;const s=new SharedArrayBuffer(X*r+1<<4),l=new Int16Array(s),E=new Int16Array(s,2),o=new Uint32Array(s,4),a=new Float64Array(s,8),c=new Array(r),u=new Array(r);for(let e=0;e<r;++e)u[e]=yt(n);const _=new Array(r);for(let e=0;e<r;++e)_[e]=G(u[e],{type:"process_request",counts:o,end:i[e][1],filePath:t,id:e,maxes:E,mins:l,start:i[e][0],sums:a}).then(f=>{c[f.id]=f.trie});for(let e=_.length-1;e>0;--e){const f=e-1>>1,h=e;_[f]=_[f].then(()=>_[h]).then(()=>G(u[f],{type:"merge_request",a:f,b:h,counts:o,maxes:E,mins:l,sums:a,tries:c})).then(M=>{for(const A of M.ids)c[A]=M.tries[A]})}for(let e=0;e<r;++e)_[e]=_[e].then(()=>u[e].terminate());await Promise.all(_);const T=z(I,{fd:I.length<1?1:void 0,flags:"a",highWaterMark:nt}),R=Buffer.allocUnsafe(tt);T.write("{"),gt(c,R,0,T,", ",w),T.end(`}
`);function w(e,f,h,M){const A=Math.round(a[M<<1]/o[M<<2]);e.write(f.toString("utf8",0,h)),e.write("="),e.write((l[M<<3]/10).toFixed(1)),e.write("/"),e.write((A/10).toFixed(1)),e.write("/"),e.write((E[M<<3]/10).toFixed(1))}}const q=11*W,v=111*W;function Dt(t,n,r){return t[n]===_t?(++n,n+4>r?-(10*t[n]+t[n+2]-q):-(100*t[n]+10*t[n+1]+t[n+3]-v)):n+4>r?10*t[n]+t[n+2]-q:100*t[n]+10*t[n+1]+t[n+3]-v}async function Ot({end:t,filePath:n,id:r,start:I,counts:i,maxes:s,mins:l,sums:E}){if(I>=t)return{type:"process_response",id:r,trie:Z(r,0)};let o=Z(r),a=r*X+1;const c=Buffer.allocUnsafe(L),u=j(n,{start:I,end:t-1,highWaterMark:ft(t-I)});let _=0,T;for await(const e of u){const f=e.length;for(let h=0;h<f;++h){if(e[h]!==x){c[_++]=e[h];continue}let M=_-4;c[M-2]===U?M-=2:c[M-1]===U&&(M-=1);const A=Dt(c,M+1,_);_=0,[o,T]=dt(o,c,0,M),o[T+d]!==m?w(o[T+d],A):(o[T+d]=a,R(a++,A))}}function R(e,f){l[e<<3]=f,s[e<<3]=f,i[e<<2]=1,E[e<<1]=f}function w(e,f){e<<=3,l[e]=l[e]<=f?l[e]:f,s[e]=s[e]>=f?s[e]:f,++i[e>>1],E[e>>2]+=f}return{type:"process_response",id:r,trie:o}}function Ht({a:t,b:n,tries:r,counts:I,maxes:i,mins:s,sums:l}){function E(o,a){o<<=3,a<<=3,s[o]=Math.min(s[o],s[a]),i[o]=Math.max(i[o],i[a]),I[o>>1]+=I[a>>1],l[o>>2]+=l[a>>2]}return{type:"merge_response",ids:pt(r,t,n,E),tries:r}}if(V){const t=$(import.meta.url);Nt(process.argv[2],t,Y())}else H.addListener("message",async t=>{if(t.type==="process_request")H.postMessage(await Ot(t));else if(t.type==="merge_request")H.postMessage(Ht(t));else throw new Error("Unknown message type")});
//# sourceMappingURL=index.mjs.map
