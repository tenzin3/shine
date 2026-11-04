/* events */
document.addEventListener("click",e=>{
  if(!e.target.closest('#music-panel, #p-music'))showMusic(false);
  const ex=e.target.closest("[data-example]"); if(ex){const box=document.getElementById('mind-text'); if(box) box.value=ex.dataset.example; findTeachings(ex.dataset.example); return}
  const o=e.target.closest("[data-open]"); if(o){openReader(o.dataset.open);return}
  const g=e.target.closest("[data-go]"); if(g){document.getElementById("q").value=""; if(!document.getElementById("reader").hidden){document.getElementById("reader").hidden=true;openId=null} location.hash=g.dataset.go; return}
});
document.getElementById("r-close").onclick=closeReader;
document.getElementById("r-listen").onclick=()=>{if(player.id!==openId) loadTrack(openId); play()};
document.getElementById("p-play").onclick=()=>player.playing?pause():play();
document.getElementById("p-stop").onclick=stop;
document.getElementById("p-back").onclick=()=>jump(-1);
document.getElementById("p-fwd").onclick=()=>jump(1);
document.getElementById("p-range").oninput=e=>{narration.currentTime=+e.target.value; updateProg()};
document.getElementById("p-heart").onclick=e=>{if(!player.id)return; let s=store.get("shine-saved",[]); s=s.includes(player.id)?s.filter(x=>x!==player.id):[player.id,...s]; store.set("shine-saved",s); e.currentTarget.setAttribute("aria-pressed",s.includes(player.id)); if(current==="saved"&&document.getElementById("reader").hidden) go("saved")};
document.getElementById("today-btn").onclick=()=>openReader(today().id);
document.getElementById("surprise").onclick=()=>openReader(TEXTS[Math.floor(Math.random()*TEXTS.length)].id);
document.getElementById("q").addEventListener("input",()=>go(current));
document.getElementById("r-copy").onclick=async e=>{const el=document.getElementById("r-cite");try{await navigator.clipboard.writeText(el.innerText);e.target.textContent="Copied"}catch(err){const r=document.createRange();r.selectNodeContents(el);const s=getSelection();s.removeAllRanges();s.addRange(r);e.target.textContent="Selected, press Ctrl/Cmd+C"}setTimeout(()=>e.target.textContent="Copy citation",2200)};
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!document.getElementById("reader").hidden)closeReader()});
function route(){const h=location.hash.slice(1); if(byId(h)){if(!SHELVES.some(s=>s.id===current))go(current); openReader(h,false)} else {document.getElementById("reader").hidden=true; openId=null; go(SHELVES.some(s=>s.id===h)||h==="saved"?h:"home")}}
window.addEventListener("hashchange",route);
const setPH=()=>{
  document.documentElement.style.setProperty("--player-h",document.getElementById("player").offsetHeight+"px");
  document.documentElement.style.setProperty("--nav-h",document.getElementById("rail").offsetHeight+"px");
};
window.addEventListener("resize",setPH);
if(window.ResizeObserver){const layoutObserver=new ResizeObserver(setPH);layoutObserver.observe(document.getElementById("player"));layoutObserver.observe(document.getElementById("rail"));}
document.getElementById("p-disc").innerHTML=pic(today(),200);
route(); setPH();
