const $=id=>document.getElementById(id);
const COLORS=['#ff8fa3','#ffd166','#7bdff2','#a8e6a1','#c3a6ff','#f4f1de'];
let items=[],color=COLORS[0],busy=false,openId=null;
try{items=JSON.parse(localStorage.getItem('nightjar')||'[]')}catch(e){}
const save=()=>{try{localStorage.setItem('nightjar',JSON.stringify(items))}catch(e){}};

/* moon phase */
(function(){
const p=((Date.now()-947182440000)/864e5/29.530588853%1+1)%1,w=p<.5?p:1-p,k=Math.cos(2*Math.PI*w);
const rx=Math.abs(k)*40,sw=k>0?0:1,l=$('lit');
l.setAttribute('d',`M50 10A40 40 0 0 1 50 90A${rx} 40 0 0 ${sw} 50 10Z`);
if(p>.5)l.setAttribute('transform','translate(100 0) scale(-1 1)');
$('mname').textContent=['new moon','waxing crescent','first quarter','waxing gibbous','full moon','waning gibbous','last quarter','waning crescent'][Math.floor(p*8+.5)%8];
})();

/* paper star */
function pts(R,r){const a=[];for(let i=0;i<10;i++){const g=Math.PI/5*i-Math.PI/2,d=i%2?r:R;a.push([50+d*Math.cos(g),50+d*Math.sin(g)])}return a}
function starMarkup(c){const p=pts(48,22);let h='';for(let i=0;i<10;i++){const t=`50,50 ${p[i]} ${p[(i+1)%10]}`;h+=`<polygon points="${t}" fill="${c}"/><polygon points="${t}" fill="${i%2?'#000':'#fff'}" opacity="${i%2?.15:.24}"/>`}return h}

/* jar */
function render(newId){
const g=$('stars');g.innerHTML='';
items.slice(-48).forEach((it,i)=>{
const row=Math.floor(i/6),col=i%6,r=n=>{const x=Math.sin(it.id%9973*12.9898+n*78.233)*43758.5453;return x-Math.floor(x)};
const x=44+col*21+(row%2?7:0)+r(1)*5,y=224-row*17+r(2)*4,rot=r(3)*70-35;
const e=document.createElementNS('http://www.w3.org/2000/svg','g');
e.setAttribute('class','st');e.setAttribute('transform',`translate(${x-10} ${y-10}) rotate(${rot} 10 10) scale(.2)`);
e.innerHTML=`<g class="in">${starMarkup(it.color)}</g>`;
e.onclick=()=>openRead(it.id,e);g.append(e);
if(it.id===newId)e.firstChild.animate([{transform:'translateY(-500px)',opacity:0},{transform:'translateY(0)',opacity:1}],{duration:700,easing:'cubic-bezier(.3,1.3,.5,1)'});
});
$('count').textContent=items.length?`${items.length} star${items.length>1?'s':''} in the jar`:'the jar is empty. it has room.';
}

/* write / fold */
COLORS.forEach((c,i)=>{const b=document.createElement('button');b.style.background=c;b.setAttribute('role','radio');b.setAttribute('aria-label','paper colour '+(i+1));b.setAttribute('aria-checked',i==0);
b.onclick=()=>{color=c;[...$('sw').children].forEach(x=>x.setAttribute('aria-checked',x===b))};$('sw').append(b)});
$('write').onclick=()=>{if(busy)return;$('wv').classList.add('on');$('tx').focus()};
$('cancel').onclick=()=>$('wv').classList.remove('on');
$('tx').oninput=()=>$('fold').disabled=!$('tx').value.trim();
$('fold').onclick=async()=>{
const text=$('tx').value.trim();if(!text)return;busy=true;$('wv').classList.remove('on');$('tx').value='';$('fold').disabled=true;
const w=220,h=150,cx=innerWidth/2,cy=innerHeight*.42;
const [fx,fy]=await chain(cx,cy,w,h,color,mkTpl(text),false);
const f=await morph(fx,fy,w,h,color,false);
const j=$('jar').getBoundingClientRect();
await f.animate([{transform:'scale(1)'},{transform:`translate(${j.left+j.width/2-fx}px,${j.top+j.height*.1-fy}px) scale(.45) rotate(30deg)`}],{duration:850,easing:'ease-in-out'}).finished;
f.remove();const id=Date.now();items.push({id,text,color});save();render(id);busy=false};

