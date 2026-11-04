/* Saved neural narration: one recording per lesson, with paragraph timestamps. */
const narration=new Audio();narration.preload='metadata';
const player={id:null,i:0,playing:false,buffering:false,token:0};
const fmt=s=>{const seconds=Math.max(0,Math.floor(Number(s)||0));return `${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`};
function loadTrack(id){
  stop();const t=byId(id);player.id=id;player.i=0;
  const recording=AUDIO[id];
  document.getElementById('p-disc').innerHTML=pic(t,200);
  document.getElementById('p-title').textContent=t.title;
  document.getElementById('p-author').textContent=t.author;
  document.getElementById('p-narrator').textContent=recording?recording.narrator:'Recording unavailable';
  if(recording)narration.src=recording.src;
  else narration.removeAttribute('src');
  const range=document.getElementById('p-range');range.max=recording?.duration||0;range.value=0;
  document.getElementById('p-len').textContent=fmt(recording?.duration||0);
  document.getElementById('p-heart').setAttribute('aria-pressed',store.get('shine-saved',[]).includes(id));
  updateProg();
}
function paragraphAt(time,times){
  let lo=0,hi=times.length;
  while(lo<hi){const mid=(lo+hi)>>1;if(times[mid]<=time)lo=mid+1;else hi=mid;}
  return Math.max(0,lo-1);
}
function followParagraph(){
  if(openId!==player.id)return;
  const paragraph=document.querySelector(`#r-text p[data-i="${player.i}"]`);
  if(paragraph)paragraph.scrollIntoView({block:'center',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
}
function updateProg(){
  const recording=AUDIO[player.id];if(!recording)return;
  const before=player.i;
  const spoken=paragraphAt(narration.currentTime,recording.paragraphs);
  player.i=recording.paragraph_indices?.[spoken]??spoken;
  document.getElementById('p-range').value=narration.currentTime;
  document.getElementById('p-cur').textContent=fmt(narration.currentTime);
  document.querySelectorAll('#r-text p').forEach(p=>p.classList.toggle('speaking',player.playing&&openId===player.id&&+p.dataset.i===player.i));
  if(before!==player.i&&player.playing)followParagraph();
}
function setIcon(){document.getElementById('p-icon').innerHTML=player.playing?'<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>':'<path d="M7 4v16l13-8z"/>';document.getElementById('p-play').setAttribute('aria-label',player.playing?'Pause':'Play')}
function play(){
  if(!player.id)openReader(today().id);
  if(!AUDIO[player.id])return;
  const token=++player.token;
  player.playing=true;player.buffering=false;setIcon();syncMusic();
  narration.play().catch(()=>{
    if(token!==player.token)return;
    pause();document.getElementById('p-narrator').textContent='Could not play. Tap play to retry.';
  });
}
function pause(){player.playing=false;player.buffering=false;player.token++;narration.pause();setIcon();syncMusic();updateProg()}
function stop(){pause();narration.currentTime=0;player.i=0;updateProg()}
function jump(d){const recording=AUDIO[player.id];if(!recording)return;const current=paragraphAt(narration.currentTime,recording.paragraphs);const i=Math.max(0,Math.min(recording.paragraphs.length-1,current+d));narration.currentTime=recording.paragraphs[i];updateProg()}
narration.addEventListener('timeupdate',updateProg);
narration.addEventListener('playing',()=>{player.playing=true;player.buffering=false;document.getElementById('p-narrator').textContent=AUDIO[player.id]?.narrator||'AI narration';setIcon();syncMusic();updateProg();followParagraph()});
narration.addEventListener('waiting',()=>{player.buffering=true;syncMusic()});
narration.addEventListener('pause',()=>{player.playing=false;setIcon();syncMusic();updateProg()});
narration.addEventListener('ended',stop);
narration.addEventListener('error',()=>{pause();document.getElementById('p-narrator').textContent='Recording unavailable. Please reload.';});
narration.addEventListener('loadedmetadata',()=>{
  if(Number.isFinite(narration.duration)){
    document.getElementById('p-range').max=narration.duration;
    document.getElementById('p-len').textContent=fmt(narration.duration);
  }
});
