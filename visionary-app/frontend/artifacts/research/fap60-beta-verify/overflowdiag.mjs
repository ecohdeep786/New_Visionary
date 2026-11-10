import { chromium } from 'playwright-core';
const [route, width] = process.argv.slice(2);
const b = await chromium.launch({ channel:'msedge', headless:true, args:['--no-proxy-server'] });
const c = await b.newContext({ viewport:{width:Number(width)||390,height:900}, reducedMotion:'reduce' });
const p = await c.newPage();
await p.goto('http://127.0.0.1:4197'+route, { waitUntil:'networkidle', timeout:60000 });
await p.waitForTimeout(1500);
const offenders = await p.evaluate(()=>{
  const w=document.documentElement.clientWidth;
  const bad=[];
  for(const el of document.querySelectorAll('#main *')){
    const r=el.getBoundingClientRect();
    if(r.width>w+1 || r.right>w+1 || r.left<-1){
      const cs=getComputedStyle(el);
      bad.push({tag:el.tagName, cls:String(el.className).slice(0,70), w:Math.round(r.width), left:Math.round(r.left), right:Math.round(r.right), overflowX:cs.overflowX, pos:cs.position});
      if(bad.length>=12) break;
    }
  }
  return {vw:w, mainScroll:document.querySelector('#main').scrollWidth, bad};
});
console.log(JSON.stringify(offenders,null,1));
await b.close();
