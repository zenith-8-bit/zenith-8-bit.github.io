const $=s=>document.querySelector(s),J=u=>fetch(u).then(r=>r.json()),T=u=>fetch(u).then(r=>r.text());
const D=d=>new Date(d).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'});
const head=(k,t,s)=>`<div class="art sm">${A[k]}</div><h1>${t}</h1><p class="sub">${s}</p>`;
const posts=(l,r)=>`<ul class="rows">${l.map(p=>`<li><div class="row"><a class="t" href="#/${r}/${p.slug}">${p.title}</a><span>${D(p.date)}</span></div>${p.summary?`<p>${p.summary}</p>`:''}</li>`).join('')||'<li class="mute">Nothing yet. Add a .md file to content/'+r+'/</li>'}</ul>`;
const proj=l=>`<ul class="rows">${l.map(p=>`<li>${p.url?`<a class="t" href="${p.url}">${p.title}</a>`:`<b>${p.title}</b>`}<span class="mute"> · ${p.status}</span><p>${p.blurb} Built with ${p.tags.join(', ')}.</p></li>`).join('')}</ul>`;
let S,X,P,B,H;
const R={
'':()=>`<h1>${S.name}</h1><p class="sub">${S.role}</p><p class="sub">${S.location}</p>
<div class="art hero">${A.hero}</div>
<p class="hl">${S.headline}</p>${S.about.map(p=>`<p>${p}</p>`).join('')}<a class="more" href="#/writing">View notes</a>
<h2>Projects</h2>${proj(P.slice(0,5))}<a class="more" href="#/projects">All projects</a>
<h2>What I’m into</h2><ul class="rows">${S.interests.map(i=>`<li><b>${i.t}</b><p>${i.d}</p></li>`).join('')}</ul>
<h2>Experimenting with</h2><p>${S.experiments.join(', ')}.</p>
<h2>Before this</h2><ul class="rows">${S.background.map(b=>`<li>${b}</li>`).join('')}</ul>
<h2>Latest work</h2><ul class="rows" id="lw"><li class="mute">Loading from GitHub…</li></ul><a class="more" href="https://github.com/${S.github}">Follow on GitHub</a>
<h2>Now</h2><ul class="now">${S.now.map(n=>`<li>${n}</li>`).join('')}</ul><p class="mute">Updated ${S.nowUpdated}</p>
<h2>Connect</h2><dl class="kv">${S.contacts.map(c=>`<dt>${c.label}</dt><dd><a href="${c.url}">${c.handle}</a></dd>`).join('')}</dl>`,
projects:()=>head('projects','Projects','Things I built.')+'<div style="height:1rem"></div>'+proj(P),
reading:()=>head('reading','Reading list','On the shelf, in hand, and queued.')+['reading','next','read'].map(s=>`<h2>${{reading:'Reading now',read:'Finished',next:'Up next'}[s]}</h2><ul class="rows">${B.filter(b=>b.status==s).map(b=>`<li><b>${b.title}</b><span class="mute"> · ${b.author}</span>${b.note?`<p>${b.note}</p>`:''}</li>`).join('')}</ul>`).join(''),
writing:()=>head('writing','Notes','Things I wrote.')+'<div style="height:1rem"></div>'+posts(X.posts,'writing'),
shared:()=>head('shared','Blogs I like','Other people’s sites worth your time.')+`<p><a href="#" data-act="rb">Go to a random one</a></p><ul class="rows">${H.map(h=>`<li><a class="t" href="${h.url}">${h.name}</a><span class="mute"> · ${h.tags.join(', ')}</span><p>${h.note}</p></li>`).join('')}</ul>`,
journal:()=>head('journal','Journal','Unedited, dated, mostly for me.')+'<div style="height:1rem"></div>'+posts(X.journal,'journal'),
contact:()=>head('contact','Contact','Say hello.')+`<dl class="kv" style="margin-top:1.5rem">${S.contacts.map(c=>`<dt>${c.label}</dt><dd><a href="${c.url}">${c.handle}</a></dd>`).join('')}</dl>`};
const dark=()=>document.documentElement.dataset.t?document.documentElement.dataset.t=='dark':!matchMedia('(prefers-color-scheme:light)').matches;
const latest=()=>{const el=$('#lw');if(!el)return;fetch(`https://api.github.com/users/${S.github}/events/public`).then(r=>r.json()).then(ev=>{const l=ev.filter(e=>e.type=='PushEvent').slice(0,6);el.innerHTML=l.map(e=>{const c=(e.payload.commits||[]).slice(-1)[0],m=c?c.message.split('\n')[0]:'Pushed commits';return`<li><a class="t" href="https://github.com/${e.repo.name}/commit/${e.payload.head}">${m}</a><p>${e.repo.name}</p></li>`}).join('')||'<li class="mute">No public activity yet.</li>'}).catch(()=>el.innerHTML='<li class="mute">Couldn’t load GitHub activity.</li>')};
async function render(){const [r,slug]=location.hash.replace(/^#\/?/,'').split('/');let h;
if(slug&&(r=='writing'||r=='journal')){const k=r=='writing'?'posts':'journal',m=X[k].find(p=>p.slug==slug)||{title:slug},t=await T(`content/${k}/${slug}.md`);h=`<article><a class="mute" href="#/${r}">← ${r=='writing'?'notes':r}</a><h1>${m.title}</h1><p class="mute">${m.date?D(m.date):''}</p>${md(t)}</article>`}
else h=(R[r||'']||R[''])();
$('#app').innerHTML=h;document.title=(r?r[0].toUpperCase()+r.slice(1)+' · ':'')+S.name;scrollTo(0,0);latest();
$('#nav').innerHTML=`<a class="home" href="#/">${S.name}</a>`+['projects','reading','writing','shared','journal','contact'].map(k=>`<a href="#/${k}" ${k==r?'aria-current="page"':''}>${k=='writing'?'notes':k}</a>`).join('')+'<button id="th" aria-label="Toggle theme">◐</button>';
$('#th').onclick=()=>{const n=dark()?'light':'dark';document.documentElement.dataset.t=n;localStorage.t=n}}
document.addEventListener('click',e=>{const a=e.target.closest('[data-act]');if(a){e.preventDefault();open(H[Math.random()*H.length|0].url,'_blank','noopener')}});
(async()=>{if(localStorage.t)document.documentElement.dataset.t=localStorage.t;
try{[S,X,P,B,H]=await Promise.all(['site','index','projects','reading','shared'].map(f=>J(`content/${f}.json`)))}catch(e){$('#app').innerHTML='<p>Can’t load content. Browsers block this when index.html is opened by double-click. In this folder run <code>python -m http.server</code>, then visit <code>http://localhost:8000</code>.</p>';return}
$('#foot').innerHTML=`<dl class="kv"><dt>Last modified</dt><dd>${D(document.lastModified)}</dd></dl><p>Edit content/, then run tools/publish.py.</p>`;
addEventListener('hashchange',render);render();
if(!matchMedia('(prefers-reduced-motion:reduce)').matches)addEventListener('pointermove',e=>{const s=$('.hero svg');if(!s)return;const r=s.getBoundingClientRect();s.style.setProperty('--aim',Math.max(-70,Math.min(30,Math.atan2(e.clientY-(r.top+r.height*.5),e.clientX-(r.left+r.width*.23))*180/Math.PI))+'deg')})})();
