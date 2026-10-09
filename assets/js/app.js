const $=s=>document.querySelector(s),J=u=>fetch(u).then(r=>{if(!r.ok)throw 0;return r.json()}),T=u=>fetch(u).then(r=>{if(!r.ok)throw 0;return r.text()});
const D=d=>new Date(d).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'});
const cls=s=>esc(String(s||'').replace(/\s+/g,'-')),reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
const tagsOf=l=>[...new Set(l.flatMap(x=>x.tags||[]))].sort();
const chips=t=>t&&t.length?`<div class="chips">${t.map(x=>`<span class="chip">${esc(x)}</span>`).join('')}</div>`:'';
const filters=l=>`<div class="filters" data-filters><button class="chip on" data-f="">all</button>${tagsOf(l).map(t=>`<button class="chip" data-f="${esc(t)}">${esc(t)}</button>`).join('')}</div>`;
const head=(k,t,s)=>`<div class="art sm">${A[k]}</div><h1>${t}</h1><p class="sub">${s}</p>`;
const skel=n=>Array.from({length:n},()=>'<div class="sk l"></div>').join('');
const empty=(m)=>`<p class="mute">${m}</p>`;
let S,X,P,B,H;

const pcard=(p,i=0)=>`<div class="card rv" style="--d:${i}" data-tags="${esc((p.tags||[]).join('|'))}"><h3>${p.url?`<a class="t" href="${esc(p.url)}" target="_blank" rel="noopener">${esc(p.title)} ↗</a>`:esc(p.title)}<span class="badge ${cls(p.status)}">${esc(p.status)}</span>${p.year?`<span class="meta">${esc(p.year)}</span>`:''}</h3><p>${esc(p.blurb)}</p>${chips(p.tags)}${p.details?`<button class="tg" data-xp aria-expanded="false"><i>▸</i> how it works</button><div class="xp"><div><div class="in">${md(p.details).html}</div></div></div>`:''}</div>`;
const pcards=l=>`<div class="stack">${l.map(pcard).join('')}</div>`;
const post=(p,r,i=0)=>`<a class="card post rv" style="--d:${i}" href="#/${r}/${p.slug}"><h3>${esc(p.title)}<span class="meta">${D(p.date)}${p.read?` · ${p.read} min`:''}</span></h3>${p.summary?`<p>${esc(p.summary)}</p>`:''}${p.mood?`<p class="mono" style="font-size:.78rem">mood: ${esc(p.mood)}</p>`:''}${chips((p.tags||'').split(',').map(s=>s.trim()).filter(Boolean))}</a>`;
const posts=(l,r)=>l.length?`<div class="stack">${l.map((p,i)=>post(p,r,i)).join('')}</div>`:empty(`Nothing yet. Run <code>python tools/zen.py</code> to write one.`);
const stars=n=>{n=+n||0;return n?`<span class="stars">${'★'.repeat(n)}<s>${'★'.repeat(5-n)}</s></span>`:''};
const contacts=()=>`<dl class="kv">${S.contacts.map(c=>`<dt>${esc(c.label)}</dt><dd><a href="${esc(c.url)}">${esc(c.handle)}</a></dd>`).join('')}</dl>`;
const sec=(t,n)=>`<h2>${t}${n!=null?` <small>${n}</small>`:''}</h2>`;

