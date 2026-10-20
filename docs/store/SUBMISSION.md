# Edge 제출 안내

제출 버전: 1.6.1 · 이름: 한국어 딸깍컷 / 영어 SlopCut · 저장소: slopcut-extension

2026-10-20: BOOTH 추천 카드 호환 수정 1.6.1을 제출했고 **In review**를 확인했습니다. 기존 1.6.0은 **Live**입니다.

[Edge 스토어 설치](https://microsoftedge.microsoft.com/addons/detail/bggbknekgpfjabnipaogajdlemaijdoj)

## 파일 선택

- `dist/SlopCut-1.6.1-edge.zip`: Edge에 업로드할 확장 패키지. ZIP 최상위에 manifest.json이 있습니다.
- `ko-KR.txt`, `en-US.txt`: 각 언어의 상세 소개, 짧은 설명, 검색어.
- `privacy-answers.txt`: 단일 목적, 권한, 원격 코드, 데이터 처리 설명.
- `reviewer-notes.txt`: 심사자용 재현 절차.
- `icons/logo-300.png`: 스토어 로고.
- `screenshots/01-unity.png` ~ `05-dust-demo.png`: 1280×800 PNG 5장.
- `screenshots/PROVENANCE.md`: 캡처 출처와 예시 데이터 구분.

스크린샷은 실제 UI 위주이며 과장된 기능이나 심사 통과 표시를 넣지 않았습니다.
01/02는 실제 사이트 공개 상품 화면을 잘라 계정·최근 본 상품 영역을 제외했습니다.
03/04는 실제 관리 HTML을 예시 데이터로 렌더링했습니다. 05는 실제 effects.js를 예시 카드에 적용했습니다.
확장 패키지에는 테스트·스크린샷·마케팅 문서를 포함하지 않습니다.

## 공개 정보

GitHub 계정: Obsihill · 저장소: https://github.com/Obsihill/slopcut-extension
공개자: SlopCut · 라이선스: MIT (`LICENSE`)
개인정보처리방침 공개 주소: https://obsihill.github.io/slopcut-extension/privacy.html
GitHub Pages는 main /docs에서 공개되며, 업데이트를 제출할 때도 이 주소를 사용합니다.

## 진행 순서

1. slopcut-extension 저장소에 이 폴더의 내용물을 올립니다. 기존 로컬 설치 폴더는 유지합니다.
2. 필요 시 Releases에 `SlopCut-1.6.1-edge.zip`을 첨부합니다. 자동으로 스토어 설치 파일이 되는 것은 아닙니다.
3. 저장소 Settings → Pages에서 main /docs를 소스로 지정합니다.
4. 공개된 개인정보처리방침 URL을 로그아웃 상태에서도 열 수 있는지 확인합니다.
5. Edge Partner Center의 기존 SlopCut에서 Update를 선택하고 확장 ZIP을 업로드합니다.
6. 기본 카테고리는 현재 대시보드의 생산성(Productivity) 계열 중 적절한 항목을 선택합니다.
7. 한국어·영어 소개와 로고, 스크린샷을 등록합니다. 영문 소개에는 한국어 기능 UI임을 고지했습니다.
8. 개인정보 항목에 실제 처리 방식과 일치하는 답변 및 공개된 개인정보처리방침 URL을 입력합니다.
9. 심사 메모 입력란의 2,000자 제한에 맞춰 reviewer-notes.txt의 변경 사항과 검증 절차를 요약하고, 제출 내용을 검토한 뒤 제출합니다.

1.6.1 업데이트는 심사 중입니다. 승인 또는 공개를 의미하지 않습니다.
스토어 설치는 개발용 설치와 ID가 다를 수 있으므로 기존 차단 목록을 먼저 JSON으로 내보내세요.

## 공식 문서 확인 기준 (2026-10-17)

[Microsoft 공식 제출 안내](https://learn.microsoft.com/en-us/microsoft-edge/extensions/publish/publish-extension)
기준으로 상세 소개는 250~10,000자, 스크린샷은 최대 6장에 1280×800 또는 640×480, 로고는 정사각형이며 300×300 권장입니다.
최종 대시보드의 입력 제한이 바뀌면 그 값을 따릅니다.
