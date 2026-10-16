const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),ext=path.join(root,'extension');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));const m=read(path.join(ext,'manifest.json'));
assert.equal(m.name,'__MSG_extensionName__');assert.equal(m.default_locale,'en');assert.deepEqual(m.permissions,['storage']);assert.equal(m.version,read(path.join(root,'package.json')).version);
for(const lang of ['ko','en']){const l=read(path.join(ext,'_locales',lang,'messages.json'));for(const k of ['extensionName','extensionDescription','actionTitle','optionsTitle'])assert(l[k].message);assert(l.extensionDescription.message.length<=132);assert.equal(l.extensionName.message,lang==='ko'?'딸깍컷':'SlopCut');}
const refs=[m.background.service_worker,m.options_page,...Object.values(m.icons),...Object.values(m.action.default_icon),...m.content_scripts.flatMap(c=>[...c.js,...c.css])];for(const p of refs)assert(fs.existsSync(path.join(ext,p)),p);
for(const f of fs.readdirSync(path.join(root,'docs/store/screenshots')).filter(f=>f.endsWith('.png'))){const b=fs.readFileSync(path.join(root,'docs/store/screenshots',f));assert.equal(b.readUInt32BE(16),1280);assert.equal(b.readUInt32BE(20),800);}
assert.equal(fs.readdirSync(path.join(root,'docs/store/screenshots')).filter(f=>f.endsWith('.png')).length,5);
const logo=fs.readFileSync(path.join(root,'docs/store/icons/logo-300.png'));assert.equal(logo.readUInt32BE(16),300);assert.equal(logo.readUInt32BE(20),300);
for(const f of ['privacy.html','privacy.md','privacy.en.md'])assert(fs.statSync(path.join(root,'docs',f)).size>500);
for(const lang of ['ko-KR','en-US']){const text=fs.readFileSync(path.join(root,'docs/store',lang+'.txt'),'utf8').replace(/\r/g,'');const detail=text.split(lang==='ko-KR'?'상세 설명\n':'Detailed description\n')[1].split(lang==='ko-KR'?'검색어 —':'Search terms —')[0].trim();assert(detail.length>=250&&detail.length<=10000);const terms=text.split(lang==='ko-KR'?'검색어 — 7개, 21단어 이내\n':'Search terms — seven terms\n')[1].trim().split(/\r?\n/);assert(terms.length<=7);assert(terms.every(t=>t.length<=30));assert(terms.join(' ').split(/\s+/).length<=21);}
console.log('Release metadata, permissions, runtime files, policies, five 1280x800 screenshots and 300x300 logo verified.');
