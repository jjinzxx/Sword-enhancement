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
  startingGold: 5000,
  levels: [
    { level: 0,  name: "낡은 검",         image: "images/swords/00.png", sellPrice: 0,         successRate: 95, enhanceCost: 100,    destroyRate: 0,  downgradeProtectCost: 0,      destroyProtectCost: 0 },
    { level: 1,  name: "무쇠 검",         image: "images/swords/01.png", sellPrice: 250,       successRate: 90, enhanceCost: 160,    destroyRate: 0,  downgradeProtectCost: 200,    destroyProtectCost: 0 },
    { level: 2,  name: "단련된 검",       image: "images/swords/02.png", sellPrice: 550,       successRate: 85, enhanceCost: 250,    destroyRate: 0,  downgradeProtectCost: 300,    destroyProtectCost: 0 },
    { level: 3,  name: "견습 기사의 검",  image: "images/swords/03.png", sellPrice: 1200,      successRate: 80, enhanceCost: 400,    destroyRate: 0,  downgradeProtectCost: 500,    destroyProtectCost: 0 },
    { level: 4,  name: "기사의 검",       image: "images/swords/04.png", sellPrice: 2500,      successRate: 75, enhanceCost: 650,    destroyRate: 0,  downgradeProtectCost: 800,    destroyProtectCost: 0 },
    { level: 5,  name: "백은 검",         image: "images/swords/05.png", sellPrice: 5200,      successRate: 70, enhanceCost: 1000,   destroyRate: 5,  downgradeProtectCost: 1200,   destroyProtectCost: 2000 },
    { level: 6,  name: "황금 검",         image: "images/swords/06.png", sellPrice: 11000,     successRate: 65, enhanceCost: 1600,   destroyRate: 7,  downgradeProtectCost: 2000,   destroyProtectCost: 3200 },
    { level: 7,  name: "마력이 깃든 검",  image: "images/swords/07.png", sellPrice: 23000,     successRate: 60, enhanceCost: 2600,   destroyRate: 9,  downgradeProtectCost: 3200,   destroyProtectCost: 5200 },
    { level: 8,  name: "정령의 검",       image: "images/swords/08.png", sellPrice: 48000,     successRate: 55, enhanceCost: 4200,   destroyRate: 12, downgradeProtectCost: 5000,   destroyProtectCost: 8400 },
    { level: 9,  name: "화염의 검",       image: "images/swords/09.png", sellPrice: 100000,    successRate: 50, enhanceCost: 6700,   destroyRate: 15, downgradeProtectCost: 8000,   destroyProtectCost: 13500 },
    { level: 10, name: "빙결의 검",       image: "images/swords/10.png", sellPrice: 210000,    successRate: 45, enhanceCost: 10000,  destroyRate: 20, downgradeProtectCost: 12000,  destroyProtectCost: 20000 },
    { level: 11, name: "뇌전의 검",       image: "images/swords/11.png", sellPrice: 440000,    successRate: 40, enhanceCost: 16000,  destroyRate: 24, downgradeProtectCost: 19000,  destroyProtectCost: 32000 },
    { level: 12, name: "용사의 검",       image: "images/swords/12.png", sellPrice: 920000,    successRate: 35, enhanceCost: 26000,  destroyRate: 28, downgradeProtectCost: 31000,  destroyProtectCost: 52000 },
    { level: 13, name: "드래곤 슬레이어", image: "images/swords/13.png", sellPrice: 1900000,   successRate: 30, enhanceCost: 42000,  destroyRate: 32, downgradeProtectCost: 50000,  destroyProtectCost: 84000 },
    { level: 14, name: "심연의 검",       image: "images/swords/14.png", sellPrice: 4000000,   successRate: 27, enhanceCost: 67000,  destroyRate: 36, downgradeProtectCost: 80000,  destroyProtectCost: 134000 },
    { level: 15, name: "천상의 검",       image: "images/swords/15.png", sellPrice: 8400000,   successRate: 24, enhanceCost: 100000, destroyRate: 40, downgradeProtectCost: 120000, destroyProtectCost: 200000 },
    { level: 16, name: "타락한 성검",     image: "images/swords/16.png", sellPrice: 17600000,  successRate: 21, enhanceCost: 160000, destroyRate: 44, downgradeProtectCost: 190000, destroyProtectCost: 320000 },
    { level: 17, name: "구원의 성검",     image: "images/swords/17.png", sellPrice: 37000000,  successRate: 18, enhanceCost: 260000, destroyRate: 48, downgradeProtectCost: 310000, destroyProtectCost: 520000 },
    { level: 18, name: "신화의 검",       image: "images/swords/18.png", sellPrice: 78000000,  successRate: 15, enhanceCost: 420000, destroyRate: 52, downgradeProtectCost: 500000, destroyProtectCost: 840000 },
    { level: 19, name: "창세의 검",       image: "images/swords/19.png", sellPrice: 163000000, successRate: 12, enhanceCost: 670000, destroyRate: 56, downgradeProtectCost: 800000, destroyProtectCost: 1340000 },
    { level: 20, name: "신을 베는 검",    image: "images/swords/20.png", sellPrice: 342000000, successRate: 0,  enhanceCost: 0,      destroyRate: 0,  downgradeProtectCost: 0,      destroyProtectCost: 0 }
  ]
};
