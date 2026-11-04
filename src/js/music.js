/* Original ambient soundscape: softly moving consonant tones, no downloads. */
const music={enabled:store.get('shine-music',true)===true,volume:Math.max(0,Math.min(100,Number(store.get('shine-music-volume',25))||0)),ctx:null,master:null,sleep:null};
function createMusic(){
  const Audio=window.AudioContext||window.webkitAudioContext;
  if(!Audio)throw new Error('Web Audio unavailable');
  const ctx=new Audio();music.ctx=ctx;
  const master=ctx.createGain();master.gain.value=0;master.connect(ctx.destination);music.master=master;
  const filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=1100;filter.Q.value=.3;filter.connect(master);
  // A spacious D major pentatonic pad; very slow independent swells avoid a hard loop.
  [146.832,220,293.665,369.994,440,493.883].forEach((frequency,i)=>{
    const gain=ctx.createGain();gain.gain.value=.055;gain.connect(filter);
    const swell=ctx.createOscillator(),depth=ctx.createGain();
    swell.frequency.value=.018+i*.004;depth.gain.value=.022;
    swell.connect(depth);depth.connect(gain.gain);swell.start();
    [-3,3].forEach(detune=>{
      const tone=ctx.createOscillator();tone.type='sine';tone.frequency.value=frequency;
      tone.detune.value=detune;tone.connect(gain);tone.start();
    });
  });
}
async function syncMusic(){
  clearTimeout(music.sleep);
  const active=()=>music.enabled&&music.volume>0&&player.playing&&!player.buffering;
  try{
    if(active()){
      if(!music.ctx)createMusic();
      await music.ctx.resume();
    }
    if(!music.master)return;
    const ctx=music.ctx,param=music.master.gain;
    if(param.cancelAndHoldAtTime)param.cancelAndHoldAtTime(ctx.currentTime);
    else{param.cancelScheduledValues(ctx.currentTime);param.setValueAtTime(param.value,ctx.currentTime);}
    param.setTargetAtTime(active()?music.volume/100*.35:0,ctx.currentTime,active()?.8:.18);
    if(!active())music.sleep=setTimeout(()=>{
      if(!active()&&music.ctx.state==='running')music.ctx.suspend().catch(()=>{});
    },1400);
  }catch(error){
    document.getElementById('music-status').textContent='Music is unavailable in this browser. Narration still works.';
  }
}
function showMusic(open){document.getElementById('music-panel').hidden=!open;document.getElementById('p-music').setAttribute('aria-expanded',open);}
function updateMusicControls(){
  const toggle=document.getElementById('music-toggle');
  toggle.setAttribute('aria-pressed',music.enabled);toggle.textContent=music.enabled?'Music on':'Music off';
  document.getElementById('music-volume').value=music.volume;
}
updateMusicControls();
document.getElementById('p-music').onclick=()=>showMusic(document.getElementById('music-panel').hidden);
document.getElementById('music-close').onclick=()=>{showMusic(false);document.getElementById('p-music').focus();};
document.getElementById('music-toggle').onclick=()=>{music.enabled=!music.enabled;store.set('shine-music',music.enabled);updateMusicControls();syncMusic();};
document.getElementById('music-volume').oninput=e=>{music.volume=+e.target.value;store.set('shine-music-volume',music.volume);syncMusic();};
window.addEventListener('pagehide',()=>{pause();if(music.ctx)music.ctx.suspend().catch(()=>{});});
