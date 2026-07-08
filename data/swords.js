// ============================================================
// 검 키우기 - 아이템 데이터 테이블
// 이 파일을 직접 수정해서 밸런스를 조정하세요. (fetch를 쓰지 않고
// <script>로 로드하므로 index.html을 더블클릭해 열어도 동작합니다)
//
// 각 항목의 의미:
//   level                : 강화 수치 (+N). 배열 순서와 일치해야 함
//   name                 : 해당 수치에서의 검 이름
//   image                : 검 이미지 경로. 파일이 없으면 기본 SVG 검이 표시됨
//   sellPrice            : 판매 가격 (골드)
//   successRate          : 이 수치에서 "다음 수치로" 강화 시도 시 성공 확률 (%)
//   enhanceCost          : 강화 1회 비용 (골드)
//   destroyRate          : 강화 "실패 시" 검이 파괴될 확률 (%)
//   downgradeProtectCost : 하락 보호 비용 (체크 시 강화 비용에 합산, 실패해도 수치 유지)
//   destroyProtectCost   : 파괴 보호 비용 (체크 시 강화 비용에 합산, 파괴를 막음)
//
// 마지막 항목은 최대 강화 단계로, 더 이상 강화할 수 없습니다.
// ============================================================
window.SWORD_DATA = {
  startingGold: 1000,
  levels: [
    { level: 0,  name: "낡은 검",         image: "images/swords/00.png", sellPrice: 0,         successRate: 97.75, enhanceCost: 100,    destroyRate: 0,  downgradeProtectCost: 100,      destroyProtectCost: 0 },
    { level: 1,  name: "무쇠 검",         image: "images/swords/01.png", sellPrice: 250,       successRate: 94.75, enhanceCost: 180,    destroyRate: 0,  downgradeProtectCost: 180,    destroyProtectCost: 0 },
    { level: 2,  name: "단련된 검",       image: "images/swords/02.png", sellPrice: 525,       successRate: 90.02, enhanceCost: 325,    destroyRate: 0,  downgradeProtectCost: 325,    destroyProtectCost: 0 },
    { level: 3,  name: "견습 기사의 검",  image: "images/swords/03.png", sellPrice: 1100,      successRate: 85.52, enhanceCost: 580,    destroyRate: 0,  downgradeProtectCost: 580,    destroyProtectCost: 0 },
    { level: 4,  name: "기사의 검",       image: "images/swords/04.png", sellPrice: 2300,      successRate: 81.25, enhanceCost: 1050,    destroyRate: 0,  downgradeProtectCost: 1050,   destroyProtectCost: 0 },
    { level: 5,  name: "백은 검",         image: "images/swords/05.png", sellPrice: 4860,      successRate: 77.18, enhanceCost: 1890,   destroyRate: 0,  downgradeProtectCost: 1890,   destroyProtectCost: 0 },
    { level: 6,  name: "황금 검",         image: "images/swords/06.png", sellPrice: 10210,     successRate: 73.32, enhanceCost: 3400,   destroyRate: 0,  downgradeProtectCost: 3400,   destroyProtectCost: 0 },
    { level: 7,  name: "마력이 깃든 검",  image: "images/swords/07.png", sellPrice: 21440,     successRate: 69.65, enhanceCost: 6120,   destroyRate: 0,  downgradeProtectCost: 6120,  destroyProtectCost: 0 },
    { level: 8,  name: "정령의 검",       image: "images/swords/08.png", sellPrice: 45020,     successRate: 66.17, enhanceCost: 11020,   destroyRate: 0,  downgradeProtectCost: 11020,  destroyProtectCost: 0 },
    { level: 9,  name: "화염의 검",       image: "images/swords/09.png", sellPrice: 94550,    successRate: 62.86, enhanceCost: 19835,   destroyRate: 0,  downgradeProtectCost: 19835,  destroyProtectCost: 0 },
    { level: 10, name: "빙결의 검",       image: "images/swords/10.png", sellPrice: 198570,    successRate: 59.72, enhanceCost: 35705,  destroyRate: 0,  downgradeProtectCost: 35705, destroyProtectCost: 0 },
    { level: 11, name: "뇌전의 검",       image: "images/swords/11.png", sellPrice: 416997,    successRate: 42.5,  enhanceCost: 64270,  destroyRate: 0.3, downgradeProtectCost: 64270, destroyProtectCost: 128540 },
    { level: 12, name: "용사의 검",       image: "images/swords/12.png", sellPrice: 875690,    successRate: 36.12, enhanceCost: 115680,  destroyRate: 0.36, downgradeProtectCost: 115680, destroyProtectCost: 132160 },
    { level: 13, name: "드래곤 슬레이어", image: "images/swords/13.png", sellPrice: 1838950,   successRate: 30.70, enhanceCost: 208230,  destroyRate: 0.43, downgradeProtectCost: 208230, destroyProtectCost: 416460 },
    { level: 14, name: "심연의 검",       image: "images/swords/14.png", sellPrice: 3861800,   successRate: 26.1,  enhanceCost: 374810,  destroyRate: 0.52, downgradeProtectCost: 374810, destroyProtectCost: 749620 },
    { level: 15, name: "천상의 검",       image: "images/swords/15.png", sellPrice: 8109800,   successRate: 22.18, enhanceCost: 674665, destroyRate: 0.62, downgradeProtectCost: 674665, destroyProtectCost: 1349330 },
    { level: 16, name: "타락한 성검",     image: "images/swords/16.png", sellPrice: 17030580,  successRate: 18.85, enhanceCost: 1214395, destroyRate: 2.1, downgradeProtectCost: 1214395, destroyProtectCost: 2428790 },
    { level: 17, name: "구원의 성검",     image: "images/swords/17.png", sellPrice: 35764220,  successRate: 16.02, enhanceCost: 2185910, destroyRate: 3.55, downgradeProtectCost: 2185910, destroyProtectCost: 4271820 },
    { level: 18, name: "신화의 검",       image: "images/swords/18.png", sellPrice: 75104850,  successRate: 13.62, enhanceCost: 3934640, destroyRate: 5.99, downgradeProtectCost: 3934640, destroyProtectCost: 7869280 },
    { level: 19, name: "창세의 검",       image: "images/swords/19.png", sellPrice: 157720200, successRate: 11.58, enhanceCost: 7082350, destroyRate: 33.05, downgradeProtectCost: 7082350, destroyProtectCost: 14164700 },
    { level: 20, name: "신을 베는 검",    image: "images/swords/20.png", sellPrice: 331212420, successRate: 9.84, enhanceCost: 12748230, destroyRate: 42.96, downgradeProtectCost: 12748230, destroyProtectCost: 25496460 },
    { level: 21, name: "차원의 검",       image: "images/swords/21.png", sellPrice: 695546080, successRate: 8.36, enhanceCost: 22946815, destroyRate: 55.05, downgradeProtectCost: 22946815, destroyProtectCost: 45893630 },
    { level: 22, name: "별빛의 검",       image: "images/swords/22.png", sellPrice: 1460646770, successRate: 7.11, enhanceCost: 41304265, destroyRate: 69.65, downgradeProtectCost: 41304265, destroyProtectCost: 82608530 },
    { level: 23, name: "운명의 검",       image: "images/swords/23.png", sellPrice: 3067358220, successRate: 6.04, enhanceCost: 74347675, destroyRate: 73.32, downgradeProtectCost: 74347675, destroyProtectCost: 148695350 },
    { level: 24, name: "시간의 검",       image: "images/swords/24.png", sellPrice: 6441452260, successRate: 5.13, enhanceCost: 133825815, destroyRate: 73.32, downgradeProtectCost: 133825815, destroyProtectCost: 267651630 },
    { level: 25, name: "공허의 검",       image: "images/swords/25.png", sellPrice: 13527049750, successRate: 4.36, enhanceCost: 240886465, destroyRate: 77.18, downgradeProtectCost: 240886465, destroyProtectCost: 481772930 },
    { level: 26, name: "영원의 검",       image: "images/swords/26.png", sellPrice: 28406804480, successRate: 3.71, enhanceCost: 433595635, destroyRate: 85.52, downgradeProtectCost: 433595635, destroyProtectCost: 867191270 },
    { level: 27, name: "태초의 검",       image: "images/swords/27.png", sellPrice: 59654289410, successRate: 3.15, enhanceCost: 780472145, destroyRate: 90.02, downgradeProtectCost: 780472145, destroyProtectCost: 1560944290 },
    { level: 28, name: "무한의 검",       image: "images/swords/28.png", sellPrice: 125274007760, successRate: 2.68, enhanceCost: 1404849860, destroyRate: 94.75, downgradeProtectCost: 1404849860, destroyProtectCost: 2809699720 },
    { level: 29, name: "절대자의 검",     image: "images/swords/29.png", sellPrice: 263075416300, successRate: 2.28, enhanceCost: 2528729750, destroyRate: 97.75, downgradeProtectCost: 2528729750, destroyProtectCost: 5057459500 },
    { level: 30, name: "세계의 검",       image: "images/swords/30.png", sellPrice: 552458374230, successRate: 0, enhanceCost: 0, destroyRate: 0, downgradeProtectCost: 0, destroyProtectCost: 0 }
  ]
};
