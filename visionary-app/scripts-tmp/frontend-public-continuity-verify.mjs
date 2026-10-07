import {chromium} from 'playwright-core';
import sharp from 'sharp';
import assert from 'node:assert/strict';

const browser=await chromium.launch({channel:'msedge',headless:true});
const routes=['/','/student','/teacher','/parent','/professional','/organization','/pricing','/privacy','/login'];
try{
 for(const width of [390,1440])for(const route of routes){
  const pixels=[];
  for(const [version,base] of [['before','http://127.0.0.1:4251'],['after','http://127.0.0.1:4252']]){
   const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
   const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(String(error)));
   // Keep the authored hero at the same first headline in both builds. Only
   // the documented 2800ms headline cycle is frozen; layout timers still run.
   await context.addInitScript(()=>{
    const interval=window.setInterval.bind(window);
    window.setInterval=(callback,delay,...args)=>delay===2800?0:interval(callback,delay,...args);
   });
   await page.goto(base+route,{waitUntil:'networkidle'});
   await page.evaluate(()=>document.fonts.ready);
   await page.waitForFunction(()=>[...document.images].filter(img=>{const box=img.getBoundingClientRect();return box.width>0&&box.height>0&&box.top<innerHeight&&box.bottom>0;}).every(img=>img.complete));
   const buffer=await page.screenshot({path:`scripts-tmp/public-continuity-${route.slice(1)||'home'}-${width}-${version}.png`,animations:'disabled'});
   pixels.push(await sharp(buffer).ensureAlpha().raw().toBuffer());
   assert.deepEqual(errors,[],`${route} ${width} ${version} page errors`);
   await context.close();
  }
  assert.equal(pixels[0].length,pixels[1].length);
  let changed=0;for(let i=0;i<pixels[0].length;i+=4)if(pixels[0][i]!==pixels[1][i]||pixels[0][i+1]!==pixels[1][i+1]||pixels[0][i+2]!==pixels[1][i+2])changed++;
  console.log(JSON.stringify({route,width,changedPixels:changed,totalPixels:pixels[0].length/4}));
  assert.equal(changed,0,`${route} ${width} public output changed`);
 }
 console.log('PASS 18 same-data public/auth viewport comparisons; unchanged pixels; no page errors. Scope: this internal patch against the pre-patch production dist, not historical public-team approval.');
}finally{await browser.close();}