const R={
'':()=>`<h1 class="name">${esc(S.name)}</h1><p class="sub">${esc(S.role)} · ${esc(S.location)}</p>
<span class="pill"><span class="dot"></span>${esc((S.now||[])[0]||'building things')}</span>
<div class="art hero">${A.hero}</div>
<p class="hl">${esc(S.headline)}</p>${S.about.map(p=>`<p>${esc(p)}</p>`).join('')}
<div class="btns"><a class="btn p" href="#/projects">See projects <span>→</span></a><a class="btn" href="#/writing">Read notes <span>→</span></a><a class="btn" href="#/contact">Say hello</a></div>
${sec('Selected projects')}<div class="stack">${P.slice(0,4).map(pcard).join('')}</div><a class="more" href="#/projects">All ${P.length} projects →</a>
${X.posts.length?sec('Latest notes')+posts(X.posts.slice(0,3),'writing')+'<a class="more" href="#/writing">All notes →</a>':''}
${sec('What I’m into')}<div class="grid g2">${S.interests.map((i,n)=>`<div class="card rv" style="--d:${n%2}"><h3>${esc(i.t)}</h3><p>${esc(i.d)}</p></div>`).join('')}</div>
${sec('Experimenting with')}<div class="chips rv" style="margin:0">${S.experiments.map(e=>`<span class="chip">${esc(e)}</span>`).join('')}</div>
${sec('Before this')}<ul class="tl rv">${S.background.map(b=>`<li>${esc(b)}</li>`).join('')}</ul>
${sec('Latest work on GitHub')}<div id="lw">${skel(3)}</div><a class="more" href="https://github.com/${esc(S.github)}">Follow on GitHub →</a>
${sec('Now')}<ul class="now rv">${S.now.map(n=>`<li>${esc(n)}</li>`).join('')}</ul><p class="mute">Updated ${esc(S.nowUpdated)}</p>
${sec('Connect')}<div class="rv">${contacts()}</div>`,
projects:()=>head('projects','Projects','Things I built. Open one for the how and why.')+filters(P)+`<div class="stack" data-filterable>${P.map(pcard).join('')}</div>`,
reading:()=>head('reading','Reading list','On the shelf, in hand, and queued.')+['reading','next','read'].map(s=>{const l=B.filter(b=>b.status==s);return l.length?sec({reading:'Reading now',read:'Finished',next:'Up next'}[s],l.length)+`<div class="stack">${l.map((b,i)=>`<div class="card rv" style="--d:${i}"><h3>${esc(b.title)}<span class="meta">${esc(b.author)}</span></h3>${b.note?`<p>${esc(b.note)}</p>`:''}${b.rating?`<p>${stars(b.rating)}</p>`:''}</div>`).join('')}</div>`:''}).join('')||empty('Empty shelf.'),
writing:()=>head('writing','Notes','Things I wrote.')+'<div style="height:1.2rem"></div>'+posts(X.posts,'writing'),
journal:()=>head('journal','Journal','Unedited, dated, mostly for me.')+'<div style="height:1.2rem"></div>'+posts(X.journal,'journal'),
shared:()=>head('shared','Blogs I like','Other people’s sites worth your time.')+`<p style="margin-top:1.2rem"><button class="btn" data-act="rb">Surprise me <span>↗</span></button></p>${filters(H)}<div class="stack" data-filterable>${H.map((h,i)=>`<a class="card post rv" style="--d:${i%4}" href="${esc(h.url)}" target="_blank" rel="noopener" data-tags="${esc((h.tags||[]).join('|'))}"><h3>${esc(h.name)} <span class="meta">${esc(new URL(h.url).hostname)} ↗</span></h3><p>${esc(h.note)}</p>${chips(h.tags)}</a>`).join('')}</div>`,
contact:()=>head('contact','Contact','Say hello.')+`<div style="margin-top:1.5rem">${contacts()}</div>`};

const dark=()=>document.documentElement.dataset.t?document.documentElement.dataset.t=='dark':!matchMedia('(prefers-color-scheme:light)').matches;
const toast=m=>{const t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove('on'),1600)};
const latest=()=>{const el=$('#lw');if(!el)return;fetch(`https://api.github.com/users/${S.github}/events/public`).then(r=>r.json()).then(ev=>{const l=ev.filter(e=>e.type=='PushEvent').slice(0,5);el.innerHTML=l.length?`<ul class="rows">${l.map(e=>{const c=(e.payload.commits||[]).slice(-1)[0],m=c?c.message.split('\n')[0]:'Pushed commits';return`<li><a class="t" href="https://github.com/${e.repo.name}/commit/${e.payload.head}">${esc(m)}</a><p>${esc(e.repo.name)}</p></li>`}).join('')}</ul>`:empty('No public activity yet.')}).catch(()=>el.innerHTML=empty('Couldn’t load GitHub activity.'))};

const io='IntersectionObserver'in window?new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.08,rootMargin:'0px 0px -30px 0px'}):null;
const mount=h=>{const m=$('#app');m.innerHTML=h;m.className='page';[...m.children].forEach((c,i)=>c.style.setProperty('--i',Math.min(i,8)));m.querySelectorAll('.rv').forEach(e=>io?io.observe(e):e.classList.add('in'))};

async function article(r,slug){const k=r=='writing'?'posts':'journal',list=X[k],i=list.findIndex(p=>p.slug==slug),m=list[i]||{title:slug};
 mount(`<article><a class="back" href="#/${r}">← ${r=='writing'?'notes':r}</a><h1>${esc(m.title)}</h1><div class="sk s"></div><div class="sk"></div><div class="sk"></div><div class="sk s"></div></article>`);
 let t;try{t=await T(`content/${k}/${slug}.md`)}catch{mount(`<article><a class="back" href="#/${r}">← back</a><h1>Not found</h1><p class="mute">That entry doesn’t exist.</p></article>`);return}
 const {html,toc}=md(t),tg=(m.tags||'').split(',').map(s=>s.trim()).filter(Boolean),nw=list[i-1],ol=list[i+1];
 mount(`<article><a class="back" href="#/${r}">← ${r=='writing'?'notes':r}</a><h1>${esc(m.title)}</h1><div class="ameta">${m.date?`<span>${D(m.date)}</span>`:''}${m.read?`<span>· ${m.read} min read</span>`:''}${m.mood?`<span>· mood: ${esc(m.mood)}</span>`:''}<button class="chip" data-share style="margin-left:auto;cursor:pointer">copy link</button></div>${chips(tg)}
 ${toc.length>=3?`<div class="toc"><b>On this page</b>${toc.map(h=>`<a href="#/" data-anchor="${h.id}">${esc(h.t)}</a>`).join('')}</div>`:''}
 <div class="body">${html}</div>
 <div class="pn">${ol?`<a class="card" href="#/${r}/${ol.slug}"><small>← Older</small><br>${esc(ol.title)}</a>`:'<span></span>'}${nw?`<a class="card nx" href="#/${r}/${nw.slug}"><small>Newer →</small><br>${esc(nw.title)}</a>`:'<span></span>'}</div></article>`)}

