const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {JSDOM} = require('jsdom');
const root = path.resolve(__dirname, '../extension');
const source = name => fs.readFileSync(path.join(root,name),'utf8');
const copy = value => value === undefined ? undefined : JSON.parse(JSON.stringify(value));
const settle = () => new Promise(resolve => setTimeout(resolve,200));

// A shared, asynchronous chrome.storage + actual background.js across multiple DOM tabs.
function environment(initial, initialTheme) {
  let stored = copy(initial), uiTheme = initialTheme, failSave = false, messageHandler;
  const listeners = [], action = {addListener(){}};
  const runtime = {id:'test-extension',onMessage:{addListener(fn){messageHandler=fn;}},openOptionsPage:async()=>{}};
  const storage = {local:{
    async get(){await new Promise(r=>setTimeout(r,2));return {state:copy(stored),uiTheme};},
    async set(values){
      if(failSave)throw new Error('test storage write failed');
      const changes={};
      if(Object.hasOwn(values,'state')){const old=copy(stored);stored=copy(values.state);changes.state={oldValue:old,newValue:copy(stored)};}
      if(Object.hasOwn(values,'uiTheme')){const old=uiTheme;uiTheme=values.uiTheme;changes.uiTheme={oldValue:old,newValue:uiTheme};}
      for(const fn of listeners)fn(changes,'local');
    }
  },onChanged:{addListener(fn){listeners.push(fn);}}};
  const chrome = {runtime,storage,action:{onClicked:action}};
  const ctx = vm.createContext({chrome,URL,console,setTimeout,clearTimeout});
  ctx.importScripts = name => vm.runInContext(source(name),ctx);
  vm.runInContext(source('background.js'),ctx);
  runtime.sendMessage = message => new Promise(resolve=>messageHandler(copy(message),{id:runtime.id},value=>resolve(copy(value))));
  return {
    ASB:ctx.ASB, chrome, stored:()=>copy(stored), theme:()=>uiTheme, fail:()=>{failSave=true;},
    silentStore:value=>{stored=copy(value);},
    async tab(html,url,options=false,appearance={}) {
      const dom=new JSDOM(html,{url,runScripts:'outside-only'});
      dom.window.chrome=chrome;
      if(appearance.locale) {
        const messages=JSON.parse(source(`_locales/${appearance.locale}/messages.json`));
        dom.window.chrome={...chrome,i18n:{getMessage:key=>messages[key]?.message || ''}};
      }
      const media={matches:appearance.dark===true,addEventListener(_event,fn){this.listener=fn;}};
      dom.window.matchMedia=()=>media;
      dom.setBrowserDark=value=>{media.matches=value;media.listener?.({matches:value});};
      if(appearance.cached)dom.window.localStorage.setItem('slopblock.theme',appearance.cached);
      if(options) for(const file of ['theme.js','shared.js','options.js'])dom.window.eval(source(file));
      else {
        dom.navigations=[];dom.backCount=0;
        const location=Object.assign(new URL(url),{replace:target=>dom.navigations.push(target)});
        const context=vm.createContext({document:dom.window.document,window:dom.window,location,history:{length:appearance.historyLength ?? 1,back(){dom.backCount++;}},MutationObserver:dom.window.MutationObserver,chrome,URL,console,setTimeout:dom.window.setTimeout.bind(dom.window),clearTimeout:dom.window.clearTimeout.bind(dom.window)});
        for(const file of ['shared.js','adapters/unity.js','adapters/booth.js','effects.js','content.js'])vm.runInContext(source(file),context);
      }
      await settle();return dom;
    }
  };
}
const boothCard = (seller,id=1) => `<li class="item-card l-card"><div class="item-card__wrap" id="item_${id}"><a href="https://booth.pm/ko/items/${id}"><img alt="product"></a><div class="item-card__shop-info"><a class="item-card__shop-name-anchor nav" href="https://${seller}.booth.pm/"><div class="flex items-center"><img alt="${seller}"><div class="item-card__shop-name">${seller}</div></div></a></div></div></li>`;
const boothDetail = `<main><div class="flex"><a data-product-list="from market_show via market_item_detail to shop_index" href="https://n0m.booth.pm/"><img alt="NØM"><span>NØM</span></a><a href="https://n0m.booth.pm/cart">cart</a></div><h2 id="product-title">Overdose</h2><div id="description"><a href="https://mio3works.booth.pm/items/4013951">other product</a><a href="https://other.booth.pm/">other store in description</a></div><ul>${boothCard('n0m',2)}</ul></main>`;
const unityCard = id => `<li><article data-test="search-results-product-card-10"><a href="/packages/package/10"><img></a><div class="h-5"><a data-test="product-card-publisher" href="/publishers/${id}">Unity Seller</a></div></article></li>`;

