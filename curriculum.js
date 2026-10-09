(function(root){
 'use strict';
 const grades=Array.from({length:12},(_,i)=>i+1);
 const band=g=>g<=2?'Discover':g<=5?'Create':g<=8?'Investigate':'Design lab';
 function activities(grade){
  const g=Number(grade);if(!grades.includes(g))throw Error('Choose a grade from 1 to 12');
  const tier=g<=2?0:g<=5?1:g<=8?2:3;
  const step=g+1;
  const sequence=tier===0?[g,g+1,g+2,g+3,g+4]:tier===1?[g,g+step,g+step*2,g+step*3,g+step*4]:tier===2?[g,g*2,g*4,g*8,g*16]:[g*g,(g+1)**2,(g+2)**2,(g+3)**2,(g+4)**2];
  const patternRule=tier===0?'Add 1 each time.':tier===1?`Add ${step} each time.`:tier===2?'Double each time.':`These are consecutive squares, starting at ${g}². Their gaps increase by 2.`;
  const target=tier===0?g*5:tier===1?g*5:12;
  const unit=tier<2?'whole':tier===2?'fraction':'percent';
  const price=10+g*3,budget=tier===0?20+g*10:100+g*20,quantity=tier===0?1:tier===1?2:3,discount=tier===3?10:0;
  const items=[{name:tier<2?'Notebook':'Sketchbook',icon:'📒',price:tier===0?7:price,need:quantity},{name:'Pencil',icon:'✏️',price:tier===0?5:5+g,need:tier<2?1:0},{name:'Stickers',icon:'⭐',price:8,need:0}];
  const algebraA=g-3,algebraB=g+2,algebraX=g+1;
  const sortItems=tier===0?[2,3,4,5,6,7]:tier===1?[g,g+1,g+2,g+3,g+4,g+5]:tier===2?[g,g+1,g*2,g*2+1,g*3,g*3+1]:[4,9,12,16,20,25];
  const bucketNames=tier===0?['Even','Odd']:tier===1?['Multiple of 3','Not a multiple of 3']:tier===2?[`Multiple of ${g}`,`Not a multiple of ${g}`]:['Perfect square','Not a perfect square'];
  const classification=n=>tier===0?n%2===0:tier===1?n%3===0:tier===2?n%g===0:Number.isInteger(Math.sqrt(n));
  const memoryPairs=tier===0?[['☀','☀'],['☂','☂'],['★','★']]:tier===1?Array.from({length:4},(_,i)=>[`${g+i} + ${g}`,String(g*2+i)]):tier===2?[['1/2','50%'],['1/4','25%'],['3/4','75%'],['1/5','20%']]:[[`2^${g-7}`,String(2**(g-7))],['√81','9'],['3² + 4²','25'],['log₁₀100','2'],['0.125','1/8']];
  const code=tier<2?g*3+3:tier===2?g*4+7:g*g+2*g;
  const codePrompt=tier<2?`A = ${g}, B = ${g+1}, C = ${g+2}. Find A + B + C.`:tier===2?`A = ${g}. Find 4 × A + 7.`:`Let x = ${g}. Find x² + 2x.`;
  const routeSize=4,routeTarget=g+3;
  const common=(id,day,week,icon,title,type,prompt,hint,benefit,config={})=>({id,day,week,icon,title,type,prompt,hint,benefit,config,grade:g,band:band(g)});
  return [
   common('passport',0,1,'🎨',tier<2?'Design your explorer badge':'Design your personal emblem','paint',tier<2?'Paint a badge that feels like you. Save the actual artwork in your passport.':'Create a pixel emblem using negative space, colour and a repeating motif. Save it in your passport.','Choose a colour, then paint with a mouse, finger or keyboard. Save again whenever you change your design.','Creative choice, spatial planning and ownership.',{size:8,artifact:true}),
   common('secret',1,1,'🃏',tier<2?'The memory garden':'Match lab','memory','Turn over two cards at a time and find every matching pair.',tier===0?'Match identical symbols.':'Match each expression or fraction with its equal value.','Working memory and recognising connections.',{pairs:memoryPairs}),
   common('rocket',3,1,'🚀',tier<2?'Build a rocket runway':'Sequence launch lab','sequence','Arrange the missing numbers, then launch your rocket.',patternRule,'Finding and applying a mathematical rule.',{sequence,rule:patternRule}),
   common('warmup',5,1,'🧺',tier<2?'The number mixer':tier===2?'Fraction studio':'Percentage studio','split',tier<2?`Find three different pairs that make ${target}. Move pieces between the two baskets.`:tier===2?'Split one whole into two fractions in three different ways. Each counter is one twelfth.':'Split a 100% budget into two shares in three different ways. Each counter is one twelfth of the budget.','Move one piece at a time. A pair and its reverse count as the same discovery.','Exploring equivalence and multiple solutions.',{target,unit,goal:3}),
   common('hunt',7,2,'🦋',tier<2?'The mirror garden':'Symmetry atelier','symmetry',tier<2?'Paint the right half to make a mirror image of the left half.':'Reconstruct the reflected pixel design across the vertical axis.','The column nearest the mirror on the left matches the column nearest the mirror on the right.','Spatial reasoning and reflection.',{size:6,seed:g}),
   common('market',9,2,'🛍️',tier<2?'Run a tiny shop':'Creative project budget','market',tier<2?'Choose the items on your list and work out your change.':'Buy the supplies for a creative project. Follow the list and calculate what remains.',discount?`Apply the ${discount}% discount to the basket total before subtracting from your budget.`:'Add the item prices, then subtract the cost from the budget.','Planning purchases and checking arithmetic.',{items,budget,discount}),
   common('family',11,2,'🥁',tier<2?'Copy the colour beat':'Pattern memory challenge','rhythm','Watch a short colour sequence, then recreate it. You control when it starts.','Say the colour names in your head or remember them in small groups.','Attention, sequencing and memory.',{length:Math.min(3+Math.floor(g/2),8),seed:g}),
   common('detective',13,2,'🗂️',tier<2?'Sort the treasure':'Logic sorting studio','sort','Place every number in the correct collection, then check your sorting.',tier===0?'Even numbers can be split into pairs with nothing left over.':tier===1?'Multiples of 3 divide by 3 with no remainder.':tier===2?`Look for numbers that divide by ${g} exactly.`:'A perfect square is a whole number multiplied by itself.','Classification and explaining a rule.',{items:sortItems,labels:bucketNames,answers:sortItems.map(n=>classification(n)?0:1)}),
   common('teacher',15,3,'⚖️',tier<2?'Balance the mystery box':'Equation balance lab','balance',tier<2?`Find the mystery value: x + ${g+2} = ${g*3+5}.`:`Balance the equation: ${algebraA}x + ${algebraB} = ${algebraA*algebraX+algebraB}.`,tier<2?'Remove the added number from both sides.':'Subtract the constant from both sides, then divide by the coefficient of x.','Seeing equality as a balance.',{a:tier<2?1:algebraA,b:tier<2?g+2:algebraB,x:tier<2?g*2+3:algebraX}),
   common('double',17,3,'🤖','Invent a number machine','machine',tier<2?'Move the input slider and watch your machine transform numbers. Solve both output challenges.':'Experiment with a function machine, then find inputs for both target outputs.','Try different inputs and compare how the output changes.','Exploring input-output rules.',{a:tier===0?1:tier===1?2:g-3,b:g,targets:[2,g+2],max:16}),
   common('choice',19,3,'🗺️',tier<2?'Plan a treasure route':'Route design challenge','route','Move from START to the flag. Avoid blocked squares. Undo steps whenever you want.','Move up, down, left or right. You can also select a neighbouring square.','Planning ahead and revising a strategy.',{size:routeSize,blocks:tier<2?[5,10]:[1,5,10],goal:15}),
   common('pitstop',21,4,'💛',tier<2?'Make a feeling postcard':'Design your pre-class intention','postcard',tier<2?'Choose a feeling, choose a colour and write or draw a short message to your future self.':'Create a short intention for your first class: a question you want to ask or something you want to explore.','There is no correct feeling. You can be curious, excited, unsure or nervous.','Self-expression and preparing for a new experience.',{artifact:true}),
   common('code',24,4,'🔐',tier<2?'The secret number vault':'Cipher vault','code',codePrompt,tier<2?'Replace each letter with its value, then add.':tier===2?'Multiply before adding.':'Square x first, then add twice x.','Using symbols and following an order of operations.',{target:code}),
   common('celebrate',27,4,'🖼️',tier<2?'Your mini art exhibition':'Design a discovery poster','paint',tier<2?'Make a new piece of pixel art inspired by something you enjoyed. Add it to your passport gallery.':'Create a geometric poster using a repeating motif and deliberate colour choices. Add it to your saved gallery.','Try alternating colours, a border or a repeating shape.','Reflection through creative work.',{size:8,artifact:true}),
   common('boarding',29,4,'🎒',tier<2?'Pack your explorer bag':'Build your class launch kit','pack','Pack paper, a pencil and your device. Leave the other objects outside.','Use your usual Bhanzu message to confirm the actual time and joining link.','Planning and readiness.',{items:[['Paper','📄',true],['Pencil','✏️',true],['Device','💻',true],['Football','⚽',false],['Ice cream','🍦',false],['Plant','🪴',false]]})
  ];
 }
 const api={grades,band,activities};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.ExplorerCurriculum=api;
})(typeof globalThis!=='undefined'?globalThis:this);
