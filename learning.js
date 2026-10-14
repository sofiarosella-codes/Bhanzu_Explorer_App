(function(root){
 'use strict';
 const KEY='bhanzu-explorer-learning-v1',E=root.Explorer,T=root.ExplorerLessons;
 const phases=['learn','see','try','play','reflect'],labels=['Learn','See it','Try it','Play','Reflect'];
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let data={grades:{}},ctx=null,storageOK=true,pointTimer=null;
 try{const saved=JSON.parse(localStorage.getItem(KEY)||'null');if(saved&&typeof saved==='object'&&!Array.isArray(saved)&&saved.grades&&typeof saved.grades==='object')data=saved;}catch{/* Old application data is never modified here. */}
 function save(){try{localStorage.setItem(KEY,JSON.stringify(data));}catch{storageOK=false;}}
 function grade(g){const key=String(g);if(!data.grades[key]||typeof data.grades[key]!=='object')data.grades[key]={days:{}};if(!data.grades[key].days)data.grades[key].days={};return data.grades[key];}
 function dayState(g,d){const days=grade(g).days;if(!days[d]||typeof days[d]!=='object')days[d]={phase:'learn',visited:[],step:0};const s=days[d];if(!phases.includes(s.phase))s.phase='learn';if(!Array.isArray(s.visited))s.visited=[];return s;}
 function activities(g,original,state){
  const done=Array.isArray(state.progress?.[g])?state.progress[g]:[];
  const result=[];
  for(let day=1;day<=30;day++){
   const s=dayState(g,day),old=original.filter(m=>m.day===day);
   if(!s.curriculum){s.curriculum=old.some(m=>done.includes(m.id)||Object.hasOwn(state.drafts||{},`${g}:${m.id}`)||Object.hasOwn(state.artifacts||{},`${g}:${m.id}`))?'saved':'guided-v1';}
   result.push(...(s.curriculum==='saved'?old.map(m=>({...m,idea:T.topic(g,day).takeaway,savedDay:true})):T.activities(g,day)));
  }
  save();return result;
 }
 const phase=(g,d)=>dayState(g,d).phase;
 function go(p){if(!ctx||!phases.includes(p)||!ctx.canDay(ctx.selectedDay))return;const s=dayState(ctx.profile.grade,ctx.selectedDay);if(!s.visited.includes(s.phase))s.visited.push(s.phase);s.phase=p;save();ctx.render();document.getElementById('journey-stage')?.focus({preventScroll:true});document.getElementById('journey-stage')?.scrollIntoView({block:'start',behavior:'instant'});}
 function setPlay(g,d){dayState(g,d).phase='play';save();}
 function title(g,d){return T.topic(g,d).title;}
 function pathHTML(g,d,done){const s=dayState(g,d),complete=done.length===5;return `<nav class="lesson-path" aria-label="Today's learning steps">${phases.map((p,i)=>`<button data-phase="${p}" ${p===s.phase?'aria-current="step"':''}><span aria-hidden="true">${(p==='play'?complete:p==='reflect'?!!s.reflection:s.visited.includes(p))?'✓':i+1}</span>${labels[i]}</button>`).join('')}</nav>`;}
 function visualHTML(v,alternate=false){
  const ink='var(--ink)',accent='var(--purple)',soft='var(--soft)';
  let drawing='',description=v.label;
  if(v.type==='fraction'){
   const d=v.denominator*(alternate?2:1),n=v.numerator*(alternate?2:1),w=360/d;
   drawing=Array.from({length:d},(_,i)=>`<rect x="${20+i*w}" y="48" width="${w-2}" height="52" rx="3" fill="${i<n?accent:soft}" stroke="${ink}"/><text x="${20+(i+.5)*w}" y="80" text-anchor="middle" fill="${i<n?'var(--on-brand)':ink}" font-size="15">${i<n?'●':'○'}</text>`).join('')+`<text x="200" y="135" text-anchor="middle">${n} of ${d} equal parts selected</text>`;
  }else if(v.type==='array'){
   const rows=alternate?v.columns:v.rows,cols=alternate?v.rows:v.columns,unit=Math.min(28,130/rows,340/cols),left=(400-cols*unit)/2;
   drawing=Array.from({length:rows*cols},(_,i)=>`<rect x="${left+(i%cols)*unit}" y="${10+Math.floor(i/cols)*unit}" width="${unit-3}" height="${unit-3}" rx="3" fill="${accent}"/>`).join('')+`<text x="200" y="163" text-anchor="middle">${rows} rows × ${cols} = ${rows*cols}</text>`;
  }else if(v.type==='parts'){
   const l=alternate?v.right:v.left,r=alternate?v.left:v.right,w=340*l/(l+r);
   drawing=`<rect x="30" y="35" width="${w}" height="55" rx="4" fill="${accent}"/><rect x="${30+w}" y="35" width="${340-w}" height="55" fill="${soft}" stroke="${ink}"/><text x="30" y="120">Part A: ${l}</text><text x="370" y="120" text-anchor="end">Part B: ${r}</text><text x="200" y="155" text-anchor="middle">${l} + ${r} = ${l+r}</text>`;
  }else if(v.type==='line'){
   const start=v.start,end=start+v.delta,lo=Math.min(start,end,0)-2,hi=Math.max(start,end,0)+2,x=n=>30+(n-lo)/(hi-lo)*340;
   const a=alternate?end:start,b=alternate?start:end;
   drawing=`<line x1="20" x2="380" y1="100" y2="100" stroke="${ink}" stroke-width="3"/><path d="M${x(a)} 90 Q${(x(a)+x(b))/2} 5 ${x(b)} 90" fill="none" stroke="${accent}" stroke-width="4"/><circle cx="${x(b)}" cy="90" r="6" fill="${accent}"/>${[...new Set([start,end,0])].map(n=>`<path d="M${x(n)} 94v12" stroke="${ink}"/><text x="${x(n)}" y="135" text-anchor="middle">${n}</text>`).join('')}<text x="200" y="163" text-anchor="middle">${a} ${alternate?'−':'+'} ${v.delta} = ${b}</text>`;
  }else if(v.type==='machine'){
   const input=v.input+(alternate?1:0),out=v.a*input+v.b;
   drawing=`<rect x="115" y="30" width="170" height="85" rx="15" fill="${soft}" stroke="${accent}" stroke-width="3"/><text x="65" y="80" text-anchor="middle">${input}</text><text x="100" y="80" text-anchor="middle">→</text><text x="200" y="80" text-anchor="middle">× ${v.a}, + ${v.b}</text><text x="300" y="80" text-anchor="middle">→</text><text x="350" y="80" text-anchor="middle">${out}</text><text x="200" y="155" text-anchor="middle">${v.a} × ${input} + ${v.b} = ${out}</text>`;
  }else if(v.type==='rectangle'){
   drawing=`<rect x="95" y="40" width="210" height="80" rx="2" fill="${soft}" stroke="${accent}" stroke-width="5"/><text x="200" y="25" text-anchor="middle">${v.width} cm</text><text x="320" y="85">${v.height} cm</text>${alternate?`<text x="200" y="150" text-anchor="middle">${v.width} cm</text><text x="80" y="85" text-anchor="end">${v.height} cm</text>`:''}`;
  }else{
   drawing=`<path d="M200 15v140" stroke="${ink}" stroke-dasharray="5 5"/><rect x="85" y="65" width="30" height="30" rx="5" fill="${accent}"/><rect x="285" y="65" width="30" height="30" rx="5" fill="${accent}"/><text x="145" y="115" text-anchor="middle">${v.distance}</text><text x="255" y="115" text-anchor="middle">${v.distance}</text>${alternate?'<path d="M100 80h200" stroke="currentColor" stroke-dasharray="4 4"/>':''}<text x="200" y="175" text-anchor="middle">Equal distances from the mirror</text>`;
  }
  return `<svg class="lesson-visual" viewBox="0 0 400 185" role="img" aria-label="${esc(description)}" style="color:${ink};fill:${ink};font:17px sans-serif">${drawing}</svg>`;
 }
 function stageHTML(g,d,done){const s=dayState(g,d),t=T.topic(g,d),p=s.phase,complete=done.length===5;
  const tools='<button class="lesson-read" data-lesson-read>▶ Read aloud</button>';
  let content='';
  if(p==='learn')content=`<div class="eyebrow">Learn · Concept Corner</div><h2>${esc(t.title)}</h2><div id="lesson-guide-dock" class="guide-dock"></div><div id="lesson-reading">${t.explanation.map(x=>`<p>${esc(x)}</p>`).join('')}<div class="lesson-real"><strong>In real life</strong><p>${esc(t.life)}</p></div><figure class="lesson-demo"><div id="lesson-visual">${visualHTML(t.visual,!!s.alternate)}</div><figcaption>${esc(t.visual.label)}</figcaption><button id="lesson-demo-toggle">${s.alternate?'Show the first view':'Explore another view'}</button></figure><p class="lesson-why"><strong>Why does this work?</strong> ${esc(t.why)}</p></div><button class="primary" data-next-phase="see">See an example →</button>`;
  else if(p==='see'){
   const index=Math.max(0,Math.min(t.steps.length-1,Number(s.step)||0)),step=t.steps[index];
   content=`<div class="eyebrow">See it · Worked example</div><h2>Let’s work it out together</h2><p>${esc(t.example.question)}</p><div id="lesson-guide-dock" class="guide-dock"></div><div id="lesson-reading"><ol class="worked-steps">${t.steps.slice(0,index+1).map((x,i)=>`<li ${i===index?'aria-current="step"':''}><p>${esc(x.text)}</p><strong>${esc(x.math)}</strong></li>`).join('')}</ol><p class="small">Step ${index+1} of ${t.steps.length}. Go back or ask the guide whenever you like.</p></div><div class="actions"><button id="example-back" ${index===0?'disabled':''}>← Previous step</button><button id="example-next" class="primary">${index===t.steps.length-1?'Try it yourself →':'Show the next step →'}</button></div>`;
  }else if(p==='try')content=`<div class="eyebrow">Try it · A question with support</div><h2>Your turn, at your pace</h2><div id="lesson-reading"><p id="guided-question" class="question">${esc(t.trial.question)}</p><p>No timer and no marks. Try a strategy, or use a hint.</p></div><form id="guided-form"><label for="guided-answer">Your answer</label><input id="guided-answer" name="answer" type="number" inputmode="decimal" step="any" required value="${esc(s.answer??'')}" autocomplete="off"><button class="primary" type="submit">Check my thinking</button></form><div id="guided-feedback" role="status">${s.correct?'✓ You found a way. Ready to explore?':''}</div><div id="lesson-guide-dock" class="guide-dock"></div><div class="actions"><button id="guided-hint">A little hint</button><button data-next-phase="see">Show me again</button></div><button id="guided-play" data-next-phase="play" ${s.correct?'':'hidden'}>Play today’s activities →</button>`;
  else if(p==='reflect')content=`<div class="eyebrow">Reflect · What I learned</div><h2>A thought to keep</h2><div id="lesson-guide-dock" class="guide-dock"></div><div id="lesson-reading"><p>${complete?'You explored all five activities.':'You can pause and reflect at any point.'} What helped you make sense of today’s idea?</p><blockquote>${esc(t.takeaway)}</blockquote><p class="confidence-note">${g<=3?'You can do tricky things, one small step at a time. Trying another way is something to feel good about.':'You can do hard things. Choosing a strategy, asking for a clue and changing your approach all count as progress.'}</p></div><form id="reflection-form"><label for="reflection-text">Keep this takeaway, or put it in your own words</label><textarea id="reflection-text" maxlength="220" rows="3">${esc(s.reflection?.text||t.takeaway)}</textarea><button class="primary" type="submit">Save in my field journal</button></form><p id="reflection-status" role="status">${s.reflection?'✓ Your thought is saved on this device.':''}</p><button data-next-phase="play">Back to today’s activities</button>`;
  return `<section id="journey-stage" class="panel lesson-stage" tabindex="-1">${content}<div class="lesson-secondary">${tools}${p!=='play'?'<button id="lesson-skip">I already know this, take me to the games</button>':''}</div>${!storageOK?'<p role="alert">Lesson notes could not be saved. Browser storage may be unavailable.</p>':''}</section>`;
 }
 function playHTML(g,d,list,done,selected){return `<section id="journey-stage" class="panel play-home" tabindex="-1"><div class="eyebrow">Play · Put the idea to work</div><h2>Today’s five activities</h2><p id="day-summary">Day ${d} · ${done.length}/5 saved</p>${list[0]?.savedDay?'<p class="small saved-day-note">Your saved activities are kept exactly as you left them. Today’s lesson adds another idea to explore alongside them.</p>':''}<div class="day-activities">${list.map((m,i)=>`<button data-mission="${m.id}" aria-pressed="${m.id===selected}"><span>${done.includes(m.id)?'✓':m.icon}</span><strong>${i+1}. ${esc(m.title)}</strong><small>${done.includes(m.id)?'Saved · replay any time':'Explore at your pace'}</small></button>`).join('')}</div><button data-next-phase="reflect">${done.length===5?'What I learned →':'Pause and reflect'}</button></section>`;}
 function journalHTML(g){const entries=Object.entries(grade(g).days).filter(([,s])=>s.reflection&&typeof s.reflection.text==='string').sort((a,b)=>+a[0]-+b[0]);return `<details class="lesson-journal"><summary>What I learned · ${entries.length} saved thoughts</summary>${entries.length?entries.map(([d,s])=>`<article><strong>Day ${d} · ${esc(title(g,+d))}</strong><p>${esc(s.reflection.text)}</p></article>`).join(''):'<p>Save a takeaway from the Reflect step to keep it here.</p>'}</details>`;}
 function updateJournal(){if(!ctx)return;document.querySelector('.lesson-journal')?.remove();document.querySelector('.passport')?.insertAdjacentHTML('beforeend',journalHTML(ctx.profile.grade));}
 function bind(context){ctx=context;if(!ctx)return;const {grade:g}=ctx.profile,d=ctx.selectedDay,s=dayState(g,d),t=T.topic(g,d);
  document.querySelectorAll('[data-phase]').forEach(b=>b.onclick=()=>go(b.dataset.phase));document.querySelectorAll('[data-next-phase]').forEach(b=>b.onclick=()=>go(b.dataset.nextPhase));
  const skip=document.getElementById('lesson-skip');if(skip)skip.onclick=()=>{s.skipped=true;go('play');};
  document.querySelector('[data-lesson-read]')?.addEventListener('click',e=>root.ExplorerEngagement?.read(document.getElementById('lesson-reading')?.innerText||t.title,e.currentTarget));
  document.getElementById('lesson-demo-toggle')?.addEventListener('click',e=>{s.alternate=!s.alternate;save();document.getElementById('lesson-visual').innerHTML=visualHTML(t.visual,s.alternate);e.currentTarget.textContent=s.alternate?'Show the first view':'Explore another view';root.ExplorerEngagement?.say('Notice what changed in the picture, and what stayed the same.','think','#lesson-visual');});
  document.getElementById('example-back')?.addEventListener('click',()=>{s.step=Math.max(0,(s.step||0)-1);save();ctx.render();});
  document.getElementById('example-next')?.addEventListener('click',()=>{if((s.step||0)>=t.steps.length-1)go('try');else{s.step=(s.step||0)+1;save();ctx.render();}});
  const form=document.getElementById('guided-form');if(form){form.onsubmit=e=>{e.preventDefault();if(!ctx.canDay(d))return;const input=document.getElementById('guided-answer');if(!input.value.trim()||!Number.isFinite(+input.value))return;s.answer=input.value;s.correct=Math.abs(+input.value-t.trial.value)<1e-8;save();const fb=document.getElementById('guided-feedback');fb.textContent=s.correct?'✓ That works! Explain one step to yourself before you play.':'↻ A useful try. '+t.steps[0].text+' You can ask for a hint or see the example again.';fb.dataset.feedback=s.correct?'correct':'wrong';document.getElementById('guided-play').hidden=!s.correct;form.querySelector('button').classList.toggle('primary',!s.correct);document.getElementById('guided-play').classList.toggle('primary',!!s.correct);root.ExplorerEngagement?.lessonFeedback(s.correct,fb.textContent);point(s.correct?'#guided-play':'#guided-answer');};document.getElementById('guided-hint').onclick=()=>{s.hints=(s.hints||0)+1;save();const text=s.hints===1?'Start by identifying what you know. '+t.steps[0].text:'Follow the same order as the example, using the new numbers. '+t.steps.slice(0,2).map(x=>x.text).join(' ');document.getElementById('guided-feedback').textContent='Hint: '+text;root.ExplorerEngagement?.say(text,'think','#guided-answer');};}
  document.getElementById('reflection-form')?.addEventListener('submit',e=>{e.preventDefault();const text=document.getElementById('reflection-text').value.trim();if(!text){document.getElementById('reflection-status').textContent='Choose one small thought to keep, or come back later.';return;}s.reflection={text:text.slice(0,220),saved:E.today()};if(!s.visited.includes('reflect'))s.visited.push('reflect');save();updateJournal();document.getElementById('reflection-status').textContent=storageOK?'✓ Saved in your field journal. Your thinking is worth keeping.':'Your thought is here, but browser storage could not save it.';root.ExplorerEngagement?.say('You noticed your own strategy. That is something to celebrate.','celebrate','#reflection-status');});
  updateJournal();
  const p=s.phase,lines=['Let’s look for the idea before we practise.','What do you notice when you look closely?','A picture can help us explain why.'];
  const speech=p==='see'?t.steps[Math.min(s.step||0,t.steps.length-1)].text:p==='try'?'Try one step. A hint or another look at the example is always welcome.':p==='reflect'?'Keep one idea that made sense to you. Your explanation matters.':p==='play'?'Today’s idea: '+t.takeaway:lines[(d-1)%lines.length]+' Today we explore '+t.title.toLowerCase()+'.';
  root.ExplorerEngagement?.say(speech,p==='see'?'point':'wave',p==='try'?'#guided-answer':p==='play'?'#hint':'#lesson-guide-dock');
 }
 function mascotSVG(world){
  const outfit=world==='space'?'<ellipse cx="70" cy="62" rx="46" ry="45" class="guide-helmet"/><path d="M43 97h54v16H43z" class="guide-trim"/><circle cx="52" cy="104" r="3" fill="currentColor"/>':world==='sports'?'<path d="M31 43Q70 19 109 43L106 55Q70 33 34 55Z" class="guide-trim"/><path d="M80 91l10 10-10 10-10-10z" class="guide-trim"/>':'<path d="M29 47Q70 25 111 47L98 39 91 20H49L42 39Z" class="guide-trim"/><path d="M48 95l22 18 22-18" class="guide-scarf"/>';
  return `<svg class="guide-svg" viewBox="0 0 140 155" role="img" aria-label="An original little folded-paper guide, dressed as ${world==='space'?'an astronaut':world==='sports'?'a coach':'an explorer'}"><g class="guide-breathe"><path d="M52 119l-9 17m45-17 9 17" class="guide-limbs"/><path d="M32 78L17 91M108 78l16-14" class="guide-limbs guide-arms"/><path d="M70 22Q103 22 108 61L101 102Q91 126 70 125Q49 126 39 102L32 61Q37 22 70 22Z" class="guide-body"/><path d="M83 24L104 48 82 43Z" class="guide-fold"/>${outfit}<g class="guide-eyes"><ellipse cx="55" cy="66" rx="5" ry="7"/><ellipse cx="85" cy="66" rx="5" ry="7"/></g><path d="M59 85q11 10 22 0" class="guide-smile"/><circle cx="44" cy="82" r="5" class="guide-cheek"/><circle cx="96" cy="82" r="5" class="guide-cheek"/></g></svg>`;
 }
 function installMascot(node){node.classList.add('learning-guide');node.innerHTML=`<button class="guide-character-button" aria-label="Ask the guide for help">${mascotSVG(document.documentElement.dataset.theme)}</button><div class="guide-speech"><p aria-live="polite"></p><div class="guide-quick"><button data-guide-help>Ask for help</button><button data-guide-read>▶ Read this</button><button data-guide-hide>Hide guide</button></div><div class="guide-help" hidden><button data-guide-action="hint">A hint</button><button data-guide-action="learn">Explain the idea again</button><button data-guide-action="see">Show the example again</button></div></div>`;
  const help=node.querySelector('.guide-help');node.querySelector('.guide-character-button').onclick=node.querySelector('[data-guide-help]').onclick=()=>{help.hidden=!help.hidden;};
  node.querySelector('[data-guide-read]').onclick=e=>root.ExplorerEngagement?.read(node.querySelector('p').textContent,e.currentTarget,true);
  node.querySelectorAll('[data-guide-action]').forEach(b=>b.onclick=()=>{help.hidden=true;if(b.dataset.guideAction==='hint'){const hint=document.getElementById('guided-hint')||document.getElementById('hint');if(hint)hint.click();else root.ExplorerEngagement?.say(ctx?T.topic(ctx.profile.grade,ctx.selectedDay).why:'Choose a day to explore its idea.','think');}else{if(ctx&&b.dataset.guideAction==='see')dayState(ctx.profile.grade,ctx.selectedDay).step=0;go(b.dataset.guideAction);}});
  point(null,node);
 }
 function point(selector,node=document.getElementById('eng-mascot')){
  if(!node)return;const target=typeof selector==='string'?document.querySelector(selector):null;
  let dock=document.getElementById('lesson-guide-dock');
  if(document.getElementById('mission-detail')){
   dock=document.getElementById('play-guide-dock');if(!dock){dock=document.createElement('div');dock.id='play-guide-dock';dock.className='guide-dock';const actions=document.querySelector('#mission-detail>.actions');(actions||document.getElementById('studio')).insertAdjacentElement('afterend',dock);}
  }
  if(!dock){dock=document.getElementById('fallback-guide-dock');if(!dock){dock=document.createElement('div');dock.id='fallback-guide-dock';dock.className='guide-dock';document.getElementById('app').append(dock);}}
  if(node.parentElement!==dock)dock.append(node);
  document.querySelectorAll('.guide-pointed').forEach(n=>n.classList.remove('guide-pointed'));clearTimeout(pointTimer);
  if(target&&!node.hidden){target.classList.add('guide-pointed');pointTimer=setTimeout(()=>target.classList.remove('guide-pointed'),2400);}
  node.classList.remove('guide-arriving');void node.offsetWidth;node.classList.add('guide-arriving');
 }
 function reset(){data={grades:{}};save();}
 root.ExplorerLearning={KEY,activities,phase,setPlay,title,pathHTML,stageHTML,playHTML,journalHTML,bind,go,updateJournal,installMascot,mascotSVG,point,reset,dayState};
})(globalThis);
