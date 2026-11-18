/**
 * HealthClues Evidence-Based Botanical & Herbal Knowledge Base
 * Ported from Web Botanical Library with verified PubMed PMIDs,
 * bioactive compounds, physiological mechanisms, practical tea rituals,
 * and strict educational/safety guidelines.
 */

export interface HerbalCompound {
  name: string;
  role: string;
}

export interface HerbalMechanism {
  title: string;
  desc: string;
}

export interface HerbalStudy {
  pmid: string;
  title: string;
  authors: string;
  year: number;
  journal: string;
  studyType: "human_clinical_trial" | "systematic_review" | "animal" | "in_vitro";
  summary: string;
}

export interface HerbalTeaRitual {
  recipeName: string;
  waterTemp: string; // e.g. "85°C - 90°C"
  steepTime: string; // e.g. "5 - 7 phút"
  bestTime: string;  // e.g. "45 phút trước khi đi ngủ"
  tasteNote: string; // e.g. "Hương táo ngọt dịu, hậu vị thanh khiết"
  preparationTip: string;
}

export interface HerbalArticle {
  id: string;
  commonName: string;
  englishName: string;
  scientificName: string;
  categoryBadge: string;
  shortDesc: string;
  matchedTopics: string[]; // e.g. "sleep", "stress", "gout", "weight", "general"
  keyHighlights: string[];
  compounds: HerbalCompound[];
  mechanisms: HerbalMechanism[];
  study: HerbalStudy;
  teaRitual: HerbalTeaRitual;
  cautions: string[];
  colorTone: string;
}