async function render(){const [r,slug]=location.hash.replace(/^#\/?/,'').split('/');
 if(slug&&(r=='writing'||r=='journal'))await article(r,slug);else mount((R[r||'']||R[''])());
 document.title=(r?r[0].toUpperCase()+r.slice(1)+' · ':'')+S.name;scrollTo(0,0);latest();
 document.querySelectorAll('nav [data-k]').forEach(a=>a.toggleAttribute('aria-current',a.dataset.k==r))}

document.addEventListener('click',e=>{const q=s=>e.target.closest(s);let a;
 if(a=q('[data-act]')){e.preventDefault();open(H[Math.random()*H.length|0].url,'_blank','noopener')}
 if(a=q('[data-xp]')){const c=a.closest('.card'),o=c.classList.toggle('open');a.setAttribute('aria-expanded',o)}
 if(a=q('[data-copy]')){navigator.clipboard?.writeText(a.closest('figure').querySelector('code').textContent);a.textContent='copied';setTimeout(()=>a.textContent='copy',1400)}
 if(a=q('[data-anchor]')){e.preventDefault();document.getElementById(a.dataset.anchor)?.scrollIntoView({behavior:reduce?'auto':'smooth'})}
 if(a=q('[data-share]')){navigator.clipboard?.writeText(location.href);toast('Link copied')}
 if(a=q('[data-f]')){const f=a.dataset.f;a.parentNode.querySelectorAll('.chip').forEach(c=>c.classList.toggle('on',c==a));
  document.querySelectorAll('[data-filterable]>*').forEach(c=>{const ok=!f||(c.dataset.tags||'').split('|').includes(f);c.hidden=!ok;if(ok)c.classList.add('in')})}
 if(a=q('#th')){const n=dark()?'light':'dark';document.documentElement.dataset.t=n;localStorage.t=n}});
addEventListener('pointermove',e=>{const c=e.target.closest?.('.card');if(c){const b=c.getBoundingClientRect();c.style.setProperty('--mx',e.clientX-b.left+'px');c.style.setProperty('--my',e.clientY-b.top+'px')}
 if(reduce)return;const s=$('.hero svg');if(!s)return;const r=s.getBoundingClientRect();s.style.setProperty('--aim',Math.max(-70,Math.min(30,Math.atan2(e.clientY-(r.top+r.height*.5),e.clientX-(r.left+r.width*.23))*180/Math.PI))+'deg')});
addEventListener('scroll',()=>{const h=document.documentElement.scrollHeight-innerHeight;$('#bar').style.transform=`scaleX(${h>0?scrollY/h:0})`;$('nav').classList.toggle('s',scrollY>10)},{passive:true});

(async()=>{if(localStorage.t)document.documentElement.dataset.t=localStorage.t;
 const t0=performance.now(),first=!sessionStorage.booted;
 try{[S,X,P,B,H]=await Promise.all(['site','index','projects','reading','shared'].map(f=>J(`content/${f}.json`)))}
 catch(e){$('#boot').remove();$('#app').innerHTML='<p>Can’t load content. Browsers block this when index.html is opened by double-click. In this folder run <code>python tools/zen.py serve</code>, then visit <code>http://localhost:8000</code>.</p>';return}
 $('#nav').innerHTML=`<div class="navin"><a class="home" href="#/"><i>Z</i>${esc(S.name)}</a>`+['projects','reading','writing','shared','journal','contact'].map(k=>`<a data-k="${k}" href="#/${k}">${k=='writing'?'notes':k}</a>`).join('')+'<button id="th" aria-label="Toggle theme">◐</button></div>';
 $('#foot').innerHTML=`<dl class="kv"><dt>Last modified</dt><dd>${D(document.lastModified)}</dd></dl><p>© ${new Date().getFullYear()} ${esc(S.name)}. Edit content/ with <code>python tools/zen.py</code>.</p>`;
 addEventListener('hashchange',render);await render();
 const wait=first&&!reduce?Math.max(0,1100-(performance.now()-t0)):0;sessionStorage.booted=1;
 setTimeout(()=>{const b=$('#boot');b.classList.add('out');setTimeout(()=>b.remove(),600)},wait)})();
