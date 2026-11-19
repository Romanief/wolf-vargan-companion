'use strict';
const $ = id => document.getElementById(id);
const fresh = {hp:24,first:4,second:2,inspire:3,rebuke:1,dice:3,focus:'',mode:'exploration',notes:'',wins:0,fails:0,stable:false,armourBonus:0};
const key = 'frostbound.wolf.v1';
let state = {...fresh}, previous, timer;
try { Object.assign(state,JSON.parse(localStorage.getItem(key))); } catch {}
const pendingRolls = [];
function die(sides) {
 const value = Math.floor(Math.random()*sides)+1;
 pendingRolls.push({sides,value});
 return value;
}
const signed = n => n<0 ? String(n) : '+'+n;
const btn = (label,action,value='',cls='') => '<button class="'+cls+'" data-do="'+action+'" data-value="'+value+'">'+label+'</button>';
const icons = {
 explore:'<circle cx="12" cy="12" r="9"/><path d="m16 8-2.5 5.5L8 16l2.5-5.5z"/>',
 blade:'<path d="m5 19 3-3m-3-3 6 6m-4-5L18 3l3-1-1 4L10 17"/>',
 eye:'<path d="M2 12q10-14 20 0-10 14-20 0Z"/><circle cx="12" cy="12" r="3"/>',
 talk:'<path d="M4 4h16v12H9l-5 4zM8 8h8m-8 4h5"/>',
 trail:'<path d="m2 19 7-13 5 9 3-5 5 9zM7 10l2 2 2-2"/>',
 mask:'<path d="M3 6q9 4 18 0-1 14-9 15Q4 19 3 6Zm4 5 3 1m4 0 3-1m-8 5q3 3 6 0"/>',
 magic:'<path d="m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5z"/>',
 sound:'<path d="M3 10v4m4-8v12m5-16v20m5-16v12m4-8v4"/>',
 dice:'<path d="m12 2 9 6v9l-9 5-9-5V8zM3 8l9 5 9-5m-9 5v9"/>'
};
const icon = id => '<svg aria-hidden="true" viewBox="0 0 24 24">'+icons[id]+'</svg>';
const card = (name,sub,ico,action,value='') => '<button class="card" data-do="'+action+'" data-value="'+value+'"><span class="icon">'+icon(ico)+'</span><span><strong>'+name+'</strong><span class="sub">'+sub+'</span></span></button>';
const skills = {Acrobatics:3,'Animal Handling':2,Arcana:2,Athletics:0,Deception:4,History:1,Insight:2,Intimidation:7,Investigation:1,Medicine:2,Nature:1,Perception:5,Performance:4,Persuasion:5,Religion:1,'Sleight of Hand':3,Stealth:3,Survival:3};
const saves = {Strength:-1,Dexterity:4,Constitution:2,Intelligence:0,Wisdom:1,Charisma:5};
const tips = {Perception:'Look or listen for something hidden.',Survival:'Follow tracks or find shelter in the snow.',Intimidation:'Make the guard think twice.',Persuasion:'Win someone over with an honest offer.'};
const magic = {
 'Minor Illusion':[0,'Create a distraction','Within 30 ft, make a sound or a still image up to 5 ft across. It lasts 1 minute. Try footsteps behind a guard.'],
 Thaumaturgy:[0,'Make an impression','Within 30 ft, amplify your voice, flicker flames or swing an unlocked door.'],
 'Vicious Mockery':[0,'Spoil an enemy’s aim','One enemy within 60 ft that hears you makes a Wisdom save. On a failure, deal psychic damage and give it disadvantage on its next attack before its next turn ends.',4,1],
 'Dissonant Whispers':[1,'Drive one foe away','One creature within 60 ft makes a Wisdom save. Failure: psychic damage and it must use its reaction, if available, to move away. Success: half damage and it stays. A deafened creature succeeds.',6,3],
 Bane:[1,'Weaken up to three foes','Within 30 ft, each target makes a Charisma save. On a failure, it subtracts 1d4 from attacks and saves for up to 1 minute.',0,0,true],
 Thunderwave:[1,'Make space around you','Everyone in a 15-ft cube starting at you makes a Constitution save. Failure: thunder damage and a 10-ft push. Success: half damage and no push. Watch your allies.',8,2],
 'Faerie Fire':[1,'Light up hidden enemies','Choose a 20-ft cube within 60 ft. Creatures that fail a Dexterity save glow for up to 1 minute. Attacks against them have advantage if the attacker can see them.',0,0,true],
 Shatter:[2,'Strike a cluster of foes','Choose a point within 60 ft. Everyone within 10 ft makes a Constitution save. Deal thunder damage, half on a success. Allies can be hit.',8,3],
 Invisibility:[2,'Slip past a lookout','Touch one creature. It turns invisible for up to 1 hour. The spell ends if it attacks or casts a spell.',0,0,true]
};
function save(){try{localStorage.setItem(key,JSON.stringify(state))}catch{toast('This browser could not save your changes.')}render()}
function change(fn){previous={...state};fn();save()}
function toast(t){$('feedback').textContent=t;clearTimeout(timer);timer=setTimeout(()=>$('feedback').textContent='',3000)}
function modal(title,html){$('heading').textContent=title;$('body').innerHTML=diceTray(pendingRolls.splice(0))+html;dieReferences($('body'));if(!$('dialog').open)$('dialog').showModal();$('dialog').scrollTop=0}
function grid(items){return '<div class="grid">'+items.join('')+'</div>'}
function charges(left,max,label){
 return '<span class="charge" aria-label="'+left+' of '+max+' '+label+' remaining">'+left+'/'+max+'</span>';
}
const spellRange = {
 'Minor Illusion':'Up to 30 ft',
 Thaumaturgy:'Up to 30 ft',
 'Vicious Mockery':'Up to 60 ft · must hear you',
 'Dissonant Whispers':'Up to 60 ft',
 Bane:'Up to 30 ft',
 Thunderwave:'Close · 15-ft cube from you',
 'Faerie Fire':'Up to 60 ft · 20-ft cube',
 Shatter:'Up to 60 ft · 10-ft radius',
 Invisibility:'Touch'
};
function spells(names){
 const headings=['Cantrips · free to use','Level 1 spells','Level 2 spells'];
 return headings.map((heading,level)=>{
  const group=names.filter(n=>magic[n][0]===level);
  if(!group.length)return '';
  const badge=level===0?'':charges(level===1?state.first:state.second,level===1?4:2,'level '+level+' slots');
  return '<h3 class="magic-level">'+heading+' '+badge+'</h3>'+grid(group.map(n=>card(n,magic[n][1]+'<span class="range">'+spellRange[n]+'</span>',n==='Minor Illusion'?'mask':'magic','spell',n)));
 }).join('');
}
function row(k,v){return '<div class="row"><span>'+k+'</span><strong>'+v+'</strong></div>'}
function commonActions(){
 return `<section class="turn-options" aria-labelledby="turn-options-title">
 <h3 class="kicker" id="turn-options-title">Other ways to use your action</h3>
 <dl>
 <dt>Dash</dt><dd>Run farther. Move up to another 30 ft at your normal speed.</dd>
 <dt>Disengage</dt><dd>Back away safely. Enemies get no free attacks when you move this turn.</dd>
 <dt>Dodge</dt><dd>Take a defensive stance. Until your next turn, enemies you can see roll twice to hit you and take the lower roll. You take the higher roll on Dexterity saves.</dd>
 <dt>Help</dt><dd>Give an ally a hand. Ask the DM if they can roll twice and take the higher result.</dd>
 </dl></section>`;
}
function combatView(inspiration){
 const spellMenuOpen = document.querySelector('#combat-spells')?.open;
 const weapons = grid([
  card('Rapier strike','Melee · within 5 ft','blade','weapon','Rapier'),
  card('Dagger strike','Melee 5 ft · throw 20/60 ft','blade','weapon','Dagger')
 ]);
 const reactions = grid([
  card('Hellish Rebuke',state.rebuke?'When damaged · up to 60 ft':'Used · returns after a long rest','magic','rebuke'),
  card('Opportunity attack','When a foe leaves your 5-ft reach','blade','weapon','Opportunity')
 ]);
 return `<section class="combat-start" aria-label="Start of combat">
  <h3 class="kicker">Start of combat</h3>
  ${card('Roll initiative','Roll once to find your place in the turn order · +3','dice','skill','Initiative')}
 </section>
 <h2>Take your turn</h2>
 <p class="intro">You can move, take one action and use one bonus action, in any order.</p>
 <section class="turn-part" aria-label="Movement">
  <h3>Movement</h3><p>Move up to 30 ft. You can split the distance before and after your action.</p>
 </section>
 <section class="turn-part" aria-label="Action">
  <h3>Action</h3><p>Choose one.</p>
  <h4 class="kicker">Attack</h4>${weapons}
  <details class="turn-spells" id="combat-spells" ${spellMenuOpen?'open':''}><summary>Cast a spell</summary>
   <p class="slot-tip">Spells of the same level share uses.</p>
   ${spells(['Vicious Mockery','Minor Illusion','Thaumaturgy','Dissonant Whispers','Faerie Fire','Bane','Thunderwave','Shatter','Invisibility'])}
  </details>
  ${commonActions()}
 </section>
 <section class="turn-part" aria-label="Bonus action">
  <h3>Bonus action</h3><p>You may also inspire one ally this turn.</p>
  ${card(inspiration,'Within 60 ft · must hear you','sound','inspire')}
 </section>
 <section class="combat-reactions" aria-label="Reactions">
  <h3 class="kicker">Reactions</h3>${reactions}
 </section>
 <div class="foot">${btn('Saving throws','saves')}</div>`;
}
function render(){
 const exp=state.mode==='exploration';
 const inspiration='Inspire an ally '+charges(state.inspire,3,'inspiration uses');
 $('stats').innerHTML=btn('<span class="stat-label">Hit points</span><b>'+state.hp+' <small>/ 24</small></b><span class="hp-track"><i style="width:'+100*state.hp/24+'%"></i></span>','hp','','hp-stat')+
 '<div><span class="stat-label">Armour class</span><b>'+(13+state.armourBonus)+' <small>AC</small></b></div><div><span class="stat-label">Base speed</span><b>30 <small>ft</small></b></div>';
 document.querySelector('nav').dataset.active=state.mode;
 for(const m of ['exploration','combat']){$(m).setAttribute('aria-pressed',String(state.mode===m));$(m).innerHTML=icon(m==='combat'?'blade':'explore')+' '+(m==='combat'?'Combat':'Exploration')}
 $('quick').innerHTML=btn('Resources','resources')+btn('Rest','rest');
 $('actions').innerHTML=exp?'<h2>Explore the wilds</h2><p class="intro">Tell the DM what Wolf tries. Roll when asked.</p>'+grid([card('Look around','Perception · +5','eye','skill','Perception'),card('Talk it through','Persuasion · +5','talk','skill','Persuasion'),card('Track & navigate','Survival · +3','trail','skill','Survival'),card('Intimidate','Intimidation · +7','mask','skill','Intimidation')])+'<div class="foot">'+btn('All skill rolls','skills')+btn(inspiration,'inspire')+'</div><h3 class="kicker">Exploration magic</h3><p class="slot-tip">Spells of the same level share uses.</p>'+spells(['Minor Illusion','Thaumaturgy','Invisibility']):combatView(inspiration);
 $('vitals').innerHTML=(state.armourBonus?row('Flourish AC',13+state.armourBonus)+btn('My next turn','endac'):'')+row('Hit points',state.hp+' / 24')+'<div class="meter"><i style="display:block;width:'+state.hp/24*100+'%"></i></div>'+btn('Adjust HP','hp')+(state.hp===0?btn('Death saves','death'):'')+row('Spell slots · level 1',state.first+' / 4')+row('Spell slots · level 2',state.second+' / 2')+row('Inspiration',state.inspire+' / 3')+(state.focus?row('Concentrating',state.focus)+btn('End concentration','endfocus'):'')+'<div class="foot">'+btn('Rest','rest')+(previous?btn('Undo last change','undo'):'')+'</div>';
}
function rollCheck(name,bonus){const n=die(20);modal(name,'<div class="result"><strong class="rollval">'+(n+bonus)+'</strong>Die '+n+' '+signed(bonus)+'</div><p>Tell the DM your total.</p>')}
function spell(name){const [level,tip,desc,,,focus]=magic[name];let html='<p>'+desc+'</p>'+(level||name==='Vicious Mockery'?'<p class="muted">'+(name==='Invisibility'?'Touch · no roll':'The DM rolls the save against 13.')+'</p>':'');if(focus)html+='<p>Concentrate on one spell at a time.'+(state.focus?' Casting this ends '+state.focus+'.':'')+'</p>';if(!level)html+=btn('Cast for free','cast',name+'|0','primary');else for(let l=level;l<=2;l++){const left=l===1?state.first:state.second;html+=left?btn('Use level '+l+' slot · '+left+' left','cast',name+'|'+l,'primary'):'<p>No level '+l+' slots left.</p>'}modal(name,html)}
function damage(count,size,bonus=0){const rolls=Array.from({length:count},()=>die(size));return {total:rolls.reduce((a,b)=>a+b,bonus),detail:rolls.join(' + ')+(bonus?' + '+bonus:'')}}
function rollDamage(n,d,b,type){const r=damage(n,d,b);return '<div class="result"><strong class="rollval">'+r.total+'</strong>'+type+' damage · '+r.detail+'</div>'}
let lastHit=false;
function weapon(name){lastHit=false;const n=die(20);modal(name,'<div class="result"><strong class="rollval">'+(n+4)+'</strong>Attack roll · '+n+' + 4</div><p>'+(n===1?'Natural 1. You miss.':n===20?'Natural 20! Roll critical damage.':'Ask the DM if that hits.')+'</p>'+(n===1?'':btn('Roll damage','hit',name+'|'+(n===20?2:1),'primary'))+(name==='Dagger'?'<p class="hint">Throw up to 20 ft normally, or 60 ft with disadvantage. Damage assumes your dagger is your only wielded weapon.</p>':''))}
function adjustHp(delta){state.hp=Math.min(24,Math.max(0,state.hp+delta));if(state.hp>0){state.wins=0;state.fails=0;state.stable=false}else state.focus=''}
function death(){modal('At zero hit points',state.stable?'<p>Stable. Wait for healing.</p>':state.fails>=3?'<p>Three failed saves. Speak to the DM.</p>':'<p>At the start of your turn, roll a death save.</p>'+row('Successes',state.wins+' / 3')+row('Failures',state.fails+' / 3')+btn('Roll death save','deathroll','','primary'))}
function rest(){modal('Take a rest','<h3>Short rest · 1 hour</h3><p>Spend a Hit Die to heal. Song of Rest adds 1d6 once if Wolf performs and spends a die.</p>'+row('Hit Dice',state.dice+' / 3')+'<label>Dice to spend <input type="number" id="amount" min="1" max="'+state.dice+'" value="1"></label><label><input style="width:auto" type="checkbox" id="song" checked> Include Song of Rest</label><p>'+btn('Finish short rest','short')+'</p><h3>Long rest · 8 hours</h3><p>Recover all HP, spells, inspiration and one spent Hit Die. Start with at least 1 HP.</p>'+btn('Finish long rest','long'))}
function showProfile(){modal('Wolf Vargan','<p class="title">“No one decides what I become.”</p><p>Wolfie to his friends. A playful, fiercely loyal tiefling hunting the cult that awakened something ancient in him.</p>'+row('Level 3 bard','College of Swords')+row('Background','Haunted One')+row('Armour class',(13+state.armourBonus)+' · leather')+row('Speed','30 ft')+row('Passive Perception','15')+row('Darkvision','60 ft · grey in darkness')+row('Fire damage','Take half')+row('Spell save / attack','13 / +5')+row('Proficiency','+2')+'<details class="block"><summary>Ability scores &amp; build</summary><p>STR 8 · DEX 14 · CON 14 · INT 10 · WIS 12 · CHA 17</p><p>2014 bard, fixed HP, infernal tiefling. Dueling gives +2 damage with a one-handed melee weapon when no other weapon is wielded. Expertise in Intimidation and Perception. Additional trained skill: Persuasion.</p><p>Wolf can wear medium armour and use a proficient melee weapon as his bard spellcasting focus.</p></details>'+btn('Saving throws','saves'))}
function action(op,value){
 switch(op){
 case 'resources':modal('Resources',row('Level 1 spell slots',state.first+' / 4')+row('Level 2 spell slots',state.second+' / 2')+row('Inspiration',state.inspire+' / 3')+row('Hellish Rebuke',state.rebuke?'Ready':'Used')+row('Hit Dice',state.dice+' / 3')+row('Concentration',state.focus||'None')+row('Armour class',13+state.armourBonus)+(state.armourBonus?btn('My next turn','endac'):'')+(state.focus?btn('End concentration','endfocus'):'')+(previous?btn('Undo last change','undo'):''));break;
 case 'endac':change(()=>state.armourBonus=0);if($('dialog').open)$('dialog').close();break;
 case 'profile':showProfile();break;
 case 'close':$('dialog').close();break;
 case 'skills':case 'saves':{const list=op==='skills'?skills:saves;modal(op==='skills'?'Skill checks':'Saving throws','<p>Tap the roll your DM asks for.</p><div class="compact">'+Object.entries(list).map(([s,b])=>btn(s+' '+signed(b),op==='skills'?'skill':'save',s)).join('')+'</div>');break}
 case 'skill':case 'save':rollCheck(value,value==='Initiative'?3:(op==='save'?saves:skills)[value]);break;
 case 'spell':spell(value);break;
 case 'cast':{const [n,l]=value.split('|'),level=Number(l),pool=level===1?'first':'second';
 const [base,,desc,size,count,focus]=magic[n];if(level&&!state[pool])return spell(n);
 if(level)change(()=>{state[pool]--;if(focus)state.focus=n});
 modal(n,'<p>'+desc+'</p>'+(size?rollDamage(count+(base?level-base:0),size,0,n==='Thunderwave'||n==='Shatter'?'Thunder':'Psychic'):'')+(focus?'<p>Concentration started.</p>':'')+(level?'<p>Level '+level+' slots left: '+state[pool]+'.</p>':'')+btn('Done','close'));break}
 case 'weapon':weapon(value);break;
 case 'hit':{const [n,m]=value.split('|');lastHit=true;modal(n,rollDamage(Number(m),n==='Dagger'?4:8,4,'Piercing')+(n==='Opportunity'?'':'<p>Taking the Attack action gives you 10 ft extra speed this turn. Once on a hit, you may spend inspiration for a flourish.</p>'+btn('Choose a flourish '+charges(state.inspire,3,'inspiration uses'),'flourishes',m)));break}
 case 'flourishes':modal('Blade Flourish',state.inspire&&lastHit?'<p>Spend one inspiration. Pick one effect.</p>'+['Defensive','Slashing','Mobile'].map(n=>btn(n,'flourish',n+'|'+value)).join(''):'<p>No flourish available.</p>');break;
 case 'flourish':{if(!state.inspire||!lastHit)return;lastHit=false;const [n,m]=value.split('|'),r=die(6),extra=m==='2'?die(6):0;
 change(()=>{state.inspire--;if(n==='Defensive')state.armourBonus=r});modal(n+' Flourish','<p>Add <b>'+(r+extra)+'</b> damage to the hit.</p><p>'+({Defensive:'Your armour class is '+(13+r)+' until your next turn.',Slashing:'Deal '+r+' damage to any other creatures you choose within 5 ft of you.',Mobile:'Push the target up to '+(5+r)+' ft away. You may use your reaction to move up to your speed to a space within 5 ft of it.'}[n])+'</p>');break}
 case 'inspire':modal('Inspire an ally','<p>Pick a companion within 60 ft who can hear you. Say “Trust me. You’ve got this.”</p><p>Within 10 minutes, they can add 1d6 to one attack, check or save after rolling, before the result is announced.</p>'+ (state.inspire?btn('Give inspiration · '+state.inspire+' left','give','','primary'):'<p>Out of inspiration. A long rest restores it.</p>'));break;
 case 'give':if(state.inspire){change(()=>state.inspire--);modal('Ally inspired','<p>Tell them they have a d6 to use within 10 minutes.</p>')}break;
 case 'rebuke':modal('Hellish Rebuke','<p>When a creature you can see within 60 ft damages you, use your reaction. It makes a Dexterity save against 13. Deal 3d10 fire damage, half on a success.</p>'+(state.rebuke?btn('Use infernal magic · 1/1','burn','','primary'):'<p>Used. Returns after a long rest.</p>'));break;
 case 'burn':if(state.rebuke){change(()=>state.rebuke=0);modal('Hellish Rebuke',rollDamage(3,10,0,'Fire')+'<p>Halve the total if the target saves.</p>')}break;
 case 'hp':modal('Adjust hit points',row('Current HP',state.hp+' / 24')+'<p><label>Amount <input id="amount" type="number" inputmode="numeric" min="1" step="1" required></label></p>'+btn('Take damage','damage')+btn('Heal','heal'));break;
 case 'damage':case 'heal':{const amount=Number($('amount').value);if(!Number.isSafeInteger(amount)||amount<1)return $('amount').reportValidity();const focus=state.focus;change(()=>adjustHp(op==='heal'?amount:-amount));if(op==='damage'&&focus&&state.hp){const dc=Math.max(10,Math.floor(amount/2));modal('Hold concentration','<p>Taking damage could end '+focus+'. Make a Constitution save against '+dc+'.</p>'+btn('Roll to keep spell','hold',String(dc),'primary'))}else{$('dialog').close();toast('Hit points: '+state.hp+' / 24')}break}
 case 'hold':{const n=die(20)+2;if(n<Number(value))change(()=>state.focus='');modal('Concentration save','<p>You rolled '+n+'. '+(n>=Number(value)?'Your spell continues.':'Your spell ends.')+'</p>');break}
 case 'endfocus':change(()=>state.focus='');if($('dialog').open)$('dialog').close();break;
 case 'death':death();break;
 case 'deathroll':{const n=die(20);change(()=>{if(n===20)adjustHp(1);else if(n>=10)state.wins++;else state.fails=Math.min(3,state.fails+(n===1?2:1));if(state.wins===3)state.stable=true});modal('Death save','<p>You rolled '+n+'. '+(state.hp?'Wolf wakes with 1 HP.':state.stable?'Wolf is stable.':state.fails>=3?'Three failures. Speak to the DM.':state.wins+' successes · '+state.fails+' failures.')+'</p>');break}
 case 'rest':rest();break;
 case 'short':{const count=Number($('amount').value);if(!Number.isInteger(count)||count<1||count>state.dice||!state.hp)return modal('Short rest','<p>'+(!state.hp?'Wolf needs healing first.':'Choose a number of available Hit Dice.')+'</p>'+btn('Back','rest'));const heal=damage(count,8,count*2).total+($('song').checked?die(6):0),old=state.hp;change(()=>{state.dice-=count;adjustHp(heal)});modal('Rest complete','<p>Recovered '+(state.hp-old)+' HP. '+state.dice+' Hit Dice left.</p>');break}
 case 'long':if(!state.hp)return modal('Long rest','<p>Wolf needs at least 1 HP to benefit.</p>');change(()=>Object.assign(state,{...fresh,notes:state.notes,mode:state.mode,dice:Math.min(3,state.dice+1)}));modal('Rest complete','<p>Wolf has full HP, spell slots, inspiration and infernal magic.</p>');break;
 case 'undo':if(previous){const notes=state.notes,mode=state.mode;state={...previous,notes,mode};previous=null;save();if($('dialog').open)$('dialog').close();toast('Last change undone.')}break;
 }
}
document.addEventListener('click',event=>{const b=event.target.closest('button');if(!b)return;if(b.dataset.mode){if(state.mode===b.dataset.mode)return;state.mode=b.dataset.mode;save();if(!matchMedia('(prefers-reduced-motion: reduce)').matches)$('actions').animate([{opacity:.5,transform:'translateX('+(state.mode==='combat'?10:-10)+'px)'},{opacity:1,transform:'none'}],{duration:220,easing:'ease-out'})}else action(b.dataset.do,b.dataset.value)});
$('notes').value=state.notes;
$('notes').addEventListener('input',e=>{state.notes=e.target.value;save()});
$('dialog').addEventListener('click',e=>{if(e.target===$('dialog')){const box=$('dialog').getBoundingClientRect();if(e.clientX<box.left||e.clientX>box.right||e.clientY<box.top||e.clientY>box.bottom)$('dialog').close()}});
render();