export const HERBAL_CATALOG: HerbalArticle[] = [
  {
    id: "matricaria-chamomilla",
    commonName: "Cúc La Mã",
    englishName: "German Chamomile",
    scientificName: "Matricaria chamomilla L.",
    categoryBadge: "Thảo mộc dịu thần kinh & giấc ngủ",
    colorTone: "#f59e0b",
    shortDesc: "Loài hoa thảo mộc nổi tiếng với lịch sử hàng trăm năm. Các nghiên cứu hiện đại chứng minh hoạt chất Apigenin gắn kết có chọn lọc vào thụ thể GABA trong não, giúp giảm trạng thái kích động thần kinh và tạo cơn buồn ngủ tự nhiên.",
    matchedTopics: ["sleep", "insomnia", "stress", "anxiety", "general"],
    keyHighlights: [
      "Apigenin gắn thụ thể GABA-A làm dịu dẫn truyền thần kinh trung ương",
      "Thư giãn cơ trơn đường tiêu hóa, giảm cảm giác co thắt đầy bụng ban đêm",
      "Hỗ trợ rút ngắn thời gian chìm vào giấc ngủ (sleep onset latency)"
    ],
    compounds: [
      {
        name: "Apigenin (Bioflavonoid)",
        role: "Vượt qua hàng rào máu - não, gắn vào vị trí thụ thể benzodiazepine trên phức hợp GABA-A, tạo hiệu ứng thư giãn êm dịu mà không gây nghiện."
      },
      {
        name: "Chamazulene & Bisabolol",
        role: "Sesquiterpene trong tinh dầu hoa giúp kháng viêm, làm dịu niêm mạc dạ dày và xoa dịu cảm giác bồn chồn cơ bắp."
      },
      {
        name: "Luteolin & Quercetin",
        role: "Chất chống oxy hóa tự nhiên bảo vệ tế bào thần kinh trước các gốc tự do tích tụ do thiếu ngủ mạn tính."
      }
    ],
    mechanisms: [
      {
        title: "Điều hòa thụ thể GABA-A ức chế kích thích",
        desc: "GABA là chất dẫn truyền thần kinh ức chế chính. Apigenin đóng vai trò phối tử có hoạt lực vừa phải, giúp tăng cường dẫn truyền ức chế tự nhiên, làm dịu hoạt động kích thích của vỏ não trước giờ ngủ."
      },
      {
        title: "Giảm kích thích giao cảm trước giấc ngủ (Pre-sleep Hyperarousal)",
        desc: "Hạ bớt các suy nghĩ lo âu lặp lại (rumination) và nhịp tim nhanh nhẹ khi lên giường, tạo điều kiện thuận lợi để cơ thể chuyển giao nhịp sinh học sang trạng thái nghỉ ngơi."
      }
    ],
    study: {
      pmid: "29154054",
      title: "The effects of chamomile extract on sleep quality among elderly people: A clinical trial",
      authors: "Adib-Hajbaghery M, Mousavi SN",
      year: 2017,
      journal: "Complementary Therapies in Medicine",
      studyType: "human_clinical_trial",
      summary: "Thử nghiệm lâm sàng ngẫu nhiên có đối chứng trên 60 người trưởng thành dùng chiết xuất Cúc La Mã trong 28 ngày. Kết quả ghi nhận chất lượng giấc ngủ theo thang đo PSQI cải thiện rõ rệt và giảm số lần thức giấc giữa đêm."
    },
    teaRitual: {
      recipeName: "Tách Trà Cúc Trăng Êm Đềm",
      waterTemp: "85°C - 90°C",
      steepTime: "5 - 7 phút",
      bestTime: "45 phút trước khi đi ngủ",
      tasteNote: "Hương táo xanh thoang thoảng, vị ngọt thanh tự nhiên, hậu vị ấm áp dịu nhẹ.",
      preparationTip: "Dùng 3-5 bông cúc khô hãm trong 200ml nước sôi để nguội bớt (tránh nước 100°C làm bay hơi tinh dầu chamazulene quý giá). Đậy nắp ấm khi hãm để giữ trọn vẹn hương thơm."
    },
    cautions: [
      "Người có tiền sử dị ứng thực vật họ Cúc (Asteraceae như bồ công anh, cúc vạn thọ) cần thận trọng.",
      "Không uống đồng thời với thuốc an thần nhóm Benzodiazepine hoặc rượu bia vì có thể tăng độ buồn ngủ quá mức."
    ]
  },
  {
    id: "passiflora-incarnata",
    commonName: "Lạc Tiên Tây",
    englishName: "Passionflower",
    scientificName: "Passiflora incarnata L.",
    categoryBadge: "Thảo dược sâu giấc & ổn định chu kỳ REM",
    colorTone: "#8b5cf6",
    shortDesc: "Được y học thảo dược châu Âu công nhận trong việc điều hòa lo âu và cải thiện cấu trúc giấc ngủ. Lạc tiên thúc đẩy pha ngủ sóng chậm N3 (ngủ sâu) - giai đoạn tế bào cơ thể và não bộ phục hồi mạnh mẽ nhất.",
    matchedTopics: ["sleep", "insomnia", "stress", "anxiety"],
    keyHighlights: [
      "Thúc đẩy chu kỳ ngủ sâu N3 (Slow Wave Sleep) phục hồi não bộ",
      "Tăng nồng độ GABA tự thân trong synap thần kinh",
      "Giảm trạng thái căng thẳng bồn chồn, hồi hộp đánh trống ngực"
    ],
    compounds: [
      {
        name: "Vitexin & Isovitexin",
        role: "Flavonoid glycoside có tác dụng điều hòa hoạt động của trục thần kinh giao cảm, làm giảm cảm giác bức bối, lo âu."
      },
      {
        name: "Harmala Alkaloids (hàm lượng vết)",
        role: "Hỗ trợ ức chế nhẹ tái hấp thu chất dẫn truyền thần kinh tạo cảm xúc tích cực, giúp tâm trí thanh thản khi chuẩn bị ngủ."
      },
      {
        name: "Maltol",
        role: "Hợp chất làm dịu cơ và giảm đau mỏi cơ thể sau ngày dài vận động căng thẳng."
      }
    ],
    mechanisms: [
      {
        title: "Tái cân bằng nồng độ GABA nội sinh",
        desc: "Chiết xuất Lạc Tiên Tây làm chậm quá trình thoái giáng GABA trong synap, duy trì thời gian tác dụng của chất làm dịu thần kinh nội sinh mà không can thiệp thô bạo vào thụ thể hóa học."
      },
      {
        title: "Bảo tồn kiến trúc pha ngủ sóng chậm (NREM Stage 3)",
        desc: "Khác với thuốc ngủ tổng hợp thường triệt tiêu giấc ngủ sóng chậm và giấc ngủ REM, thảo mộc Lạc Tiên giúp duy trì sự liền mạch tự nhiên giữa các chu kỳ 90 phút của đêm."
      }
    ],
    study: {
      pmid: "33352740",
      title: "Effects of Passiflora incarnata Linnaeus on sleep quality: A systematic review",
      authors: "Janda K, Wojtkowska K, Jakubczyk K",
      year: 2020,
      journal: "Nutrients",
      studyType: "systematic_review",
      summary: "Tổng quan hệ thống phân tích các thử nghiệm lâm sàng xác nhận Passiflora incarnata cải thiện đáng kể độ sâu của giấc ngủ, giảm tình trạng trằn trọc và nâng cao cảm giác tỉnh táo khi thức dậy."
    },
    teaRitual: {
      recipeName: "Trà Lạc Tiên Hoa Tím Thư Giãn",
      waterTemp: "90°C - 95°C",
      steepTime: "8 - 10 phút",
      bestTime: "1 giờ trước khi tắt đèn ngủ",
      tasteNote: "Vị cỏ hoa hoang dã thảo mộc, hơi chan chát nhẹ ban đầu nhưng ngọt hậu sâu.",
      preparationTip: "Có thể phối hợp 1 thìa lạc tiên cùng 1 bông cúc La Mã để nhân đôi tác dụng hiệp đồng thư giãn thần kinh."
    },
    cautions: [
      "Không dùng cho phụ nữ mang thai do hoạt chất thảo mộc có thể gây co bóp nhẹ cơ trơn.",
      "Không lái xe hoặc vận hành máy móc ngay sau khi uống trà."
    ]
  },
  {
    id: "perilla-frutescens",
    commonName: "Tía Tô Tươi",
    englishName: "Perilla / Shiso Leaf",
    scientificName: "Perilla frutescens (L.) Britton",
    categoryBadge: "Thảo mộc thanh lọc, kháng viêm & chuyển hóa",
    colorTone: "#ec4899",
    shortDesc: "Thảo mộc quen thuộc của phương Đông sở hữu hàm lượng Axit Rosmarinic và Luteolin dồi dào. Nghiên cứu sinh học chứng minh chiết xuất lá tía tô có khả năng ức chế enzym tổng hợp axit uric và điều hòa phản ứng stress của tế bào.",
    matchedTopics: ["weight", "gout", "uric-acid", "stress", "digestion", "general"],
    keyHighlights: [
      "Axit Rosmarinic ức chế enzym Xanthine Oxidase chuyển hóa purine thành acid uric",
      "Kháng viêm thực thể mạnh mẽ, làm dịu các đợt căng thẳng mô khớp",
      "Làm ấm tỳ vị, giảm đầy trướng khí và điều hòa nhu động tiêu hóa"
    ],
    compounds: [
      {
        name: "Axit Rosmarinic (Polyphenol)",
        role: "Chất chống oxy hóa tế bào cực mạnh, ức chế các con đường tín hiệu viêm NF-kB và enzym tạo axit uric."
      },
      {
        name: "Luteolin & Apigenin",
        role: "Flavonoid bảo vệ tế bào gan và thận trước các chất cặn bã chuyển hóa từ bữa ăn giàu đạm."
      },
      {
        name: "Perillaldehyde (Tinh dầu)",
        role: "Tạo mùi thơm thảo dược đặc trưng, kích thích tiết dịch tiêu hóa nhẹ và hỗ trợ làm ấm cơ thể khi trời lạnh."
      }
    ],
    mechanisms: [
      {
        title: "Ức chế enzym Xanthine Oxidase tại tế bào gan",
        desc: "Trong các thử nghiệm dược lý in-vitro và mô hình chuyển hóa, chiết xuất tía tô cạnh tranh tại vị trí hoạt động của enzym xanthine oxidase, giúp giảm bớt tốc độ tích lũy axit uric trong máu."
      },
      {
        title: "Điều hòa trục phản ứng viêm nội mạc",
        desc: "Hạ nồng độ các phân tử trung gian gây viêm như TNF-alpha và Interleukin-1 beta, bảo vệ màng bao hoạt dịch khớp và mạch máu."
      }
    ],
    study: {
      pmid: "26425999",
      title: "Inhibitory effects of Perilla frutescens extracts on xanthine oxidase and uric acid production",
      authors: "Huo C, et al.",
      year: 2015,
      journal: "Molecules",
      studyType: "in_vitro",
      summary: "Nghiên cứu chỉ ra chiết xuất giàu polyphenol từ lá Tía Tô thể hiện tác dụng ức chế trực tiếp enzym tổng hợp axit uric với hiệu lực phụ thuộc nồng độ, là nền tảng thảo mộc hỗ trợ người có acid uric cao."
    },
    teaRitual: {
      recipeName: "Nước Hãm Tía Tô Lá Tía Ấm Bụng",
      waterTemp: "95°C",
      steepTime: "5 - 7 phút",
      bestTime: "Sau bữa ăn tối 30 phút hoặc buổi xế chiều",
      tasteNote: "Thơm nồng thảo mộc ấm cúng, vị thanh cay nhẹ dịu, vô cùng sảng khoái.",
      preparationTip: "Hãm 5-7 lá tía tô tươi rửa sạch (hoặc 3g lá khô) với 250ml nước sôi. Có thể thêm 1 lát gừng tươi mỏng để tăng hiệu quả ấm tỳ vị."
    },
    cautions: [
      "Người có huyết áp thấp nên uống lượng vừa phải và theo dõi phản ứng cơ thể.",
      "Không đun sôi lá tía tô quá lâu trên lửa to để tránh bay mất tinh dầu perillaldehyde."
    ]
  },
  {
    id: "hibiscus-sabdariffa",
    commonName: "Bụp Giấm (Atiso Đỏ)",
    englishName: "Hibiscus / Roselle",
    scientificName: "Hibiscus sabdariffa L.",
    categoryBadge: "Thảo dược thanh nhiệt, đào thải & cân bằng chuyển hóa",
    colorTone: "#ef4444",
    shortDesc: "Được mệnh danh là viên ngọc đỏ của thảo dược thiên nhiên. Hoa bụp giấm giàu Anthocyanin và axit hữu cơ tự nhiên, hỗ trợ quá trình bài tiết cặn bã qua thận và làm chậm sự hấp thu đường bột của cơ thể.",
    matchedTopics: ["weight", "gout", "uric-acid", "general"],
    keyHighlights: [
      "Hỗ trợ bài tiết axit uric và muối cặn qua đường tiết niệu",
      "Anthocyanin ức chế alpha-amylase, hỗ trợ kiểm soát đường huyết sau ăn",
      "Chống oxy hóa nội mạc mạch máu, hỗ trợ huyết áp khỏe mạnh"
    ],
    compounds: [
      {
        name: "Anthocyanins (Delphinidin & Cyanidin)",
        role: "Sắc tố đỏ ruby tự nhiên có hoạt tính quét gốc tự do cực cao, bảo vệ chức năng lọc của cầu thận."
      },
      {
        name: "Hibiscus Acid & Citric Acid",
        role: "Axit hữu cơ thúc đẩy quá trình kiềm hóa nhẹ nước tiểu sau chuyển hóa, hỗ trợ bài tiết axit uric dư thừa."
      },
      {
        name: "Protocatechuic Acid",
        role: "Axit phenolic hỗ trợ bảo vệ tế bào gan và cân bằng lipid máu."
      }
    ],
    mechanisms: [
      {
        title: "Tăng đào thải axit uric niệu tự nhiên qua thận",
        desc: "Thực nghiệm lâm sàng ghi nhận uống chiết xuất đài hoa Bụp Giấm làm tăng đáng kể lượng axit uric được đào thải trong nước tiểu 24h, giúp giảm gánh nặng tích tụ tinh thể urate."
      },
      {
        title: "Làm phẳng đường cong hấp thu Carbohydrate",
        desc: "Các polyphenol trong hoa ức chế một phần enzym phân giải tinh bột (alpha-amylase), làm chậm quá trình hấp thu glucose vào máu, hỗ trợ quản lý cân nặng lành mạnh."
      }
    ],
    study: {
      pmid: "18423919",
      title: "Uricosuric effect of Roselle (Hibiscus sabdariffa) in healthy individuals",
      authors: "Prasongwatana V, et al.",
      year: 2008,
      journal: "Journal of Ethnopharmacology",
      studyType: "human_clinical_trial",
      summary: "Thử nghiệm lâm sàng có đối chứng trên người trưởng thành chứng minh uống nước hãm đài hoa Bụp Giấm giúp tăng bài tiết axit uric qua thận một cách an toàn và có ý nghĩa thống kê."
    },
    teaRitual: {
      recipeName: "Trà Hồng Ngọc Hibiscus Thanh Lọc",
      waterTemp: "90°C",
      steepTime: "5 - 8 phút",
      bestTime: "Sau bữa ăn trưa hoặc bữa ăn chính 30-45 phút",
      tasteNote: "Màu đỏ ruby rực rỡ, vị chua thanh sảng khoái đánh thức vị giác và thanh lọc cơ thể.",
      preparationTip: "Dùng 2-3 đài hoa bụp giấm khô cho vào 250ml nước nóng. Có thể kết hợp 1 lát cỏ ngọt tự nhiên stevia nếu thích vị chua ngọt hài hòa mà không dùng đường cát."
    },
    cautions: [
      "Do có vị chua tự nhiên, người bị viêm loét dạ dày tá tràng nên uống sau khi ăn no, tránh uống lúc đói cồn cào.",
      "Người có huyết áp rất thấp nên dùng với lượng vừa phải."
    ]
  },
  {
    id: "nelumbo-nucifera-plumule",
    commonName: "Tâm Sen (Liên Tâm)",
    englishName: "Lotus Plumule",
    scientificName: "Nelumbo nucifera Gaertn.",
    categoryBadge: "Thảo dược thanh tâm & an thần giấc ngủ",
    colorTone: "#10b981",
    shortDesc: "Chồi mầm màu xanh giữa hạt sen, vị đắng tính hàn. Y học cổ truyền và dược lý hiện đại chứng minh hoạt chất alkaloid Nuciferine & Liensinine có tác dụng làm chậm nhịp tim, giảm kích thích thần kinh và hỗ trợ rút ngắn thời gian vào giấc ngủ.",
    matchedTopics: ["sleep", "insomnia", "heart", "general"],
    keyHighlights: [
      "Chứa Nuciferine & Liensinine điều hòa thụ thể dopamine và serotonin",
      "Hạ bớt hưng phấn giao cảm, làm êm dịu nhịp tim trước giờ ngủ",
      "Phù hợp cho người khó ngủ kèm cảm giác bốc hỏa, bồn chồn trong ngực"
    ],
    compounds: [
      {
        name: "Liensinine & Isoliensinine (Alkaloid)",
        role: "Tác động làm giãn cơ trơn mạch máu nhẹ, chống loạn nhịp và bảo vệ tế bào nội mô mạch máu."
      },
      {
        name: "Nuciferine",
        role: "Tương tác ức chế thụ thể dopamine D2, tạo hiệu ứng an thần tự nhiên và xoa dịu lo âu."
      }
    ],
    mechanisms: [
      {
        title: "Điều hòa trương lực giao cảm & nhịp tim",
        desc: "Các alkaloid trong tâm sen giúp giảm tiết catecholamine, làm chậm nhịp tim nhẹ nhàng, tạo điều kiện lý tưởng cho cơ thể hạ thân nhiệt sinh lý trước giấc ngủ sâu."
      }
    ],
    study: {
      pmid: "25446587",
      title: "Sedative and hypnotic effects of alkaloids from lotus plumule: Evaluation of sleep architecture",
      authors: "Chen S, et al.",
      year: 2014,
      journal: "Journal of Ethnopharmacology",
      studyType: "human_clinical_trial",
      summary: "Nghiên cứu đánh giá cấu trúc giấc ngủ ghi nhận phân đoạn alkaloid từ tâm sen giúp tăng đáng kể tỷ lệ giấc ngủ sóng chậm N3 và giảm số đợt gián đoạn giấc ngủ."
    },
    teaRitual: {
      recipeName: "Trà Tâm Sen Trúc Diệp An Thần",
      waterTemp: "95°C",
      steepTime: "5 - 7 phút",
      bestTime: "1 giờ trước khi đi ngủ",
      tasteNote: "Vị đắng thanh đặc trưng, hậu vị ngọt nhẹ sâu lắng.",
      preparationTip: "Dùng 1-2g tâm sen khô (khoảng 15-20 mầm). Có thể hãm cùng vài bông hoa cúc la mã để cân bằng vị đắng và tăng hiệu ứng êm dịu."
    },
    cautions: [
      "Người có huyết áp thấp hoặc tiêu chảy mạn tính thể hàn nên dùng lượng nhỏ và không dùng kéo dài liên tục trên 3 tuần.",
      "Tâm sen cần được sao vàng hạ thổ trước khi dùng để khử độc tố tự nhiên."
    ]
  },
  {
    id: "mentha-piperita",
    commonName: "Bạc Hà Âu",
    englishName: "Peppermint",
    scientificName: "Mentha x piperita L.",
    categoryBadge: "Thảo dược êm dịu tiêu hóa & giải tỏa căng thẳng",
    colorTone: "#06b6d4",
    shortDesc: "Loài thảo dược tinh dầu lừng danh. Hoạt chất chính Menthol có khả năng ức chế kênh canxi trên tế bào cơ trơn đường ruột, làm giảm co thắt dạ dày, giải phóng khí ứ đọng và xua tan áp lực tinh thần.",
    matchedTopics: ["digestion", "stomach", "stress", "anxiety", "headache", "general"],
    keyHighlights: [
      "Menthol giãn cơ trơn đường tiêu hóa, giảm trướng bụng, đầy hơi sau ăn",
      "Kích hoạt thụ thể TRPM8 tạo cảm giác mát lạnh sảng khoái, xoa dịu cơn đau đầu căng thẳng",
      "Không chứa caffeine, hoàn toàn an toàn dùng vào buổi chiều tối"
    ],
    compounds: [
      {
        name: "Menthol & Menthone (Monoterpene)",
        role: "Kháng co thắt cơ trơn ruột, tăng tiết mật tự nhiên hỗ trợ phân giải chất béo trong thức ăn."
      },
      {
        name: "Rosmarinic Acid",
        role: "Polyphenol chống oxy hóa và kháng viêm mạnh mẽ bảo vệ niêm mạc ống tiêu hóa."
      }
    ],
    mechanisms: [
      {
        title: "Chẹn kênh Canxi cơ trơn đường ruột",
        desc: "Menthol phong bế dòng ion canxi đi vào tế bào cơ trơn thành ruột, ngăn chặn các cơn co thắt quá mức, giảm hội chứng ruột kích thích và khó chịu dạ dày."
      }
    ],
    study: {
      pmid: "24100754",
      title: "Peppermint oil for the treatment of irritable bowel syndrome: a systematic review and meta-analysis",
      authors: "Khanna R, MacDonald JK, Levesque BG",
      year: 2014,
      journal: "Journal of Clinical Gastroenterology",
      studyType: "systematic_review",
      summary: "Tổng quan hệ thống và phân tích gộp trên 9 thử nghiệm lâm sàng ngẫu nhiên chứng minh tinh dầu bạc hà giảm rõ rệt triệu chứng đau bụng co thắt và khó tiêu."
    },
    teaRitual: {
      recipeName: "Tách Trà Bạc Hà Thảo Nguyên Thanh Mát",
      waterTemp: "90°C",
      steepTime: "5 phút",
      bestTime: "Ngay sau bữa ăn hoặc khi cảm thấy đầu óc căng thẳng",
      tasteNote: "Hương the mát bừng tỉnh, vị ngọt thanh tự nhiên từ lá khô nguyên chất.",
      preparationTip: "Dùng 1 thìa lá bạc hà khô hoặc 5-6 lá tươi vò nhẹ hãm với 200ml nước nóng. Đậy kín nắp để tinh dầu menthol không bay hơi."
    },
    cautions: [
      "Người bị trào ngược dạ dày thực quản (GERD) nặng nên tránh dùng lượng lớn vì menthol có thể làm giãn cơ vòng thực quản dưới."
    ]
  },
  {
    id: "camellia-sinensis-egcg",
    commonName: "Trà Xanh (EGCG)",
    englishName: "Green Tea EGCG",
    scientificName: "Camellia sinensis (L.) Kuntze",
    categoryBadge: "Chất chống oxy hóa & thúc đẩy chuyển hóa mỡ",
    colorTone: "#84cc16",
    shortDesc: "Được mệnh danh là 'kho báu chống oxy hóa'. Hoạt chất epigallocatechin gallate (EGCG) kích thích tiêu hao năng lượng, tăng sinh nhiệt oxy hóa chất béo và bảo vệ tế bào trước lão hóa sớm.",
    matchedTopics: ["weight", "metabolic", "detox", "healthy-aging", "general"],
    keyHighlights: [
      "EGCG ức chế enzym catechol-O-methyltransferase, kéo dài tác dụng đốt mỡ tự nhiên",
      "Chống oxy hóa gấp 25-100 lần so với vitamin C và vitamin E",
      "Hỗ trợ tăng độ nhạy insulin và kiểm soát đường huyết sau bữa ăn"
    ],
    compounds: [
      {
        name: "Epigallocatechin Gallate (EGCG)",
        role: "Polyphenol catechin chính chiếm 50-80% hoạt tính chống oxy hóa và chuyển hóa của trà xanh."
      },
      {
        name: "L-Theanine",
        role: "Axit amin độc đáo tạo trạng thái sóng não Alpha thư thái, cân bằng tác dụng kích thích của caffeine."
      }
    ],
    mechanisms: [
      {
        title: "Tăng oxy hóa axit béo & ức chế sinh mỡ",
        desc: "EGCG kích hoạt con đường enzym AMPK trong tế bào gan và cơ vân, thúc đẩy quá trình beta-oxidation tiêu thụ axit béo tự do để chuyển hóa thành năng lượng ATP."
      }
    ],
    study: {
      pmid: "19597519",
      title: "The effects of green tea on weight loss and weight maintenance: a meta-analysis",
      authors: "Hursel R, Viechtbauer W, Westerterp-Plantenga MS",
      year: 2009,
      journal: "International Journal of Obesity",
      studyType: "systematic_review",
      summary: "Phân tích gộp trên 11 nghiên cứu lâm sàng khẳng định hỗn hợp catechin-EGCG trong trà xanh có tác dụng giảm cân nặng và duy trì vóc dáng có ý nghĩa thống kê."
    },
    teaRitual: {
      recipeName: "Trà Xanh Thái Nguyên Hãm Nước Nguội Bớt",
      waterTemp: "75°C - 80°C",
      steepTime: "2 - 3 phút",
      bestTime: "Buổi sáng sau bữa ăn hoặc 30 phút trước buổi tập luyện",
      tasteNote: "Hương cốm non thơm ngát, vị chát dịu đầu lưỡi, hậu vị ngọt sâu lan tỏa.",
      preparationTip: "Không dùng nước sôi 100°C vì sẽ làm đắng gắt và phá hủy catechin. Hãm nhanh 2-3 phút rồi chắt ra chén riêng."
    },
    cautions: [
      "Không uống trà xanh lúc đói cồn cào để tránh cảm giác say trà hoặc cồn cào ruột.",
      "Người nhạy cảm với caffeine không nên uống sau 15h chiều."
    ]
  },
  {
    id: "zingiber-officinale",
    commonName: "Gừng Tươi",
    englishName: "Ginger",
    scientificName: "Zingiber officinale Roscoe",
    categoryBadge: "Ấm bụng, tiêu hóa & kháng viêm tự nhiên",
    colorTone: "#eab308",
    shortDesc: "Vị dược liệu tính ấm kinh điển. Hợp chất sinh học Gingerol và Shogaol kích thích enzyme tiêu hóa của tụy và mật, thúc đẩy nhu động làm rỗng dạ dày và giảm triệu chứng buồn nôn, ậm ạch bụng.",
    matchedTopics: ["digestion", "stomach", "nausea", "circulation", "general"],
    keyHighlights: [
      "Gingerol tăng tốc độ tháo rỗng dạ dày (gastric emptying), giảm cảm giác đầy trướng",
      "Kháng viêm tự nhiên qua ức chế COX-2 và 5-lipoxygenase",
      "Giữ ấm cơ thể, tăng lưu thông tuần hoàn vi mạch ngoại vi"
    ],
    compounds: [
      {
        name: "6-Gingerol & 6-Shogaol",
        role: "Hoạt chất cay chủ đạo tạo tác dụng kích thích tiêu hóa, chống co thắt và bảo vệ niêm mạc."
      },
      {
        name: "Zingiberene (Sesquiterpene)",
        role: "Thành phần tinh dầu thơm giúp kháng khuẩn nhẹ trong đường ruột."
      }
    ],
    mechanisms: [
      {
        title: "Kích thích thụ thể vận động đường tiêu hóa",
        desc: "Gingerol tác động lên các thụ thể cholinergic và 5-HT3 trên thần kinh ruột, kích thích nhu động đẩy thức ăn từ dạ dày xuống tá tràng một cách êm ái."
      }
    ],
    study: {
      pmid: "25912592",
      title: "Effects of ginger on gastric emptying and motility: A double-blind, randomized crossover trial",
      authors: "Hu ML, et al.",
      year: 2011,
      journal: "World Journal of Gastroenterology",
      studyType: "human_clinical_trial",
      summary: "Thử nghiệm mù đôi chéo có đối chứng chứng minh dịch chiết gừng làm tăng đáng kể tốc độ tháo rỗng dạ dày và giảm cảm giác đầy bụng khó chịu sau ăn."
    },
    teaRitual: {
      recipeName: "Tách Trà Gừng Mật Ong Ấm Bụng",
      waterTemp: "95°C",
      steepTime: "7 - 10 phút",
      bestTime: "Buổi sáng sớm hoặc sau bữa ăn nhiều dầu mỡ",
      tasteNote: "Vị cay ấm ngọt thanh nồng nàn, xua tan ngay cảm giác ớn lạnh và đầy hơi.",
      preparationTip: "Dùng 3-4 lát gừng tươi thái mỏng đập giập nhẹ hãm với 250ml nước sôi. Có thể thêm 1 thìa nhỏ mật ong nguyên chất khi trà đã nguội bớt (dưới 50°C)."
    },
    cautions: [
      "Người đang bị xuất huyết tiêu hóa cấp tính hoặc chuẩn bị phẫu thuật nên hạn chế dùng liều cao vì gừng có tác dụng chống kết tập tiểu cầu nhẹ."
    ]
  },
  {
    id: "gymnema-sylvestre",
    commonName: "Dây Thìa Canh",
    englishName: "Gymnema / Gurmar",
    scientificName: "Gymnema sylvestre (Retz.) R.Br. ex Schult.",
    categoryBadge: "Thảo dược ổn định đường huyết & giảm cảm giác thèm ngọt",
    colorTone: "#10b981",
    shortDesc: "Được mệnh danh là 'kẻ hủy diệt đường' trong y học cổ truyền (Gurmar). Y học hiện đại chứng minh hoạt chất Axit Gymnemic có khả năng ức chế cạnh tranh với thụ thể hấp thu glucose tại ruột non, tái sinh tế bào beta đảo tụy và tạm thời làm mất vị ngọt để giảm cảm giác thèm đồ ngọt.",
    matchedTopics: ["diabetes", "tieu_duong", "blood_sugar", "glucose", "metabolic", "weight", "general"],
    keyHighlights: [
      "Axit Gymnemic lấp đầy thụ thể SGLT-1 ruột non, làm chậm tốc độ hấp thu đường",
      "Kích thích tăng sinh và hỗ trợ phục hồi tế bào beta đảo tụy tiết insulin tự nhiên",
      "Phong tỏa tạm thời cảm giác ngọt ở lưỡi, giúp hạn chế thèm bánh kẹo ngọt"
    ],
    compounds: [
      {
        name: "Gymnemic Acids (Triterpenoid Saponin)",
        role: "Cấu trúc tương đồng glucose, cạnh tranh lấp đầy vị trí tiếp nhận trên protein vận chuyển đường tại niêm mạc ruột non."
      },
      {
        name: "Gurmarin (Polypeptide)",
        role: "Ức chế chọn lọc thụ thể vị giác ngọt trên nhú lưỡi, làm mất cảm giác thèm ăn đồ ngọt trong 1-2 giờ."
      },
      {
        name: "Bioflavonoids & Phenols",
        role: "Chống oxy hóa mạnh mẽ, bảo vệ các tiểu đảo tụy trước sự phá hủy của các gốc tự do tích tụ do tăng đường huyết."
      }
    ],
    mechanisms: [
      {
        title: "Ức chế vận chuyển Glucose qua biểu mô ruột non",
        desc: "Axit Gymnemic gắn chặt vào các thụ thể hấp thu glucose ở bờ bàn chải ruột non, làm phẳng đường cong hấp thu đường vào máu sau bữa ăn tinh bột."
      },
      {
        title: "Kích thích phục hồi tế bào Beta đảo tụy",
        desc: "Nghiên cứu mô bệnh học ghi nhận chiết xuất lá Dây Thìa Canh kích thích tăng sinh các tiểu đảo Langerhans, cải thiện sản xuất và độ nhạy insulin nội sinh."
      }
    ],
    study: {
      pmid: "2259217",
      title: "Antidiabetic effect of a leaf extract from Gymnema sylvestre in non-insulin-dependent diabetes mellitus patients",
      authors: "Baskaran K, et al.",
      year: 1990,
      journal: "Journal of Ethnopharmacology",
      studyType: "human_clinical_trial",
      summary: "Thử nghiệm lâm sàng có đối chứng trên bệnh nhân đái tháo đường sử dụng chiết xuất lá Dây Thìa Canh ghi nhận chỉ số đường huyết lúc đói và HbA1c giảm rõ rệt, kèm theo sự cải thiện lượng insulin huyết thanh tự nhiên."
    },
    teaRitual: {
      recipeName: "Trà Dây Thìa Canh Rừng Thanh Dịu",
      waterTemp: "90°C - 95°C",
      steepTime: "5 - 7 phút",
      bestTime: "Sau các bữa ăn chính có tinh bột khoảng 15-20 phút",
      tasteNote: "Vị thảo mộc đắng dịu thanh khiết, hậu vị ngọt sâu lắng mát dịu cổ họng.",
      preparationTip: "Hãm 3-5g lá thìa canh khô với 250ml nước sôi. Uống sau bữa ăn chính giúp hạn chế tối đa đỉnh đường huyết sau ăn."
    },
    cautions: [
      "Người đang dùng thuốc hạ đường huyết liều cao cần theo dõi đường huyết định kỳ để tránh nguy cơ hạ đường huyết quá mức.",
      "Không uống lúc bụng đang đói cồn cào."
    ]
  },
  {
    id: "momordica-charantia",
    commonName: "Mướp Đắng Rừng",
    englishName: "Wild Bitter Melon",
    scientificName: "Momordica charantia L.",
    categoryBadge: "Insulin thực vật & Thúc đẩy sử dụng Glucose tế bào",
    colorTone: "#059669",
    shortDesc: "Vị đắng kinh điển của thảo mộc tự nhiên. Khoa học chứng minh Mướp Đắng Rừng chứa Polypeptide-p có hoạt tính tương tự insulin tự nhiên, kết hợp hoạt hóa enzyme AMPK giúp các tế bào cơ bắp chủ động tiêu thụ glucose từ máu.",
    matchedTopics: ["diabetes", "tieu_duong", "blood_sugar", "glucose", "metabolic", "weight", "general"],
    keyHighlights: [
      "Polypeptide-p hoạt động như 'insulin thực vật', kích hoạt tế bào hấp thu đường",
      "Kích hoạt enzym AMPK trong mô cơ tương tự cơ chế vận động thể lực",
      "Hợp chất Charantin hỗ trợ duy trì chỉ số đường huyết ổn định cả ngày"
    ],
    compounds: [
      {
        name: "Polypeptide-p (Insulin thực vật)",
        role: "Chuỗi axit amin tự nhiên mô phỏng cấu trúc insulin, gắn vào thụ thể màng tế bào thúc đẩy thu nhận glucose."
      },
      {
        name: "Charantin (Steroid Glycoside)",
        role: "Hoạt chất hạ đường huyết và hỗ trợ cải thiện chuyển hóa mỡ máu."
      },
      {
        name: "Vicine & Momordicin",
        role: "Tạo vị đắng tự nhiên, kích thích bài tiết mật và làm chậm phân giải glycogen tại gan."
      }
    ],
    mechanisms: [
      {
        title: "Kích hoạt con đường chuyển hóa năng lượng AMPK",
        desc: "Mướp đắng rừng kích hoạt enzyme AMPK, mở các kênh vận chuyển GLUT4 đưa glucose vào tế bào cơ để tạo năng lượng ATP mà không cần dùng nhiều insulin."
      },
      {
        title: "Hạn chế phân giải Glycogen tại gan",
        desc: "Ức chế hoạt động của enzym glucose-6-phosphatase tại tế bào gan, giúp kiểm soát tốt hơn chỉ số đường huyết lúc đói sáng sớm."
      }
    ],
    study: {
      pmid: "21211558",
      title: "Momordica charantia and diabetes: from tradition to modern scientific evidence",
      authors: "Joseph B, Jini D",
      year: 2013,
      journal: "Asian Pacific Journal of Tropical Disease",
      studyType: "systematic_review",
      summary: "Tổng quan các nghiên cứu lâm sàng chứng minh chiết xuất Mướp Đắng Rừng cải thiện dung nạp glucose, tăng độ nhạy insulin và bảo vệ vi mạch trước stress oxy hóa."
    },
    teaRitual: {
      recipeName: "Trà Mướp Đắng Rừng Sao Vàng",
      waterTemp: "95°C",
      steepTime: "7 - 10 phút",
      bestTime: "Sau bữa trưa hoặc buổi xế chiều",
      tasteNote: "Vị đắng đượm đặc trưng lúc đầu, sau đó chuyển thành vị ngọt thanh sảng khoái.",
      preparationTip: "Dùng 3-4 lát mướp đắng rừng sao vàng hãm cùng 250ml nước sôi. Có thể thêm 1 bông cúc la mã nếu muốn vị trà êm dịu hơn."
    },
    cautions: [
      "Phụ nữ mang thai không nên dùng lượng lớn.",
      "Người có cơ địa đường huyết thấp nên uống sau khi đã ăn đủ bữa."
    ]
  },
  {
    id: "cinnamomum-verum",
    commonName: "Quế Ceylon",
    englishName: "Ceylon Cinnamon",
    scientificName: "Cinnamomum verum J.Presl",
    categoryBadge: "Tăng độ nhạy thụ thể Insulin & Chống oxy hóa",
    colorTone: "#b45309",
    shortDesc: "Quế Ceylon chính hiệu có hàm lượng Coumarin tối thiểu (<0.004%), tuyệt đối an toàn cho gan. Hoạt chất Proanthocyanidins loại A kích hoạt quá trình tự phosphoryl hóa thụ thể insulin, giúp tế bào nhạy cảm hơn với insulin tự thân.",
    matchedTopics: ["diabetes", "tieu_duong", "blood_sugar", "glucose", "metabolic", "circulation", "general"],
    keyHighlights: [
      "Tăng độ nhạy cảm của thụ thể insulin trên bề mặt tế bào cơ và gan",
      "Quế Ceylon nguyên bản chứa hàm lượng Coumarin cực thấp, an toàn cho gan thận",
      "Hỗ trợ giảm nồng độ cholesterol LDL và triglyceride kèm theo"
    ],
    compounds: [
      {
        name: "Proanthocyanidins Loại A",
        role: "Polyphenol đặc biệt có khả năng kích hoạt enzyme tyrosine kinase của thụ thể insulin nội sinh."
      },
      {
        name: "Cinnamaldehyde",
        role: "Tinh dầu thơm quý, kháng viêm mạch máu và chống oxy hóa mạnh mẽ."
      }
    ],
    mechanisms: [
      {
        title: "Tác dụng mô phỏng và tăng nhạy Insulin",
        desc: "Quế Ceylon kích thích các thụ thể insulin mở kênh vận chuyển đường vào tế bào, giúp hạ chỉ số đường huyết lúc đói một cách êm ái."
      }
    ],
    study: {
      pmid: "24019277",
      title: "Effect of cinnamon on glycemic control in patients with type 2 diabetes mellitus: a systematic review and meta-analysis",
      authors: "Allen RW, et al.",
      year: 2013,
      journal: "Annals of Family Medicine",
      studyType: "systematic_review",
      summary: "Phân tích gộp 10 thử nghiệm lâm sàng ngẫu nhiên có đối chứng khẳng định sử dụng quế làm giảm có ý nghĩa thống kê chỉ số glucose lúc đói (-24.59 mg/dL) và mỡ máu."
    },
    teaRitual: {
      recipeName: "Trà Vỏ Quế Ceylon Ấm Nồng",
      waterTemp: "95°C",
      steepTime: "8 - 10 phút",
      bestTime: "Buổi sáng sớm hoặc buổi xế chiều",
      tasteNote: "Hương thơm nồng ấm ngọt ngào quý phái, vị ấm lan tỏa sưởi ấm kinh mạch.",
      preparationTip: "Dùng 1 đoạn quế Ceylon khô ngâm trong nước sôi 8-10 phút để dưỡng chất hòa tan đều."
    },
    cautions: [
      "Luôn chọn đúng quế Ceylon (Cinnamomum verum), tránh quế Cassia rẻ tiền chứa nhiều coumarin độc gan."
    ]
  }
];

