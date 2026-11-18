/**
 * HealthClues Evidence-Based Body Science & Physiological Knowledge Base
 * Explains biological mechanisms of the human body connected to the player's Quiz topic
 * with interactive daily clue quizzes and detective game tie-ins.
 */

export interface BodyScienceChapter {
  id: string;
  title: string;
  subtitle: string;
  scientificConcept: string;
  mechanismDetail: string;
  actionableClue: string;
  pmid?: string;
}

export interface BodyScienceQuiz {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  clueReward: {
    id: string;
    title: string;
    description: string;
    icon: string;
  };
}

export interface BodyScienceTopic {
  id: string;
  title: string;
  badge: string;
  iconName: string;
  colorTone: string;
  matchedQuests: string[];
  summaryVi: string;
  chapters: BodyScienceChapter[];
  dailyQuiz: BodyScienceQuiz;
}

export const BODY_SCIENCE_TOPICS: BodyScienceTopic[] = [
  {
    id: "sleep-neurobiology",
    title: "Cơ Chế Giấc Ngủ & Nhịp Sinh Học",
    badge: "Sinh học giấc ngủ & Não bộ",
    iconName: "moon",
    colorTone: "#6366f1",
    matchedQuests: ["sleep", "insomnia", "general"],
    summaryVi: "Khám phá cách não bộ điều khiển cơn buồn ngủ qua phân tử Adenosine, nhịp sinh học ngày-đêm do ánh sáng điều hòa và cơ chế dọn sạch độc tố tế bào thần kinh trong pha ngủ sâu.",
    chapters: [
      {
        id: "ch-adenosine",
        title: "Áp Lực Giấc Ngủ & Phân Tử Adenosine",
        subtitle: "Tại sao bạn cảm thấy buồn ngủ sau một ngày dài?",
        scientificConcept: "Homeostatic Sleep Drive (Áp lực ngủ cân bằng nội môi)",
        mechanismDetail: "Mỗi giây bạn thức, các tế bào não liên tục tiêu thụ phân tử năng lượng ATP và giải phóng sản phẩm phụ là Adenosine. Khi Adenosine tích tụ ngày càng nhiều trong dịch não tủy, nó gắn vào các thụ thể thần kinh, gửi tín hiệu làm chậm hoạt động vỏ não và tạo cảm giác 'áp lực buồn ngủ'. Khi bạn ngủ một giấc trọn vẹn, hệ thống glymphatic sẽ dọn sạch toàn bộ Adenosine này để chuẩn bị cho ngày mới.",
        actionableClue: "Caffeine có cấu trúc tương tự Adenosine nên nó chiếm chỗ thụ thể, 'đánh lừa' não bạn là chưa mệt. Khi caffeine tan hết, toàn bộ Adenosine ứ đọng sẽ ập đến gây sụp năng lượng (Caffeine Crash). Hãy dừng nạp caffeine trước khi ngủ ít nhất 8 tiếng.",
        pmid: "24076395"
      },
      {
        id: "ch-circadian",
        title: "Đồng Hồ Sinh Học & Tuyến Tùng Tiết Melatonin",
        subtitle: "Cơ chế 'cảm ứng ánh sáng' điều hòa nhịp ngày đêm",
        scientificConcept: "Circadian Rhythm & SCN (Nhân trên chéo não)",
        mechanismDetail: "Sâu bên trong não bộ có một cụm khoảng 20.000 tế bào thần kinh gọi là nhân trên chéo (SCN) - đóng vai trò là 'đồng hồ tổng' của cơ thể. SCN nhận tín hiệu trực tiếp từ tế bào cảm quang trong võng mạc. Khi trời tối dần, SCN truyền lệnh cho Tuyến Tùng giải phóng hormone Melatonin vào máu, phát tín hiệu cho mọi cơ quan: 'Đã đến giờ nghỉ ngơi!'.",
        actionableClue: "Ánh sáng xanh từ màn hình điện thoại (bước sóng ~460nm) có thể ức chế tiết Melatonin tới 80%. Tắt bớt đèn trần và đón ánh nắng tự nhiên 15 phút sau khi thức dậy là chìa khóa vàng để đồng bộ nhịp sinh học.",
        pmid: "30311830"
      },
      {
        id: "ch-glymphatic",
        title: "Pha Ngủ Sâu N3 & Hệ Thống Tự Làm Sạch Glymphatic",
        subtitle: "Não bộ rửa sạch độc tố khi bạn chìm vào giấc ngủ sâu",
        scientificConcept: "Slow-Wave Sleep & Glymphatic Waste Clearance",
        mechanismDetail: "Trong giai đoạn ngủ sóng chậm (NREM Stage 3 - Deep Sleep), các tế bào thần kinh co lại khoảng 60%, tạo ra các khoảng trống lớn giữa các tế bào. Dòng dịch não tủy (CSF) sẽ tràn qua như một làn nước mát, cuốn trôi các mảng protein độc hại tích tụ ban ngày, bao gồm Beta-Amyloid và Tau - các chất liên quan đến suy giảm trí nhớ.",
        actionableClue: "Pha ngủ sâu N3 tập trung nhiều nhất ở nửa đầu của đêm (trước 2h sáng). Do đó, việc đi ngủ trước 23h giúp bạn tối ưu hóa thời gian não bộ được 'tắm rửa' sạch sẽ.",
        pmid: "24136970"
      }
    ],
    dailyQuiz: {
      id: "quiz-sleep-01",
      question: "Chất nào liên tục tích tụ trong não khi bạn thức và tạo ra 'áp lực buồn ngủ' tự nhiên?",
      options: [
        "Melatonin",
        "Adenosine",
        "Cortisol",
        "Adrenaline"
      ],
      correctIndex: 1,
      explanation: "Chính xác! Adenosine sinh ra từ quá trình đốt năng lượng ATP của tế bào não suốt cả ngày. Càng thức lâu, Adenosine tích lũy càng nhiều, tạo nên áp lực ngủ sinh học tự nhiên.",
      clueReward: {
        id: "clue-adenosine-key",
        title: "Manh Mối Sinh Học: Thụ Thể Adenosine",
        description: "Manh mối quý giá chứng minh giấc ngủ không thể ép buộc mà cần thời gian tích lũy áp lực sinh học tự nhiên.",
        icon: "zap"
      }
    }
  },
  {
    id: "stress-nervous-system",
    title: "Cơ Chế Căng Thẳng & Hệ Thần Kinh Đối Giao Cảm",
    badge: "Trục HPA & Dây thần kinh phế vị",
    iconName: "activity",
    colorTone: "#10b981",
    matchedQuests: ["stress", "anxiety"],
    summaryVi: "Hiểu rõ cơ chế trục Não - Thượng thận (HPA) tiết Cortisol khi căng thẳng và bí mật tại sao nhịp thở sâu 4-7-8 có thể kích hoạt dây thần kinh phế vị để lập tức hạ nhịp tim.",
    chapters: [
      {
        id: "ch-hpa-axis",
        title: "Trục HPA & Hormone Căng Thẳng Cortisol",
        subtitle: "Phản ứng sinh tồn nghìn năm và nghịch lý thời hiện đại",
        scientificConcept: "Hypothalamic-Pituitary-Adrenal Axis (Trục HPA)",
        mechanismDetail: "Khi não cảm nhận áp lực (dù là thú dữ hay deadline công việc), vùng dưới đồi phát tín hiệu cho tuyến thượng thận giải phóng Cortisol và Adrenaline. Tim đập nhanh, đồng tử giãn, đường huyết tăng vọt để chuẩn bị chạy trốn. Tuy nhiên, căng thẳng tâm lý kéo dài khiến Cortisol duy trì ở mức cao vào ban đêm, gây tỉnh táo giả tạo và cản trở cơ thể nghỉ ngơi.",
        actionableClue: "Nhịp sinh học tự nhiên của Cortisol nên cao nhất lúc 7h sáng để bạn tỉnh táo làm việc và chạm đáy vào nửa đêm. Hãy thực hiện nghi thức hạ nhiệt tâm trí trước khi ngủ.",
        pmid: "27756778"
      },
      {
        id: "ch-vagus-nerve",
        title: "Dây Thần Kinh Phế Vị (Vagus) & Sức Mạnh Nhịp Thở 4-7-8",
        subtitle: "Công tắc bật phanh hãm nhịp tim sinh học của cơ thể",
        scientificConcept: "Parasympathetic Activation & Vagal Nerve Tone",
        mechanismDetail: "Dây thần kinh phế vị (dây thần kinh sọ số X) là đường truyền tín hiệu chính của Hệ thần kinh Đối giao cảm (Rest & Digest). Khi bạn kéo dài hơi thở ra (như thở hít 4s - nín 7s - thở ra 8s), áp lực trong lồng ngực kích hoạt thụ thể áp lực baroreceptor, gửi tín hiệu trực tiếp kích hoạt dây thần kinh phế vị phóng thích Acetylcholine làm chậm nhịp tim ngay trong vòng 60-90 giây.",
        actionableClue: "Thực hành 4 chu kỳ thở 4-7-8 trước khi đi ngủ giúp cơ thể chuyển từ trạng thái 'báo động' (Giao cảm) sang trạng thái 'an toàn' (Đối giao cảm).",
        pmid: "30153464"
      }
    ],
    dailyQuiz: {
      id: "quiz-stress-01",
      question: "Kỹ thuật thở nào giúp kích hoạt dây thần kinh phế vị để làm dịu nhịp tim nhanh chóng?",
      options: [
        "Hít thật nhanh và thở dồn dập",
        "Thở ra chậm và kéo dài hơn thời gian hít vào (như 4-7-8)",
        "Nín thở liên tục trong 2 phút",
        "Thở nông bằng ngực trên"
      ],
      correctIndex: 1,
      explanation: "Xuất sắc! Khi pha thở ra dài gấp đôi pha hít vào, thụ thể áp lực kích thích dây thần kinh phế vị giải phóng Acetylcholine, ra lệnh cho tim đập chậm lại và cơ bắp thư giãn.",
      clueReward: {
        id: "clue-vagus-switch",
        title: "Manh Mối Sinh Học: Công Tắc Phế Vị",
        description: "Bằng chứng sinh lý học cho thấy hơi thở ra kéo dài là chiếc chìa khóa tự nhiên hạ nhịp tim và hóa giải căng thẳng.",
        icon: "heart"
      }
    }
  },
  {
    id: "metabolism-uric-acid",
    title: "Chuyển Hóa Cơ Thể, Cân Nặng & Đường Huyết",
    badge: "Đường huyết, GLUT4 & Cân bằng chuyển hóa",
    iconName: "trending-up",
    colorTone: "#f59e0b",
    matchedQuests: ["diabetes", "glucose", "blood_sugar", "tieu_duong", "weight", "gout", "uric-acid"],
    summaryVi: "Khám phá cơ chế làm phẳng đường cong Glucose để kích hoạt đốt mỡ tự nhiên, kích hoạt kênh GLUT4 qua vận động sau ăn và chu trình thoái giáng Purine thành Axit Uric tại gan.",
    chapters: [
      {
        id: "ch-insulin-curve",
        title: "Đường Cong Insulin & Chiếc Khóa Đốt Mỡ",
        subtitle: "Làm phẳng đỉnh Glucose để cơ thể sử dụng mỡ làm năng lượng",
        scientificConcept: "Insulin Sensitivity & Lipolysis Regulation",
        mechanismDetail: "Khi bạn ăn tinh bột hấp thu nhanh hoặc đường tinh luyện, nồng độ glucose trong máu tăng vọt, buộc tuyến tụy tiết lượng lớn Insulin để đưa đường vào tế bào. Khi nồng độ Insulin trong máu ở mức cao, enzym lipase (chuyên phân giải mỡ dự trữ) bị ức chế hoàn toàn. Chỉ khi đường huyết ổn định và Insulin hạ thấp, cơ thể mới có thể mở khóa kho mỡ để đốt cháy.",
        actionableClue: "Thứ tự ăn chuẩn sinh học: Ăn rau củ chất xơ trước -> Đạm & Chất béo -> Tinh bột sau cùng. Chất xơ tạo mạng lưới gel làm chậm hấp thu đường, ngăn đỉnh glucose tăng vọt.",
        pmid: "31779505"
      },
      {
        id: "ch-glut4-muscle",
        title: "Kênh GLUT4 & Đi Bộ 15 Phút Sau Bữa Ăn",
        subtitle: "Hạ đường huyết tự nhiên bằng sự co cơ mà không phụ thuộc insulin",
        scientificConcept: "Exercise-Induced GLUT4 Translocation",
        mechanismDetail: "Thông thường, glucose muốn đi vào tế bào cơ cần có insulin 'mở khóa'. Tuy nhiên, khi cơ bắp co bóp (như khi đi bộ nhẹ nhàng 15-20 phút sau ăn), nồng độ canxi nội bào và enzym AMPK tăng lên, kích thích các túi chứa kênh GLUT4 tự động hòa màng và hút glucose trực tiếp từ máu vào cơ bắp để tạo năng lượng, độc lập hoàn toàn với insulin. Nhờ đó, tụy được nghỉ ngơi và đường huyết sau ăn hạ nhanh chóng.",
        actionableClue: "Đi bộ nhẹ nhàng hoặc đứng thong thả 15-20 phút sau bữa ăn chính (tuyệt đối không nằm ngay) giúp giảm tới 30% đỉnh đường huyết sau ăn.",
        pmid: "27747394"
      },
      {
        id: "ch-purine-cycle",
        title: "Chu Trình Chuyển Hóa Purine & Đào Thải Axit Uric",
        subtitle: "Cơ chế enzym Xanthine Oxidase và vai trò của thận",
        scientificConcept: "Purine Metabolism & Renal Uric Acid Clearance",
        mechanismDetail: "Axit Uric là sản phẩm thoái biến tự nhiên của các nhân purine (có trong tế bào già cỗi của cơ thể và một số thực phẩm giàu purine như nội tạng, thịt đỏ). Enzym Xanthine Oxidase tại gan xúc tác phản ứng oxy hóa này. Khoảng 70% axit uric được đào thải qua nước tiểu ở thận. Uống thiếu nước hoặc tiêu thụ nhiều si-rô ngô giàu fructose sẽ cạnh tranh đường đào thải của axit uric ở ống thận.",
        actionableClue: "Uống rải đều 2-2.5 lít nước trong ngày kết hợp các loại thảo mộc giàu polyphenol (như Tía Tô, Atiso Đỏ) hỗ trợ quá trình bài tiết axit uric tự nhiên qua thận.",
        pmid: "28267232"
      }
    ],
    dailyQuiz: {
      id: "quiz-metabolism-01",
      question: "Thứ tự ăn uống nào theo y học chứng minh giúp làm phẳng đỉnh đường huyết (glucose spike) hiệu quả nhất?",
      options: [
        "Ăn đồ ngọt tráng miệng trước, sau đó mới ăn cơm",
        "Rau xanh chất xơ trước -> Đạm/chất béo -> Tinh bột sau cùng",
        "Ăn toàn bộ tinh bột trước rồi mới ăn thức ăn kèm",
        "Vừa ăn vừa uống nhiều nước ngọt có gas"
      ],
      correctIndex: 1,
      explanation: "Tuyệt vời! Chất xơ trong rau củ phủ một lớp màng bảo vệ lên niêm mạc ruột non, làm chậm tốc độ hấp thu đường bột vào máu và ngăn đỉnh insulin tăng vọt.",
      clueReward: {
        id: "clue-glucose-flat",
        title: "Manh Mối Sinh Học: Đường Cong Glucose",
        description: "Manh mối then chốt về thứ tự ăn uống giúp kiểm soát đường huyết và duy trì trạng thái đốt mỡ tự nhiên.",
        icon: "shield"
      }
    }
  }
];

export function getBodyScienceTopicsForProfile(quest?: string, topic?: string): BodyScienceTopic[] {
  const normQuest = (quest || "").toLowerCase();
  const normTopic = (topic || "").toLowerCase();

  let targetQuest = "sleep";
  if (
    normQuest.includes("diabetes") ||
    normQuest.includes("glucose") ||
    normTopic.includes("tiểu đường") ||
    normTopic.includes("đường huyết") ||
    normTopic.includes("đái tháo đường") ||
    normTopic.includes("glucose")
  ) {
    targetQuest = "diabetes";
  } else if (normQuest.includes("stress") || normTopic.includes("căng thẳng") || normTopic.includes("lo âu")) {
    targetQuest = "stress";
  } else if (normQuest.includes("weight") || normTopic.includes("cân") || normTopic.includes("gout") || normTopic.includes("uric")) {
    targetQuest = "weight";
  }

  return [...BODY_SCIENCE_TOPICS].sort((a, b) => {
    const aMatch = a.matchedQuests.includes(targetQuest);
    const bMatch = b.matchedQuests.includes(targetQuest);
    if (aMatch && !bMatch) return -1;
    if (!aMatch && bMatch) return 1;
    return 0;
  });
}
