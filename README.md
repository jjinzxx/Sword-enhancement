# 검 키우기

브라우저에서 바로 실행되는 검 강화 게임. 빌드 과정 없이 `index.html`을 열면 동작합니다.

## 실행

- `index.html` 더블클릭 (또는 아무 정적 서버로 폴더 서빙)

## 데이터 제공 방법

### 아이템 데이터 테이블

[data/swords.js](data/swords.js) 파일을 직접 수정하면 됩니다. 강화 수치(+0 ~ 최대)당 한 줄이며, 각 필드의 의미는 파일 상단 주석에 있습니다:

| 필드 | 의미 |
|---|---|
| `level` | 강화 수치 (배열 순서와 일치) |
| `name` | 해당 수치의 검 이름 |
| `image` | 검 이미지 경로 |
| `sellPrice` | 판매 가격 (골드) |
| `successRate` | 다음 수치로의 강화 성공 확률 (%) |
| `enhanceCost` | 강화 1회 비용 (골드) |
| `destroyRate` | 강화 **실패 시** 검이 파괴될 확률 (%) |
| `downgradeProtectCost` | 하락 보호 비용 (골드) |
| `destroyProtectCost` | 파괴 보호 비용 (골드) |

레벨 수는 늘리거나 줄여도 됩니다. 마지막 항목이 최대 강화 단계가 됩니다.

### 검 이미지

`images/swords/` 폴더에 강화 수치별로 두 자리 숫자 이름으로 넣으면 됩니다:

```
images/swords/00.png   ← +0 검
images/swords/01.png   ← +1 검
...
images/swords/20.png   ← +20 검
```

- PNG(투명 배경) 권장, 세로로 긴 비율(약 1:2)이 가장 잘 맞습니다.
- 이미지가 없는 수치는 자동으로 기본 SVG 검(수치대별 색상)이 표시되므로, 일부만 넣어도 됩니다.
- 다른 파일명/경로를 쓰고 싶으면 `data/swords.js`의 `image` 필드만 바꾸면 됩니다.

## 저장

닉네임, 골드, 강화 중인 검, 보관함은 브라우저 localStorage에 자동 저장됩니다.
브라우저를 껐다 켜도 유지됩니다. (초기화하려면 개발자도구 → Application → Local Storage에서 `sword-game-*` 키 삭제)

## 온라인 채팅/랭킹 (선택)

기본은 오프라인 모드(채팅·랭킹이 내 브라우저에만 저장)입니다.
[js/config.js](js/config.js)에 Supabase URL과 publishable key를 넣으면 실제 다른 플레이어와 채팅·골드 랭킹이 공유됩니다. 필요한 테이블: `sword_chat`, `sword_players` (스키마는 js/backend.js 참고).

랭킹은 `전체 골드`와 `일일 획득 골드` 탭으로 나뉩니다. 일일 획득 골드는 판매나 지원금처럼 실제로 얻은 골드만 오늘 날짜 기준으로 누적합니다.

## 관리자 명령어

채팅 입력창에서 `/admin help`를 입력하면 관리자 명령어를 볼 수 있습니다.

- `/admin login <비밀번호>`: 관리자 모드 로그인
- `/admin reset-users`: 전체 유저 데이터 초기화 신호 전송
- `/admin reset-me`: 현재 브라우저 데이터만 초기화
- `/admin logout`: 관리자 모드 종료

온라인 모드에서는 Supabase SQL Editor에서 [sql/setup.sql](sql/setup.sql)을 다시 실행하고, 파일 안의 `CHANGE_ME_ADMIN_PASSWORD`를 실제 비밀번호로 바꿔야 합니다. 전체 초기화는 서버의 랭킹 데이터를 비우고 초기화 이벤트를 남기며, 접속 중이거나 다음에 접속한 브라우저가 그 이벤트를 보고 로컬 저장 데이터를 초기화합니다.
