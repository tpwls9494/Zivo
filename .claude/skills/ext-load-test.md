---
name: ext-load-test
description: 크롬 익스텐션(extension/) 빌드·수동 테스트·디버깅 시 로드. chrome://extensions 로드 절차, Service Worker 로그 확인, chrome.storage.sync 디버깅 체크리스트.
---

# Chrome Extension Load & Test Skill

`extension/` 의 Manifest V3 익스텐션을 로컬에서 빌드하고 크롬에 수동으로 로드·테스트하는 절차.

## 빌드

```bash
cd extension
npm install
npm run dev       # watch 모드: src/ 변경 시 dist/ 자동 재빌드 (HMR 아님, 재로드 필요)
npm run build     # 프로덕션 번들
```

결과물은 `extension/dist/` 에 생성. manifest.json, popup.html, background.js, 아이콘 등이 들어있다.

## 크롬에 로드

1. 크롬 주소창에 `chrome://extensions` 입력
2. 우측 상단 **개발자 모드** 토글 ON
3. **압축해제된 확장 프로그램 로드** 클릭
4. `/Users/isejin/Desktop/세진 폴더/openclaw/Zivo/extension/dist` 선택
5. 확장 리스트에 Zivo 카드 추출 — 고유 ID (예: `pahmnccglmhjomefejgegfdpkobabohf`) 표시됨

### 재빌드 후

`npm run dev` watch 모드에서 코드 변경 → dist 갱신 → `chrome://extensions` 의 Zivo 카드 우하단 **새로고침** 아이콘 클릭. popup 만 바꾼 경우도 마찬가지 (popup 은 열 때마다 새로 뜨지만 Service Worker 코드 갱신은 재로드 필요).

## Service Worker 디버깅

Manifest V3 의 background 는 Service Worker 다. DevTools 열기:

1. `chrome://extensions` → Zivo 카드에 **Service Worker** 링크
2. 클릭 → DevTools 창 → Console/Network 확인 가능
3. Service Worker 는 **idle 시 죽는다** — 링크가 "inactive" 로 표시되면 알람/메시지가 와서 깨어날 때까지 대기

로그 위치:
- **popup 로그**: popup 을 연 상태에서 우클릭 → 검사
- **content script 로그**: 해당 탭의 DevTools Console
- **background SW 로그**: 위 Service Worker DevTools
- **chrome.storage 읽기**: Service Worker DevTools Console 에서
  ```js
  chrome.storage.sync.get(null, console.log)
  chrome.storage.local.get(null, console.log)
  ```

## chrome.storage.sync 주의사항

- 총 저장 용량 **100 KB**, 키당 **8 KB**, 초당 120 writes, 시간당 1800 writes 제한
- 큰 배열 (예: 검색 이력) 은 `chrome.storage.local` (5 MB) 로
- 민감정보 (여권번호) 는 **둘 다 금지** — 백엔드 DB 에만 저장
- 동기화는 같은 크롬 계정 로그인된 기기 간에만. 로그아웃 시 해당 기기에서 삭제될 수 있음.

## 수동 테스트 체크리스트 (Day 1 기준)

- [ ] 확장 아이콘 클릭 → popup 이 열리고 기본 검색 폼 (출발지·도착지·날짜) 노출
- [ ] popup 에서 입력 후 저장 버튼 → `chrome.storage.sync.get(null)` 로 확인
- [ ] popup 닫았다 다시 열기 → 입력값 자동완성
- [ ] Service Worker DevTools 에서 `console.log` 출력 확인
- [ ] manifest.json 의 `permissions` 에 불필요한 권한 없는지 확인 (`storage` 정도만)
- [ ] `host_permissions` 에 백엔드 도메인만 (개발: `http://localhost:8000/*`)

## Day 4+ 테스트 체크리스트 (검색·예약 추가)

- [ ] 검색 실행 → 네트워크 탭에서 `POST /api/flights/search` 호출 확인
- [ ] 3탭 (기본 / 더 싼 옵션 / 달력) 렌더링 및 전환
- [ ] 편도 조합 탭에 **경고 배너** 노출
- [ ] `원터치 예약` 클릭 → 새 탭에서 항공사 딥링크 오픈, popup 은 예약 이력에 row 추가
- [ ] 가격 알림 등록 → Service Worker 가 6시간마다 폴링하는지 (알람은 `chrome.alarms` 로 설정)

## 자주 마주치는 이슈

| 증상 | 원인 | 해결 |
|---|---|---|
| popup 이 빈 화면 | manifest `action.default_popup` 경로 오타 또는 popup.html 없음 | `dist/manifest.json` 과 실제 파일 확인 |
| `Refused to execute inline script` | MV3 는 CSP 로 인라인 JS 차단 | 모든 JS 를 별도 파일로 |
| `net::ERR_CONNECTION_REFUSED` (백엔드 호출) | docker-compose 미기동 또는 `host_permissions` 누락 | `docker-compose ps`, manifest 재확인 |
| Service Worker 즉시 죽음 | MV3 idle timeout | `chrome.alarms.create` 로 주기 웨이크, 또는 필요시 persistent 대체 패턴 |
| HMR 안 됨 | MV3 에서 CRXJS 가 부분 지원 | 변경 후 수동 **새로고침** |

## 배포 빌드 점검

`npm run build` 후 `dist/` 를 Chrome Web Store 업로드용으로 zip:

```bash
cd extension/dist && zip -r ../zivo-v0.1.0.zip . && cd ..
```

업로드 전 확인:
- `manifest.json` 의 `version` 이 올라갔는가
- `permissions` 에 불필요한 것 없는가 (리뷰 사유)
- `host_permissions` 가 프로덕션 API 도메인인가
- 아이콘 16/48/128 png 모두 포함
