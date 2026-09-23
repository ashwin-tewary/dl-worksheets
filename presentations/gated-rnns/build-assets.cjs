const fs=require('node:fs'),path=require('node:path'),S=require('./scenes.js'),stories=require('./storyboards.js');
const defaults={recap:{weight:.5},lstm:{previous:.8,forget:.75,input:.5,candidate:.4,output:.6},highway:{links:20,forget:.95},gru:{previous:.8,x:.2,reset:.5,update:.75},bidirectional:{ending:'river',mode:'complete'}};
const dir=path.join(__dirname,'assets');fs.mkdirSync(dir,{recursive:true});
let gallery='<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Gated RNNs · Visual asset gallery</title><link rel="stylesheet" href="../styles.css"></head><body><main class="gallery-page"><a href="../">← Interactive lecture worksheet</a><h1>Keep the clue.<br><em>Five visual explanations.</em></h1><p>Original SVG teaching assets. These are final frames; the worksheet animates the steps with prediction pauses. Numbers are supplied examples, not trained predictions.</p><div class="gallery-grid">';
let guide='# Gated RNNs · planned animation storyboards\n\nEach animation follows a fixed narrative. Controls: play/pause, back/next, replay, speed, scrub, beat selection and SVG export. Beat 4 pauses before calculation results; Continue resumes. Reduced-motion users get stable steps. No animation autoplays on page load.\n\n';
Object.entries(stories).forEach(([key,story],i)=>{
 const name=`${String(i+1).padStart(2,'0')}-${key}.svg`;
 fs.writeFileSync(path.join(dir,name),S.render(key,story.steps.length-1,1,defaults[key]));
 gallery+=`<figure><h2>${story.title}</h2><img src="${name}" alt="${story.title}: final numerical diagram"><figcaption>${story.note}</figcaption><a href="${name}" download>Download SVG</a> · <a href="../#${key}">Open interactive lesson</a></figure>`;
 guide+=`## ${i+1}. ${story.title}\n\n${story.subtitle}\n\n${story.note}\n\n`+story.steps.map((s,j)=>`${j+1}. **${s.title}${s.checkpoint?' — PREDICTION PAUSE':''}.** ${s.narration}${s.equation?' Rule: '+s.equation:''}`).join('\n')+'\n\n';
});
fs.writeFileSync(path.join(dir,'gallery.html'),gallery+'</div></main></body></html>');
fs.writeFileSync(path.join(__dirname,'storyboard-guide.md'),guide);
console.log('Generated five SVG assets, gallery and storyboard guide.');
