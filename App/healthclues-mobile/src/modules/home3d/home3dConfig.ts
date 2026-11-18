export interface FurnitureShopItem {
  id: string;
  nameVi: string;
  room: "living" | "bedroom" | "kitchen";
  roomLabel: string;
  priceCoins: number;
  descVi: string;
  isUnlockedDefault?: boolean;
}

export const FURNITURE_CATALOG: FurnitureShopItem[] = [
  {
    id: "sofa_luxury",
    nameVi: "Sofa Hoàng Gia Êm Ái",
    room: "living",
    roomLabel: "Phòng Khách",
    priceCoins: 0,
    descVi: "Sofa bọc nhung cao cấp, nâng đỡ cột sống sau ngày dài thám hiểm.",
    isUnlockedDefault: true,
  },
  {
    id: "table_coffee",
    nameVi: "Bàn Trà Gỗ Sồi Alpine",
    room: "living",
    roomLabel: "Phòng Khách",
    priceCoins: 50,
    descVi: "Bàn trà mộc mạc để nhâm nhi tách trà thảo mộc ấm trước khi ngủ.",
  },
  {
    id: "fireplace_stone",
    nameVi: "Lò Sưởi Đá Nguyên Khối",
    room: "living",
    roomLabel: "Phòng Khách",
    priceCoins: 80,
    descVi: "Lò sưởi củi thông tí tách sưởi ấm toàn bộ căn phòng gỗ tuyết.",
  },
  {
    id: "piano_grand",
    nameVi: "Đàn Grand Piano Cổ Điển",
    room: "living",
    roomLabel: "Phòng Khách",
    priceCoins: 120,
    descVi: "Đàn dương cầm tấu lên những bản nhạc êm dịu giúp thư giãn não bộ.",
  },
  {
    id: "painting_fireplace",
    nameVi: "Tranh Sơn Dầu Dãy Núi Tuyết",
    room: "living",
    roomLabel: "Phòng Khách",
    priceCoins: 40,
    descVi: "Khung tranh phong cảnh nguyên bản mang lại cảm giác bình yên, tĩnh tại.",
  },
  {
    id: "bed_master",
    nameVi: "Giường Ngủ Master Dưỡng Sinh",
    room: "bedroom",
    roomLabel: "Phòng Ngủ",
    priceCoins: 100,
    descVi: "Nệm cao su thiên nhiên nâng đỡ hoàn hảo, xua tan đau lưng và mất ngủ.",
  },
  {
    id: "plant_pot_alps",
    nameVi: "Chậu Thông Lùn Thanh Lọc",
    room: "living",
    roomLabel: "Phòng Khách",
    priceCoins: 30,
    descVi: "Cây xanh bản địa tiết ra phytoncide giúp thanh lọc không khí trong lành.",
  },
  {
    id: "lantern_hanging",
    nameVi: "Đèn Chùm Pha Lê Ấm Áp",
    room: "kitchen",
    roomLabel: "Bếp Ăn",
    priceCoins: 60,
    descVi: "Ánh sáng vàng dịu dàng không gây chói mắt, giữ gìn giấc ngủ ngon.",
  },
];
