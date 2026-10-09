/* tiny markdown: headings, lists, tasks, tables, code, quotes, hr, images, links. returns {html, toc} */
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const slug=s=>s.toLowerCase().replace(/<[^>]+>/g,'').replace(/[^\w]+/g,'-').replace(/^-|-$/g,'');
const md=src=>{
 src=src.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/,'').replace(/\r\n/g,'\n');
 const safe=u=>/^(https?:|mailto:|#|\.{0,2}\/|[\w-]+\/)/i.test(u)?u:'#';
 const inl=t=>{const k=[];t=esc(t).replace(/`([^`]+)`/g,(_,c)=>(k.push(c),'\u0000'+(k.length-1)+'\u0000'))
  .replace(/!\[(.*?)\]\((.*?)\)/g,(_,a,u)=>`<img alt="${a}" src="${safe(u)}" loading="lazy">`)
  .replace(/\[(.*?)\]\((.*?)\)/g,(_,a,u)=>`<a href="${safe(u)}">${a}</a>`)
  .replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').replace(/(^|[\s(])\*(?!\s)(.+?)\*/g,'$1<i>$2</i>').replace(/~~(.+?)~~/g,'<s>$1</s>');
  return t.replace(/\u0000(\d+)\u0000/g,(_,i)=>`<code>${k[i]}</code>`)};
 const L=src.split('\n'),out=[],toc=[];let i=0;
 const blk=l=>/^(```|#{1,3} |>|[-*] |\d+\. |---+$|\|)/.test(l);
 while(i<L.length){let l=L[i];
  if(!l.trim()){i++;continue}
  if(l.startsWith('```')){const lang=l.slice(3).trim(),c=[];i++;while(i<L.length&&!L[i].startsWith('```'))c.push(L[i++]);i++;
   out.push(`<figure class="code"><figcaption><span>${esc(lang||'code')}</span><button data-copy>copy</button></figcaption><pre><code>${esc(c.join('\n'))}</code></pre></figure>`);continue}
  let m=l.match(/^(#{1,3}) (.*)/);
  if(m){const n=m[1].length+1,id=slug(m[2]);if(n<=3)toc.push({id,t:m[2].replace(/[`*]/g,'')});out.push(`<h${n} id="${id}">${inl(m[2])}<a class="an" href="#/" data-anchor="${id}">#</a></h${n}>`);i++;continue}
  if(/^---+$/.test(l.trim())){out.push('<hr>');i++;continue}
  if(l[0]=='>'){const c=[];while(i<L.length&&L[i][0]=='>')c.push(L[i++].replace(/^> ?/,''));out.push(`<blockquote>${inl(c.join(' '))}</blockquote>`);continue}
  if(/^\|/.test(l)&&/^\|?[\s:|-]+\|?$/.test(L[i+1]||'')){const row=r=>r.replace(/^\||\|$/g,'').split('|').map(x=>x.trim()),h=row(l);i+=2;const b=[];
   while(i<L.length&&/^\|/.test(L[i]))b.push(row(L[i++]));out.push(`<table><thead><tr>${h.map(x=>`<th>${inl(x)}</th>`).join('')}</tr></thead><tbody>${b.map(r=>`<tr>${r.map(x=>`<td>${inl(x)}</td>`).join('')}</tr>`).join('')}</tbody></table>`);continue}
  if(/^([-*]|\d+\.) /.test(l)){const ord=/^\d/.test(l),c=[];while(i<L.length&&/^([-*]|\d+\.) /.test(L[i]))c.push(L[i++].replace(/^([-*]|\d+\.) /,''));
   out.push(`<${ord?'ol':'ul'}>${c.map(x=>`<li>${inl(x.replace(/^\[( |x)\] /,(_,v)=>v=='x'?'☑ ':'☐ '))}</li>`).join('')}</${ord?'ol':'ul'}>`);continue}
  const p=[];while(i<L.length&&L[i].trim()&&!(blk(L[i])&&p.length))p.push(L[i++]);out.push(`<p>${inl(p.join(' '))}</p>`)}
 return{html:out.join(''),toc}};
