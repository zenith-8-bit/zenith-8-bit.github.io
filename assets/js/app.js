const $=s=>document.querySelector(s),J=u=>fetch(u).then(r=>r.json()),T=u=>fetch(u).then(r=>r.text());
const D=d=>new Date(d).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'});
const tg=t=>!t?'':`<div class="tags">${(Array.isArray(t)?t:t.split(',')).map(x=>`<span>${x.trim()}</span>`).join('')}</div>`;
const host=u=>(u||'').replace(/^https?:\/\/(www\.)?/,'').replace(/\/$/,'');
const head=(k,t,s)=>`<header><div class="art sm">${A[k]}</div><h1>${t}</h1><p class="lede">${s}</p></header>`;
const posts=(l,r)=>`<ul class="list">${l.map(p=>`<li><a href="#/${r}/${p.slug}">${p.title}</a><span class="meta">${D(p.date)}${p.mood?' · '+p.mood:''}</span>${p.summary?`<p>${p.summary}</p>`:''}${tg(p.tags)}</li>`).join('')||'<li>Nothing yet. Add a .md file to content/'+r+'/</li>'}</ul>`;
const card=x=>{const n=x.title||x.name,s=[x.status,host(x.url)].filter(Boolean).join(' · ');return`<li class="card"><a class="th h${[...n].reduce((a,c)=>a+c.charCodeAt(0),0)%5}" ${x.url?`href="${x.url}"`:'aria-hidden="true" tabindex="-1"'}><span>${n[0]}</span><i></i></a><div class="cb"><b>${n}</b><small>${s}</small><p>${x.blurb||x.note}</p>${tg(x.tags)}${x.url?`<a class="go" href="${x.url}">Go to site</a>`:''}</div></li>`};
const F={projects:new Set(),shared:new Set()};
const dir=(k,L)=>{const c={};L.forEach(x=>x.tags.forEach(t=>c[t]=(c[t]||0)+1));const f=F[k];
return`<div class="chips" data-k="${k}">${Object.entries(c).sort((a,b)=>b[1]-a[1]).map(([t,n])=>`<button class="chip" aria-pressed="${f.has(t)}" data-t="${t}">${t} <em>${n}</em></button>`).join('')}</div><ul class="grid">${L.filter(x=>!f.size||x.tags.some(t=>f.has(t))).map(card).join('')}</ul>`};
let S,X,P,B,H;
const R={
'':()=>`<section class="top"><div><h1>${S.name}</h1><p class="intro">${S.intro}</p><button class="btn" data-act="rp">Random project</button><a class="btn o" href="#/shared">Blogs I like</a></div><div class="art">${A.hero}</div></section>
<h2>About me</h2><div class="prose">${S.about.map(p=>`<p>${p}</p>`).join('')}</div>
<h2>What I’m into</h2><ul class="mini">${S.interests.map(i=>`<li><b>${i.t}</b><p>${i.d}</p></li>`).join('')}</ul>
<h2>Experimenting with</h2><div class="tags big">${S.experiments.map(x=>`<span>${x}</span>`).join('')}</div>
<h2>Before this</h2><ul class="list">${S.background.map(b=>`<li>${b}</li>`).join('')}</ul>
<h2>Right now</h2><div class="prose"><p>${S.now}</p></div>
<h2>Things I’ve built</h2>${dir('projects',P)}<h2>Latest writing</h2>${posts(X.posts.slice(0,3),'writing')}`,
projects:()=>head('projects','Projects','Things I built. Filter by tag.')+dir('projects',P),
reading:()=>head('reading','Reading list','On the shelf, in hand, and queued.')+['reading','next','read'].map(s=>`<h2>${{reading:'Reading now',read:'Finished',next:'Up next'}[s]}</h2><ul class="list">${B.filter(b=>b.status==s).map(b=>`<li><b>${b.title}</b><span class="meta">${b.author}</span>${b.note?`<p>${b.note}</p>`:''}</li>`).join('')}</ul>`).join(''),
writing:()=>head('writing','Writing','Notes and essays, mine.')+posts(X.posts,'writing'),
shared:()=>head('shared','Blogs I like','Other people’s sites worth your time.')+`<button class="btn" data-act="rb">Go to a random blog</button>`+dir('shared',H),
journal:()=>head('journal','Journal','Unedited, dated, mostly for me.')+posts(X.journal,'journal'),
contact:()=>head('contact','Contact','Say hello.')+`<ul class="list">${S.contacts.map(c=>`<li><a href="${c.url}">${c.label}</a><span class="meta">${c.handle}</span></li>`).join('')}</ul>`};
const dark=()=>document.documentElement.dataset.t?document.documentElement.dataset.t=='dark':!matchMedia('(prefers-color-scheme:light)').matches;
async function render(keep){const y=scrollY,[r,slug]=location.hash.replace(/^#\/?/,'').split('/');let h;
if(slug&&(r=='writing'||r=='journal')){const k=r=='writing'?'posts':'journal',m=X[k].find(p=>p.slug==slug)||{title:slug},t=await T(`content/${k}/${slug}.md`);h=`<article><p class="meta"><a href="#/${r}">← ${r}</a></p><h1>${m.title}</h1><p class="meta">${m.date?D(m.date):''}</p>${md(t)}</article>`}
else h=(R[r||'']||R[''])();
$('#app').innerHTML=h;document.title=(r?r[0].toUpperCase()+r.slice(1)+' · ':'')+S.name;scrollTo(0,keep===1?y:0);
$('#nav').innerHTML=`<a class="home" href="#/">${S.name}</a>`+['projects','reading','writing','shared','journal','contact'].map(k=>`<a href="#/${k}" ${k==r?'aria-current="page"':''}>${k}</a>`).join('')+'<button id="th" aria-label="Toggle theme">◐</button>';
$('#th').onclick=()=>{const n=dark()?'light':'dark';document.documentElement.dataset.t=n;localStorage.t=n}}
document.addEventListener('click',e=>{const c=e.target.closest('.chip');if(c){const k=c.parentNode.dataset.k,t=c.dataset.t;F[k].has(t)?F[k].delete(t):F[k].add(t);return render(1)}
const a=e.target.closest('[data-act]');if(a){const L=a.dataset.act=='rp'?P.filter(p=>p.url):H;open(L[Math.random()*L.length|0].url,'_blank','noopener')}});
(async()=>{if(localStorage.t)document.documentElement.dataset.t=localStorage.t;
try{[S,X,P,B,H]=await Promise.all(['site','index','projects','reading','shared'].map(f=>J(`content/${f}.json`)))}catch(e){$('#app').innerHTML='<p>Can’t load content. Browsers block this when index.html is opened by double-click. In this folder run <code>python -m http.server</code>, then visit <code>http://localhost:8000</code>.</p>';return}
$('#foot').textContent=`© ${new Date().getFullYear()} ${S.name}. Edit content/, then run tools/publish.py.`;
addEventListener('hashchange',()=>render());render();
if(!matchMedia('(prefers-reduced-motion:reduce)').matches)addEventListener('pointermove',e=>{const s=$('.top svg');if(!s)return;const r=s.getBoundingClientRect();s.style.setProperty('--aim',Math.max(-70,Math.min(30,Math.atan2(e.clientY-(r.top+r.height*.5),e.clientX-(r.left+r.width*.23))*180/Math.PI))+'deg')})})();
