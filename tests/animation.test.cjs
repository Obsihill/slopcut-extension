const {test, before, after} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require('playwright');
const root = path.resolve(__dirname,'../extension');
const markets = require('./marketplace-fixtures.cjs');
let browser;
for (const site of ['cgtrader','fab','turbosquid']) {
  for (const detail of [false,true]) test(`${site} browser: ${detail?'detail animates then returns':'same-seller cards dissolve and grid fills without navigation'}`,async t=>{
    const context=await browser.newContext({viewport:{width:1100,height:700}});t.after(()=>context.close());
    const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));t.after(()=>assert.deepEqual(errors,[]));
    await page.route('**/*',route=>{
      if(new URL(route.request().url()).pathname.endsWith('/previews'))return route.fulfill({contentType:'text/html',body:markets.preview(route.request().url().includes('/2/')?'other-seller':'sample-seller')});
      return route.fulfill({contentType:'text/html',body:`<!doctype html><html><head><style>body{margin:20px;font:14px Arial}#results{display:grid;grid-template-columns:repeat(3,240px);gap:14px}#results>div{border:1px solid gray;background:#eee}img{width:240px;height:150px}.fabkit-Stack--column{display:flex;flex-direction:column}main>img{width:400px;height:250px}</style></head><body>${detail?markets.detail(site):`<main><h1>Results</h1><div id="results">${markets.card(site)}${markets.card(site,'other-seller',2)}${markets.card(site,'sample-seller',3)}</div></main>`}</body></html>`});
    });
    await page.goto(detail?markets.details[site]:markets.urls[site]);
    await page.evaluate(()=>{
      const listeners=[];window.__state={blocked:[],enabled:true,sitesEnabled:{cgtrader:true,fab:true,turbosquid:true}};window.__back=0;
      history.pushState({},'',location.href);history.back=()=>window.__back++;
      window.chrome={storage:{local:{get:async()=>({state:window.__state})},onChanged:{addListener:f=>listeners.push(f)}},runtime:{sendMessage:async m=>{
        window.__state={...window.__state,blocked:[...window.__state.blocked,m.publisher]};listeners.forEach(f=>f({state:{newValue:window.__state}},'local'));return {ok:true,state:window.__state};
      }}};
    });
    await page.addStyleTag({path:path.join(root,'content.css')});
    for(const file of JSON.parse(fs.readFileSync(path.join(root,'manifest.json'),'utf8')).content_scripts[0].js)await page.addScriptTag({path:path.join(root,file)});
    const selector=detail?'main > div > .asb-button':'#card-1 .asb-button';await page.waitForSelector(selector);
    if(!detail)await page.waitForSelector('#card-3 .asb-button');
    const neighbor=detail?null:await page.locator('#card-2').boundingBox();
    const label=await page.locator(selector).getAttribute('data-seller');assert.equal(label,`${site}:sample-seller`);
    await page.locator(selector).click();await page.waitForSelector('[data-asb-dissolving]');
    assert.equal(await page.evaluate(()=>window.__back),0);assert.equal(await page.locator('[data-asb-dissolving]').count(),detail?1:2);
    await page.waitForTimeout(220);assert.ok(await page.locator('[data-asb-dissolving]').first().evaluate(e=>e.style.maskImage.startsWith('url(')));
    await page.waitForFunction(()=>!document.querySelector('.asb-dust'));
    if(detail)assert.equal(await page.evaluate(()=>window.__back),1);
    else {await page.waitForTimeout(280);assert.equal(await page.locator('[data-asb-hidden]').count(),2);assert.ok((await page.locator('#card-2').boundingBox()).x<neighbor.x);assert.equal(page.url(),markets.urls[site]);}
    assert.equal(await page.locator('[data-asb-dissolving]').count(),0);
  });
}
before(async()=>{browser = await chromium.launch({...(process.env.BROWSER_CHANNEL ? {channel:process.env.BROWSER_CHANNEL} : {}),headless:true});});
after(async()=>{await browser?.close();});
const picture = 'data:image/svg+xml;base64,' + Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="230" height="160"><rect width="230" height="160" fill="#788b6e"/><path d="M0 160L80 45l60 65 35-40 55 90" fill="#b7c6ac"/><circle cx="180" cy="35" r="17" fill="#ebe3b5"/></svg>').toString('base64');
function card(seller,id) {return `<li id="card-${id}"><article class="item-card__wrap"><img src="${picture}"><h2>Sample asset ${id}</h2><div class="item-card__shop-info"><a class="item-card__shop-name-anchor" href="https://${seller}.booth.pm/">${seller}</a></div></article></li>`;}
async function fixture(t, {reduced=false,detail=false,fail=false,initial=false}={}) {
  const context = await browser.newContext({viewport:{width:1100,height:650},reducedMotion:reduced?'reduce':'no-preference'});
  t.after(()=>context.close());
  const page = await context.newPage();
  const errors=[]; page.on('pageerror',e=>errors.push(e.message)); t.after(()=>assert.deepEqual(errors,[]));
  await page.route('**/*',route=>route.fulfill({contentType:'text/html',body:`<!doctype html><html><head><style>body{font:14px Tahoma;background:#f5f4ee;margin:20px}ul{display:grid;grid-template-columns:repeat(4,230px);gap:18px;list-style:none;padding:0}li{background:white;border:1px solid #999;overflow:hidden}article>img{width:100%;display:block}h2{font-size:15px;padding:0 8px}.item-card__shop-info{padding:8px}main>h1{font-size:22px}</style></head><body><main>${detail?'<a data-product-list="to shop_index" href="https://dust-shop.booth.pm/">dust-shop</a><h1>Sample product</h1>':'<h1>SlopCut animation preview</h1>'}<ul>${card('dust-shop',1)}${card('other-shop',2)}${card('dust-shop',3)}${card('last-shop',4)}</ul></main></body></html>`}));
  await page.goto(detail?'https://booth.pm/ko/items/123':'https://booth.pm/ko/search/test');
  await page.evaluate(({fail,initial})=>{
    const listeners=[];
    window.__state={version:2,enabled:true,sitesEnabled:{unity:true,booth:true},blocked:initial?[{site:'booth',id:'dust-shop',name:'dust-shop',addedAt:1}]:[]};
    window.__setState = value => {window.__state=value;listeners.forEach(fn=>fn({state:{newValue:value}},'local'));};
    window.__back=0; history.pushState({},'',location.href); history.back=()=>{window.__back++;};
    window.chrome={storage:{local:{get:async()=>({state:window.__state})},onChanged:{addListener:fn=>listeners.push(fn)}},runtime:{sendMessage:async message=>{
      if(fail)throw new Error('Simulated failed save');
      window.__setState({...window.__state,blocked:[...window.__state.blocked,{...message.publisher,addedAt:Date.now()}]});
      return {ok:true,state:window.__state};
    }}};
  },{fail,initial});
  await page.addStyleTag({path:path.join(root,'content.css')});
  for(const file of JSON.parse(fs.readFileSync(path.join(root,'manifest.json'),'utf8')).content_scripts[0].js)await page.addScriptTag({path:path.join(root,file)});
  await page.waitForFunction(()=>document.querySelector('.asb-button'));
  return page;
}
test('live cards dissolve without reload; all matching cards hide, grid closes and temporary styles clean up',async t=>{
  const page=await fixture(t);
  await page.locator('#card-1').evaluate(el=>el.style.setProperty('filter','contrast(0.9)','important'));
  const before=await page.locator('#card-2').boundingBox();
  await page.locator('#card-1 .asb-button').click();
  await page.waitForSelector('[data-asb-dissolving]');
  await page.waitForTimeout(280);
  assert.equal(await page.locator('[data-asb-hidden]').count(),0);
  assert.equal(await page.locator('[data-asb-dissolving]').count(),2);
  assert.ok(await page.locator('#card-1').evaluate(el=>el.style.maskImage.startsWith('url(')));
  assert.ok(await page.locator('.asb-dust').evaluate(el=>el.getContext('2d').getImageData(0,0,el.width,el.height).data.some((v,i)=>i%4===3&&v>0)));
  await page.waitForFunction(()=>!document.querySelector('.asb-dust'));
  await page.waitForTimeout(280);
  assert.equal(await page.locator('[data-asb-hidden]').count(),2);
  assert.equal(await page.locator('[data-asb-dissolving]').count(),0);
  assert.equal(await page.locator('#card-1').evaluate(el=>el.style.maskImage),'');
  assert.equal(await page.locator('#card-1').evaluate(el=>el.style.getPropertyPriority('filter')),'important');
  assert.equal(await page.evaluate(()=>window.__state.blocked.length),1);
  assert.ok((await page.locator('#card-2').boundingBox()).x<before.x);
  assert.equal(page.url(),'https://booth.pm/ko/search/test');
});
test('explicit block animates even with Windows reduced motion; previously blocked cards still hide immediately',async t=>{
  const page=await fixture(t,{reduced:true});
  await page.locator('#card-1 .asb-button').click();
  await page.waitForSelector('[data-asb-dissolving]');
  assert.equal(await page.evaluate(()=>matchMedia('(prefers-reduced-motion: reduce)').matches),true);
  assert.equal(await page.locator('[data-asb-hidden]').count(),0);
  await page.waitForTimeout(180);
  assert.ok(await page.locator('#card-1').evaluate(el=>el.style.maskImage.startsWith('url(')));
  await page.waitForFunction(()=>document.querySelectorAll('[data-asb-hidden]').length===2);
  assert.equal(await page.locator('.asb-dust').count(),0);
  const existing=await fixture(t,{initial:true});
  assert.equal(await existing.locator('[data-asb-hidden]').count(),2);
  assert.equal(await existing.locator('.asb-dust').count(),0);
});
test('pausing during dissolution restores cards and removes visual state',async t=>{
  const page=await fixture(t);
  await page.locator('#card-1 .asb-button').click();
  await page.waitForSelector('[data-asb-dissolving]');
  await page.evaluate(()=>window.__setState({...window.__state,enabled:false}));
  await page.waitForFunction(()=>!document.querySelector('.asb-dust'));
  assert.equal(await page.locator('[data-asb-hidden],[data-asb-dissolving]').count(),0);
  assert.equal(await page.locator('#card-1').evaluate(el=>el.style.maskImage),'');
});
test('failed saves keep cards visible and do not animate',async t=>{
  const page=await fixture(t,{fail:true});
  await page.locator('#card-1 .asb-button').click();
  await page.waitForFunction(()=>document.querySelector('#card-1 .asb-button').textContent==='다시 시도');
  assert.equal(await page.locator('.asb-dust,[data-asb-hidden],[data-asb-dissolving]').count(),0);
});
test('detail waits for the effect before returning to the previous page',async t=>{
  const page=await fixture(t,{detail:true});
  await page.locator('main > .asb-button').click();
  await page.waitForSelector('main[data-asb-dissolving]');
  assert.equal(await page.evaluate(()=>window.__back),0);
  await page.waitForFunction(()=>window.__back===1);
  assert.equal(await page.locator('.asb-dust,[data-asb-dissolving]').count(),0);
});
