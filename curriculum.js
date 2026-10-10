(function (root) {
  'use strict';
  const grades = Array.from({ length: 12 }, (_, i) => i + 1);
  const DAYS = 30, PER_DAY = 5;
  const band = g => g <= 2 ? 'Discover' : g <= 5 ? 'Create' : g <= 8 ? 'Investigate' : 'Design lab';
  const plans = [
    ['paint', 'memory', 'sequence', 'market', 'route'],
    ['symmetry', 'rhythm', 'split', 'balance', 'postcard'],
    ['sort', 'machine', 'code', 'paint', 'memory']
  ];
  const ideas = ['a forest hideout', 'a friendly robot', 'an underwater city', 'a team emblem', 'a constellation', 'a secret garden', 'a festival flag', 'a mountain shelter', 'a future invention', 'your favourite discovery'];
  const icons = { paint:'🎨', memory:'🃏', sequence:'🧩', market:'🛍️', route:'🗺️', symmetry:'🦋', rhythm:'🥁', split:'🧺', balance:'⚖️', postcard:'💌', sort:'🗂️', machine:'🤖', code:'🔐', pack:'🎒' };

  // Stable IDs and deterministic variants keep saved work valid after a refresh.
  function make(type, g, day, slot) {
    const tier = g <= 2 ? 0 : g <= 5 ? 1 : g <= 8 ? 2 : 3;
    const v = day - 1, idea = ideas[Math.floor(v / 3)];
    let title, prompt, hint, benefit, config;
    switch (type) {
      case 'paint':
        title = `Design ${idea}`;
        prompt = tier < 2 ? `Paint ${idea}. Try a new colour combination and save your artwork.` : `Design ${idea} as pixel art. Use a repeating motif, negative space and a deliberate colour palette.`;
        hint = 'Select a colour, then paint with a finger, mouse or keyboard. You can edit and save again.';
        benefit = 'Creative expression and spatial planning.';
        config = { size: 8, artifact: true };
        break;
      case 'memory': {
        title = `Match trail ${day}`;
        prompt = tier === 0 ? 'Find the matching symbols, two cards at a time.' : 'Match each expression to its equal value. Remember where the cards are.';
        const symbols = ['☀','☂','★','♫','☘','◆','☾','♥','✿','♜','▲','●'];
        const count = tier === 0 ? 3 + (g % 2) : tier === 3 ? 5 : 4;
        const pairs = Array.from({ length: count }, (_, i) => {
          const n = g + v + i + 1;
          if (tier === 0) return [symbols[(v + i) % symbols.length], symbols[(v + i) % symbols.length]];
          if (tier === 1) return [`${n} + ${g}`, String(n + g)];
          if (tier === 2) { const k = 1 + (v + i) % 9; return [`${k}/10`, `${k * 10}%`]; }
          return [`${n}² − ${g}`, String(n * n - g)];
        });
        hint = tier === 0 ? 'Remember the position of each symbol.' : 'Work out the value, then find the card with the same value.';
        benefit = 'Working memory and recognising equivalence.';
        config = { pairs }; break;
      }
      case 'sequence': {
        title = `Number trail ${day}`;
        const start = g + v, step = tier === 0 ? g : g + 1 + v % 3;
        const sequence = Array.from({ length: 5 }, (_, i) => tier < 2 ? start + step * i : tier === 2 ? (g + v % 4) * (2 + v % 2) ** i : (g + v + i) ** 2);
        const rule = tier < 2 ? `Add ${step} each time.` : tier === 2 ? `Multiply by ${2 + v % 2} each time.` : `Use consecutive squares, starting at ${g + v}².`;
        prompt = 'Arrange three missing numbers to complete the sequence.';
        hint = rule; benefit = 'Recognising and applying a pattern.';
        config = { sequence, rule }; break;
      }
      case 'split': {
        title = tier < 2 ? `Number remix ${day}` : tier === 2 ? `Fraction remix ${day}` : `Budget shares ${day}`;
        const target = tier === 0 ? 6 + g * 2 + v % 3 * 2 : tier === 1 ? 10 + g + v % 5 : 12;
        const unit = tier < 2 ? 'whole' : tier === 2 ? 'fraction' : 'percent';
        prompt = tier < 2 ? `Find three different pairs that make ${target}.` : `Plan two shares for ${idea}. Find three ways to split ${tier === 2 ? 'one whole into twelfths' : '100% of a budget'}.`;
        hint = 'Move counters between the baskets. A pair and its reverse count only once.';
        benefit = 'Equivalence and flexible number thinking.';
        config = { target, unit, goal: 3 }; break;
      }
      case 'symmetry':
        title = `Mirror design ${day}`;
        prompt = `Complete the reflected design for ${idea}. Paint the right half to match the left.`;
        hint = 'Compare columns equally far from the centre line.';
        benefit = 'Reflection and spatial reasoning.';
        config = { size: tier < 2 ? 6 : 8, seed: g + Math.floor(v / 3) }; break;
      case 'market': {
        title = `Supply shop ${day}`;
        const names = ['Notebook','Sketchbook','Project card','Poster sheet'];
        const items = [
          { name: names[v % 4], icon:'📒', price: tier === 0 ? 5 + v % 5 : 10 + g * 3 + v, need: tier === 0 ? 1 : 2 + v % 2 },
          { name:'Pencil', icon:'✏️', price: tier === 0 ? 3 + v % 3 : 5 + g, need: 1 },
          { name:'Stickers', icon:'⭐', price: 8 + v % 4, need: 0 }
        ];
        const total = items.reduce((n, x) => n + x.price * x.need, 0);
        const budget = total + 10 + g * 2 + v, discount = tier === 3 ? 5 * (1 + v % 4) : 0;
        prompt = `Buy the listed supplies for ${idea}, then work out the money left${discount ? ` after your ${discount}% discount` : ''}.`;
        hint = discount ? `Take ${discount}% off the total before subtracting from your budget.` : 'Add the prices of the items on the list, then subtract from your budget.';
        benefit = 'Planning purchases and calculating change.';
        config = { items, budget, discount }; break;
      }
      case 'rhythm':
        title = `Colour beat ${day}`;
        prompt = 'Watch the colour sequence, then recreate it at your own pace.';
        hint = 'Remember small groups of colour names or positions.';
        benefit = 'Attention and sequence memory.';
        config = { length: Math.min(3 + Math.floor(g / 2) + Math.floor(v / 3) % 2, 8), seed: g + Math.floor(v / 3) }; break;
      case 'sort': {
        title = `Treasure sorting ${day}`;
        const divisor = tier === 0 ? 2 : tier === 1 ? 3 + v % 3 : g;
        const items = Array.from({ length: 6 }, (_, i) => tier === 3 ? (2 + v % 7 + Math.floor(i / 2)) ** 2 + i % 2 : divisor * (2 + Math.floor(i / 2) + v % 3) + i % 2);
        const labels = tier === 0 ? ['Even','Odd'] : tier === 3 ? ['Perfect square','Not a perfect square'] : [`Multiple of ${divisor}`,`Not a multiple of ${divisor}`];
        const answers = items.map(n => (tier === 3 ? Number.isInteger(Math.sqrt(n)) : n % divisor === 0) ? 0 : 1);
        prompt = 'Give every number the correct home. Check your collections when you are ready.';
        hint = tier === 0 ? 'Even numbers can be split into pairs.' : tier === 3 ? 'A perfect square is a whole number multiplied by itself.' : `Test whether each number divides by ${divisor} exactly.`;
        benefit = 'Classifying numbers using a rule.';
        config = { items, labels, answers }; break;
      }
      case 'balance': {
        title = `Mystery balance ${day}`;
        const a = tier < 2 ? 1 : g - 3 + v % 3, b = g + 1 + v % 5, x = 2 + g + v % 7;
        prompt = `Find x so that ${a === 1 ? 'x' : `${a}x`} + ${b} = ${a * x + b}.`;
        hint = a === 1 ? 'Subtract the added number from both sides.' : 'Subtract the constant, then divide by the coefficient of x.';
        benefit = 'Understanding equality and equations.';
        config = { a, b, x }; break;
      }
      case 'machine':
        title = `Number machine ${day}`;
        prompt = 'Experiment with the input slider. Find the inputs for both target outputs.';
        hint = 'Watch how changing the input changes the output.';
        benefit = 'Exploring input-output relationships.';
        config = { a: tier === 0 ? 1 : tier === 1 ? 2 + v % 2 : g - 3 + v % 3, b: g + v % 6, targets: [2 + v % 4, 7 + (g + v) % 8], max: 16 }; break;
      case 'route': {
        title = `Route planner ${day}`;
        const obstacles = [1,2,3,5,6,7,9,10,11];
        const blocks = Array.from({ length: 2 + Math.min(3, Math.floor(g / 3)) }, (_, i) => obstacles[(v + i * 2) % obstacles.length]);
        prompt = `Plan a route through ${idea}. Reach the flag without crossing a blocked square.`;
        hint = 'Move to neighbouring squares. Undo a step when you want to try another route.';
        benefit = 'Planning ahead and revising a strategy.';
        config = { size: 4, blocks, goal: 15 }; break;
      }
      case 'postcard':
        title = `A postcard from day ${day}`;
        prompt = `Imagine a visit to ${idea}. Write a question, a discovery or a message to your future self.`;
        hint = 'Choose a feeling and a colour. A short message is enough.';
        benefit = 'Reflection and self-expression.';
        config = { artifact: true }; break;
      case 'code': {
        title = `Cipher vault ${day}`;
        const n = g + v;
        const target = tier < 2 ? 3 * n + 3 : tier === 2 ? 4 * n + 7 : n * n + 2 * n;
        prompt = tier < 2 ? `A = ${n}, B = ${n + 1}, C = ${n + 2}. Find A + B + C.` : tier === 2 ? `A = ${n}. Find 4 × A + 7.` : `Let x = ${n}. Find x² + 2x.`;
        hint = tier < 2 ? 'Replace the letters with their values and add.' : 'Calculate powers or multiplication before addition.';
        benefit = 'Interpreting symbols and following operation order.';
        config = { target }; break;
      }
      case 'pack':
        title = 'Your class launch kit';
        prompt = 'Pack paper, a pencil and your device. Leave the other objects outside.';
        hint = 'Check the actual class time and joining link in your Bhanzu message.';
        benefit = 'Planning and readiness.';
        config = { items: [['Paper','📄',true],['Pencil','✏️',true],['Device','💻',true],['Football','⚽',false],['Ice cream','🍦',false],['Plant','🪴',false]] }; break;
      default: throw new Error(`Unknown activity type: ${type}`);
    }
    return { id: `d${String(day).padStart(2, '0')}-${slot + 1}`, day, slot: slot + 1, week: Math.min(4, Math.ceil(day / 8)), grade: g, band: band(g), type, icon: icons[type], title, prompt, hint, benefit, config };
  }

  function activities(grade) {
    const g = Number(grade);
    if (!grades.includes(g)) throw new Error('Choose a grade from 1 to 12');
    return Array.from({ length: DAYS }, (_, index) => {
      const day = index + 1, group = [...plans[index % 3]];
      if (day === DAYS) group[4] = 'pack';
      const rotate = Math.floor(index / 3) % PER_DAY;
      return Array.from({ length: PER_DAY }, (_, slot) => make(group[(slot + rotate) % PER_DAY], g, day, slot));
    }).flat();
  }
  const api = { grades, band, activities, DAYS, PER_DAY };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ExplorerCurriculum = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
