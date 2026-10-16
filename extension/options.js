'use strict';
const $ = id => document.getElementById(id);
const pageTitle = chrome.i18n?.getMessage('optionsTitle') || '딸깍컷 - 차단 목록 관리';
document.title = pageTitle;
$('brand-title').textContent = pageTitle;
let state = ASB.defaults();
for (const [site,name] of Object.entries(ASB.sites)) {
  const label = document.createElement('label'), input = document.createElement('input'), count = document.createElement('span');
  input.type='checkbox'; input.id=`enabled-${site}`; count.id=`count-${site}`; count.className='muted';
  label.append(input,document.createTextNode(name+' '),count); $('site-controls').append(label);
  for (const id of ['add-site','site-filter']) {
    const option=document.createElement('option'); option.value=site; option.textContent=name; $(id).append(option);
  }
}
if (globalThis.SlopCutTheme) {
  SlopCutTheme.ready.then(() => { $('theme').value = SlopCutTheme.preference; });
  $('theme').onchange = async () => {
    const control = $('theme'); control.disabled = true;
    try {await SlopCutTheme.set(control.value); message('테마 설정을 저장했습니다.');}
    catch (error) {control.value = SlopCutTheme.preference; message(error.message, true);}
    finally {control.disabled = false;}
  };
}
function message(text, error = false) { $('message').textContent = text; $('message').classList.toggle('error', error); }
async function change(type, payload, success) {
  try { state = await ASB.request(type, payload); render(); message(success); return true; }
  catch (error) {message(error.message, true); return false;}
}
function render() {
  $('count').replaceChildren(document.createTextNode(String(state.blocked.length)), Object.assign(document.createElement('span'),{textContent:'명'}));
  $('enabled').checked = state.enabled;
  for (const site of Object.keys(ASB.sites)) {
    $(`enabled-${site}`).checked = state.sitesEnabled[site];
    $(`count-${site}`).textContent = `${state.blocked.filter(e => e.site === site).length}명 차단`;
  }
  const q = $('search').value.trim().toLocaleLowerCase();
  const site = $('site-filter').value;
  const entries = state.blocked.filter(e => (!site || e.site === site) && `${e.name} ${e.id} ${ASB.sites[e.site]}`.toLocaleLowerCase().includes(q)).sort((a,b) => b.addedAt-a.addedAt);
  $('list').replaceChildren();
  $('empty').hidden = entries.length > 0;
  $('empty').textContent = q || site ? '이 조건에 맞는 차단 판매자가 없습니다.' : '아직 차단한 판매자가 없습니다. 판매자 이름 옆 차단 버튼으로 추가하세요.';
  for (const e of entries) {
    const li = document.createElement('li'), record = document.createElement('div');
    record.className='record';
    const link = document.createElement('a'); link.textContent=e.name; link.href=ASB.sellerUrl(e); link.target='_blank'; link.rel='noopener noreferrer';
    const meta = document.createElement('span'); meta.className='meta'; meta.textContent=`${ASB.sites[e.site]} · ${e.id} · ${new Date(e.addedAt).toLocaleDateString('ko-KR')} 추가`;
    const remove = document.createElement('button'); remove.textContent='차단 해제'; remove.setAttribute('aria-label',`${e.name} 차단 해제`);
    remove.onclick=()=>change('unblock',{site:e.site,id:e.id},`${e.name} 차단을 해제했습니다.`);
    record.append(link,meta); li.append(record,remove); $('list').append(li);
  }
  $('clear').disabled = !state.blocked.some(e => !site || e.site === site);
  $('clear').textContent = site ? `${ASB.sites[site]} 전체 해제` : '전체 해제';
}
$('add').onsubmit = async e => {
  e.preventDefault(); const site = $('add-site').value, id = ASB.sellerId(site, $('publisher').value);
  if (!id) {message('선택한 사이트의 올바른 판매자 URL 또는 ID를 입력하세요.',true);return;}
  if (await change('block',{publisher:{site,id,name:$('name').value.trim()}},'판매자를 차단했습니다. 열린 스토어 페이지에도 바로 반영됩니다.')) {
    $('publisher').value=''; $('name').value='';
  }
};
$('add-site').onchange = () => { $('publisher').placeholder = ASB.placeholders[$('add-site').value]; };
$('enabled').onchange = async () => {await change('enabled',{enabled:$('enabled').checked},'숨김 설정을 변경했습니다.'); render();};
$('search').oninput=render;
$('site-filter').onchange=render;
for (const site of Object.keys(ASB.sites)) $(`enabled-${site}`).onchange = async () => {await change('siteEnabled',{site,enabled:$(`enabled-${site}`).checked},`${ASB.sites[site]} 숨김 설정을 변경했습니다.`);render();};
$('clear').onclick = () => {
  const site=$('site-filter').value, count=state.blocked.filter(e=>!site||e.site===site).length;
  if(confirm(`${site ? ASB.sites[site] : '전체 사이트'} 판매자 ${count}명의 차단을 모두 해제할까요? 먼저 백업을 내보낼 수 있습니다.`)) change('clear',site?{site}:{},'선택한 차단 목록을 해제했습니다.');
};
$('export').onclick=()=>{
  const url=URL.createObjectURL(new Blob([JSON.stringify({version:2,blocked:state.blocked},null,2)],{type:'application/json'}));
  const a=document.createElement('a'); a.href=url; a.download=`SlopCut-backup-${new Date().toISOString().slice(0,10)}.json`; a.click(); setTimeout(()=>URL.revokeObjectURL(url),3000); message('전체 사이트의 차단 목록 백업을 내보냈습니다.');
};
$('import').onclick=()=>$('file').click();
$('file').onchange=async()=>{
  const f=$('file').files[0]; if(!f)return;
  try {
    if(f.size>2*1024*1024)throw new Error('백업 파일은 2MB 이하여야 합니다.');
    const data=JSON.parse(await f.text());
    if(!Array.isArray(data.blocked)||data.blocked.length>10000)throw new Error('올바른 차단 목록 JSON 파일을 선택하세요.');
    const entries=data.blocked.map(ASB.entry);
    await change('import',{entries},'백업을 현재 차단 목록에 합쳤습니다.');
  } catch(e) {message(e.message,true);} finally {$('file').value='';}
};
chrome.storage.onChanged.addListener((changes,area)=>{if(area==='local'&&changes.state){state=ASB.normalize(changes.state.newValue);render();}});
ASB.read().then(value=>{state=value;render();}).catch(e=>message(e.message,true));
