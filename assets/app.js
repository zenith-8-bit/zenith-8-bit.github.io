const progress=document.getElementById('scrollProgress'), nav=document.getElementById('navbar');
function scrollUI(){const h=document.documentElement.scrollHeight-innerHeight; progress.style.width=(h>0?(scrollY/h)*100:0)+'%'; nav?.classList.toggle('scrolled',scrollY>40)}
addEventListener('scroll',scrollUI,{passive:true});scrollUI();

const menu=document.getElementById('mobileMenu'),open=document.getElementById('menuBtn'),close=document.getElementById('mobileClose');
open?.addEventListener('click',()=>menu.classList.add('open'));close?.addEventListener('click',()=>menu.classList.remove('open'));
menu?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>menu.classList.remove('open')));

const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');observer.unobserve(e.target)}}),{threshold:.12});
document.querySelectorAll('.reveal').forEach((el,i)=>{el.style.transitionDelay=Math.min(i*35,280)+'ms';observer.observe(el)});

const typing=document.getElementById('typing');
if(typing){const phrases=['build --curious','trace --why','ship --small','break --safely','learn --deep'];let p=0,i=0,del=false;
function type(){const s=phrases[p];typing.textContent=del?s.slice(0,i--):s.slice(0,i++);if(!del&&i>s.length){del=true;setTimeout(type,1100);return}if(del&&i<0){del=false;p=(p+1)%phrases.length;i=0}setTimeout(type,del?35:65)}type()}

const cursor=document.getElementById('cursorFollower');
if(cursor&&matchMedia('(pointer:fine)').matches){let x=innerWidth/2,y=innerHeight/2,cx=x,cy=y;addEventListener('mousemove',e=>{x=e.clientX;y=e.clientY});function frame(){cx+=(x-cx)*.16;cy+=(y-cy)*.16;cursor.style.left=cx+'px';cursor.style.top=cy+'px';requestAnimationFrame(frame)}frame();
document.querySelectorAll('a,button,.project-card').forEach(el=>{el.addEventListener('mouseenter',()=>cursor.classList.add('hovering'));el.addEventListener('mouseleave',()=>cursor.classList.remove('hovering'))})}
