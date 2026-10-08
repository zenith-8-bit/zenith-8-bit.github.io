const $=s=>document.querySelector(s),J=u=>fetch(u).then(r=>r.json()),T=u=>fetch(u).then(r=>r.text());
const D=d=>new Date(d).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'});
const tags=t=>!t?'':`<div class="tags">${(Array.isArray(t)?t:t.split(',')).map(x=>`<span>${x.trim()}</span>`).join('')}</div>`;
const head=(k,t,s)=>`<header><div class="art sm">${A[k]}</div><h1>${t}</h1><p class="lede">${s}</p></header>`;
const posts=(l,r)=>`<ul class="list">${l.map(p=>`<li><a href="#/${r}/${p.slug}">${p.title}</a><span class="meta">${D(p.date)}${p.mood?' · '+p.mood:''}</span>${p.summary?`<p>${p.summary}</p>`:''}${tags(p.tags)}</li>`).join('')||'<li>Nothing yet. Add a .md file to content/'+r+'/</li>'}</ul>`;
const projs=l=>`<ul class="list">${l.map(p=>`<li>${p.url?`<a href="${p.url}">${p.title}</a>`:`<b>${p.title}</b>`}<span class="meta">${p.year}</span><p>${p.blurb}</p>${tags(p.tags)}</li>`).join('')}</ul>`;
let S,X,P,B,H;
const R={
'':()=>`<section class="hero"><div class="art big">${A.hero}</div><h1>${S.name}<svg class="ul" viewBox="0 0 300 14" preserveAspectRatio="none"><path d="M2 9C60 2 120 13 180 6s90 3 118-2"/></svg></h1><p class="lede">${S.tagline}</p></section><p>${S.about}</p><h2>Now</h2><p>${S.now}</p><h2>Latest writing</h2>${posts(X.posts.slice(0,3),'writing')}<h2>Projects</h2>${projs(P.slice(0,3))}`,
projects:()=>head('projects','Projects','Things I finished and shipped.')+projs(P),
reading:()=>head('reading','Reading list','On the shelf, in hand, and queued.')+['reading','next','read'].map(s=>`<h2>${{reading:'Reading now',read:'Finished',next:'Up next'}[s]}</h2><ul class="list">${B.filter(b=>b.status==s).map(b=>`<li><b>${b.title}</b><span class="meta">${b.author}</span>${b.note?`<p>${b.note}</p>`:''}</li>`).join('')}</ul>`).join(''),
writing:()=>head('writing','Writing','Notes and essays, mine.')+posts(X.posts,'writing'),
shared:()=>head('shared','Blogs I like','Reshared: other people’s sites worth your time.')+`<ul class="shelf">${H.map(h=>`<li><a class="stamp" href="${h.url}"><b>${h.name}</b><small>${h.note}</small></a></li>`).join('')}</ul>`,
journal:()=>head('journal','Journal','Unedited, dated, mostly for me.')+posts(X.journal,'journal'),
contact:()=>head('contact','Contact','Say hello.')+`<ul class="list">${S.contacts.map(c=>`<li><a href="${c.url}">${c.label}</a><span class="meta">${c.handle}</span></li>`).join('')}</ul>`};
const dark=()=>document.documentElement.dataset.t?document.documentElement.dataset.t=='dark':matchMedia('(prefers-color-scheme:dark)').matches;
async function render(){const [r,slug]=location.hash.replace(/^#\/?/,'').split('/');let h;
if(slug&&(r=='writing'||r=='journal')){const k=r=='writing'?'posts':'journal',m=X[k].find(p=>p.slug==slug)||{title:slug},t=await T(`content/${k}/${slug}.md`);h=`<article><p class="meta"><a href="#/${r}">← ${r}</a></p><h1>${m.title}</h1><p class="meta">${m.date?D(m.date):''}</p>${md(t)}</article>`}
else h=(R[r||'']||R[''])();
$('#app').innerHTML=h;document.title=(r?r[0].toUpperCase()+r.slice(1)+' · ':'')+S.name;scrollTo(0,0);
$('#nav').innerHTML=`<a class="home" href="#/">${S.name}</a>`+['projects','reading','writing','shared','journal','contact'].map(k=>`<a href="#/${k}" ${k==r?'aria-current="page"':''}>${k}</a>`).join('')+'<button id="th" aria-label="Toggle theme">◐</button>';
$('#th').onclick=()=>{const n=dark()?'light':'dark';document.documentElement.dataset.t=n;localStorage.t=n}}
(async()=>{if(localStorage.t)document.documentElement.dataset.t=localStorage.t;
[S,X,P,B,H]=await Promise.all(['site','index','projects','reading','shared'].map(f=>J(`content/${f}.json`)));
$('#foot').textContent=`© ${new Date().getFullYear()} ${S.name}. Edit content/, then run tools/publish.py.`;
addEventListener('hashchange',render);render();
if(!matchMedia('(prefers-reduced-motion:reduce)').matches)addEventListener('pointermove',e=>{const s=$('.hero svg');if(!s)return;const r=s.getBoundingClientRect();s.style.setProperty('--aim',Math.max(-70,Math.min(30,Math.atan2(e.clientY-(r.top+r.height*.5),e.clientX-(r.left+r.width*.23))*180/Math.PI))+'deg')})})();
