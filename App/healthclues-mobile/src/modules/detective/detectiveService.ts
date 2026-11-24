import { getStoredSession, resolveServiceUrl } from "@/services/api";

export interface MobileDetectiveCase {
  id: string;
  title: string;
  topic: "sleep" | "gout" | "migraine";
  topicLabel: string;
  victim: string;
  difficulty: 1 | 2 | 3;
  coinReward: number;
  expReward: number;
  description: string;
  sceneName: string;
  clues: {
    id: string;
    title: string;
    description: string;
    isKey: boolean;
  }[];
  culpritOptions: {
    id: string;
    text: string;
    isCorrect: boolean;
    explanation: string;
  }[];
}

export const DETECTIVE_CASES: MobileDetectiveCase[] = [
  {
    id: "case-sleep-001",
    title: "Bí Ẩn Đêm Không Ngủ",
    topic: "sleep",
    topicLabel: "Giấc Ngủ & Nhịp Sinh Học",
    victim: "Bạn An (24 tuổi)",
    difficulty: 1,
    coinReward: 120,
    expReward: 40,
    description:
      "Bạn An ở Làng Sống Khỏe liên tục trằn trọc đến 3 giờ sáng không thể chợp mắt. An khẳng định mình đã uống trà thảo mộc nhưng tại sao vẫn thức trắng đêm?",
    sceneName: "Phòng Ngủ Của An",
    clues: [
      {
        id: "clue-1",
        title: "Tách trà trên bàn",
        description: "An uống trà xanh đậm đặc lúc 9h tối (chứa nhiều caffeine làm ức chế adenosine).",
        isKey: true,
      },
      {
        id: "clue-2",
        title: "Điện thoại còn sáng màn hình",
        description: "Điện thoại lướt mạng xã hội liên tục phát ra ánh sáng xanh ức chế melatonin.",
        isKey: true,
      },
      {
        id: "clue-3",
        title: "Nhiệt độ phòng ngủ",
        description: "Phòng ngủ đóng kín quá ngột ngạt (29°C), nhiệt độ lý tưởng cho giấc ngủ là 20-22°C.",
        isKey: false,
      },
    ],
    culpritOptions: [
      {
        id: "ans-1",
        text: "Uống trà xanh đậm đặc buổi tối và dùng điện thoại phát ánh sáng xanh trước khi ngủ.",
        isCorrect: true,
        explanation:
          "Chính xác! Caffeine trong trà xanh chặn thụ thể Adenosine gây tỉnh táo giả, kết hợp ánh sáng xanh ức chế Melatonin làm đồng hồ sinh học bị đảo lộn hoàn toàn.",
      },
      {
        id: "ans-2",
        text: "Do An không tập thể dục cường độ cao lúc nửa đêm.",
        isCorrect: false,
        explanation: "Sai rồi. Tập thể dục nặng sát giờ ngủ sẽ làm tăng nhịp tim và thân nhiệt, càng làm khó ngủ hơn.",
      },
      {
        id: "ans-3",
        text: "Do phòng ngủ quá lạnh và thiếu ánh sáng.",
        isCorrect: false,
        explanation: "Không đúng. Phòng ngủ của An thực tế bị bí và ngột ngạt.",
      },
    ],
  },
  {
    id: "case-gout-002",
    title: "Cơn Đau Gút Lúc Nửa Đêm",
    topic: "gout",
    topicLabel: "Chuyển Hóa & Axit Uric",
    victim: "Chú Minh (48 tuổi)",
    difficulty: 2,
    coinReward: 150,
    expReward: 50,
    description:
      "Chú Minh bỗng thức giấc lúc 2 giờ sáng vì ngón chân cái sưng đỏ tấy, đau dữ dội như bị kim châm. Hãy điều tra nguyên nhân bữa ăn tối qua của chú!",
    sceneName: "Bàn Ăn Nhà Chú Minh",
    clues: [
      {
        id: "clue-1",
        title: "Vỏ lon bia và đĩa lòng nướng",
        description: "Bữa liên hoan tối qua gồm nội tạng động vật giàu purine và 3 cốc bia lớn.",
        isKey: true,
      },
      {
        id: "clue-2",
        title: "Cốc nước lọc rỗng",
        description: "Cả ngày chú Minh quên uống nước, cơ thể bị mất nước làm axit uric kết tinh nhanh hơn.",
        isKey: true,
      },
      {
        id: "clue-3",
        title: "Đôi giày đi bộ",
        description: "Giày để gọn gàng ở góc nhà, chú không hề bị chấn thương cơ học.",
        isKey: false,
      },
    ],
    culpritOptions: [
      {
        id: "ans-1",
        text: "Nạp lượng lớn đạm Purine từ nội tạng kết hợp cồn từ bia và uống quá ít nước.",
        isCorrect: true,
        explanation:
          "Tuyệt vời! Bia ức chế thận bài tiết axit uric, còn nội tạng phân giải tạo ồ ạt tinh thể Urat lắng đọng tại khớp ngón chân cái gây cơn gút cấp.",
      },
      {
        id: "ans-2",
        text: "Do chú Minh đi bộ quá nhiều làm bong gân khớp ngón chân.",
        isCorrect: false,
        explanation: "Sai rồi. Khớp ngón chân cái của chú sưng đỏ nóng rát do viêm khớp vi tinh thể Urat, không phải chấn thương.",
      },
    ],
  },
  {
    id: "case-migraine-003",
    title: "Cơn Đau Nửa Đầu Bí Ẩn",
    topic: "migraine",
    topicLabel: "Thần Kinh & Căng Thẳng",
    victim: "Chị Lan (32 tuổi)",
    difficulty: 2,
    coinReward: 140,
    expReward: 45,
    description:
      "Chị Lan làm việc tại Làng Sống Khỏe bị cơn đau nhức giật giật nửa đầu bên trái kèm buồn nôn và sợ ánh sáng. Nguyên nhân bắt nguồn từ đâu?",
    sceneName: "Góc Bàn Làm Việc",
    clues: [
      {
        id: "clue-1",
        title: "Hộp cơm bỏ dở",
        description: "Chị Lan nhịn ăn trưa để chạy deadline, đường huyết giảm đột ngột kích hoạt cơn đau đầu.",
        isKey: true,
      },
      {
        id: "clue-2",
        title: "Bình nước cạn đáy",
        description: "Lượng nước uống trong ngày chưa tới 500ml.",
        isKey: true,
      },
    ],
    culpritOptions: [
      {
        id: "ans-1",
        text: "Bỏ bữa gây tụt đường huyết kết hợp mất nước và căng thẳng liên tục trước máy tính.",
        isCorrect: true,
        explanation:
          "Chính xác! Tụt đường huyết và mất nước kích thích dây thần kinh sinh ba (Trigeminal nerve) làm co thắt mạch máu não gây cơn đau nửa đầu Migraine.",
      },
    ],
  },
];

