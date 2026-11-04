/* "What's on your mind?" panel */
const EXAMPLES=["I can’t focus on my studies","I’m angry at someone close to me","I lost someone I love","I miss my family back home"];
const spark={text:'',status:'idle',result:null,error:''};
function crisisBox(){
  return `<div class="crisis" role="alert"><p><b>It sounds like you’re carrying something very heavy right now.</b> You don’t have to face it alone. Please reach out to someone today:</p>
  <ul><li>India: Tele-MANAS, call <a href="tel:14416">14416</a> (free, 24 hours)</li>
  <li>United States: call or text <a href="tel:988">988</a></li>
  <li>Elsewhere: find a helpline at <a href="https://findahelpline.com" target="_blank" rel="noopener">findahelpline.com</a></li>
  <li>If you are in immediate danger, call your local emergency number (112 in India).</li></ul>
  <p>Talking with a trusted friend, family member or teacher can help too.</p></div>`;
}
function mindPanel(){
  const r=spark.result; let out='';
  if(spark.status==='loading') out=`<p class="mind-status" role="status">Finding teachings for you<span class="dots"></span></p>`;
  else if(spark.status==='error') out=`<p class="mind-status" role="alert">${esc(spark.error)}</p>`;
  else if(r&&r.crisis) out=crisisBox();
  else if(r){
    const picks=(r.picks||[]).map(p=>({t:byId(p.id),why:p.why,hits:p.hits})).filter(p=>p.t);
    out=(r.reflection?`<p class="reflect">${esc(r.reflection)}</p>`:'')+
      (picks.length?`<div class="picks">${picks.map(p=>`<div class="pick">${card(p.t)}${p.why?`<p class="why">${esc(p.why)}</p>`:''}${p.hits&&p.hits.length?`<p class="hits">Matched: ${p.hits.map(esc).join(', ')}</p>`:''}</div>`).join('')}</div>`
        :`<p class="mind-status">No close match this time. <button class="chip" data-go="beginners">Start here</button> is a good place to begin.</p>`);
  }
  const badge='Word matching · Datamuse';
  const note='Shine matches your words to its lessons using keywords and related words from <a href="https://www.datamuse.com/api/" target="_blank" rel="noopener">Datamuse</a>, a free word-finding service. Only single words are looked up, and Shine doesn’t store what you write. Shine is Buddhist practice and reflection, not medical or mental-health care.';
  return `<section class="mind" aria-labelledby="mind-h"><div class="mind-head"><h2 id="mind-h">What’s on your mind?</h2><span class="spark-badge">${badge}</span></div>
  <form class="mind-form" id="mind-form"><textarea id="mind-text" maxlength="600" aria-labelledby="mind-h" placeholder="Write a few words, for example: I keep arguing with my brother and feel guilty afterwards.">${esc(spark.text)}</textarea>
  <div class="mind-actions">${EXAMPLES.map(x=>`<button type="button" class="chip" data-example="${esc(x)}">${esc(x)}</button>`).join('')}<button class="find" type="submit" ${spark.status==='loading'?'disabled':''}>Find teachings</button></div></form>
  <p class="mind-note">${note}</p>
  <div class="mind-out" aria-live="polite">${out}</div></section>`;
}
function rerenderMind(scroll){
  const old=document.querySelector('.mind'); if(!old) return;
  const tmp=document.createElement('div'); tmp.innerHTML=mindPanel(); old.replaceWith(tmp.firstElementChild);
  if(scroll) document.querySelector('.mind-out')?.scrollIntoView({block:'nearest',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
}
async function findTeachings(text){
  spark.text=text=(text||'').trim();
  if(text.length<3){spark.status='error';spark.error='Write a few words about what’s on your mind.';return rerenderMind()}
  if(CRISIS_RE&&CRISIS_RE.test(text)){spark.result={crisis:true,picks:[]};spark.status='done';return rerenderMind(true)}
  spark.status='loading';spark.result=null;rerenderMind();
  try{spark.result=await localMatch(text);spark.status='done'}
  catch(e){spark.status='error';spark.error='Something went wrong while matching. Please try again.'}
  rerenderMind(true);
}
document.addEventListener('submit',e=>{if(e.target.id==='mind-form'){e.preventDefault();findTeachings(document.getElementById('mind-text').value)}});
document.addEventListener('input',e=>{if(e.target.id==='mind-text')spark.text=e.target.value});
document.addEventListener('keydown',e=>{if(e.target.id==='mind-text'&&e.key==='Enter'&&(e.metaKey||e.ctrlKey)){e.preventDefault();findTeachings(e.target.value)}});
