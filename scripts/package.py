from pathlib import Path
import zipfile, hashlib, json
root=Path(__file__).resolve().parents[1]
ext=root/'extension'
version=json.loads((ext/'manifest.json').read_text(encoding='utf-8'))['version']
dist=root/'dist'; dist.mkdir(exist_ok=True)
out=dist/f'SlopCut-{version}-edge.zip'
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED) as z:
    for p in sorted(ext.rglob('*')):
        if p.is_file() and p.suffix in {'.js','.json','.html','.css','.png','.svg'}:
            info=zipfile.ZipInfo(p.relative_to(ext).as_posix(),(2026,1,1,0,0,0))
            info.compress_type=zipfile.ZIP_DEFLATED
            z.writestr(info,p.read_bytes())
(dist/'SHA256SUMS.txt').write_text(hashlib.sha256(out.read_bytes()).hexdigest()+'  '+out.name+'\n',encoding='utf-8')
print(out)