/* real paper folding helpers */
function mkTpl(text,date){const t=document.createElement('div');t.className='tl';const a=document.createElement('div');a.textContent=text;t.append(a);if(date){const d=document.createElement('small');d.textContent=date;t.append(d)}return t}
async function crease(cx,cy,w,h,ax,color,tp,rev){
const H=ax==='h',b=document.createElement('div');b.className='fbox';
Object.assign(b.style,{left:cx-w/2+'px',top:cy-h/2+'px',width:w+'px',height:h+'px'});
const st=document.createElement('div'),mv=document.createElement('div'),fr=document.createElement('div'),bk=document.createElement('div');
st.className='half st';mv.className='half mv';fr.className='ff';bk.className='ff';
st.style.background=fr.style.background=bk.style.background=color;
bk.innerHTML='<div style="position:absolute;inset:0;background:rgba(0,20,60,.12)"></div>';
bk.style.transform=H?'rotateX(180deg)':'rotateY(180deg)';
Object.assign(st.style,H?{left:0,top:0,width:'100%',height:'50%'}:{left:0,top:0,width:'50%',height:'100%'});
Object.assign(mv.style,H?{left:0,top:'50%',width:'100%',height:'50%',transformOrigin:'50% 0'}:{left:'50%',top:0,width:'50%',height:'100%',transformOrigin:'0 50%'});
if(tp){const t=()=>{const x=tp.cloneNode(true);x.style.width=w+'px';x.style.height=h+'px';x.style.left='0px';return x};const a=t(),c=t();a.style.top='0px';c.style.top=-h/2+'px';st.append(a);fr.append(c)}
mv.append(fr,bk);b.append(st,mv);document.body.append(b);
await mv.animate([{transform:H?'rotateX(0deg)':'rotateY(0deg)'},{transform:H?'rotateX(180deg)':'rotateY(-180deg)'}],{duration:520,easing:'ease-in-out',direction:rev?'reverse':'normal'}).finished;
b.remove()}
async function chain(cx,cy,w,h,color,tp,rev){
const S=[[cx,cy,w,h,'h',tp],[cx,cy-h/4,w,h/2,'v'],[cx-w/4,cy-h/4,w/2,h/2,'h']];
for(const q of(rev?S.slice().reverse():S))await crease(q[0],q[1],q[2],q[3],q[4],color,q[5],rev);
return[cx-w/4,cy-3*h/8]}
async function morph(fx,fy,w,h,color,rev){
const s=document.createElement('div');s.className='strip';Object.assign(s.style,{left:fx-w/4+'px',top:fy-h/8+'px',width:w/2+'px',height:h/4+'px',background:color,display:rev?'none':'block'});document.body.append(s);
const f=flyer(color,fx,fy);f.style.display=rev?'block':'none';
const A=(el,k,d)=>el.animate(k,{duration:d,easing:'ease-in-out',direction:rev?'reverse':'normal'}).finished;
const K1=[{transform:'none'},{transform:'rotate(90deg) scale(.6)'}],K2=[{transform:'scale(.2) rotate(-90deg)'},{transform:'scale(1.25) rotate(20deg)',offset:.7},{transform:'scale(1)'}];
if(!rev){await A(s,K1,300);s.style.display='none';f.style.display='block';await A(f,K2,380)}
else{await A(f,K2,380);f.style.display='none';s.style.display='block';await A(s,K1,300)}
s.remove();return f}

