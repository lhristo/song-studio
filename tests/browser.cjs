const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true});const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4210');await page.waitForFunction(()=>!document.querySelector('#title').disabled);
 await page.fill('#title','Sofia at night');await page.fill('#idea','Coming home');await page.selectOption('#language','Bulgarian');await page.fill('#genre','Dream pop');
 await page.click('[data-step="lyrics"]');assert.match(await page.inputValue('#lyrics-prompt'),/only in Bulgarian/);
 await page.fill('#lyrics-text','Завръщам се у дома');await page.click('#approve');await page.click('[data-step="music"]');assert.equal(await page.inputValue('#music-lyrics'),'Завръщам се у дома');
 const wav=Buffer.alloc(44+16000);wav.write('RIFF');wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(8000,24);wav.writeUInt32LE(16000,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(16000,40);
 await page.setInputFiles('#audio-file',{name:'test.wav',mimeType:'audio/wav',buffer:wav});await page.waitForFunction(()=>document.querySelector('#audio-info').textContent.includes('test.wav'));
 await page.click('[data-step="art"]');
 const png=Buffer.from(await page.evaluate(()=>{const c=document.createElement('canvas');c.width=800;c.height=450;const x=c.getContext('2d');x.fillStyle='#335647';x.fillRect(0,0,800,450);return c.toDataURL('image/png').split(',')[1];}),'base64');
 await page.setInputFiles('#image-file',{name:'cover.png',mimeType:'image/png',buffer:png});await page.waitForFunction(()=>document.querySelector('#image-info').textContent==='cover.png');
 await page.setInputFiles('#image-file',{name:'broken.png',mimeType:'image/png',buffer:Buffer.from('not an image')});await page.waitForTimeout(300);assert.equal(await page.textContent('#image-info'),'cover.png');
 await page.click('[data-step="preview"]');assert.match(await page.textContent('#preview-missing'),/Ready to preview/);
 await page.waitForFunction(()=>document.querySelector('#save-status').textContent==='Saved in this browser');await page.reload();await page.waitForFunction(()=>!document.querySelector('#title').disabled);assert.equal(await page.inputValue('#title'),'Sofia at night');
 await page.click('[data-step="preview"]');assert.match(await page.textContent('#preview-missing'),/Ready/);
 const downloadPromise=page.waitForEvent('download');await page.click('#download-audio');assert.equal((await downloadPromise).suggestedFilename(),'test.wav');
 await page.screenshot({path:'/tmp/song-studio-desktop.png',fullPage:true});
 await page.click('[data-step="lyrics"]');await page.fill('#lyrics-text','Changed');await page.click('[data-step="music"]');assert.equal(await page.inputValue('#music-lyrics'),'');
 await page.click('[data-step="brief"]');await page.selectOption('#voice','Instrumental — no vocals');await page.click('[data-step="music"]');assert.match(await page.inputValue('#music-prompt'),/No singing/);
 await page.setViewportSize({width:375,height:812});for(const step of ['brief','lyrics','music','art','preview']){await page.click(`[data-step="${step}"]`);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow ${step}`);}
 await page.screenshot({path:'/tmp/song-studio-mobile.png',fullPage:true});
 page.once('dialog',d=>d.dismiss());await page.click('#reset');assert.equal(await page.inputValue('#title'),'Sofia at night');page.once('dialog',d=>d.accept());await page.click('#reset');assert.equal(await page.inputValue('#title'),'');
 await page.waitForFunction(()=>document.querySelector('#save-status').textContent==='Saved in this browser');await page.reload();await page.waitForFunction(()=>!document.querySelector('#title').disabled);assert.equal(await page.inputValue('#title'),'');assert.equal(await page.textContent('#image-info'),'No artwork uploaded');assert.deepEqual(errors,[]);
 await browser.close();console.log('PASS: prompts, approval, instrumental, media validation, persistence, exports, reset, mobile overflow, no JS errors');
})().catch(e=>{console.error(e);process.exit(1)});
