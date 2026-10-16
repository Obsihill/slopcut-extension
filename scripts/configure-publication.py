from pathlib import Path
import argparse,json,re,datetime
p=argparse.ArgumentParser(); p.add_argument('--owner',required=True); p.add_argument('--publisher',required=True); p.add_argument('--license',choices=['MIT'])
a=p.parse_args()
if not re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9-]{0,38}',a.owner): p.error('Invalid GitHub owner')
r=Path(__file__).resolve().parents[1]; f=r/'PUBLICATION.json'; d=json.loads(f.read_text(encoding='utf-8'))
base=f'https://{a.owner}.github.io/{d["repository"]}'
d.update(githubOwner=a.owner,publisherDisplayName=a.publisher,websiteUrl=base+'/',privacyPolicyUrl=base+'/privacy.html',supportUrl=f'https://github.com/{a.owner}/{d["repository"]}/issues')
if a.license:
    d['license']='MIT'
    text=(r/'LICENSE-MIT.template').read_text(encoding='utf-8').replace('MIT License (DRAFT — not applied to this repository)','MIT License')
    text=re.sub(r'Copyright.*',f'Copyright (c) {datetime.date.today().year} {a.publisher}',text,count=1)
    (r/'LICENSE').write_text(text,encoding='utf-8')
    pkg=json.loads((r/'package.json').read_text());pkg['license']='MIT';(r/'package.json').write_text(json.dumps(pkg,indent=2)+'\n')
f.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
for name in ['privacy.html','index.html']:
    path=r/'docs'/name; text=path.read_text(encoding='utf-8')
    text=re.sub(r'<p id="publication">.*?</p>', '<p id="publication"><a href="'+d['supportUrl']+'">GitHub Issues / 문의</a></p>',text,flags=re.S)
    path.write_text(text,encoding='utf-8')
print(json.dumps(d,ensure_ascii=False,indent=2))
