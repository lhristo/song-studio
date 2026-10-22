'use strict';
const $ = id => document.getElementById(id);
const fields = ['title','idea','language','genre','mood','voice','visual'];
const fresh = () => ({title:'',idea:'',language:'English',genre:'',mood:'',voice:'Warm female vocals',visual:'',lyrics:'',approved:null,audio:null,image:null});
let state=fresh(), db, timer, toastTimer, audioUrl='', imageUrl='', saveQueue=Promise.resolve();
function toast(message){ $('toast').textContent=message; $('toast').hidden=false; clearTimeout(toastTimer); toastTimer=setTimeout(()=>$('toast').hidden=true,5000); }
function persist(){
 clearTimeout(timer); $('save-status').textContent='Saving…';
 timer=setTimeout(()=>{const snapshot=structuredClone(state); saveQueue=saveQueue.catch(()=>{}).then(()=>new Promise((resolve,reject)=>{
 if(!db){reject(new Error('Storage unavailable'));return;}
 const tx=db.transaction('projects','readwrite');tx.objectStore('projects').put(snapshot,'current');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
 })).then(()=>{$('save-status').textContent='Saved in this browser';}).catch(()=>{$('save-status').textContent='Not saved — export your work';toast('Browser storage failed. Keep copies of your lyrics and original media.');});},200);
}
function instrumental(){return state.voice.startsWith('Instrumental');}
function render(){
 const title=state.title.trim()||'Untitled song';
 const brief=`Title: ${title}\nIdea: ${state.idea||'An original story of hope'}\nLanguage: ${state.language}\nStyle: ${state.genre||'Choose a fitting original style'}\nMood: ${state.mood||'Expressive'}\nVocals: ${state.voice}`;
 $('lyrics-prompt').value=instrumental()?'This project is instrumental. No lyrics are needed; continue to music.':`Write original song lyrics using this brief. Write all sung lyrics only in ${state.language}. Use clear verse, chorus and bridge sections. Do not copy existing songs. Return the lyrics for me to review.\n\n${brief}`;
 $('music-prompt').value=`${state.genre||'Original contemporary music'}; ${state.mood||'expressive'}; ${state.voice}. ${instrumental()?'No singing, spoken words or lyrics.':`Sing in ${state.language}; use the separately supplied approved lyrics.`}\nTheme: ${state.idea||title}`;
 $('music-lyrics').value=instrumental()?'':(state.approved===state.lyrics?state.lyrics:'');
 $('approval-note').textContent=instrumental()?'Instrumental selected — skip lyrics and continue to music.':state.approved===state.lyrics?'Lyrics approved. Editing them or the brief requires approval again.':'Review and approve your lyrics before using them for the song.';
 $('approve').disabled=instrumental()||!state.lyrics.trim();
 $('music-warning').textContent=instrumental()?'Use instrumental mode in the music service.':state.approved===state.lyrics?'Your approved lyrics are ready below.':'Lyrics are not approved yet. Return to The words to review them.';
 $('art-prompt').value=`Create an original 16:9 background illustration for a song called “${title}”.\nStory: ${state.idea||'A personal musical journey'}\nMood: ${state.mood||'Expressive'}\nVisual direction: ${state.visual||'Cinematic atmosphere, thoughtful composition and evocative lighting'}\nMusical style: ${state.genre||'Contemporary'}\nNo lettering, logos or watermarks. Leave space near the bottom for a title overlay.`;
 $('preview-title').textContent=title; $('preview-style').textContent=[state.genre,state.mood].filter(Boolean).join(' · ')||'Your sound starts here.';
 $('preview-missing').textContent=state.audio&&state.image?'Ready to preview. Press play to listen with your artwork.':`Still needed: ${[!state.audio&&'audio',!state.image&&'artwork'].filter(Boolean).join(' and ')}. Upload these in The sound and The scene.`;
 $('download-audio').disabled=!state.audio; $('download-art').disabled=!state.image;
 $('download-lyrics').disabled=!state.lyrics.trim();
}
function media(){
 for(const id of ['audio-check','player']){$(id).pause();$(id).removeAttribute('src');$(id).hidden=!state.audio;}
 if(audioUrl)URL.revokeObjectURL(audioUrl);if(imageUrl)URL.revokeObjectURL(imageUrl);
 audioUrl=state.audio?URL.createObjectURL(state.audio.blob):'';imageUrl=state.image?URL.createObjectURL(state.image.blob):'';
 for(const id of ['audio-check','player']){if(audioUrl)$(id).src=audioUrl;$(id).load();}
 for(const id of ['image-check','cover-image']){$(id).hidden=!state.image;if(imageUrl)$(id).src=imageUrl;else $(id).removeAttribute('src');}
 $('audio-info').textContent=state.audio?`${state.audio.name} · ${(state.audio.blob.size/1048576).toFixed(1)} MB`:'No audio uploaded · maximum 40 MB';
 $('image-info').textContent=state.image?state.image.name:'No artwork uploaded';
}
function navigate(step){document.querySelectorAll('.panel').forEach(p=>p.hidden=p.id!==step);document.querySelectorAll('[data-step]').forEach(b=>{if(b.dataset.step===step)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');});const heading=$(step).querySelector('h2');heading.tabIndex=-1;heading.focus({preventScroll:true});}
function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}
const filename=()=> (state.title.trim()||'my-song').replace(/[^\p{L}\p{N} _-]/gu,'').slice(0,100)||'my-song';
async function upload(kind,file){
 if(!file)return;
 const limit=kind==='audio'?40:10;
 try{
 if(file.size>limit*1048576||!file.size)throw new Error(`Choose a nonempty file smaller than ${limit} MB.`);
 if(kind==='image'){
 if(!['image/png','image/jpeg','image/webp'].includes(file.type))throw new Error('Choose a PNG, JPEG or WebP image.');
 const bitmap=await createImageBitmap(file);bitmap.close();
 }else{
 if(!file.type.startsWith('audio/')&&!/\.(mp3|wav|m4a|ogg|flac)$/i.test(file.name))throw new Error('Choose an audio file.');
 const url=URL.createObjectURL(file);
 try{await new Promise((resolve,reject)=>{const audio=new Audio();const timeout=setTimeout(()=>{audio.src='';reject(new Error('Audio could not be read. Try WAV or MP3.'));},10000);audio.onloadedmetadata=()=>{clearTimeout(timeout);audio.src='';resolve();};audio.onerror=()=>{clearTimeout(timeout);reject(new Error('This browser cannot play that audio file. Try WAV or MP3.'));};audio.src=url;});}finally{URL.revokeObjectURL(url);}
 }
 state[kind]={blob:file,name:file.name};media();render();persist();toast(`${kind==='audio'?'Audio':'Artwork'} added.`);
 }catch(error){toast(error.message||'The file could not be read.');}
}
async function init(){
 const controls=[...document.querySelectorAll('button,input,textarea,select')];controls.forEach(c=>c.disabled=true);
 try{
 db=await new Promise((resolve,reject)=>{const req=indexedDB.open('verse-frame',1);req.onupgradeneeded=()=>req.result.createObjectStore('projects');req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});
 const saved=await new Promise((resolve,reject)=>{const r=db.transaction('projects').objectStore('projects').get('current');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
 if(saved)state={...fresh(),...saved};$('save-status').textContent='Saved locally · this browser only';
 }catch{$('save-status').textContent='Storage unavailable — session only';}
 controls.forEach(c=>c.disabled=false);
 fields.forEach(id=>{$(id).value=state[id];$(id).addEventListener('input',()=>{state[id]=$(id).value;state.approved=null;render();persist();});});
 $('lyrics-text').value=state.lyrics;
 $('lyrics-text').addEventListener('input',()=>{state.lyrics=$('lyrics-text').value;state.approved=null;render();persist();});
 $('approve').onclick=()=>{if(state.lyrics.trim()){state.approved=state.lyrics;render();persist();toast('Lyrics approved.');}};
 document.querySelectorAll('[data-step]').forEach(b=>b.onclick=()=>navigate(b.dataset.step));
 document.querySelectorAll('[data-next]').forEach(b=>b.onclick=()=>navigate(b.dataset.next));
 document.querySelectorAll('[data-copy]').forEach(b=>b.onclick=async()=>{const source=$(b.dataset.copy);try{if(!source.value)throw new Error();await navigator.clipboard.writeText(source.value);toast('Copied to clipboard.');}catch{source.focus();source.select();toast('Select and copy the text manually with Command+C or Ctrl+C.');}});
 $('audio-file').onchange=e=>upload('audio',e.target.files[0]);$('image-file').onchange=e=>upload('image',e.target.files[0]);
 $('player').onplay=()=>$('audio-check').pause();$('audio-check').onplay=()=>$('player').pause();
 $('download-audio').onclick=()=>state.audio&&download(state.audio.blob,state.audio.name);
 $('download-art').onclick=()=>state.image&&download(state.image.blob,state.image.name);
 $('download-lyrics').onclick=()=>download(new Blob([state.lyrics],{type:'text/plain;charset=utf-8'}),filename()+'-lyrics.txt');
 $('export-brief').onclick=()=>{const {audio,image,...brief}=state;download(new Blob([JSON.stringify({...brief,exportedAt:new Date().toISOString(),mediaNote:'Media not included. Download audio and artwork separately.'},null,2)],{type:'application/json'}),filename()+'-brief.json');};
 $('reset').onclick=()=>{if(!confirm('Start a new project? This replaces the project saved in this browser. Export any work you want to keep first.'))return;state=fresh();fields.forEach(id=>$(id).value=state[id]);$('lyrics-text').value='';$('audio-file').value='';$('image-file').value='';media();render();persist();navigate('brief');};
 media();render();
}
init();