export async function getSolvedCaseIds(): Promise<string[]> {
  const session = await getStoredSession();
  if (!session) return [];
  const base = typeof window !== "undefined" ? "" : resolveServiceUrl(process.env.EXPO_PUBLIC_API_URL, 3329);
  const response = await fetch(`${base}/api/healthclues/mobile-detective/campaign`, { headers: { Authorization: `Bearer ${session.access_token}` }, cache: "no-store" });
  if (!response.ok) throw new Error(`Không tải được tiến trình điều tra (${response.status}).`);
  const payload = await response.json() as { progress?: Array<{ caseId?: string; case_id?: string; status?: string }> };
  return (payload.progress ?? []).filter(item => item.status === "solved").map(item => item.caseId ?? item.case_id ?? "").filter(Boolean);
}

export async function recordCaseSolved(
  caseItem: MobileDetectiveCase,
  stars: number
): Promise<{ coinsEarned: number; expEarned: number }> {
  const session = await getStoredSession();
  if (!session) throw new Error("Đăng nhập để lưu hồ sơ đã giải.");
  const base = typeof window !== "undefined" ? "" : resolveServiceUrl(process.env.EXPO_PUBLIC_API_URL, 3329);
  const response = await fetch(`${base}/api/healthclues/mobile-detective/solve`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
    body: JSON.stringify({ caseId: caseItem.id, stars, foundClues: caseItem.clues.map(clue => clue.id), connections: [] }),
  });
  if (!response.ok) throw new Error(`Không lưu được hồ sơ đã giải (${response.status}).`);
  const result = await response.json() as { coinsAwarded?: number; expAwarded?: number };
  return { coinsEarned: result.coinsAwarded ?? 0, expEarned: result.expAwarded ?? 0 };
}
