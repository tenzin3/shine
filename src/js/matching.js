/* Free matcher: the person's words (plus related words from Datamuse) are scored against
   hand-written keywords for each lesson and collection. */
const STOP=new Set(`about above after again against also always am an and any are as at be because been before being below between both but by can cant could did do does doing dont down during each even ever every feel feeling feels felt few for from further get gets getting got had has have having he her here hers him his how i im ive if in into is it its just keep keeps know like lot lots make me more most much my myself no nor not now of off on once only or other our out over own really same she should so some someone something such than that the their them then there these they thing things this those through to too under until up very was we were what when where which while who why will with would you your yours yourself one back always never still want wants need needs going all last month week year day since everything anything nothing very lately recently today`.split(/\s+/));
const stem=w=>{w=w.toLowerCase().replace(/[^a-z]/g,'');for(const x of['fulness','iness','ness','ments','ment','ings','ing','edly','ied','ies','ed','ful','ily','ly','es','s','y'])if(w.length-x.length>=4&&w.endsWith(x))return w.slice(0,-x.length);return w};
const sameStem=(a,b)=>a===b||(a.length>=5&&b.length>=5&&(a.startsWith(b)||b.startsWith(a)));
const PHRASES=[
 [/\b(passed away|lost (my|our|her|his|a|someone)|died|funeral|death of)\b/,'death grief'],
 [/\bmiss(ing)? (my|our|home|family|mom|mum|dad|parents)/,'homesick missing family'],
 [/\bcan'?t (focus|concentrate|sit still|stop thinking)/,'distracted restless'],
 [/\bnew to (meditat|buddh)|how (do i|to) (start|begin|meditate)/,'beginner']];
let VOCAB=null;
function vocab(){
  if(VOCAB)return VOCAB; VOCAB={};
  for(const t of TEXTS){
    const v=new Map(),info=(MATCH_DATA.lessons||{})[t.id]||{};
    const add=(text,w)=>{for(const word of String(text).toLowerCase().split(/[^a-z]+/)){if(word.length<3||STOP.has(word))continue;const k=stem(word);if((v.get(k)?.w||0)<w)v.set(k,{w,word})}};
    add(t.title+' '+(info.summary||''),1);
    add(((MATCH_DATA.collections||{})[t.playlist]||[]).join(' '),2);
    add((info.keywords||[]).join(' '),3);
    VOCAB[t.id]=v;
  }
  return VOCAB;
}
const dmCache=new Map();
function related(word){
  if(!dmCache.has(word))dmCache.set(word,(async()=>{
    const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),5000);
    try{const r=await fetch('https://api.datamuse.com/words?ml='+encodeURIComponent(word)+'&max=20',{signal:ctl.signal});return r.ok?(await r.json()).map(x=>x.word):null}
    catch(e){return null}finally{clearTimeout(timer)}
  })());
  return dmCache.get(word);
}
async function localMatch(text){
  const low=text.toLowerCase().replace(/\ball the time\b/g,' ');
  const words=[...new Set(low.replace(/['’]/g,'').split(/[^a-z]+/).filter(w=>w.length>=3&&!STOP.has(w)))].slice(0,10);
  const terms=new Map();
  const put=(word,w,from)=>{if(word.length<3||STOP.has(word))return;const k=stem(word);const cur=terms.get(k);if(!cur||cur.w<w)terms.set(k,{w,from})};
  words.forEach(w=>put(w,1,w));
  for(const [re,extra] of PHRASES){const m=low.match(re);if(m)extra.split(' ').forEach(e=>put(e,1.5,m[0]))}
  const lists=await Promise.all(words.slice(0,8).map(related));
  lists.forEach((list,i)=>(list||[]).forEach((rw,rank)=>rw.toLowerCase().split(/[^a-z]+/).forEach(part=>put(part,0.4*(1-rank/25),words[i]))));
  const V=vocab(),ranked=[];
  for(const t of TEXTS){
    let score=0;const hits=new Set();
    for(const [k,term] of terms){let best=0;for(const [vk,vi] of V[t.id])if(vi.w>best&&sameStem(k,vk))best=vi.w;if(best){score+=term.w*best;hits.add(term.from)}}
    if(score>=1)ranked.push({t,score,hits:[...hits]});
  }
  ranked.sort((a,b)=>b.score-a.score);
  return {crisis:false,reflection:'',source:'datamuse',online:lists.some(l=>l!==null),
    picks:ranked.slice(0,3).map(r=>({id:r.t.id,why:((MATCH_DATA.lessons||{})[r.t.id]||{}).summary||'',hits:r.hits.slice(0,4)}))};
}
