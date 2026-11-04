let current="home";
function go(id){
  current=id; const q=document.getElementById("q").value.trim();
  document.getElementById("view").innerHTML = q ? viewSearch(q) : id==="home"?viewHome(): id==="saved"?viewSaved(): viewShelf(id);
  rail(q?"":id); document.getElementById("content").scrollTop=0;
}

/* reader */
let openId=null;
function openReader(id,push=true){
  const t=byId(id); if(!t) return; openId=id; const s=shelfOf(t.playlist);
  document.getElementById("r-crumb").textContent=`${s.name} · ${t.minutes} min read`;
  document.getElementById("r-art").innerHTML=pic(t,500);
  document.getElementById("r-shelf").textContent=s.name;
  document.getElementById("r-title").textContent=t.title;
  document.getElementById("r-by").textContent=t.author;
  document.getElementById("r-text").innerHTML=t.paras.map((p,i)=>`<p data-i="${i}">${esc(p).replace(/\n/g,"<br>")}</p>`).join("");
  document.getElementById("r-cite").innerHTML=`“${esc(t.title)}” by ${esc(t.author)}. ${esc(t.credit)} <a href="${t.url}" target="_blank" rel="noopener">Lotsawa House</a>, CC BY-NC 4.0.<br><span style="opacity:.7;font-size:.85rem">Version ${esc(t.version)} · retrieved ${esc(t.retrieved)} · ${t.id}</span>`;
  const more=TEXTS.filter(x=>x.playlist===t.playlist&&x.id!==t.id);
  document.getElementById("r-more").innerHTML=more.length?`<div class="row-head"><h2>More in ${esc(s.name)}</h2></div><div class="row">${more.map(card).join("")}</div>`:"";
  const r=document.getElementById("reader"); r.hidden=false; r.scrollTop=0;
  let rec=store.get("shine-recent",[]).filter(x=>x!==id); rec.unshift(id); store.set("shine-recent",rec.slice(0,8));
  if(player.id!==id) loadTrack(id);
  if(push&&location.hash!=="#"+id) location.hash=id;
}
function closeReader(){document.getElementById("reader").hidden=true; openId=null; if(SHELVES.some(s=>s.id===current)||current==="saved") history.replaceState(null,"","#"+current); else history.replaceState(null,"",location.pathname+location.search); go(current)}
