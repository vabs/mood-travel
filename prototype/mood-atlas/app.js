/* THROWAWAY: comparing Atlas, Library and Guided layouts using a catalog snapshot. */
const D = window.CATALOG;
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const variants = ['A', 'B', 'C'];
const names = {A:'Mood Atlas',B:'The Quiet Library',C:'A Small Journey'};
let variant = new URLSearchParams(location.search).get('variant') || 'A';
if (!variants.includes(variant)) variant = 'A';
let state = {mood:null,journey:null,type:null,resource:null,tempo:'all'};
const families = [
  ['joy','Joy','A little light','☼',30,20,133],
  ['trust','Trust','Something steady','⌘',70,16,112],
  ['fear','Fear','A little on edge','≈',82,45,133],
  ['surprise','Surprise','The unexpected','✧',78,74,112],
  ['sadness','Sadness','A heavier day','☾',47,81,130],
  ['disgust','Disgust','Something feels off','∿',18,74,103],
  ['anger','Anger','A little fire','⌁',12,43,119],
  ['anticipation','Anticipation',"What's ahead",'↗',48,41,115]
];
const media = {book:['Books','▤'],music:['Music','♫'],movie:['Films','▷'],blog:['Articles','≋'],podcast:['Podcasts','◉']};
const moodBy = id => D.moods.find(m => m.id === id);
const journeysFor = id => D.journeys.filter(j => j.starting_mood_id === id);
const placements = journey => D.recommendations.filter(r => !journey || r.journey_id === journey).sort((a,b)=>a.priority-b.priority);
const resourceBy = id => D.resources.find(r => r.id === id);
const entriesFor = journey => placements(journey).map(p=>({...resourceBy(p.resource_id),placement:p}));
const shortType = type => media[type]?.[0] || type;
const action = (label,attrs='',cls='') => `<button ${attrs} class="${cls}">${label}</button>`;
const typeArt = r => `<div class="art ${r.type}"><span class="art-label">${shortType(r.type)}</span><span class="art-center" aria-hidden="true">${media[r.type][1]}</span><span class="art-title">${esc(r.title)}</span></div>`;
const search = () => `<form class="search" id="search"><span class="search-icon" aria-hidden="true">⌕</span><label for="feeling" hidden>A feeling to explore</label><input id="feeling" placeholder="Try anxious, lonely, curious…" autocomplete="off"><button aria-label="Find a feeling">↗</button></form><p class="search-status" id="search-status" role="status"></p>`;
function crumbs() {
  const m=moodBy(state.mood),j=D.journeys.find(j=>j.id===state.journey);
  return `<nav class="crumbs" aria-label="Breadcrumb">${action('All moods','data-home')}${m?`<span>/</span>${action(esc(m.label),`data-mood="${m.id}"`)}`:''}${j?`<span>/</span>${action(esc(j.name),`data-journey="${j.id}"`)}`:''}${state.type?`<span>/</span>${action(shortType(state.type),`data-type="${state.type}"`)}`:''}${state.resource?'<span>/</span><span>Inside the recommendation</span>':''}</nav>`;
}
function card(r) {
  return `<button class="card" data-resource="${r.id}" data-placement="${r.placement?.id||''}"><div class="card-head"><span class="media-mark" aria-hidden="true">${media[r.type][1]}</span><span class="card-type">${shortType(r.type)}</span><span class="card-duration">${esc(r.duration || 'At your pace')}</span></div><h3>${esc(r.title)}</h3><p class="card-creator">${esc(r.creator)}</p><span class="card-bottom"><span>View recommendation</span><span aria-hidden="true">↗</span></span></button>`;
}
function moodField() {
  return `<div class="atlas mood-field" aria-label="Choose a mood family">${families.map(([id,label,sub,glyph,x,y,size],i)=>`<button class="bubble" data-mood="${id}" style="--x:${x}%;--y:${y}%;--size:${size}px;--color:var(--${id});--delay:-${i*.65}s"><strong>${label}</strong><small>${sub}</small></button>`).join('')}<div class="atlas-caption">Choose what feels closest.</div></div>`;
}
function homeAtlas() {
  const picks = ['eno-music-for-airports','little-prince','paddington-2'].map(resourceBy);
  return `<section class="hero"><div class="hero-copy"><p class="eyebrow">MOOD-TRAVEL</p><h1>How are you<br>feeling?</h1><p class="intro">Explore books, music, films and stories that might fit how you feel.</p>${search()}<div class="suggestions"><span>Try</span>${action('anxious','data-mood="fear"')}${action('lonely','data-mood="sadness"')}${action('bored','data-mood="boredom"')}</div>${action('About this project','data-about','text-link')}</div>${moodField()}</section><section class="shelf"><div class="section-top"><div><p class="eyebrow">FROM THE COLLECTION</p><h2>A few places to start.</h2></div>${action('Browse the collection ↗','data-library','browse-link')}</div><div class="card-grid">${picks.map(card).join('')}</div></section>`;
}
function familyChoices(m) {
  return `<p class="mini-label">Or a different shade of ${m.family}:</p><div class="family-choices">${D.moods.filter(v=>v.family===m.family).map(v=>action(esc(v.label),`data-mood="${v.id}"`,v.id===m.id?'active':'')).join('')}</div>`;
}
function moodScreen() {
  const m=moodBy(state.mood),routes=journeysFor(m.id),j=D.journeys.find(j=>j.id===state.journey)||routes[0];
  if(j) state.journey=j.id;
  const entries=j?entriesFor(j.id):[];
  const types=Object.keys(media).filter(t=>entries.some(r=>r.type===t));
  const positions = types.length===1?[[50,18]]:types.map((_,i)=>{const a=(-90+i*360/types.length)*Math.PI/180;return [50+34*Math.cos(a),49+33*Math.sin(a)]});
  return `${crumbs()}<section class="hero explore-hero"><div class="hero-copy"><p class="eyebrow">A PLACE TO BEGIN</p><h1>A little room<br>for <em>${esc(m.label.toLowerCase())}.</em></h1><p class="mood-description">${esc(m.short_description)}</p>${familyChoices(m)}${routes.length?`<p class="mini-label">A direction you could explore:</p><div class="route-choices">${routes.map(r=>action(esc(r.name),`data-journey="${r.id}"`,j?.id===r.id?'active':'')).join('')}</div><p class="route-note">${esc(j.rationale)}</p><p class="attention-note">Choose a format in the circle, or ${action('see everything →','data-type="all"','text-link')}.</p>`:`<div class="empty"><h3>Still making room here.</h3><p>There isn't a curated route from ${esc(m.label.toLowerCase())} yet. Try a neighboring feeling, or explore one of the collections already here.</p>${action('Explore fear →','data-mood="fear"','big-button')}</div>`}</div><div class="atlas"><svg class="orbit-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${positions.map(([x,y])=>`<line x1="50" y1="49" x2="${x}" y2="${y}"/>`).join('')}</svg><div class="bubble orbit-center" style="--color:var(--${m.family})"><span class="glyph">${families.find(f=>f[0]===m.family)?.[3]||'↗'}</span><strong>${esc(m.label)}</strong><small>${entries.length?entries.length+' curated picks':'Your feeling belongs here'}</small></div>${types.map((t,i)=>`<button class="bubble" data-type="${t}" style="--x:${positions[i][0]}%;--y:${positions[i][1]}%;--size:108px;--color:#eeeee4;--delay:-${i}s"><span class="glyph">${media[t][1]}</span><strong>${media[t][0]}</strong><small>${entries.filter(r=>r.type===t).length} to explore ↗</small></button>`).join('')}<p class="atlas-caption">${types.length?'A small collection. A direction of your choosing.':'Every feeling is welcome. The collection is still growing.'}</p></div></section>`;
}
function resourceCard(r) {
  return `<article class="resource-card">${typeArt(r)}<div class="card-meta"><span>${shortType(r.type)}</span><span>${esc(r.placement.tempo.replace('-',' '))}</span></div><h3>${esc(r.title)}</h3><p class="creator">${esc(r.creator)}</p><p class="rationale">${esc(r.placement.rationale)}</p><div class="metadata">${esc(r.duration||r.time_to_start)} · ${esc(r.availability)}${r.content_warnings.length?`<p class="warning">Content notes: ${r.content_warnings.map(esc).join(', ')}</p>`:''}</div><button class="open" data-resource="${r.id}" data-placement="${r.placement.id}">Take a closer look ↗</button></article>`;
}
function results() {
  const j=D.journeys.find(j=>j.id===state.journey),all=entriesFor(j.id).filter(r=>state.type==='all'||r.type===state.type),entries=all.filter(r=>state.tempo==='all'||r.placement.tempo===state.tempo);
  return `${crumbs()}<section class="detail-layout"><div class="detail-heading"><p class="eyebrow">YOUR LITTLE COLLECTION</p><h1>${esc(j.name)}<em>.</em></h1><p class="intro">${esc(j.rationale)}</p><p class="mini-label">EXPLORE A FORMAT</p><div class="family-choices">${['all',...Object.keys(media).filter(t=>entriesFor(j.id).some(r=>r.type===t))].map(t=>action(t==='all'?'Everything':shortType(t),`data-type="${t}"`,state.type===t?'active':'')).join('')}</div><p class="attention-note">Time & attention describes the work's commitment, not how quickly it changes a feeling.</p></div><div><div class="filters" aria-label="Filter time and attention">${[['all','Any pace'],['quick','A small moment'],['steady','Settle in'],['slow-burn','Take your time']].map(([v,l])=>action(l,`data-tempo="${v}"`,state.tempo===v?'active':'')).join('')}</div><p class="mini-label" role="status">${entries.length} ${entries.length===1?'recommendation':'recommendations'} · chosen by people, not an algorithm</p><div class="resources">${entries.map(resourceCard).join('')}</div>${entries.length?'':`<div class="empty"><h3>Nothing at this pace just yet.</h3><p>Try another pace to see more of this collection.</p>${action('Show any pace','data-tempo="all"','big-button')}</div>`}</div></section>`;
}
function resourceDetail() {
  const r=resourceBy(state.resource),p=D.recommendations.find(p=>p.id===state.placement)||D.recommendations.find(p=>p.resource_id===r.id);
  return `${crumbs()}<section class="selected-resource">${typeArt(r)}<div class="copy"><p class="eyebrow">${shortType(r.type)} · A CLOSER LOOK</p><h1>${esc(r.title)}</h1><p>${esc(r.creator)}</p><p>${esc(p?.rationale||r.notes||'A selection from the mood-travel collection.')}</p><p>${esc(r.duration||r.time_to_start)} · ${esc(r.availability)}</p>${r.content_warnings.length?`<p class="warning">Content notes: ${r.content_warnings.map(esc).join(', ')}</p>`:'<p>No content warnings listed in the current catalog.</p>'}<a class="big-button" href="${esc(r.canonical_url)}" target="_blank" rel="noopener noreferrer">Explore this ${r.type==='blog'?'article':r.type} ↗</a><p class="attention-note">Opens ${esc(new URL(r.canonical_url).hostname)} in a new tab.<br>Curated by ${esc(r.contributor)} · checked ${esc(r.last_checked)}.</p>${action('← Back to the collection','data-back','text-link')}</div></section>`;
}
function libraryHome() {
  const unique=[...new Map(entriesFor().map(r=>[r.id,r])).values()];
  return `<section class="library-head"><p class="eyebrow">THE QUIET LIBRARY</p><h1>Something good.<br><em>For the way you feel.</em></h1><p class="intro">Books, music, films and thoughtful little detours. A collection to browse at your own pace.</p></section><div class="mood-tabs">${[['fear','On edge'],['sadness','Feeling low'],['anger','A little angry'],['boredom','Restless'],['joy','Feeling good']].map(([id,l])=>action(l,`data-mood="${id}" style="--color:var(--${moodBy(id).family})"`)).join('')}</div><section class="shelf"><div class="section-top"><h2>Pick up a little curiosity.</h2><p>${unique.length} things to discover</p></div><div class="library-grid">${unique.slice(0,12).map(card).join('')}</div></section>`;
}
function journeyHome() {
  return `<section class="journey-shell"><div class="step-indicator"><span class="current">01 · A feeling</span><i></i><span>02 · A direction</span><i></i><span>03 · A discovery</span></div><div class="journey-head"><p class="eyebrow">A SMALL JOURNEY</p><h1>Let's start <em>where you are.</em></h1><p class="intro">No need to have the perfect word. Just choose what feels closest, and we'll take it from there.</p></div><div class="journey-moods">${families.map(([id,label,sub,glyph])=>`<button data-mood="${id}" style="--color:var(--${id})"><strong>${glyph} &nbsp; ${label}</strong><span>${sub} ↗</span></button>`).join('')}</div><div style="max-width:440px;margin:30px auto 0">${search()}</div></section>`;
}
function journeyDirection() {
  const m=moodBy(state.mood),routes=journeysFor(m.id);
  return `${crumbs()}<section class="journey-shell"><div class="step-indicator"><span>01 · ${esc(m.label)}</span><i></i><span class="current">02 · A direction</span><i></i><span>03 · A discovery</span></div><div class="journey-head"><p class="eyebrow">YOU CHOOSE THE DIRECTION</p><h1>What would feel <em>right?</em></h1><p class="intro">${esc(m.short_description)} These are invitations to explore, with no particular outcome to reach.</p></div>${familyChoices(m)}<div class="journey-routes">${routes.map(j=>`<button data-journey="${j.id}" data-guided-route><h3>${esc(j.name)} ↗</h3><p>${esc(j.rationale)}</p><span class="mini-label">${entriesFor(j.id).length} recommendations</span></button>`).join('')}</div>${routes.length?'':`<div class="empty"><h3>This part of the collection is still growing.</h3><p>No curated route from ${esc(m.label.toLowerCase())} yet.</p>${action('Try fear →','data-mood="fear"','big-button')}</div>`}</section>`;
}
function render() {
  document.body.dataset.variant=variant;
  $('#variant-label').textContent=variant+' · '+names[variant];
  $('#main').innerHTML=state.resource?resourceDetail():state.type?results():state.mood?(variant==='C'?journeyDirection():moodScreen()):variant==='B'?libraryHome():variant==='C'?journeyHome():homeAtlas();
}
function reset(){state={mood:null,journey:null,type:null,resource:null,tempo:'all'};render()}
function setVariant(v){variant=v;const url=new URL(location.href);url.searchParams.set('variant',v);history.replaceState({},'',url);reset();window.scrollTo(0,0)}
function cycle(n){setVariant(variants[(variants.indexOf(variant)+n+variants.length)%variants.length])}
$('#previous').onclick=()=>cycle(-1);$('#next').onclick=()=>cycle(1);
document.addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;
  if(b.hasAttribute('data-home'))reset();
  if(b.hasAttribute('data-library'))setVariant('B');
  if(b.hasAttribute('data-about'))$('#about').showModal();
  if(b.classList.contains('close'))$('#about').close();
  if(b.dataset.mood){state={mood:b.dataset.mood,journey:null,type:null,resource:null,tempo:'all'};render()}
  if(b.dataset.journey){state.journey=b.dataset.journey;state.resource=null;if(b.hasAttribute('data-guided-route'))state.type='all';render()}
  if(b.dataset.type){state.type=b.dataset.type;state.resource=null;state.tempo='all';render()}
  if(b.dataset.tempo){state.tempo=b.dataset.tempo;render()}
  if(b.dataset.resource){state.resource=b.dataset.resource;state.placement=b.dataset.placement;render()}
  if(b.hasAttribute('data-back')){state.resource=null;render()}
});
document.addEventListener('submit',e=>{
  if(e.target.id!=='search')return;e.preventDefault();const q=$('#feeling').value.trim().toLowerCase();if(!q)return;
  const exact=D.moods.find(m=>m.label.toLowerCase()===q||m.id===q);
  const synonym=D.synonyms.find(s=>s.term===q);
  const candidates=synonym?.candidates||[];
  const id=exact?.id||[...candidates].sort((a,b)=>b.confidence-a.confidence)[0]?.mood_id;
  if(id){state={mood:id,journey:null,type:null,resource:null,tempo:'all'};render()}else $('#search-status').textContent='No match yet. Try a mood bubble, or search anxious, lonely or bored.';
});
document.addEventListener('keydown',e=>{
  if(['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)||e.target.isContentEditable||$('#about').open)return;
  if(e.key==='ArrowRight'){e.preventDefault();cycle(1)}if(e.key==='ArrowLeft'){e.preventDefault();cycle(-1)}
  if(e.key==='Escape'){if(state.resource)state.resource=null;else if(state.type)state.type=null;else state.mood=null;render()}
});
render();