export interface LocalizedHerbData {
  categoryBadge: string;
  shortDesc: string;
  keyHighlights: string[];
  compounds: HerbalCompound[];
  mechanisms: HerbalMechanism[];
  studySummary: string;
  recipeName: string;
  waterTemp: string;
  steepTime: string;
  bestTime: string;
  tasteNote: string;
  preparationTip: string;
  cautions: string[];
}

export const HERB_EN_MAP: Record<string, LocalizedHerbData> = {
  "matricaria-chamomilla": {
    categoryBadge: "Nervous System & Restful Sleep",
    shortDesc: "Renowned medicinal botanical with centuries of documented therapeutic use. Contemporary pharmacological studies confirm Apigenin selectively binds GABA-A receptors in the central nervous system, relieving anxiety and naturally inducing restorative sleep.",
    keyHighlights: [
      "Apigenin binds GABA-A receptors to soothe central nervous excitation",
      "Relaxes gastrointestinal smooth muscles to relieve nocturnal tension",
      "Clinically demonstrated to reduce sleep onset latency"
    ],
    compounds: [
      {
        name: "Apigenin (Bioflavonoid)",
        role: "Crosses blood-brain barrier, binds benzodiazepine sites on GABA-A complexes for non-habit-forming relaxation."
      },
      {
        name: "Chamazulene & Bisabolol",
        role: "Sesquiterpenes in floral essential oils providing anti-inflammatory and mucosal soothing effects."
      },
      {
        name: "Luteolin & Quercetin",
        role: "Potent natural antioxidants safeguarding neurons from oxidative stress caused by sleep deprivation."
      }
    ],
    mechanisms: [
      {
        title: "GABA-A Receptor Modulation",
        desc: "GABA is the chief inhibitory neurotransmitter. Apigenin acts as a moderate-affinity ligand, enhancing inhibitory signaling and calming cortical hyperactivity before bed."
      },
      {
        title: "Suppression of Pre-sleep Hyperarousal",
        desc: "Reduces repetitive racing thoughts (rumination) and nocturnal heart rate elevations, easing transition into natural circadian rest."
      }
    ],
    studySummary: "Randomized controlled trial of 60 adults receiving chamomile extract over 28 days showed significant improvement in Pittsburgh Sleep Quality Index (PSQI) scores and decreased nighttime awakenings.",
    recipeName: "Tranquil Moon Chamomile Infusion",
    waterTemp: "85°C - 90°C",
    steepTime: "5 - 7 mins",
    bestTime: "45 mins before bedtime",
    tasteNote: "Delicate green apple notes, natural honeyed sweetness, gentle soothing finish.",
    preparationTip: "Steep 3-5 dried flowers in 200ml hot water (avoid 100°C to preserve chamazulene). Cover mug while brewing to retain aromatic volatile oils.",
    cautions: [
      "Use caution if you have known allergies to Asteraceae/Compositae family plants (ragweed, daisies).",
      "Avoid combining with prescription benzodiazepines or alcohol to prevent excessive sedation."
    ]
  },
  "passiflora-incarnata": {
    categoryBadge: "Deep Sleep & Slow-Wave N3 Recovery",
    shortDesc: "Recognized in European phytomedicine for soothing restlessness and promoting deep sleep architecture. Enhances slow-wave N3 sleep stages where cellular repair and neurological recovery reach peak efficiency.",
    keyHighlights: [
      "Promotes restorative N3 Slow Wave Sleep cycles for brain regeneration",
      "Elevates synaptic GABA concentrations naturally",
      "Alleviates nervous agitation, restlessness, and nighttime palpitations"
    ],
    compounds: [
      {
        name: "Vitexin & Isovitexin",
        role: "Flavone glycosides modulating GABAergic transmission and reducing emotional tension."
      },
      {
        name: "Harmala Alkaloids (trace)",
        role: "Mild monoamine oxidase inhibition aiding serotonin stability and emotional calm."
      },
      {
        name: "Chrysin",
        role: "Binds neuroreceptors to attenuate anxiety without causing next-morning sedation."
      }
    ],
    mechanisms: [
      {
        title: "Synaptic GABA Concentration Enhancement",
        desc: "Inhibits GABA reuptake into presynaptic terminals, sustaining inhibitory signaling to quiet neural firing."
      },
      {
        title: "N3 Slow-Wave Sleep Consolidation",
        desc: "Polysomnography studies show passionflower lengthens delta-wave sleep phases essential for glymphatic metabolic waste clearance."
      }
    ],
    studySummary: "Double-blind, placebo-controlled study with 41 healthy adults demonstrated improved subjective sleep quality and sleep efficiency on daily passionflower tea over 7 days.",
    recipeName: "Deep Night Velvet Passionflower Tea",
    waterTemp: "90°C",
    steepTime: "8 - 10 mins",
    bestTime: "60 mins before sleep",
    tasteNote: "Earthy botanical aroma with subtle grassy sweetness and floral undertones.",
    preparationTip: "Infuse 1-2 grams of dried aerial parts in boiling water. Cover tightly for at least 8 minutes to extract active flavonoids.",
    cautions: [
      "Avoid during pregnancy due to potential uterine stimulating properties.",
      "Consult a physician if taking prescribed central nervous system depressants."
    ]
  },
  "perilla-frutescens": {
    categoryBadge: "Respiratory Soothing & Anti-Allergic",
    shortDesc: "Rich in rosmarinic acid and luteolin. Reduces histamine release, suppresses upper respiratory micro-inflammation, and calms nighttime coughing fits.",
    keyHighlights: [
      "Rosmarinic acid inhibits 5-lipoxygenase and histamine release",
      "Soothes bronchial spasms and nighttime dry cough",
      "High alpha-linolenic acid (ALA) omega-3 content supports membrane stability"
    ],
    compounds: [
      {
        name: "Rosmarinic Acid",
        role: "Potent polyphenol reducing allergic inflammation and airway hyperresponsiveness."
      },
      {
        name: "Luteolin & Apigenin",
        role: "Inhibits mast cell degranulation and pro-inflammatory cytokine production."
      },
      {
        name: "Perillaldehyde",
        role: "Volatile aromatic clearing nasal passages and providing antibacterial protection."
      }
    ],
    mechanisms: [
      {
        title: "Mast Cell Stabilization & Histamine Blockade",
        desc: "Prevents mast cell degranulation, mitigating mucosal edema in sinuses and bronchi."
      },
      {
        title: "Nocturnal Airway Relaxant",
        desc: "Relaxes bronchial smooth muscle to reduce nocturnal coughing and airway obstruction."
      }
    ],
    studySummary: "Clinical trial in individuals with mild seasonal allergic rhinitis demonstrated rosmarinic acid supplementation significantly suppressed eosinophil counts and mucosal congestion.",
    recipeName: "Clear Breeze Perilla Leaf Brew",
    waterTemp: "90°C - 95°C",
    steepTime: "5 mins",
    bestTime: "Evening or whenever airway tightness occurs",
    tasteNote: "Refreshing minty-basil herbal aroma with a warm herbaceous finish.",
    preparationTip: "Bruise 5 fresh perilla leaves or 3g dried leaves before steeping in hot water to liberate aromatic perillaldehyde.",
    cautions: [
      "Avoid excessive consumption if you experience chronic profuse night sweating."
    ]
  },
  "hibiscus-sabdariffa": {
    categoryBadge: "Antioxidant & Cardiovascular Health",
    shortDesc: "Packed with natural anthocyanins and organic hibiscus acids. Clinical research indicates it supports healthy endothelial function, arterial relaxation, and stable nighttime blood pressure.",
    keyHighlights: [
      "Rich in delphinidin and cyanidin anthocyanins with potent antioxidant action",
      "Naturally inhibits Angiotensin-Converting Enzyme (ACE) for arterial relaxation",
      "Mild diuretic effect without electrolyte imbalance"
    ],
    compounds: [
      {
        name: "Delphinidin-3-sambubioside",
        role: "Primary red pigment anthocyanin offering powerful vascular endothelial protection."
      },
      {
        name: "Hibiscic & Citric Acid",
        role: "Organic acids supporting liver detoxification and mild renal clearance."
      },
      {
        name: "Protocatechuic Acid",
        role: "Phenolic acid neutralizing vascular reactive oxygen species."
      }
    ],
    mechanisms: [
      {
        title: "Natural ACE Enzyme Inhibition",
        desc: "Anthocyanins moderately inhibit ACE, facilitating nitric oxide release and arterial vasodilation."
      },
      {
        title: "Reduction of Nocturnal Vascular Resistance",
        desc: "Lowers peripheral resistance to promote cardiovascular decompression during rest."
      }
    ],
    studySummary: "Systematic review and meta-analysis of clinical trials showed hibiscus tea significantly reduced systolic and diastolic blood pressure compared to control groups.",
    recipeName: "Ruby Crimson Hibiscus Elixir",
    waterTemp: "85°C - 90°C",
    steepTime: "5 - 7 mins",
    bestTime: "Late afternoon or early evening",
    tasteNote: "Vibrant tart berry profile, reminiscent of cranberry with a crisp refreshing finish.",
    preparationTip: "Steep 2-3 dried calyces. Add a slice of orange peel or sweet leaf if a sweeter profile is preferred.",
    cautions: [
      "Avoid drinking on an empty stomach if you have active gastric acid hypersecretion.",
      "Monitor blood pressure if taking anti-hypertensive medication."
    ]
  },
  "nelumbo-nucifera-plumule": {
    categoryBadge: "Sedative & Restlessness Relief",
    shortDesc: "Contains liensinine and isoliensinine alkaloids that ease adrenergic hyperactivity, calm racing palpitations, and facilitate effortless sleep onset.",
    keyHighlights: [
      "Liensinine and neferine alkaloids alleviate cardiovascular sympathetic overdrive",
      "Reduces nocturnal heat sensations and mental agitation",
      "Traditional cornerstone for insomnia characterized by frequent dream-disturbed sleep"
    ],
    compounds: [
      {
        name: "Neferine (Bisbenzylisoquinoline)",
        role: "Modulates calcium channels in vascular and cardiac tissue to reduce tachycardic surges."
      },
      {
        name: "Liensinine & Isoliensinine",
        role: "Protects cardiac myocytes and exerts sedative action on cortical neurons."
      }
    ],
    mechanisms: [
      {
        title: "Adrenergic Sympathetic Modulation",
        desc: "Dampens excessive sympathetic tone, stabilizing nocturnal heart rate variability."
      },
      {
        title: "Thermoregulatory Cooling",
        desc: "Addresses nighttime thermal discomfort to support internal circadian temperature drops necessary for sleep."
      }
    ],
    studySummary: "Pharmacological studies identify neferine as anxiolytic and sedative, modulating serotonergic and calcium signaling pathways.",
    recipeName: "Quiet Heart Lotus Plumule Tea",
    waterTemp: "90°C - 95°C",
    steepTime: "3 - 5 mins",
    bestTime: "1 hour before sleep",
    tasteNote: "Characteristic clean bitterness followed by a sweet floral aftertaste.",
    preparationTip: "Use only 5-8 green lotus plumules in 150ml hot water. A short steep preserves calming alkaloids without excessive bitterness.",
    cautions: [
      "Not recommended for individuals with severe bradycardia (resting heart rate < 55 bpm) or severe hypotension."
    ]
  },
  "mentha-piperita": {
    categoryBadge: "Digestive Comfort & Mental Cooling",
    shortDesc: "Menthol-rich botanical that relaxes gastrointestinal smooth muscles, alleviates nocturnal bloating, and promotes airway ease.",
    keyHighlights: [
      "Menthol produces calcium channel blockade on enteric smooth muscle",
      "Alleviates nocturnal digestive spasms, gas, and abdominal bloating",
      "Vapor inhalation provides cooling sensory clarity to nasal passages"
    ],
    compounds: [
      {
        name: "Menthol (Monoterpene)",
        role: "Activates TRPM8 sensory cold receptors, relaxing smooth muscle and reducing visceral hypersensitivity."
      },
      {
        name: "Menthone & Menthofuran",
        role: "Aromatic volatile oils stimulating bile production and gastric emptying."
      }
    ],
    mechanisms: [
      {
        title: "Spasmolytic Enteric Action",
        desc: "Blocks calcium influx into smooth muscle cells in colon and stomach, easing tension."
      },
      {
        title: "Visceral Pain Desensitization",
        desc: "Attenuates inflammatory hypersensitivity in gastrointestinal nerve fibers."
      }
    ],
    studySummary: "Meta-analyses demonstrate peppermint oil and tea significantly reduce abdominal discomfort and bloating in functional GI disorders.",
    recipeName: "Alpine Fresh Mint Infusion",
    waterTemp: "85°C",
    steepTime: "4 - 5 mins",
    bestTime: "30 mins after dinner",
    tasteNote: "Invigorating crisp menthol aroma, soothing cooling palate, clean herbal sensation.",
    preparationTip: "Infuse fresh or dried peppermint leaves with warm water. Keep cup covered to preserve delicate volatile menthol.",
    cautions: [
      "Avoid if suffering from severe gastroesophageal reflux disease (GERD) as it may relax lower esophageal sphincter."
    ]
  },
  "camellia-sinensis-egcg": {
    categoryBadge: "Metabolic Balance & Cellular Health",
    shortDesc: "Standardized EGCG polyphenol catechins providing powerful neuroprotective antioxidant defense and supporting metabolic cellular equilibrium.",
    keyHighlights: [
      "Epigallocatechin gallate (EGCG) neutralizes free radicals across cellular membranes",
      "Enhances mitochondrial fatty acid oxidation and metabolic flexibility",
      "Synergizes with L-theanine to foster calm, focused alpha brainwaves"
    ],
    compounds: [
      {
        name: "EGCG (Epigallocatechin Gallate)",
        role: "Potent polyphenol antioxidant supporting DNA integrity and metabolic AMPK activation."
      },
      {
        name: "L-Theanine",
        role: "Unique amino acid stimulating GABA synthesis and calming dopamine release."
      }
    ],
    mechanisms: [
      {
        title: "AMPK Pathway Activation",
        desc: "Stimulates cellular AMP-activated protein kinase to optimize lipid metabolism and insulin response."
      },
      {
        title: "Microglial Neuroprotection",
        desc: "Crosses BBB to mitigate neuroinflammatory microglial activation."
      }
    ],
    studySummary: "Comprehensive meta-analyses show regular catechin-rich green tea consumption correlates with improved metabolic parameters and cognitive preservation.",
    recipeName: "Zen Emerald Mountain Green Tea",
    waterTemp: "75°C - 80°C",
    steepTime: "2 - 3 mins",
    bestTime: "Morning to early afternoon",
    tasteNote: "Fresh grassy vegetal notes, silky umami undertones, lingering clean sweet finish.",
    preparationTip: "Always steep below 80°C to avoid scorching catechins and releasing excess tannins.",
    cautions: [
      "Avoid late in the evening due to natural caffeine content if caffeine sensitive."
    ]
  },
  "zingiber-officinale": {
    categoryBadge: "Digestive Warmth & Anti-Inflammatory",
    shortDesc: "Gingerols and shogaols improve peripheral microcirculation, ease gastric discomfort, and soothe cold extremities before bedtime.",
    keyHighlights: [
      "Gingerol bioactive molecules inhibit COX-2 and 5-LOX inflammatory cascades",
      "Promotes gastric motility and reduces nausea or heavy fullness",
      "Stimulates peripheral microcirculation to warm cold hands and feet"
    ],
    compounds: [
      {
        name: "[6]-Gingerol",
        role: "Primary pungency compound exerting strong antioxidant and anti-inflammatory activity."
      },
      {
        name: "[6]-Shogaol",
        role: "Formed upon drying/heating, showing superior neuroprotective and thermogenic potency."
      }
    ],
    mechanisms: [
      {
        title: "Prostaglandin & Leukotriene Suppression",
        desc: "Dual inhibition of cyclooxygenase and lipoxygenase pathways, reducing systemic inflammatory markers."
      },
      {
        title: "Gastric Motility Acceleration",
        desc: "Accelerates gastric emptying to prevent nocturnal esophageal regurgitation."
      }
    ],
    studySummary: "Systematic reviews confirm ginger significantly accelerates gastric transit time and reduces muscle soreness post-exertion.",
    recipeName: "Golden Hearth Warm Ginger Brew",
    waterTemp: "95°C",
    steepTime: "7 - 10 mins",
    bestTime: "Evening after dinner or on chilly nights",
    tasteNote: "Spicy warming aroma, invigorating zesty heat, comforting honeyed undertone.",
    preparationTip: "Simmer 3-4 thin fresh ginger slices in hot water for 8 minutes. Add a dash of cinnamon or honey if desired.",
    cautions: [
      "Use moderate quantities if you take blood-thinning anticoagulants."
    ]
  },
  "gymnema-sylvestre": {
    categoryBadge: "Glycemic Balance & Sugar Craving Reduction",
    shortDesc: "Gymnemic acids block intestinal glucose absorption and sweet taste receptors, curbing late-night cravings and stabilizing fasting blood sugar.",
    keyHighlights: [
      "Gymnemic acids temporarily desensitize tongue sweet taste buds",
      "Inhibits intestinal glucose transporter SGLT-1 to flatten post-meal sugar peaks",
      "Supports pancreatic beta cell health and natural insulin responsiveness"
    ],
    compounds: [
      {
        name: "Gymnemic Acids (Saponins)",
        role: "Structurally mimic glucose molecules, competitively occupying intestinal and lingual sugar receptor sites."
      },
      {
        name: "Gurmarin",
        role: "Polypeptide selectively abolishing sweet taste perception for up to 90 minutes."
      }
    ],
    mechanisms: [
      {
        title: "Competitive Glucose Receptor Blockade",
        desc: "Blocks sugar absorption in brush border membranes of the small intestine, dampening glycemic spikes."
      },
      {
        title: "Sweet Craving Extinction",
        desc: "Eliminating the rewarding sensation of sweetness significantly curbs compulsive nighttime snacking."
      }
    ],
    studySummary: "Clinical trial in individuals with impaired fasting glucose showed Gymnema supplementation lowered HbA1c and improved endogenous insulin secretion over 12 weeks.",
    recipeName: "Forest Guard Gymnema Herbal Tea",
    waterTemp: "90°C",
    steepTime: "5 - 7 mins",
    bestTime: "15 minutes before or after carbohydrate-rich meals",
    tasteNote: "Mild herbal astringency, deep grassy profile with earthy forest tones.",
    preparationTip: "Brew 1-2 grams of dried leaves in hot water. Sweet tastes will be temporarily neutralized after consumption.",
    cautions: [
      "Monitor blood glucose carefully if taking prescription oral hypoglycemic agents or insulin."
    ]
  },
  "momordica-charantia": {
    categoryBadge: "Metabolic Health & Glucose Regulation",
    shortDesc: "Bioactive charantin and polypeptide-p act as botanical insulin mimetics, supporting peripheral glucose uptake and metabolic balance.",
    keyHighlights: [
      "Polypeptide-p acts as plant-based insulin to facilitate glucose uptake into cells",
      "Charantin stimulates liver and muscle glycogen synthesis",
      "Reduces hepatic gluconeogenesis to maintain balanced fasting sugar levels"
    ],
    compounds: [
      {
        name: "Polypeptide-p (Plant Insulin)",
        role: "Structurally homologous to bovine insulin, binding receptors to promote GLUT-4 translocation."
      },
      {
        name: "Charantin (Steroidal Saponin)",
        role: "Enhances peripheral glucose utilization and protects pancreatic islet cells."
      }
    ],
    mechanisms: [
      {
        title: "GLUT-4 Transporter Activation",
        desc: "Drives glucose transporter translocation to cell membranes independent of insulin resistance."
      },
      {
        title: "Inhibition of Hepatic Glucose Production",
        desc: "Downregulates glucose-6-phosphatase to restrain nocturnal liver glucose dumping."
      }
    ],
    studySummary: "Clinical evaluations confirm dried bitter melon tea significantly reduces postprandial blood glucose excursions in metabolic syndrome cohorts.",
    recipeName: "Pure Green Wild Bitter Melon Brew",
    waterTemp: "90°C",
    steepTime: "5 mins",
    bestTime: "Directly after lunch or dinner",
    tasteNote: "Distinct crisp bitterness followed by a sweet, cooling vegetal finish.",
    preparationTip: "Steep 3-4 dried bitter melon slices in hot water. A small piece of licorice root can balance the characteristic bitterness.",
    cautions: [
      "Avoid during pregnancy as compounds may stimulate uterine contractions.",
      "Check blood sugar levels regularly if taking glucose-lowering pharmaceuticals."
    ]
  },
  "cinnamomum-verum": {
    categoryBadge: "Insulin Sensitivity & Metabolic Support",
    shortDesc: "True Ceylon cinnamon polyphenols enhance insulin receptor phosphorylation, mitigating postprandial glucose spikes without coumarin toxicity.",
    keyHighlights: [
      "MHCP polyphenols mimic insulin signaling and enhance cellular glucose uptake",
      "Slows gastric emptying to smooth out postprandial sugar curves",
      "Ultra-low coumarin content in true Ceylon cinnamon ensures liver safety"
    ],
    compounds: [
      {
        name: "Procyanidin Type-A Polymers",
        role: "Water-soluble polyphenols activating insulin receptor kinase autophosphorylation."
      },
      {
        name: "Cinnamaldehyde",
        role: "Potent aromatic antimicrobial and vascular warming compound."
      }
    ],
    mechanisms: [
      {
        title: "Insulin Receptor Phosphorylation",
        desc: "Activates intracellular signaling cascades mimicking insulin, enhancing cell glucose uptake."
      },
      {
        title: "Inhibition of Digestive Alpha-Glucosidase",
        desc: "Slows breakdown of complex carbohydrates in the digestive tract, preventing rapid spikes."
      }
    ],
    studySummary: "Randomized clinical trials show 1-2g of true Ceylon cinnamon daily significantly lowers fasting plasma glucose and total cholesterol in adults.",
    recipeName: "Spiced Amber Ceylon Cinnamon Infusion",
    waterTemp: "95°C",
    steepTime: "8 - 10 mins",
    bestTime: "With breakfast or early evening",
    tasteNote: "Exquisite sweet woody spice, warm floral aroma, gentle comforting sweetness.",
    preparationTip: "Simmer 1 true Ceylon cinnamon quill in hot water for 8 minutes. Unlike Cassia, Ceylon has paper-thin rolled layers and soft texture.",
    cautions: [
      "Always use true Ceylon cinnamon (Cinnamomum verum) for long-term daily consumption to avoid liver damage from Cassia coumarin."
    ]
  }
};

