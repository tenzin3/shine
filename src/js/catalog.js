const pic=(t,size)=>IMG[t.id]?`<img src="${IMG[t.id]}" alt="" loading="lazy" decoding="async">`:art(t,size);
const ICONS={
 home:'<path d="M4 11 12 4l8 7"/><path d="M6 10v9h12v-9"/><path d="M10 19v-5h4v5"/>',
 seed:'<path d="M12 20v-8"/><path d="M12 12c0-4 3-6 7-6 0 4-3 6-7 6z"/><path d="M12 14c0-3-2-5-6-5 0 3 2 5 6 5z"/>',
 rain:'<path d="M7 15a4 4 0 1 1 1-7.9A5 5 0 0 1 18 9a3 3 0 0 1 0 6z"/><path d="M9 18l-1 2M13 18l-1 2M17 18l-1 2"/>',
 circle:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/>',
 flame:'<path d="M12 3c3 4 5 6 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-9z"/>',
 heart:'<path d="M12 20s-7-4.4-9-9a4.6 4.6 0 0 1 9-2.5A4.6 4.6 0 0 1 21 11c-2 4.6-9 9-9 9z"/>',
 leaf:'<path d="M5 19c0-8 5-13 14-14-1 9-6 14-14 14z"/><path d="M5 19 13 11"/>',
 moon:'<path d="M18 15A7 7 0 0 1 9 6a7 7 0 1 0 9 9z"/>',
 people:'<circle cx="9" cy="9" r="3"/><circle cx="17" cy="10" r="2.5"/><path d="M3 19c0-3 3-5 6-5s6 2 6 5"/><path d="M15 15c3 0 6 1.5 6 4"/>',
 lamp:'<path d="M12 3c2 3 3 4.5 3 6.5a3 3 0 0 1-6 0C9 7.5 10 6 12 3z"/><path d="M6 14h12l-2 6H8z"/>',
 star:'<path d="m12 4 2.4 5 5.6.8-4 4 1 5.6-5-2.7-5 2.7 1-5.6-4-4 5.6-.8z"/>'
};
const SHELVES=[
 {id:"beginners",name:"Start here",icon:"seed",c:["#6fe3c1","#4aa3ff"],line:"Simple first steps into meditation, from masters who wrote for beginners."},
 {id:"hard-times-suffering",name:"Hard Times",icon:"rain",c:["#5fb7ff","#8b7cff"],line:"Teachings for bringing pain, sickness and setbacks onto the path, so hard days become part of your practice."},
 {id:"focus-restless-mind",name:"Restless Mind",icon:"circle",c:["#8b7cff","#c38bff"],line:"Calm abiding, mindfulness and concentration for a mind that won’t sit still."},
 {id:"anger-difficult-people",name:"Anger",icon:"flame",c:["#c38bff","#ff8fb1"],line:"Mind training for the people who test us most, and the anger they stir up."},
 {id:"compassion-kindness",name:"Compassion",icon:"heart",c:["#ff8fb1","#ffb36b"],line:"Love, compassion and bodhicitta: practices for opening the heart."},
 {id:"change-loss-impermanence",name:"Change",icon:"leaf",c:["#ffb36b","#f2d36b"],line:"Reflections on impermanence, for when life shifts under your feet."},
 {id:"grief-death",name:"Grief & Death",icon:"moon",c:["#f2d36b","#9be38a"],line:"Gentle teachings on dying, loss and the bardos."},
 {id:"family-friends",name:"Family & Friends",icon:"people",c:["#9be38a","#6fe3c1"],line:"Parents, companions and the people we keep close."},
 {id:"simplicity-what-matters",name:"What Matters",icon:"lamp",c:["#6fe3c1","#5fb7ff"],line:"Heart advice on living a simple, meaningful life."},
];
const shelfOf=id=>SHELVES.find(s=>s.id===id); const byId=id=>TEXTS.find(t=>t.id===id);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const store={get(k,d){try{return JSON.parse(localStorage.getItem(k))??d}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};

/* artwork: soft photographic-feeling scenes drawn as SVG */
function rng(str){let h=2166136261;for(const c of str){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return()=>{h^=h<<13;h^=h>>>17;h^=h<<5;return((h>>>0)%10000)/10000}}
const PALETTES={
 "beginners":[["#9ad7e8","#f6d8b5","#3d6f8f"],["#bfe3d0","#f3e2b8","#2f6b63"]],
 "hard-times-suffering":[["#1d3b6b","#6f8fc4","#0e1f3d"],["#2a2f5c","#8c86c9","#141733"]],
 "focus-restless-mind":[["#0f6f86","#59c3c9","#083846"],["#1b4f8a","#7fb6e6","#0b2647"]],
 "anger-difficult-people":[["#f08a4b","#ffd29a","#5b2a3d"],["#d9645c","#ffc58f","#3b1f37"]],
 "compassion-kindness":[["#ff9a7a","#ffe0b2","#6a3a5a"],["#f7b0b8","#ffe7c7","#5a3a66"]],
 "change-loss-impermanence":[["#6a5aa8","#f0a6a0","#2b2457"],["#4b4f9a","#e5b07c","#1f2350"]],
 "grief-death":[["#26345f","#8aa0c8","#111a33"],["#3b3a6e","#b9a6d6","#191838"]],
 "family-friends":[["#5fa36a","#f3e0a0","#24452e"],["#6fa6a0","#f6dcae","#28423f"]],
 "simplicity-what-matters":[["#3f7fb0","#f4c27a","#1d3550"],["#5b8fb8","#f7d9a0","#203a55"]],
};
function art(t,size=400){
  const r=rng(t.id+t.title), pal=(PALETTES[t.playlist]||PALETTES.beginners)[Math.floor(r()*2)], [deep,light,dark]=pal, W=size,H=size, id="a"+t.id+size;
  const kind=["lake","ripples","sunset","waves","mist","flags"][Math.floor(r()*6)];
  const sky=`<linearGradient id="${id}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${deep}"/><stop offset=".62" stop-color="${light}"/><stop offset="1" stop-color="${deep}"/></linearGradient>`;
  const blur=`<filter id="${id}b"><feGaussianBlur stdDeviation="${W*.012}"/></filter><filter id="${id}bb"><feGaussianBlur stdDeviation="${W*.04}"/></filter>`;
  const ridge=(base,amp,n,fill,op)=>{let d=`M0 ${H}L0 ${base}`;for(let i=1;i<=n;i++){d+=` L${(W*i/n).toFixed(1)} ${(base-amp*r()).toFixed(1)}`}return`<path d="${d} L${W} ${H}Z" fill="${fill}" opacity="${op}"/>`};
  let g="";
  if(kind==="lake"){g=`<rect width="${W}" height="${H}" fill="url(#${id}s)"/>${ridge(H*.5,H*.22,7,dark,.75)}${ridge(H*.56,H*.12,9,dark,.95)}<g transform="translate(0 ${H*1.12}) scale(1 -1)" opacity=".35" filter="url(#${id}b)">${ridge(H*.5,H*.2,7,dark,.8)}</g><rect y="${H*.56}" width="${W}" height="${H*.44}" fill="${deep}" opacity=".45"/>${[0,1,2,3].map(i=>`<ellipse cx="${W*.55}" cy="${H*.8}" rx="${W*(.06+i*.07)}" ry="${H*(.015+i*.018)}" fill="none" stroke="${light}" stroke-opacity="${.5-i*.1}"/>`).join("")}`}
  if(kind==="ripples"){g=`<rect width="${W}" height="${H}" fill="${dark}"/><radialGradient id="${id}r"><stop offset="0" stop-color="${light}"/><stop offset="1" stop-color="${deep}"/></radialGradient><rect width="${W}" height="${H}" fill="url(#${id}r)" opacity=".8"/>${Array.from({length:14},(_,i)=>`<circle cx="${W/2}" cy="${H/2}" r="${W*.03*(i+1)}" fill="none" stroke="${i%2?light:dark}" stroke-width="${W*.012}" opacity="${.55-i*.03}" filter="url(#${id}b)"/>`).join("")}`}
  if(kind==="sunset"){g=`<rect width="${W}" height="${H}" fill="url(#${id}s)"/><circle cx="${W*(.35+r()*.3)}" cy="${H*.48}" r="${W*.13}" fill="#ffd38a" filter="url(#${id}bb)"/><circle cx="${W*(.5)}" cy="${H*.5}" r="${W*.05}" fill="#fff2cc" opacity=".9" filter="url(#${id}b)"/>${ridge(H*.62,H*.06,10,dark,.9)}<rect y="${H*.62}" width="${W}" height="${H*.38}" fill="${dark}" opacity=".85"/>${Array.from({length:7},(_,i)=>`<rect x="${W*(.35+r()*.2)}" y="${H*(.65+i*.045)}" width="${W*(.25-i*.025)}" height="${H*.008}" fill="#ffd38a" opacity="${.6-i*.07}"/>`).join("")}`}
  if(kind==="waves"){g=`<rect width="${W}" height="${H}" fill="${deep}"/>${Array.from({length:11},(_,i)=>{const y=H*(i/10);return`<path d="M0 ${y} Q ${W*.25} ${y-H*.05} ${W*.5} ${y} T ${W} ${y} L ${W} ${y+H*.12} L 0 ${y+H*.12}Z" fill="${i%2?light:dark}" opacity="${i%2?.35:.55}" filter="url(#${id}b)"/>`}).join("")}`}
  if(kind==="mist"){g=`<rect width="${W}" height="${H}" fill="url(#${id}s)"/>${[0,1,2,3].map(i=>`<g filter="url(#${id}b)">${ridge(H*(.45+i*.13),H*.14,6+i,dark,.35+i*.17)}</g>`).join("")}<rect width="${W}" height="${H}" fill="${light}" opacity=".12"/>`}
  if(kind==="flags"){const cols=["#2f6bd1","#f5f1e6","#c8362f","#2e8b57","#e8b23a"];g=`<rect width="${W}" height="${H}" fill="url(#${id}s)"/>${ridge(H*.78,H*.3,6,dark,.85)}<path d="M${-W*.05} ${H*.22} Q ${W*.5} ${H*.48} ${W*1.05} ${H*.18}" stroke="rgba(255,255,255,.5)" fill="none" stroke-width="${W*.004}"/>${Array.from({length:12},(_,i)=>{const x=W*(.01+i*.085),tt=i/11,y=H*(.2+Math.sin(tt*Math.PI)*.18);return`<path d="M${x} ${y} l${W*.06} ${-H*.005} l${-W*.004} ${H*.085} l${-W*.058} ${H*.004}z" fill="${cols[i%5]}" opacity=".9"/>`}).join("")}`}
  return`<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs>${sky}${blur}</defs>${g}<rect width="${W}" height="${H}" fill="url(#${id}v)" opacity="0"/></svg>`;
}
