# Chrome 제출 준비 확인

확인일: 2026-10-17 · 버전: 1.6.0

- 설치된 Google Chrome을 사용한 격리 브라우저 테스트 11개 통과 (`BROWSER_CHANNEL=chrome node --test tests/animation.test.cjs`). CGTrader·Fab·TurboSquid의 목록과 상세 페이지, 먼지 효과, 목록 재배치, 저장 실패, 숨김 중지, 상세 페이지 복귀를 검사했습니다.
- 이 테스트는 대표 HTML과 모의 확장 저장소를 사용합니다. 실제 Chrome 프로필에 설치한 확장으로 로그인된 운영 사이트를 검사한 결과는 아닙니다. 기존 실제 사이트 검사는 Edge에서 수행했습니다.
- `node scripts/check-release.cjs` 통과: Manifest V3, storage 권한, 로케일, 런타임 파일, 개인정보처리방침, 스크린샷 5장의 1280×800 크기.
- Chrome 제출 ZIP은 Edge 1.6.0 제출 ZIP과 바이트가 같습니다. 런타임 변경 없이 같은 버전을 사용합니다.
- ZIP SHA-256: `8ad1c8ff8dfed31d6547287c69fed4011af230e2e5a81a5d8b317b5f01964d73`
- 홍보 타일은 기존 아이콘을 HTML/CSS로 배치한 440×280 PNG이며 렌더링 후 육안으로 확인했습니다. 실제 사이트 화면으로 표시하지 않습니다.
- 공개 개인정보처리방침에 Chrome의 로컬 처리와 브라우저별 목록 분리, Limited Use 설명을 추가했습니다.

위 기록은 제출 준비에 대한 검사입니다. 실제 Chrome 웹스토어의 업로드·심사 접수·승인은 개발자 콘솔에서 확인해야 합니다.
