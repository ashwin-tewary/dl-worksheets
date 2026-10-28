const fs=require('node:fs'),path=require('node:path'),S=require('./scenes.js'),stories=require('./storyboards.js');
const dir=path.join(__dirname,'assets');fs.mkdirSync(dir,{recursive:true});
const options={qx:1,qy:0,length:8,retention:.5,method:'dot',temperature:1,mask:false,teacher:true,target:0};
let guide='# Animation storyboards\n\nSix beats per lesson. Beat 3 is an automatic prediction stop; Continue reveals the next operation. No autoplay on page load. Play/pause, back, next, replay, speed, scrub and SVG download are available in every player. Reduced motion advances stable steps.\n\n';
let cards='';
for(const [key,story] of Object.entries(stories)){
 fs.writeFileSync(path.join(dir,key+'.svg'),S.render(key,5,1,options));
 cards+=`<figure><h2>${story.title}</h2><a href="${key}.svg"><img src="${key}.svg" alt="${story.title}" width="780" height="515"></a><figcaption>${story.note} <a href="${key}.svg" download>Download original SVG</a></figcaption></figure>`;
 guide+=`## ${story.title}\n\n${story.note}\n\n`;
 for(const [i,step] of story.steps.entries())guide+=`${i+1}. **${step.title}${step.checkpoint?' — PREDICTION STOP':''}.** ${step.narration}\n   Formula: ${step.equation}\n\n`;
}
fs.writeFileSync(path.join(dir,'gallery.html'),`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Encoder–decoder & attention · Teaching figures</title><link rel="stylesheet" href="../styles.css"></head><body><main class="gallery-page"><a href="../index.html">← Return to worksheet</a><span class="step-label">ORIGINAL TEACHING FIGURES / FIVE REUSABLE SVGs</span><h1>Follow the information.</h1><p>These original figures use explicit teaching values and the worksheet’s numerical model. Download a figure for slides, or download any current frame inside the worksheet. Source attribution for the underlying methods is on the worksheet.</p><div class="gallery-grid">${cards}</div></main></body></html>`);
fs.writeFileSync(path.join(__dirname,'storyboard-guide.md'),guide.trimEnd()+'\n');
console.log('Generated five original SVG figures, gallery and storyboard guide.');
