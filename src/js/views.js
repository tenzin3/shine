function rail(active){
  const scrollLeft=document.querySelector(".nav-links")?.scrollLeft||0;
  const items=[{id:"home",name:"Home",icon:"home",c:["#6fe3c1","#4aa3ff"]},...SHELVES,{id:"saved",name:"Saved",icon:"star",c:["#f2d36b","#ff8fb1"]}];
  document.getElementById("rail").innerHTML=`<a class="logo" href="#home" aria-label="Shine home"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 4c3 5 6 8 6 13a6 6 0 0 1-12 0c0-5 3-8 6-13z" fill="#f2b84b"/><path d="M9 25h14l-2 4H11z" fill="#fff" opacity=".8"/></svg>Shine</a>`+
   `<div class="nav-links">`+items.map(s=>`<button class="nav-item" data-go="${s.id}" ${s.id===active?'aria-current="page"':""} style="--c1:${s.c[0]};--c2:${s.c[1]}"><span class="ring"><span><svg viewBox="0 0 24 24">${ICONS[s.icon]}</svg></span></span>${esc(s.name)}</button>`).join("")+`</div>`+
   `<p class="legal">Texts from <a href="https://www.lotsawahouse.org" target="_blank" rel="noopener">Lotsawa House</a>, CC BY-NC 4.0. Shine is Buddhist practice and reflection, not medical advice.</p>`;
  document.querySelector(".nav-links").scrollLeft=scrollLeft;
}
const card=t=>`<button class="card" data-open="${t.id}"><div class="thumb">${pic(t,400)}<span class="dur"><svg viewBox="0 0 10 10"><path d="M1 0v10l9-5z"/></svg>${t.minutes} min</span></div><h3>${esc(t.title)}</h3><div class="sub">${esc(shelfOf(t.playlist).name)} · ${esc(t.author)}</div></button>`;
function today(){const pool=TEXTS.filter(t=>t.minutes<=6);return pool[Math.floor(Date.now()/864e5)%pool.length]}

function viewHome(){
  const t=today(), recent=store.get("shine-recent",[]).map(byId).filter(Boolean);
  let h=`<button class="banner" data-open="${t.id}"><span class="badge"><svg viewBox="0 0 24 24"><path d="M12 3c2.5 4 4 6 4 9a4 4 0 0 1-8 0c0-3 1.5-5 4-9z"/></svg></span><span><b>Today’s teaching:</b> ${esc(t.title)} by ${esc(t.author)} · ${t.minutes} min</span><span class="chev">›</span></button>`;
  h+=`<h1 class="coll">Tibetan wisdom for everyday life</h1><p class="intro">Short teachings from Tibetan Buddhist masters, gathered around the difficulties we all meet. Read them, or press play and listen.</p>`;
  h+=mindPanel();
  if(recent.length) h+=row("Continue","recent",recent);
  for(const s of SHELVES){const list=TEXTS.filter(x=>x.playlist===s.id); if(list.length) h+=row(s.name,s.id,list)}
  return h;
}
const row=(name,id,list)=>`<div class="row-head"><h2>${esc(name)}</h2>${id==="recent"?"":`<button data-go="${id}">See all ›</button>`}</div><div class="row">${list.map(card).join("")}</div>`;
function viewShelf(id){const s=shelfOf(id),list=TEXTS.filter(t=>t.playlist===id);return`<h1 class="coll">${esc(s.name)}</h1><p class="intro">${esc(s.line)}</p><div class="grid">${list.map(card).join("")}</div>`}
function viewSaved(){const list=store.get("shine-saved",[]).map(byId).filter(Boolean);return`<h1 class="coll">Saved</h1><p class="intro">Teachings you marked with the heart in the player.</p>`+(list.length?`<div class="grid">${list.map(card).join("")}</div>`:`<p class="empty">Nothing saved yet. Open a teaching and tap the heart in the player bar.</p>`)}
function viewSearch(q){const ql=q.toLowerCase(),hits=TEXTS.filter(t=>(t.title+" "+t.author+" "+t.paras.join(" ")).toLowerCase().includes(ql));return`<h1 class="coll">Results for “${esc(q)}”</h1><p class="intro">${hits.length} teaching${hits.length===1?"":"s"}</p>`+(hits.length?`<div class="grid">${hits.map(card).join("")}</div>`:`<p class="empty">Try a feeling like “anger” or a master like “Patrul”.</p>`)}