test('v1 migration preserves Unity blocks and global pause; v2 namespaces identical IDs',()=>{
  const {ASB}=environment();
  const old=ASB.normalize({version:1,enabled:false,blocked:[{id:'000123',name:'Original',addedAt:10}]});
  assert.equal(old.enabled,false);assert.equal(old.blocked[0].site,'unity');assert.equal(old.blocked[0].id,'123');
  const data=ASB.normalize({blocked:[...old.blocked,{site:'booth',id:'123',name:'Other'}]});
  assert.equal(data.blocked.length,2);assert.equal(ASB.key(data.blocked[0]),'unity:123');assert.equal(ASB.key(data.blocked[1]),'booth:123');
});
test('seller URL parsing rejects lookalikes, accounts, invalid schemes and missing subdomains',()=>{
  const {ASB}=environment();
  assert.equal(ASB.boothId('https://N0M.booth.pm/items/12'),'n0m');
  assert.equal(ASB.boothId('n0m.booth.pm'),'n0m');assert.equal(ASB.boothId('n0m'),'n0m');
  for(const input of ['https://booth.pm/ko/items/10','https://accounts.booth.pm/','https://x.booth.pm.evil.test/','http://n0m.booth.pm/','https://a.b.booth.pm/','javascript:alert(1)','https://u:p@n0m.booth.pm/'])assert.equal(ASB.boothId(input),null,input);
});
test('background serializes writes from tabs, de-duplicates, separates unblocks and filtered clearing',async()=>{
  const e=environment({blocked:[{id:'123',name:'legacy'}]});
  await Promise.all([e.ASB.request('block',{publisher:{site:'booth',id:'123'}}),e.ASB.request('block',{publisher:{site:'booth',id:'n0m'}}),e.ASB.request('block',{publisher:{site:'booth',id:'n0m'}})]);
  assert.equal(e.stored().blocked.length,3);
  await e.ASB.request('unblock',{site:'booth',id:'123'});assert.equal(e.stored().blocked.length,2);assert.ok(e.stored().blocked.some(x=>x.site==='unity'));
  await e.ASB.request('clear',{site:'booth'});assert.equal(e.stored().blocked.length,1);
  const before=e.stored();await assert.rejects(()=>e.ASB.request('import',{entries:[{site:'booth',id:'new'},{site:'invalid',id:'x'}]}));assert.deepEqual(e.stored(),before);
});
test('BOOTH adds adjacent buttons, hides complete card cells, keeps other sellers and reacts to appended items',async t=>{
  const e=environment(),dom=await e.tab(`<ul id="results">${boothCard('n0m',1)}${boothCard('other',2)}</ul>`,'https://booth.pm/ko/search/VRChat');t.after(()=>dom.window.close());
  const d=dom.window.document;
  const b=d.querySelector('#item_1 .asb-button');assert.equal(b.previousElementSibling.tagName,'A');assert.equal(b.closest('a'),null);
  b.click();await settle();assert.equal(d.querySelector('#item_1').parentElement.dataset.asbHidden,'true');assert.equal(d.querySelector('#item_2').parentElement.dataset.asbHidden,undefined);
  d.getElementById('results').insertAdjacentHTML('beforeend',boothCard('n0m',3));await settle();assert.equal(d.querySelector('#item_3').parentElement.dataset.asbHidden,'true');
  assert.equal(d.querySelectorAll('.asb-button').length,1);assert.equal(d.querySelector('#asb-panel'),null);assert.deepEqual(dom.navigations,[]);assert.equal(dom.backCount,0);
  await e.ASB.request('siteEnabled',{site:'booth',enabled:false});await settle();assert.equal(d.querySelectorAll('[data-asb-hidden]').length,0);
  assert.ok([...d.querySelectorAll('.asb-button')].every(b=>b.textContent==='차단'));
  await e.ASB.request('siteEnabled',{site:'booth',enabled:true});await settle();assert.equal(d.querySelectorAll('[data-asb-hidden]').length,2);
});
test('BOOTH detail blocks return immediately and other tabs hide cards without unblock controls',async t=>{
  const e=environment(),a=await e.tab(boothDetail,'https://booth.pm/ko/items/8674339',false,{historyLength:2}),b=await e.tab(boothDetail,'https://n0m.booth.pm/items/8674339');t.after(()=>{a.window.close();b.window.close();});
  for(const dom of [a,b]) {const d=dom.window.document;assert.equal(d.querySelectorAll('.asb-button').length,2);assert.equal(d.querySelectorAll('#description .asb-button').length,0);}
  a.window.document.querySelector('.asb-button').click();await settle();
  for(const dom of [a,b]) {const d=dom.window.document;assert.equal(d.querySelector('.asb-button'),null);assert.equal(d.querySelector('main').hasAttribute('data-asb-hidden'),false);assert.equal(d.querySelector('#asb-panel'),null);assert.equal(d.querySelectorAll('[data-asb-hidden]').length,1);}
  assert.equal(a.backCount,1);assert.equal(b.backCount,0);assert.deepEqual(b.navigations,[]);
});
test('BOOTH shop themes use hostname for product cards and root-relative seller links',async t=>{
  const e=environment({blocked:[{site:'booth',id:'n0m'}]}),dom=await e.tab('<nav><div class="home-link-container__nickname"><a href="/">NØM</a></div></nav><div class="item-list"><div class="item"><a href="/items/1"><img></a><h2>product</h2></div></div>','https://n0m.booth.pm/');t.after(()=>dom.window.close());
  assert.equal(dom.window.document.querySelectorAll('.asb-button').length,0);assert.equal(dom.window.document.querySelector('.item').dataset.asbHidden,'true');
});
test('transaction/account pages remain untouched',async t=>{
  const e=environment();
  for(const url of ['https://accounts.booth.pm/','https://manage.booth.pm/','https://booth.pm/carts','https://n0m.booth.pm/cart','https://n0m.booth.pm/conversations']){
    const dom=await e.tab(boothDetail,url);t.after(()=>dom.window.close());assert.equal(dom.window.document.querySelector('.asb-button,#asb-panel'),null,url);
  }
});
test('Unity regression: v1 blocks hide cards, preserve detail body, and site-specific identity',async t=>{
  const e=environment({blocked:[{id:'123'}]}),dom=await e.tab(`<main><h1>Detail</h1><div><a href="/publishers/123">Unity Seller</a></div><ul>${unityCard('123')}${unityCard('456')}</ul></main>`,'https://assetstore.unity.com/packages/package/1');t.after(()=>dom.window.close());
  const d=dom.window.document;assert.equal(d.querySelectorAll('.asb-button').length,1);assert.equal(d.querySelectorAll('[data-asb-hidden]').length,1);assert.equal(d.querySelector('main').hasAttribute('data-asb-hidden'),false);
  await e.ASB.request('unblock',{site:'unity',id:'123'});await settle();assert.equal(d.querySelectorAll('[data-asb-hidden]').length,0);
});
test('failed writes leave cards visible and report the error',async t=>{
  const e=environment(),dom=await e.tab(`<ul>${boothCard('n0m')}</ul>`,'https://booth.pm/ja/items');t.after(()=>dom.window.close());e.fail();
  dom.window.document.querySelector('.asb-button').click();await settle();assert.equal(dom.window.document.querySelectorAll('[data-asb-hidden]').length,0);assert.match(dom.window.document.querySelector('.asb-button').title,/test storage write failed/);assert.deepEqual(dom.navigations,[]);assert.equal(dom.window.document.querySelector('#asb-panel'),null);
});
test('detail opened directly falls back to the store home after saving, for both sites',async t=>{
  for(const [html,url,home] of [[boothDetail,'https://n0m.booth.pm/items/8674339','https://booth.pm/'],['<main><h1>Detail</h1><a href="/publishers/123">Seller</a></main>','https://assetstore.unity.com/packages/package/1','https://assetstore.unity.com/']]){
    const e=environment(),dom=await e.tab(html,url);t.after(()=>dom.window.close());dom.window.document.querySelector('.asb-button').click();await settle();
    assert.deepEqual(dom.navigations,[home]);assert.equal(e.stored().blocked.length,1);assert.equal(dom.window.document.querySelector('.asb-button,#asb-panel'),null);
  }
});
test('returning to a cached listing re-reads blocks before displaying products',async t=>{
  const e=environment(),dom=await e.tab(`<ul>${boothCard('n0m')}</ul>`,'https://booth.pm/ko/search/VRChat');t.after(()=>dom.window.close());
  e.silentStore({blocked:[{site:'booth',id:'n0m'}]});dom.window.dispatchEvent(new dom.window.Event('pageshow'));await settle();
  assert.equal(dom.window.document.querySelector('.item-card').dataset.asbHidden,'true');assert.equal(dom.window.document.querySelector('.asb-button,#asb-panel'),null);
});
test('management filters both sites, preserves same-ID sellers, and renders untrusted names as text',async t=>{
  const e=environment({blocked:[{id:'123',name:'Unity old'},{site:'booth',id:'123',name:'<img src=x onerror=alert(1)>'}]}),dom=await e.tab(source('options.html'),'https://extension.test/options.html',true);t.after(()=>dom.window.close());
  const w=dom.window,d=w.document;assert.equal(d.querySelectorAll('#list li').length,2);assert.equal(d.querySelectorAll('#list img').length,0);
  d.getElementById('site-filter').value='booth';d.getElementById('site-filter').dispatchEvent(new w.Event('change'));assert.equal(d.querySelectorAll('#list li').length,1);assert.equal(d.querySelector('#list a').href,'https://123.booth.pm/');
  d.querySelector('#list button').click();await settle();assert.equal(e.stored().blocked.length,1);assert.equal(e.stored().blocked[0].site,'unity');
  d.getElementById('add-site').value='booth';d.getElementById('publisher').value='https://n0m.booth.pm/';d.getElementById('add').dispatchEvent(new w.Event('submit',{cancelable:true}));await settle();assert.equal(e.stored().blocked.length,2);
});
test('theme defaults to the browser preference and tracks browser changes in system mode',async t=>{
  const e=environment(),dom=await e.tab(source('options.html'),'https://extension.test/options.html',true,{dark:true});t.after(()=>dom.window.close());
  const d=dom.window.document;
  assert.equal(d.documentElement.dataset.theme,'system');assert.equal(d.documentElement.dataset.colorMode,'dark');assert.equal(d.getElementById('theme').value,'system');
  dom.setBrowserDark(false);assert.equal(d.documentElement.dataset.colorMode,'light');assert.equal(d.documentElement.style.colorScheme,'light');
});
test('explicit theme persists, syncs pages, survives block writes, and overrides the browser',async t=>{
  const initial={version:1,enabled:false,blocked:[{id:'123',name:'Keep'}]},e=environment(initial);
  const a=await e.tab(source('options.html'),'https://extension.test/options.html',true,{dark:true}),b=await e.tab(source('options.html'),'https://extension.test/options.html',true,{dark:false});t.after(()=>{a.window.close();b.window.close();});
  const select=a.window.document.getElementById('theme');select.value='light';select.dispatchEvent(new a.window.Event('change'));await settle();
  assert.equal(e.theme(),'light');assert.deepEqual(e.stored(),initial);assert.equal(a.window.document.documentElement.dataset.colorMode,'light');assert.equal(b.window.document.getElementById('theme').value,'light');
  a.setBrowserDark(true);assert.equal(a.window.document.documentElement.dataset.colorMode,'light');
  await e.ASB.request('block',{publisher:{site:'booth',id:'n0m'}});assert.equal(e.theme(),'light');
  const reload=await e.tab(source('options.html'),'https://extension.test/options.html',true,{dark:true,cached:'dark'});t.after(()=>reload.window.close());assert.equal(reload.window.document.documentElement.dataset.colorMode,'light');
  await a.window.SlopCutTheme.set('system');assert.equal(a.window.document.documentElement.dataset.colorMode,'dark');assert.equal(b.window.document.documentElement.dataset.colorMode,'light');
});
test('failed theme save restores the selection and keeps the active theme',async t=>{
  const e=environment(undefined,'dark'),dom=await e.tab(source('options.html'),'https://extension.test/options.html',true);t.after(()=>dom.window.close());e.fail();
  const d=dom.window.document,select=d.getElementById('theme');select.value='light';select.dispatchEvent(new dom.window.Event('change'));await settle();
  assert.equal(d.documentElement.dataset.colorMode,'dark');assert.equal(select.value,'dark');assert.equal(select.disabled,false);assert.match(d.getElementById('message').textContent,/test storage write failed/);
});

test('renamed brand resolves Korean/English metadata and titles without resetting stored blocks or theme',async t=>{
  const manifest=JSON.parse(source('manifest.json'));
  assert.equal(manifest.name,'__MSG_extensionName__');assert.equal(manifest.default_locale,'en');
  const initial={version:2,enabled:true,sitesEnabled:{unity:true,booth:true},blocked:[{site:'booth',id:'keep-shop',name:'Keep',addedAt:1}]};
  const e=environment(initial,'dark');
  for(const [locale,name] of [['ko','딸깍컷'],['en','SlopCut']]) {
    const messages=JSON.parse(source(`_locales/${locale}/messages.json`));assert.equal(messages.extensionName.message,name);
    const dom=await e.tab(source('options.html'),'https://extension.test/options.html',true,{locale});t.after(()=>dom.window.close());
    assert.equal(dom.window.document.title,messages.optionsTitle.message);
    assert.equal(dom.window.document.getElementById('brand-title').textContent,messages.optionsTitle.message);
    assert.equal(dom.window.document.querySelectorAll('#list li').length,1);
    assert.equal(dom.window.document.documentElement.dataset.colorMode,'dark');
  }
  assert.deepEqual(e.stored(),initial);assert.equal(e.theme(),'dark');
});
