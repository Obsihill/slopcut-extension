# 확장 구조

```text
딸깍컷 / SlopCut 확장 구조

manifest.json
  실행할 사이트와 스크립트 순서. Manifest V3, 빌드 과정/외부 런타임 불필요.

shared.js
  사이트별 판매자 ID 검증, URL 생성, 사이트+ID 키, v1 → v2 정규화, 저장소 읽기, 메시지 전송.
  예: {site:"unity", id:"123"}와 {site:"booth", id:"123"}는 서로 다른 판매자.

background.js
  저장소 변경의 단일 진입점. 여러 탭의 차단·해제 요청을 큐로 직렬화.
  읽기 → 수정 → 저장 사이에 다른 탭의 변경을 덮어쓰지 않음.

adapters/unity.js, adapters/booth.js
  사이트별 DOM 지식만 담당.
  matches(location): 적용할 도메인·페이지 판별.
  isDetail(location), home: 차단 후 상세 페이지에서 나가기 위한 판별과 기본 이동 주소.
  selector: 판매자 이름 링크의 선택자.
  publisher(anchor): {site,id,name} 또는 null.
  prepare(anchor): 판매자 이름 오른쪽의 버튼 배치를 위한 레이아웃 보정.
  cardFor(anchor): 숨길 상품 카드 전체 또는 null(상세 본문 유지).
  extraCards(document): 판매자 이름이 없는 상점 테마의 상품 카드 식별(선택).

content.js + content.css
  공통 실행 엔진: 어댑터 선택, 차단 버튼 생성, 카드 숨김, 변경 관찰, 상세에서 차단 후 나가기.
  storage.onChanged로 관리 페이지 및 다른 탭의 변경을 실시간 반영.
  MutationObserver로 나중에 추가·교체되는 상품 카드 처리.
  pageshow에서 목록을 다시 읽어 뒤로 가기로 복원된 화면에도 차단 반영.
  activeSellers로 저장 알림·DOM 재검사가 진행 중인 애니메이션을 건너뛰도록 보호.

effects.js
  살아 있는 HTML에 노이즈 마스크와 흑백 필터를 적용하고 Canvas에 검은 입자를 표시.
  이미지 다운로드나 DOM 스크린샷 없이 처리. 화면 내 최대 8개 영역, 약 30fps로 제한.
  완료 시 기존 인라인 스타일을 복원하고 실제 숨김을 실행한 뒤 주변 카드의 이동을 보간.
  사용자가 직접 요청한 효과이므로 OS 동작 줄이기 설정과 관계없이 재생.
  비활성 탭·취소·타임아웃에서 정리하고 기본 숨김 동작으로 이어짐.

options.html + options.js + options.css
  통합 관리 화면. 사이트 필터와 활성화, 검색, 직접 추가, 해제, JSON 백업·복원.

theme.js
  관리 페이지의 초기 테마와 테마 변경 담당. 기본값은 system.
  prefers-color-scheme 변경을 따라가며 light/dark 수동 선택 시 해당 모드를 유지.
  chrome.storage.local의 uiTheme 키에 따로 저장하여 차단 목록 변경과 독립적.
  첫 화면의 색상 깜빡임을 줄이기 위해 extension origin localStorage에 캐시.
  options.css는 공통 색상 토큰으로 두 모드를 표시.

다른 사이트를 추가할 때
1. shared.js에 사이트 이름, ID 검증 규칙, 판매자 URL 생성 규칙을 추가.
2. adapters/새사이트.js를 작성하고 ASBAdapters 배열에 등록.
3. manifest.json에 해당 사이트 match와 어댑터 스크립트 추가.
4. 관리 화면에 해당 사이트 선택 항목/활성화 항목 추가.
공통 차단·숨김 엔진과 저장 메시지 처리 코드는 그대로 사용.

버전 호환
- site 필드가 없는 기존 항목은 Unity 항목으로 해석.
- 스토리지 정규화는 읽기 시 수행하며 다음 정상 저장 시 v2로 기록.
- v1/v2 백업을 현재 목록에 합치고 사이트+ID 기준 중복 제거.
- 잘못된 항목이 포함된 가져오기 요청은 저장 전에 전체 거부.

_locales/ko, _locales/en
  이름·설명·툴바 제목의 브라우저 표준 현지화. 기본 로캘은 en.
  한국어 관리 화면은 브라우저 로캘에 맞춰 브랜드 제목만 변경.
  기존 state, uiTheme 및 slopblock.theme 키를 유지하여 데이터 보존.

```
