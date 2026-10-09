/* Self-contained, keyboard- and touch-friendly learning activities. */
window.ExplorerGames = (() => {
  const supported = new Set(['passport','rocket','warmup','family','market','teacher','code']);
  const cache = new Map();
  const esc = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function render(m,level) {
    if(!supported.has(m.id)) return '';
    return `<div class="game" id="game" data-game="${m.id}" data-level="${level}"><div class="game-label">✦ YOUR PLAY SPACE</div><div id="game-board"></div><div id="game-status" class="game-status" role="status">Explore at your own pace. No timer.</div></div>`;
  }
  function bind(m,level,onSuccess) {
    const root=document.getElementById('game');if(!root)return;
    const board=root.querySelector('#game-board'),status=root.querySelector('#game-status');
    const key=m.id+':'+level;
    let s=cache.get(key);if(!s){s={};cache.set(key,s);}
    const say=(text,good=false)=>{status.textContent=text;status.classList.toggle('success',good);};
    const win=text=>{say(text,true);if(!s.won){s.won=true;root.classList.add('celebrating');onSuccess(text);} };
    const wire=(sel,fn)=>board.querySelectorAll(sel).forEach(el=>el.onclick=()=>fn(el));
    // Pointer dragging works on mouse, pen and touch; button selection is the keyboard alternative.
    function drag(sourceSelector,dropSelector,perform) {
      board.querySelectorAll(sourceSelector).forEach(source=>{
        source.onpointerdown=e=>{
          if(e.button!==0)return;
          const start={x:e.clientX,y:e.clientY};let moving=false,ghost=null;
          source.setPointerCapture(e.pointerId);
          const move=ev=>{
            if(!moving&&Math.hypot(ev.clientX-start.x,ev.clientY-start.y)>7){moving=true;ghost=source.cloneNode(true);ghost.removeAttribute('id');ghost.className='drag-ghost';ghost.setAttribute('aria-hidden','true');document.body.append(ghost);}
            if(ghost){ghost.style.left=ev.clientX+'px';ghost.style.top=ev.clientY+'px';}
          };
          const finish=ev=>{
            source.removeEventListener('pointermove',move);source.removeEventListener('pointerup',finish);source.removeEventListener('pointercancel',cancel);
            if(ghost)ghost.remove();
            if(moving){source.onclick=null;e.preventDefault();const target=document.elementFromPoint(ev.clientX,ev.clientY)?.closest(dropSelector);if(target&&board.contains(target)){perform(source,target);if(source.isConnected)draw();}else{say('Drop onto a highlighted space, or tap a tile and then a space.');draw();}}
          };
          const cancel=()=>{if(ghost)ghost.remove();source.removeEventListener('pointermove',move);source.removeEventListener('pointerup',finish);source.removeEventListener('pointercancel',cancel);};
          source.addEventListener('pointermove',move);source.addEventListener('pointerup',finish);source.addEventListener('pointercancel',cancel);
        };
      });
    }
    let draw=()=>{};
    if(m.id==='passport') {
      s.pixels=s.pixels||Array(64).fill(0);s.color=s.color||1;
      const colors=['Erase','Purple','Coral','Gold','Mint'];
      draw=()=>{
        board.innerHTML=`<h3>Design your explorer badge</h3><p class="small">Paint your own rocket, face or pattern. Drag across the squares, or tap each one.</p><div class="paint-palette" aria-label="Paint colours">${colors.map((c,i)=>`<button data-color="${i}" class="paint-color ink-${i}" aria-label="${c}" aria-pressed="${s.color===i}">${i===0?'⌫':''}</button>`).join('')}</div><div class="pixel-board" aria-label="Badge drawing grid">${s.pixels.map((v,i)=>`<button class="pixel ink-${v}" data-pixel="${i}" aria-label="Row ${Math.floor(i/8)+1}, column ${i%8+1}: ${colors[v]}"></button>`).join('')}</div><div class="actions"><button id="badge-save" class="primary">My badge is ready ✨</button><button id="badge-clear">Clear canvas</button></div>`;
        wire('[data-color]',b=>{s.color=Number(b.dataset.color);draw();});
        const paint=b=>{const i=Number(b.dataset.pixel);s.pixels[i]=s.color;b.className='pixel ink-'+s.color;b.setAttribute('aria-label',`Row ${Math.floor(i/8)+1}, column ${i%8+1}: ${colors[s.color]}`);};
        wire('[data-pixel]',paint);
        const canvas=board.querySelector('.pixel-board');
        canvas.onpointerdown=e=>{const p=e.target.closest('[data-pixel]');if(!p)return;paint(p);canvas.setPointerCapture(e.pointerId);canvas.onpointermove=ev=>{if(ev.buttons===0)return;const cell=document.elementFromPoint(ev.clientX,ev.clientY)?.closest('[data-pixel]');if(cell&&canvas.contains(cell))paint(cell);};};
        canvas.onpointerup=canvas.onpointercancel=()=>{canvas.onpointermove=null;};
        board.querySelector('#badge-save').onclick=()=>{if(!s.pixels.some(Boolean)){say('Add a little colour first. Your badge can be anything you imagine!');return;}win('Your one-of-a-kind badge is ready! You can keep painting or add this adventure to your passport.');};
        board.querySelector('#badge-clear').onclick=()=>{s.pixels.fill(0);s.won=false;draw();say('A fresh canvas. What will you make?');};
      };
    } else if(m.id==='rocket') {
      const expected=level==='starter'?[8,11,14]:[12,24,48],prefix=level==='starter'?[2,5]:[3,6];
      s.slots=s.slots||[null,null,null];s.selected=s.selected??null;
      const place=(n,i)=>{if(s.slots.includes(n))s.slots[s.slots.indexOf(n)]=null;s.slots[i]=n;s.selected=null;s.won=false;root.classList.remove('celebrating');draw();say('Nice placement. Check the pattern when all three spaces are filled.');};
      draw=()=>{
        board.innerHTML=`<h3>Build the launch sequence</h3><p class="small">Drag the number tiles into the empty spaces. Or tap a tile, then tap its space.</p><div class="launch-scene ${s.won?'launched':''}" aria-hidden="true"><span class="launch-rocket">🚀</span><span class="launch-stars">✦ · ✧ · ✦</span></div><div class="sequence" aria-label="Rocket sequence">${prefix.map(n=>`<span class="fixed-number">${n}</span>`).join('')}${s.slots.map((n,i)=>`<button class="drop-slot" data-slot="${i}" aria-label="Sequence space ${i+1}${n===null?', empty':', '+n}">${n??'?'}</button>`).join('')}</div><div class="number-bank" aria-label="Number tiles">${[expected[2],expected[0],expected[1]].filter(n=>!s.slots.includes(n)).map(n=>`<button class="number-tile" data-number="${n}" aria-pressed="${s.selected===n}">${n}</button>`).join('')||'<span class="small">All tiles placed. Tap a space to return its tile.</span>'}</div><div class="actions"><button id="launch" class="primary">Check & launch 🚀</button><button id="pattern-reset">Try again</button></div>`;
        wire('[data-number]',b=>{s.selected=Number(b.dataset.number);draw();say(`Number ${s.selected} selected. Choose a space.`);});
        wire('[data-slot]',b=>{const i=Number(b.dataset.slot);if(s.selected!==null)place(s.selected,i);else if(s.slots[i]!==null){s.slots[i]=null;s.won=false;draw();}});
        drag('[data-number]','[data-slot]',(a,b)=>place(Number(a.dataset.number),Number(b.dataset.slot)));
        board.querySelector('#launch').onclick=()=>{if(s.slots.some(n=>n===null)){say('Fill all three spaces before launch.');return;}if(s.slots.every((n,i)=>n===expected[i])){win(level==='starter'?'Lift-off! You added 3 at each step.':'Lift-off! You doubled at each step.');board.querySelector('.launch-scene').classList.add('launched');}else say('The rocket needs a different sequence. '+(level==='starter'?'Add 3 each time.':'Double each time.'));};
        board.querySelector('#pattern-reset').onclick=()=>{s.slots=[null,null,null];s.selected=null;s.won=false;draw();say('Tiles reset. Try a new arrangement.');};
      };
    } else if(m.id==='warmup'||m.id==='family') {
      const target=m.id==='warmup'?20:10,goal=m.id==='warmup'?3:5;s.left=s.left??target;s.pairs=s.pairs||[];
      const move=delta=>{s.left=Math.max(0,Math.min(target,s.left+delta));draw();};
      draw=()=>{
        const right=target-s.left;
        board.innerHTML=`<h3>Build ${target} in different ways</h3><p class="small">Move counters between the baskets. Save ${goal} different pairs. Swapping the same pair counts once.</p><div class="counter-baskets"><div class="basket" data-basket="left"><strong>Basket A · ${s.left}</strong><div class="counters">${Array.from({length:s.left},(_,i)=>`<button class="counter purple-counter" data-counter="left" aria-label="Move counter ${i+1} to basket B"></button>`).join('')}</div></div><div class="basket" data-basket="right"><strong>Basket B · ${right}</strong><div class="counters">${Array.from({length:right},(_,i)=>`<button class="counter coral-counter" data-counter="right" aria-label="Move counter ${i+1} to basket A"></button>`).join('')}</div></div></div><div class="counter-controls"><button id="move-left" ${s.left===target?'disabled':''} aria-label="Move one counter to basket A">← Move one</button><output class="live-equation">${s.left} + ${right} = ${target}</output><button id="move-right" ${s.left===0?'disabled':''} aria-label="Move one counter to basket B">Move one →</button></div><div class="actions"><button id="save-pair" class="primary">Save this pair</button></div><div class="pair-collection" aria-label="Saved pairs">${s.pairs.map(x=>`<span class="pair-chip">${x} ✓</span>`).join('')}<span class="small">${s.pairs.length} / ${goal} pairs discovered</span></div>`;
        wire('[data-counter]',b=>move(b.dataset.counter==='left'?-1:1));
        drag('[data-counter]','[data-basket]',(a,b)=>{if(a.dataset.counter!==b.dataset.basket)move(a.dataset.counter==='left'?-1:1);});
        board.querySelector('#move-left').onclick=()=>move(1);board.querySelector('#move-right').onclick=()=>move(-1);
        board.querySelector('#save-pair').onclick=()=>{const pair=[s.left,right].sort((a,b)=>a-b).join(' + ');if(s.pairs.includes(pair)){say('You already found that pair! Move a counter to discover a different one.');return;}s.pairs.push(pair);draw();if(s.pairs.length>=goal)win(`You found ${goal} different ways to make ${target}! There can be more than one good way to solve a problem.`);else say('Pair collected! Move the counters and discover another.',true);};
      };
    } else if(m.id==='market') {
      const advanced=level==='challenger',budget=advanced?100:20;
      const items=advanced?[{name:'Notebook',icon:'📒',price:18,need:3},{name:'Pencil',icon:'✏️',price:7,need:0}]:[{name:'Pencil',icon:'✏️',price:7,need:1},{name:'Eraser',icon:'🧼',price:5,need:1},{name:'Notebook',icon:'📒',price:12,need:0}];
      s.cart=s.cart||items.map(()=>0);s.change=s.change||'';
      draw=()=>{
        const spent=items.reduce((sum,x,i)=>sum+x.price*s.cart[i],0);
        board.innerHTML=`<h3>Run your own little shopping trip</h3><div class="wallet">👛 Starting money <strong>₹${budget}</strong></div><p class="small">Shopping list: ${advanced?'3 notebooks':'1 pencil and 1 eraser'}. Add items, remove extras, then work out your change.</p><div class="shop-shelves">${items.map((item,i)=>`<div class="shop-item"><span class="shop-icon" aria-hidden="true">${item.icon}</span><strong>${item.name}</strong><span>₹${item.price}</span><div class="quantity"><button data-remove="${i}" aria-label="Remove ${item.name}" ${s.cart[i]===0?'disabled':''}>−</button><output aria-label="${item.name} quantity">${s.cart[i]}</output><button data-add="${i}" aria-label="Add ${item.name}" ${spent+item.price>budget?'disabled':''}>+</button></div></div>`).join('')}</div><div class="receipt"><span>Basket total</span><strong>₹${spent}</strong></div><label class="change-label">How many rupees will you get back?<input id="change" type="number" min="0" max="${budget}" inputmode="numeric" value="${esc(s.change)}" placeholder="Your change"></label><button id="checkout" class="primary">Check my shopping 🛍️</button>`;
        wire('[data-add]',b=>{s.cart[Number(b.dataset.add)]++;s.won=false;draw();});wire('[data-remove]',b=>{s.cart[Number(b.dataset.remove)]--;s.won=false;draw();});
        board.querySelector('#change').oninput=e=>{s.change=e.target.value;};
        board.querySelector('#checkout').onclick=()=>{if(!items.every((item,i)=>s.cart[i]===item.need)){say('Check your shopping list. Your basket has a missing item or an extra item.');return;}if(s.change.trim()===''){say('Type the amount of change you expect.');return;}if(Number(s.change)!==budget-spent){say(`Your items cost ₹${spent}. Subtract that from ₹${budget}.`);return;}win(`Shopping complete! ₹${budget} − ₹${spent} = ₹${budget-spent} change. You stayed within your budget.`);};
      };
    } else if(m.id==='teacher') {
      const a=level==='starter'?9:29,b=level==='starter'?6:17;s.moved=s.moved??0;
      draw=()=>{
        const first=a+s.moved,second=b-s.moved,firstOnes=first%10,secondOnes=second%10;
        const dots=(n,side)=>Array.from({length:n},(_,i)=>`<button class="counter ${side==='a'?'purple-counter':'coral-counter'}" data-transfer="${side}" aria-label="Move one unit from ${side==='a'?'first':'second'} number"></button>`).join('');
        board.innerHTML=`<h3>Make a friendly ${level==='starter'?'ten':'thirty'}</h3><p class="small">Move one unit from the second number to the first. The total stays the same!</p><div class="counter-baskets"><div class="basket" data-transfer-target="a"><strong>First number · ${first}</strong><div class="tens">${Math.floor(first/10)?Math.floor(first/10)+' ten'+(Math.floor(first/10)>1?'s':''):''}</div><div class="counters">${dots(firstOnes,'a')}</div></div><div class="basket" data-transfer-target="b"><strong>Second number · ${second}</strong><div class="tens">${Math.floor(second/10)?Math.floor(second/10)+' ten':''}</div><div class="counters">${dots(secondOnes,'b')}</div></div></div><div class="equation-card">${first} + ${second} = ${a+b}</div><div class="actions"><button id="transfer" class="primary" ${s.moved===1?'disabled':''}>Move one unit ←</button><button id="transfer-reset">Start again</button></div>`;
        const transfer=()=>{if(s.moved===1)return;s.moved=1;draw();win(`${a} + ${b} becomes ${a+1} + ${b-1}. The total is still ${a+b}!`);};
        board.querySelector('#transfer').onclick=transfer;
        wire('[data-transfer]',el=>{if(el.dataset.transfer==='b')transfer();});
        drag('[data-transfer="b"]','[data-transfer-target="a"]',transfer);
        board.querySelector('#transfer-reset').onclick=()=>{s.moved=0;s.won=false;draw();say('Move one unit to make the first number a multiple of ten.');};
      };
    } else if(m.id==='code') {
      const target=level==='starter'?'6':'15';s.entry=s.entry||'';
      draw=()=>{
        board.innerHTML=`<h3>Open the number vault</h3><p class="small">Work out the code above, then enter it on the keypad. You can also type with your keyboard.</p><div class="vault ${s.won?'open':''}"><span class="vault-icon" aria-hidden="true">${s.won?'🔓':'🔒'}</span><label class="sr-only" for="vault-code">Your secret code</label><input id="vault-code" type="text" inputmode="numeric" maxlength="3" autocomplete="off" value="${esc(s.entry)}" placeholder="?" aria-label="Your secret code"><div class="keypad">${['1','2','3','4','5','6','7','8','9','Clear','0','⌫'].map(k=>`<button data-key="${k}" aria-label="${k==='⌫'?'Delete last digit':k}">${k}</button>`).join('')}</div><button id="unlock" class="primary">Unlock the vault</button></div>`;
        wire('[data-key]',b=>{const k=b.dataset.key;s.entry=k==='Clear'?'':k==='⌫'?s.entry.slice(0,-1):(s.entry+k).slice(0,3);s.won=false;draw();});
        board.querySelector('#vault-code').oninput=e=>{s.entry=e.target.value.replace(/\D/g,'').slice(0,3);e.target.value=s.entry;};
        const unlock=()=>{if(!s.entry){say('Enter a number first.');return;}if(Number(s.entry)===Number(target)){win('Click… the vault is open! You turned letters into numbers and cracked the code.');draw();}else{say('The lock is still closed. Replace the letters with their values and try again.');root.querySelector('.vault').classList.remove('open');}};
        board.querySelector('#unlock').onclick=unlock;board.querySelector('#vault-code').onkeydown=e=>{if(e.key==='Enter')unlock();};
      };
    }
    // Keep keyboard focus on controls that survive a board update.
    const renderBoard=draw;
    draw=()=>{
      const active=board.contains(document.activeElement)?document.activeElement:null;
      const identity=active?.id?{id:active.id}:active?Array.from(active.attributes).filter(a=>a.name.startsWith('data-')).map(a=>({name:a.name,value:a.value}))[0]:null;
      renderBoard();
      if(identity){const next=identity.id?document.getElementById(identity.id):Array.from(board.querySelectorAll('['+identity.name+']')).find(el=>el.getAttribute(identity.name)===identity.value);if(next&&!next.disabled)next.focus({preventScroll:true});}
    };
    draw();if(s.won)say('Adventure explored! You can play again or add it to your passport.',true);
  }
  return {has:id=>supported.has(id),render,bind,reset:()=>cache.clear()};
})();