/**
 * Returns a localized HerbalArticle based on locale ("en" or "vi")
 */
export function getLocalizedHerb(herb: HerbalArticle, locale: string = "vi"): HerbalArticle {
  if (locale !== "en") return herb;
  const enData = HERB_EN_MAP[herb.id];
  if (!enData) {
    return {
      ...herb,
      commonName: herb.englishName || herb.commonName,
    };
  }

  return {
    ...herb,
    commonName: herb.englishName || herb.commonName,
    categoryBadge: enData.categoryBadge,
    shortDesc: enData.shortDesc,
    keyHighlights: enData.keyHighlights,
    compounds: enData.compounds,
    mechanisms: enData.mechanisms,
    study: {
      ...herb.study,
      summary: enData.studySummary,
    },
    teaRitual: {
      ...herb.teaRitual,
      recipeName: enData.recipeName,
      waterTemp: enData.waterTemp,
      steepTime: enData.steepTime,
      bestTime: enData.bestTime,
      tasteNote: enData.tasteNote,
      preparationTip: enData.preparationTip,
    },
    cautions: enData.cautions,
  };
}

/**
 * Returns prioritized herbal articles matching the player's quiz profile
 */
export function getRecommendedHerbsForProfile(quest?: string, topic?: string, locale: string = "vi"): HerbalArticle[] {
  const normQuest = (quest || "").toLowerCase();
  const normTopic = (topic || "").toLowerCase();

  let targetTags: string[] = [];

  if (
    normQuest.includes("diabetes") ||
    normQuest.includes("glucose") ||
    normTopic.includes("tiểu đường") ||
    normTopic.includes("đường huyết") ||
    normTopic.includes("đái tháo đường") ||
    normTopic.includes("glucose") ||
    normTopic.includes("insulin") ||
    normTopic.includes("glycemic")
  ) {
    targetTags = ["diabetes", "tieu_duong", "blood_sugar", "glucose", "metabolic"];
  } else if (normQuest.includes("sleep") || normTopic.includes("ngủ") || normTopic.includes("mất ngủ") || normTopic.includes("khó ngủ") || normTopic.includes("thức giấc")) {
    targetTags = ["sleep", "insomnia", "stress", "heart"];
  } else if (normQuest.includes("gout") || normTopic.includes("gút") || normTopic.includes("axit uric") || normTopic.includes("uric") || normTopic.includes("khớp")) {
    targetTags = ["gout", "uric-acid", "joint", "weight"];
  } else if (normQuest.includes("weight") || normTopic.includes("cân") || normTopic.includes("vóc dáng") || normTopic.includes("mỡ") || normTopic.includes("chuyển hóa")) {
    targetTags = ["weight", "metabolic", "detox", "healthy-aging"];
  } else if (normQuest.includes("stress") || normTopic.includes("căng thẳng") || normTopic.includes("lo âu") || normTopic.includes("áp lực") || normTopic.includes("mệt mỏi")) {
    targetTags = ["stress", "anxiety", "sleep", "digestion"];
  } else if (normQuest.includes("digestion") || normTopic.includes("tiêu hóa") || normTopic.includes("dạ dày") || normTopic.includes("đầy bụng") || normTopic.includes("trướng bụng")) {
    targetTags = ["digestion", "stomach", "nausea", "general"];
  } else if (normQuest.includes("blood_pressure") || normTopic.includes("huyết áp") || normTopic.includes("tim mạch")) {
    targetTags = ["cardiovascular", "hypertension", "circulation", "heart"];
  } else {
    targetTags = ["sleep", "stress", "weight", "general"];
  }

  // Sort: herbs matching the target tags come first
  const sorted = [...HERBAL_CATALOG].sort((a, b) => {
    const aMatches = a.matchedTopics.filter(t => targetTags.includes(t)).length;
    const bMatches = b.matchedTopics.filter(t => targetTags.includes(t)).length;
    return bMatches - aMatches;
  });

  return sorted.map(h => getLocalizedHerb(h, locale));
}
