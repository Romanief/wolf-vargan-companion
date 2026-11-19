// Visible faces of each polyhedron, ordered from its front face to its side facets.
const dieFaces = {
  4: ['5,52 30,5 43,48','30,5 56,49 43,48','5,52 43,48 56,49'],
  6: ['5,16 32,21 32,55 5,45','5,16 27,5 55,11 32,21','32,21 55,11 55,42 32,55'],
  8: ['4,26 33,17 31,55','4,26 29,3 33,17','29,3 55,25 33,17','33,17 55,25 31,55'],
  10:['8,18 29,10 42,34 19,42','8,18 31,3 29,10','31,3 54,22 42,34 29,10','54,22 32,56 42,34','19,42 42,34 32,56','8,18 19,42 32,56 4,34'],
  20:['12,16 48,16 30,45','30,3 48,16 12,16','3,36 12,16 30,45','48,16 57,36 30,45','3,36 30,45 30,57','30,45 57,36 30,57']
};
function dieShape(sides) {
  const tones = ['#dfe5e9','#f9fbfc','#888f98','#aeb7be','#6a737c','#c3cbd0'];
  const faces = dieFaces[sides].map((points,i) =>
    '<polygon points="'+points+'" fill="'+tones[i]+'"/>'
  ).join('');
  return '<svg aria-hidden="true" viewBox="0 0 60 60" stroke="#394149" stroke-width="1.5" stroke-linejoin="round">'+faces+'</svg>';
}
function diceTray(rolls) {
  if (!rolls.length) return '';
  return '<div class="dice-tray">'+rolls.map(({sides,value}) =>
    '<div class="rolled" aria-label="d'+sides+' rolled '+value+'"><span class="tumble">'+dieShape(sides)+'<b class="face face-'+sides+'">'+value+'</b></span><small>d'+sides+'</small></div>'
  ).join('')+'</div>';
}
function dieReferences(container) {
  const walker=document.createTreeWalker(container,NodeFilter.SHOW_TEXT);
  const nodes=[];
  while(walker.nextNode()) if(!walker.currentNode.parentElement.closest('.dice-tray')) nodes.push(walker.currentNode);
  for(const node of nodes){
    const parts=node.data.split(/(\b\d*d(?:20|10|8|6|4)\b)/gi);
    if(parts.length===1) continue;
    const fragment=document.createDocumentFragment();
    parts.forEach((part,i)=>{
      if(i%2===0){fragment.append(part);return}
      const ref=document.createElement('span');
      ref.className='die-ref';
      ref.innerHTML=dieShape(Number(part.toLowerCase().split('d')[1]));
      ref.append(part);
      fragment.append(ref);
    });
    node.replaceWith(fragment);
  }
}