/* read: unfold / fold back / let go */
let cur=null;
function flyer(color,x,y){const f=document.createElement('div');f.className='fly';f.style.left=x+'px';f.style.top=y+'px';f.innerHTML=`<svg viewBox="0 0 100 100" width="60" height="60">${starMarkup(color)}</svg>`;document.body.append(f);return f}
async function openRead(id,e){
if(busy)return;const it=items.find(x=>x.id===id);if(!it)return;busy=true;
const r=e.getBoundingClientRect(),ex=r.left+r.width/2,ey=r.top+r.height/2,date=new Date(it.id).toLocaleString([],{dateStyle:'medium',timeStyle:'short'});
const p=document.createElement('div');p.className='paper big';p.style.background=it.color;
const t=document.createElement('div');t.textContent=it.text;const d=document.createElement('small');d.textContent=date;p.append(t,d);
p.style.visibility='hidden';document.body.append(p);
const w=p.offsetWidth,h=p.offsetHeight,cx=innerWidth/2,cy=innerHeight*.4;
Object.assign(p.style,{left:cx-w/2+'px',top:cy-h/2+'px',height:h+'px'});
e.style.opacity=0;$('rv').classList.add('on');
const fx=cx-w/4,fy=cy-3*h/8,fl=flyer(it.color,ex,ey);
await fl.animate([{transform:`scale(${r.width/60})`},{transform:`translate(${fx-ex}px,${fy-ey}px) scale(1)`}],{duration:750,easing:'ease-in-out',fill:'forwards'}).finished;
fl.remove();
(await morph(fx,fy,w,h,it.color,true)).remove();
await chain(cx,cy,w,h,it.color,mkTpl(it.text,date),true);
p.style.visibility='';$('acts').style.top=(cy+h/2+16)+'px';$('acts').classList.add('on');
cur={id,e,p,color:it.color,w,h,cx,cy,tp:mkTpl(it.text,date)};busy=false}
async function closeRead(del){
if(!cur||busy)return;busy=true;const{id,e,p,color,w,h,cx,cy,tp}=cur;$('acts').classList.remove('on');
if(del){await p.animate([{transform:'none',opacity:1},{transform:'translateY(-140px) scale(.3) rotate(25deg)',opacity:0}],{duration:800,easing:'ease-in',fill:'forwards'}).finished;
items=items.filter(x=>x.id!==id);save();p.remove();$('rv').classList.remove('on');cur=null;render();busy=false;return}
p.remove();
const[fx,fy]=await chain(cx,cy,w,h,color,tp,false),f=await morph(fx,fy,w,h,color,false);
const r=e.getBoundingClientRect(),ex=r.left+r.width/2,ey=r.top+r.height/2;
await f.animate([{transform:'scale(1)'},{transform:`translate(${ex-fx}px,${ey-fy}px) scale(${r.width/60})`}],{duration:750,easing:'ease-in-out',fill:'forwards'}).finished;
f.remove();e.style.opacity=1;$('rv').classList.remove('on');cur=null;busy=false}
$('keep').onclick=()=>closeRead(false);$('go').onclick=()=>closeRead(true);$('rv').onclick=()=>closeRead(false);
addEventListener('keydown',ev=>{if(ev.key==='Escape'){if(cur)closeRead(false);else $('wv').classList.remove('on')}});
render();

/* sky */
const cv=$('sky'),c=cv.getContext('2d'),still=matchMedia('(prefers-reduced-motion: reduce)').matches;
let W,H,S=[],sh=null,next=4;
function size(){const d=devicePixelRatio||1;W=innerWidth;H=innerHeight;cv.width=W*d;cv.height=H*d;c.setTransform(d,0,0,d,0,0);
S=Array.from({length:Math.round(W*H/5000)},()=>({x:Math.random()*W|0,y:Math.random()*H*.9|0,s:Math.random()<.1?3:Math.random()<.45?2:1,p:Math.random()*6,v:.6+Math.random()*1.6,w:Math.random()<.2}));if(still)draw(0)}
function draw(t){
c.clearRect(0,0,W,H);
for(const s of S){c.globalAlpha=still?.8:.3+.7*(.5+.5*Math.sin(t*s.v+s.p));c.fillStyle=s.w?'#ffe9b0':'#dfe6ff';
if(s.s===3){c.fillRect(s.x-2,s.y,5,1);c.fillRect(s.x,s.y-2,1,5)}else c.fillRect(s.x,s.y,s.s,s.s)}
if(!still){
if(!sh&&t>next){sh={x:Math.random()*W*.7,y:Math.random()*H*.3,vx:9+Math.random()*4,vy:4+Math.random()*3,l:0};next=t+7+Math.random()*9}
if(sh){for(let i=0;i<16;i++){c.globalAlpha=(1-i/16)*Math.max(0,1-sh.l/70);c.fillStyle='#fff6d6';const z=i<3?3:2;c.fillRect((sh.x-sh.vx*i*.7)|0,(sh.y-sh.vy*i*.7)|0,z,z)}
sh.x+=sh.vx;sh.y+=sh.vy;sh.l++;if(sh.l>70||sh.x>W+40)sh=null}}
c.globalAlpha=1}
function loop(ms){draw(ms/1000);requestAnimationFrame(loop)}
addEventListener('resize',size);size();if(!still)requestAnimationFrame(loop);
