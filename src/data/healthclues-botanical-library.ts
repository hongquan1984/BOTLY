/**
 * HealthClues Botanical Scientific Knowledge Library
 * Evidence-based herbal knowledge articles with verified PubMed citations,
 * physiological mechanisms, evidence classifications, study limitations,
 * and strict educational boundaries.
 *
 * All PMIDs and study citations are verified against the National Library of Medicine (PubMed).
 * NO therapeutic claims, cure assertions, or treatment dosing regimens are provided.
 */

export type BotanicalEvidenceLevel =
  | 'in_vitro'
  | 'animal'
  | 'human_observational'
  | 'human_clinical_trial'
  | 'systematic_review'
  | 'traditional_use';

export type BotanicalReviewStatus = 'approved' | 'needs_review' | 'archived';

export type BotanicalCompound = {
  name: string;
  scientificDescription: {
    vi: string;
    en: string;
  };
};

export type BiologicalMechanism = {
  title: {
    vi: string;
    en: string;
  };
  description: {
    vi: string;
    en: string;
  };
};

export type ActualFinding = {
  title: {
    vi: string;
    en: string;
  };
  summary: {
    vi: string;
    en: string;
  };
  modelType: 'in_vitro' | 'animal' | 'human_pilot' | 'clinical_trial' | 'systematic_review';
};

export type BotanicalReference = {
  title: string;
  authors: string;
  journal?: string;
  year: number;
  url: string;
  pmid: string;
  doi?: string;
  studyType: 'in_vitro' | 'animal' | 'human_observational' | 'human_clinical_trial' | 'systematic_review';
};

export type BotanicalArticle = {
  id: string;
  slug: string;
  topicKeys: string[];
  imageUrl?: string;
  categoryBadge?: {
    vi: string;
    en: string;
  };
  keyHighlights?: {
    vi: string[];
    en: string[];
  };
  commonName: {
    vi: string;
    en: string;
  };
  scientificName: string;
  shortIntro: {
    vi: string;
    en: string;
  };
  compounds: BotanicalCompound[];
  biologicalMechanisms: BiologicalMechanism[];
  actualFindings: ActualFinding[];
  evidenceLevel: BotanicalEvidenceLevel;
  studyLimitations: {
    vi: string[];
    en: string[];
  };
  safetyAndContraindications: {
    vi: string[];
    en: string[];
  };
  references: BotanicalReference[];
  reviewStatus: BotanicalReviewStatus;
  lastVerifiedDate: string;
  educationalDisclaimer: {
    vi: string;
    en: string;
  };
};

const STANDARD_EDUCATIONAL_DISCLAIMER = {
  vi: 'Nội dung mang tính chất tham khảo giáo dục khoa học, không cấu thành tư vấn, chẩn đoán hay phác đồ điều trị y khoa. Thảo mộc và thực phẩm không thể thay thế thuốc chữa bệnh hoặc chỉ định của bác sĩ chuyên khoa. Tuyệt đối không tự ý ngừng, giảm hay thay đổi liều lượng thuốc điều trị khi chưa có ý kiến của nhân viên y tế.',
  en: 'This content is for scientific educational and informational purposes only and does not constitute medical advice, diagnosis, or treatment. Botanicals and dietary elements are not substitutes for prescribed medical therapies or professional clinical care. Never stop, alter, or delay prescribed medical treatments without consulting a qualified healthcare professional.',
};

export const botanicalLibrary: BotanicalArticle[] = [
  // --------------------------------------------------------------------------
  // ARTICLE 1: Tía tô (Perilla frutescens) - Gout / Uric Acid
  // --------------------------------------------------------------------------
  {
    id: 'perilla-frutescens',
    slug: 'tia-to-perilla-frutescens',
    topicKeys: ['gout', 'uric-acid'],
    imageUrl: '/healthclues/assets/botanical/perilla-frutescens.webp',
    categoryBadge: {
      vi: '🌿 Thảo mộc chuyển hóa acid uric',
      en: '🌿 Uric Acid Metabolism Herb',
    },
    keyHighlights: {
      vi: [
        'Ức chế enzyme Xanthine Oxidase (hỗ trợ kiểm soát tổng hợp acid uric)',
        'Hỗ trợ giảm phản ứng sưng viêm & đau khớp thực nghiệm',
        'Chống oxy hóa mạnh từ Rosmarinic acid & Luteolin',
      ],
      en: [
        'Inhibits Xanthine Oxidase (preclinical uric acid synthesis control)',
        'Attenuates experimental joint inflammation and swelling response',
        'Potent antioxidant protection via Rosmarinic acid and Luteolin',
      ],
    },
    commonName: {
      vi: 'Tía tô',
      en: 'Perilla / Shiso / Beefsteak Plant',
    },
    scientificName: 'Perilla frutescens (L.) Britton',
    shortIntro: {
      vi: 'Tía tô là cây thảo thuộc họ Hoa môi (Lamiaceae), có lịch sử sử dụng lâu đời trong ẩm thực và y học cổ truyền Đông Á. Các nghiên cứu tiền lâm sàng hiện đại đã phân lập và khảo sát hoạt tính ức chế enzyme tổng hợp acid uric (xanthine oxidase) của các hợp chất polyphenol trong lá tía tô.',
      en: 'Perilla is an herbaceous annual plant belonging to the mint family (Lamiaceae), widely utilized in East Asian culinary traditions and folk medicine. Contemporary preclinical research has isolated and evaluated the inhibitory activities of its leaf polyphenols against xanthine oxidase, the primary enzyme involved in uric acid synthesis.',
    },
    compounds: [
      {
        name: 'Rosmarinic acid',
        scientificDescription: {
          vi: 'Hợp chất ester polyphenol đặc trưng có hoạt tính chống oxy hóa mạnh, tham gia điều hòa phản ứng viêm trong các mô hình thực nghiệm và góp phần ức chế enzyme chuyển hóa purine.',
          en: 'A signature polyphenol ester with pronounced antioxidant properties, modulating experimental inflammatory responses and contributing to purine-metabolizing enzyme inhibition.',
        },
      },
      {
        name: 'Luteolin',
        scientificDescription: {
          vi: 'Flavone thực vật có ái lực gắn kết cao vào vị trí hoạt động của enzyme xanthine oxidase, thể hiện tác dụng ức chế cạnh tranh và không cạnh tranh trong các khảo sát in vitro.',
          en: 'A dietary flavone exhibiting high binding affinity for the catalytic center of xanthine oxidase, demonstrating competitive and non-competitive inhibition kinetics in in vitro assays.',
        },
      },
      {
        name: 'Apigenin',
        scientificDescription: {
          vi: 'Hợp chất bioflavonoid tự nhiên có khả năng làm giảm hoạt lực của enzyme xanthine oxidase và giảm gánh nặng của các gốc oxy hóa tự do sinh ra trong chu trình dị hóa purine.',
          en: 'A natural bioflavonoid shown to suppress xanthine oxidase catalytic activity while attenuating reactive oxygen species generated during purine catabolism.',
        },
      },
      {
        name: 'Vinyl caffeate & Methyl rosmarinate',
        scientificDescription: {
          vi: 'Các dẫn xuất acid phenolic được phân lập thông qua chiết xuất định hướng sinh học, được ghi nhận là những chất ức chế xanthine oxidase tiềm năng trong dịch chiết lá tía tô.',
          en: 'Phenolic acid derivatives isolated through bioassay-guided fractionation, identified as notable xanthine oxidase inhibitors within perilla leaf extracts.',
        },
      },
    ],
    biologicalMechanisms: [
      {
        title: {
          vi: 'Ức chế enzyme Xanthine Oxidase (XO)',
          en: 'Xanthine Oxidase (XO) Enzyme Inhibition',
        },
        description: {
          vi: 'Xanthine oxidase là enzyme xúc tác quá trình oxy hóa liên tiếp hypoxanthine thành xanthine, rồi từ xanthine thành acid uric. Trong các khảo sát động học enzyme, các hợp chất flavonoid và acid phenolic từ lá tía tô liên kết với phân tử enzyme, làm giảm tốc độ phản ứng tạo acid uric theo cơ chế ức chế hỗn hợp.',
          en: 'Xanthine oxidase catalyzes the progressive oxidation of hypoxanthine to xanthine, and subsequently to uric acid. In enzyme kinetic evaluations, perilla leaf flavonoids and phenolic acids bind to the enzyme complex, decreasing the catalytic rate of uric acid generation via mixed-type inhibition.',
        },
      },
      {
        title: {
          vi: 'Điều hòa phản ứng viêm tế bào liên quan đến tinh thể urat',
          en: 'Modulation of Cellular Inflammatory Responses to Urate Crystals',
        },
        description: {
          vi: 'Sự lắng đọng tinh thể monosodium urate (MSU) tại các khớp có thể kích hoạt phức hợp viêm NLRP3 và giải phóng cytokine tiền viêm. Các polyphenol trong tía tô thể hiện khả năng giảm phóng thích chất trung gian gây viêm trong mô hình nuôi cấy tế bào thực nghiệm.',
          en: 'Precipitation of monosodium urate (MSU) crystals in articular structures triggers the NLRP3 inflammasome pathway and pro-inflammatory cytokine release. Perilla polyphenols demonstrate attenuation of inflammatory mediator expression in cell culture models.',
        },
      },
    ],
    actualFindings: [
      {
        title: {
          vi: 'Khảo sát ức chế enzyme in vitro (Huo và cs., 2015)',
          en: 'In Vitro Enzyme Inhibition Screening (Huo et al., 2015)',
        },
        summary: {
          vi: 'Nghiên cứu phân lập định hướng hoạt tính đã phân tích các hoạt chất từ lá Tía tô trên mô hình enzyme xanthine oxidase sữa bò. Kết quả xác định caffeic acid, vinyl caffeate, rosmarinic acid, methyl rosmarinate và apigenin có hoạt tính ức chế enzyme phụ thuộc nồng độ.',
          en: 'Bioassay-guided fractionation of perilla leaves tested against bovine milk xanthine oxidase identified caffeic acid, vinyl caffeate, rosmarinic acid, methyl rosmarinate, and apigenin as concentration-dependent enzyme inhibitors.',
        },
        modelType: 'in_vitro',
      },
      {
        title: {
          vi: 'Thử nghiệm trên mô hình chuột tăng acid uric máu (Huo và cs., 2015)',
          en: 'In Vivo Rodent Hyperuricemia Model (Huo et al., 2015)',
        },
        summary: {
          vi: 'Trên chuột nhắt trắng được gây tăng acid uric máu bằng potassium oxonate, việc cho uống dịch chiết lá tía tô chuẩn hóa ghi nhận sự sụt giảm nồng độ acid uric huyết thanh có ý nghĩa thống kê so với nhóm chuột đối chứng không dùng dịch chiết.',
          en: 'In hyperuricemic mice induced with potassium oxonate, oral administration of standardized perilla leaf extract resulted in a statistically significant reduction in serum uric acid levels compared to untreated hyperuricemic controls.',
        },
        modelType: 'animal',
      },
    ],
    evidenceLevel: 'animal',
    studyLimitations: {
      vi: [
        'Dữ liệu hiện tại chủ yếu dừng ở mức độ ống nghiệm (in vitro) và mô hình động vật gặm nhấm; chưa có thử nghiệm lâm sàng ngẫu nhiên có đối chứng (RCT) quy mô lớn trên người.',
        'Nồng độ chiết xuất tinh khiết dùng trong phòng thí nghiệm cao hơn rất nhiều so với hàm lượng hấp thu thực tế khi sử dụng tía tô qua đường ăn uống thông thường.',
        'Chuyển hóa qua đường tiêu hóa và gan ở người (quá trình liên hợp glucuronide/sulfate) có thể làm giảm hoặc thay đổi đáng kể hoạt tính ức chế enzyme của các hợp chất polyphenol trong cơ thể.',
        'Các nghiên cứu sử dụng dung môi chiết xuất hữu cơ chuẩn hóa trong phòng thí nghiệm, không tương đương với nước sắc hoặc lá tươi dùng trong sinh hoạt gia đình.',
      ],
      en: [
        'Current evidence is primarily derived from in vitro assays and rodent models; large-scale randomized controlled trials (RCTs) in human populations are lacking.',
        'Experimental concentrations of purified active fractions markedly exceed bioavailable concentrations achievable through everyday dietary intake.',
        'First-pass gastrointestinal and hepatic metabolism (glucuronidation/sulfation) in humans can alter or diminish the actual in vivo enzyme-inhibiting potency of dietary polyphenols.',
        'Studies utilize laboratory-standardized solvent extracts, which differ phytochemically from raw culinary leaves or home-prepared infusions.',
      ],
    },
    safetyAndContraindications: {
      vi: [
        'Tía tô được xem là an toàn ở liều lượng ẩm thực thông thường trong chế độ ăn.',
        'Người có tiền sử dị ứng với các loài thực vật thuộc họ Hoa môi (Lamiaceae như húng quế, bạc hà, hương thảo) nên thận trọng trước nguy cơ viêm da tiếp xúc hoặc dị ứng.',
        'Cần tham vấn ý kiến bác sĩ chuyên khoa nếu đang sử dụng các thuốc hạ acid uric kê đơn (như allopurinol, febuxostat) hoặc thuốc chống đông máu (do rosmarinic acid có hoạt tính chống kết tập tiểu cầu nhẹ).',
        'Phụ nữ mang thai và phụ nữ đang cho con bú nên sử dụng ở mức độ gia vị ăn uống tự nhiên, tránh dùng các dạng tinh dầu hoặc viên chiết xuất đậm đặc kéo dài do thiếu dữ liệu an toàn lâm sàng.',
      ],
      en: [
        'Perilla is generally recognized as safe when consumed in standard culinary food quantities.',
        'Individuals with recognized sensitivities to Lamiaceae family species (e.g., basil, mint, rosemary) should exercise caution regarding contact dermatitis or hypersensitivity reactions.',
        'Consult a qualified physician or pharmacist if concurrently taking prescribed urate-lowering agents (such as allopurinol or febuxostat) or anticoagulant medications (due to mild antiplatelet properties of rosmarinic acid).',
        'Pregnant or nursing individuals should limit consumption to natural culinary seasoning levels and avoid high-concentration dietary supplements due to limited clinical safety data.',
      ],
    },
    references: [
      {
        title: 'Bioassay-Guided Isolation and Identification of Xanthine Oxidase Inhibitory Constituents from the Leaves of Perilla frutescens',
        authors: 'Huo C, Wan L, Wang H, Zhang X, Zhou Z, Gao K',
        journal: 'Molecules',
        year: 2015,
        url: 'https://pubmed.ncbi.nlm.nih.gov/26425999/',
        pmid: '26425999',
        doi: '10.3390/molecules201017848',
        studyType: 'animal',
      },
      {
        title: 'Isolation, characterization, and xanthine oxidase inhibitory activities of flavonoids from the leaves of Perilla frutescens',
        authors: 'Liu J, Wan L, Huo C, Zhang X, Gao K',
        journal: 'Natural Product Research',
        year: 2020,
        url: 'https://pubmed.ncbi.nlm.nih.gov/30600717/',
        pmid: '30600717',
        doi: '10.1080/14786419.2018.1544983',
        studyType: 'in_vitro',
      },
    ],
    reviewStatus: 'approved',
    lastVerifiedDate: '2026-11-07',
    educationalDisclaimer: STANDARD_EDUCATIONAL_DISCLAIMER,
  },

  // --------------------------------------------------------------------------
  // ARTICLE 2: Atiso đỏ / Bụp giấm (Hibiscus sabdariffa) - Gout / Uric Acid
  // --------------------------------------------------------------------------
  {
    id: 'hibiscus-sabdariffa',
    slug: 'atiso-do-bup-giam-hibiscus-sabdariffa',
    topicKeys: ['gout', 'uric-acid'],
    imageUrl: '/healthclues/assets/botanical/hibiscus-sabdariffa.webp',
    categoryBadge: {
      vi: '🌺 Thảo mộc bài tiết & thanh lọc thận',
      en: '🌺 Renal Uric Acid Excretion Herb',
    },
    keyHighlights: {
      vi: [
        'Hỗ trợ tăng bài tiết acid uric qua thận (cơ chế uricosuric)',
        'Giàu Anthocyanin chống oxy hóa và bảo vệ thành mạch',
        'Hỗ trợ điều hòa huyết áp nhẹ (nghiên cứu quan sát trên người)',
      ],
      en: [
        'Enhances renal excretion of uric acid (uricosuric action)',
        'Rich in Anthocyanins protecting cardiovascular & vascular integrity',
        'Supports mild blood pressure regulation (human observational studies)',
      ],
    },
    commonName: {
      vi: 'Atiso đỏ / Bụp giấm',
      en: 'Hibiscus / Roselle',
    },
    scientificName: 'Hibiscus sabdariffa L.',
    shortIntro: {
      vi: 'Atiso đỏ (còn gọi là bụp giấm) là loài thực vật thuộc họ Cẩm quỳ (Malvaceae), có đài hoa màu đỏ giàu anthocyanin và các acid hữu cơ thực vật. Nghiên cứu sinh lý và thử nghiệm quan sát bước đầu trên người khảo sát tác động của đài hoa bụp giấm đối với sự gia tăng bài xuất acid uric qua thận.',
      en: 'Hibiscus sabdariffa (commonly known as roselle) is a plant in the mallow family (Malvaceae), notable for its ruby-red calyces rich in anthocyanins and organic plant acids. Physiological studies and preliminary human observational investigations have evaluated its potential to enhance renal excretion and clearance of uric acid.',
    },
    compounds: [
      {
        name: 'Anthocyanins (Delphinidin-3-sambubioside & Cyanidin-3-sambubioside)',
        scientificDescription: {
          vi: 'Các hợp chất sắc tố tự nhiên nhóm polyphenol mang lại sắc đỏ đậm đặc trưng cho đài hoa, có hoạt tính chống oxy hóa mạnh và bảo vệ tế bào biểu mô thận trước stress oxy hóa.',
          en: 'Primary polyphenolic pigment compounds providing the vibrant red calyx color, offering substantial antioxidant activity and cytoprotection to renal epithelial cells against oxidative damage.',
        },
      },
      {
        name: 'Hibiscus acid (dẫn xuất của Hydroxycitric acid)',
        scientificDescription: {
          vi: 'Hợp chất acid hữu cơ đặc thù chiếm tỷ lệ lớn trong chất chiết đài hoa, có khả năng tạo phức với ion khoáng và ảnh hưởng đến vận chuyển chất qua màng lọc thận.',
          en: 'A characteristic organic acid isomer constituting a major fraction of calyx dry weight, capable of metal chelation and modulating electrolyte transport across renal tubules.',
        },
      },
      {
        name: 'Protocatechuic acid & Chlorogenic acid',
        scientificDescription: {
          vi: 'Các acid phenolic tự do có hoạt tính chống viêm vi mô và hỗ trợ chức năng tưới máu cầu thận trong các thử nghiệm tiền lâm sàng.',
          en: 'Free phenolic acids demonstrating microvascular anti-inflammatory properties and supporting glomerular perfusion balance in preclinical models.',
        },
      },
      {
        name: 'Organic fruit acids (Citric, Malic & Tartaric acids)',
        scientificDescription: {
          vi: 'Các acid hữu cơ tự nhiên tạo vị chua đặc trưng, ảnh hưởng đến độ thẩm thấu và pH của dịch lọc nước tiểu.',
          en: 'Naturally occurring fruit acids providing the distinctive tart taste, influencing urinary osmolarity and filtrate pH.',
        },
      },
    ],
    biologicalMechanisms: [
      {
        title: {
          vi: 'Tác dụng tăng bài xuất acid uric qua thận (Uricosuric activity)',
          en: 'Uricosuric Renal Clearance Enhancement',
        },
        description: {
          vi: 'Khác với nhóm ức chế tổng hợp (như allopurinol), Atiso đỏ tác động chủ yếu lên quá trình đào thải qua thận. Các hoạt chất hỗ trợ làm tăng phân suất bài xuất acid uric (fractional excretion of uric acid - FEUa) qua nước tiểu thông qua việc điều hòa các kênh đồng vận chuyển urat tại ống lượn gần.',
          en: 'Unlike synthetic xanthine oxidase inhibitors, Hibiscus operates predominantly through renal clearance pathways. Its constituents have been demonstrated to increase the fractional excretion of uric acid (FEUa) in urine by modulating urate reabsorption mechanisms in the renal proximal tubules.',
        },
      },
      {
        title: {
          vi: 'Giảm gánh nặng oxy hóa mô thận liên quan đến tăng urat máu',
          en: 'Mitigation of Urate-Induced Renal Oxidative Stress',
        },
        description: {
          vi: 'Nồng độ acid uric cao kéo dài có thể gây tổn thương tế bào nội mô và mô kẽ thận do stress oxy hóa. Các polyphenol và anthocyanin trong đài hoa bụp giấm giúp dọn dẹp gốc tự do và làm giảm các chỉ số peroxy hóa lipid tại thận.',
          en: 'Prolonged elevation of circulating uric acid induces microvascular and interstitial renal strain via reactive oxygen intermediates. Hibiscus calyx polyphenols and anthocyanins scavenge free radicals and reduce renal tissue lipid peroxidation markers.',
        },
      },
    ],
    actualFindings: [
      {
        title: {
          vi: 'Thử nghiệm can thiệp hoa tiêu trên người (Prasongwatana và cs., 2008)',
          en: 'Human Interventional Pilot Trial (Prasongwatana et al., 2008)',
        },
        summary: {
          vi: 'Thử nghiệm lâm sàng trên người tình nguyện khỏe mạnh và người có tiền sử sỏi thận sử dụng trà hãm từ 1,5g đài hoa bụp giấm khô 2 lần/ngày trong 15 ngày. Kết quả ghi nhận độ thanh thải và phân suất bài xuất acid uric (FEUa) tăng lên có ý nghĩa thống kê trong giai đoạn uống trà, và trở về mức cơ bản ban đầu sau thời gian rửa trôi (washout).',
          en: 'A clinical study in healthy volunteers and renal stone formers consuming an infusion of 1.5 g dried roselle calyces twice daily for 15 days observed a statistically significant elevation in urinary uric acid excretion and fractional clearance (FEUa) during intake, which reverted to baseline following a washout period.',
        },
        modelType: 'human_pilot',
      },
      {
        title: {
          vi: 'Khảo sát thực nghiệm trên chuột cống tăng acid uric máu (Solangi và cs., 2012)',
          en: 'Experimental Study in Hyperuricemic Rats (Solangi et al., 2012)',
        },
        summary: {
          vi: 'Trên chuột cống được gây tăng acid uric máu bằng potassium oxonate, dịch chiết Atiso đỏ làm giảm nồng độ urat huyết thanh thông qua việc tăng hoạt tính uricase mà không làm ức chế trực tiếp enzyme xanthine oxidase.',
          en: 'In hyperuricemic rats induced with potassium oxonate, hibiscus calyx extract reduced serum urate concentrations through enhanced uricase activity without directly suppressing xanthine oxidase.',
        },
        modelType: 'animal',
      },
    ],
    evidenceLevel: 'human_observational',
    studyLimitations: {
      vi: [
        'Cỡ mẫu thử nghiệm lâm sàng trên người còn nhỏ (dưới 40 đối tượng) và được thực hiện trên nhóm tình nguyện viên khỏe mạnh hoặc người có tiền sử sỏi thận, không phải bệnh nhân đang có cơn gút cấp hoặc tophi gút nặng.',
        'Nghiên cứu chỉ đánh giá chỉ số sinh hóa bài tiết qua nước tiểu trong thời gian ngắn (15 ngày), chưa có thử nghiệm lâm sàng dài hạn xác nhận việc giảm tần suất tái phát cơn đau gút.',
        'Sự gia tăng đào thải acid uric qua thận có thể làm tăng lượng urat trong nước tiểu; những người có cơ địa dễ tạo sỏi acid uric cần được theo dõi kỹ lưỡng dưới sự giám sát của bác sĩ.',
        'Hàm lượng acid và anthocyanin giữa các nguồn nguyên liệu thương mại khác nhau có sự chênh lệch lớn phụ thuộc vào thổ nhưỡng và quy trình sấy khô.',
      ],
      en: [
        'Human interventional data is derived from pilot-scale cohorts (under 40 subjects) evaluated in healthy volunteers or renal stone formers, rather than patients with active acute gout flares or tophaceous gout.',
        'The investigation assessed biochemical urinary excretion over a short intervention window (15 days); long-term clinical trials evaluating actual reduction of gout flare recurrence are absent.',
        'Increased urinary excretion of uric acid elevates urate concentration in the collecting system, necessitating caution in patients predisposed to acidic urinary calculi.',
        'Anthocyanin and organic acid concentrations vary considerably across commercial botanical sources depending on harvest timing and drying methods.',
      ],
    },
    safetyAndContraindications: {
      vi: [
        'Tác động hạ huyết áp: Atiso đỏ có tác dụng làm hạ huyết áp tâm thu và tâm trương đã được chứng minh trong các thử nghiệm lâm sàng (như McKay và cs., 2010); người đang dùng thuốc điều trị huyết áp cần tham vấn bác sĩ để tránh nguy cơ tụt huyết áp quá mức.',
        'Kích ứng đường tiêu hóa: Do hàm lượng acid hữu cơ cao, nước hãm Atiso đỏ có thể gây cồn cào, khó chịu hoặc làm bùng phát triệu chứng ở người có tiền sử viêm loét dạ dày - tá tràng hoặc trào ngược thực quản (GERD).',
        'Tác dụng lợi tiểu nhẹ: Có thể làm gia tăng thể tích nước tiểu, cần lưu ý khi đang sử dụng chung với các nhóm thuốc lợi tiểu tổng hợp kê đơn.',
        'Chống chỉ định đối với phụ nữ mang thai và phụ nữ đang nuôi con bằng sữa mẹ do một số nghiên cứu trên động vật ghi nhận tác động kích thích co bóp cơ tử cung.',
      ],
      en: [
        'Blood pressure modulation: Hibiscus demonstrates established blood pressure-lowering effects in clinical trials (e.g., McKay et al., 2010); individuals taking antihypertensive medications should seek medical supervision to avoid potential hypotension.',
        'Gastrointestinal irritation: Due to pronounced organic acidity, concentrated infusions may cause dyspepsia, pyrosis, or gastric discomfort in patients with peptic ulcers or gastroesophageal reflux disease (GERD).',
        'Mild diuretic action: May modestly increase urine volume; caution is recommended when co-administered with prescribed diuretic therapies.',
        'Contraindicated in pregnancy and lactation due to documented emmenagogue and potential uterine-contractile actions in animal experimental models.',
      ],
    },
    references: [
      {
        title: 'Uricosuric effect of Roselle (Hibiscus sabdariffa) in normal and renal-stone former subjects',
        authors: 'Prasongwatana V, Woottisin S, Sriboonlue P, Kukongviriyapan V',
        journal: 'Journal of Ethnopharmacology',
        year: 2008,
        url: 'https://pubmed.ncbi.nlm.nih.gov/18423919/',
        pmid: '18423919',
        doi: '10.1016/j.jep.2008.02.036',
        studyType: 'human_observational',
      },
      {
        title: 'Hibiscus sabdariffa L. tea (tisane) lowers blood pressure in prehypertensive and mildly hypertensive adults',
        authors: 'McKay DL, Chen CY, Saltzman E, Blumberg JB',
        journal: 'The Journal of Nutrition',
        year: 2010,
        url: 'https://pubmed.ncbi.nlm.nih.gov/20018807/',
        pmid: '20018807',
        doi: '10.3945/jn.109.115097',
        studyType: 'human_clinical_trial',
      },
    ],
    reviewStatus: 'approved',
    lastVerifiedDate: '2026-11-07',
    educationalDisclaimer: STANDARD_EDUCATIONAL_DISCLAIMER,
  },

  // --------------------------------------------------------------------------
  // ARTICLE 3: Cúc La Mã (Matricaria chamomilla) - Sleep / Rest
  // --------------------------------------------------------------------------
  {
    id: 'matricaria-chamomilla',
    slug: 'cuc-la-ma-matricaria-chamomilla',
    topicKeys: ['sleep', 'insomnia'],
    imageUrl: '/healthclues/assets/botanical/matricaria-chamomilla.webp',
    categoryBadge: {
      vi: '🌼 Thảo mộc dịu thần kinh & giấc ngủ',
      en: '🌼 Calm Nervous System & Sleep Herb',
    },
    keyHighlights: {
      vi: [
        'Gắn kết thụ thể GABA-A làm dịu thần kinh, hỗ trợ vào giấc ngủ sâu',
        'Thư giãn cơ trơn & làm êm dịu đường tiêu hóa, giảm khó chịu dạ dày',
        'Kháng viêm tự nhiên từ Apigenin, Chamazulene & Bisabolol',
      ],
      en: [
        'Binds GABA-A receptors to soothe nervous system & support deep sleep',
        'Smooth muscle relaxation easing gentle digestive discomfort',
        'Natural anti-inflammatory synergy from Apigenin, Chamazulene & Bisabolol',
      ],
    },
    commonName: {
      vi: 'Cúc La Mã',
      en: 'German Chamomile',
    },
    scientificName: 'Matricaria chamomilla L. (syn. Matricaria recutita L.)',
    shortIntro: {
      vi: 'Cúc La Mã là loài thực vật thảo mộc thuộc họ Cúc (Asteraceae), nổi tiếng với lịch sử ứng dụng lâu đời nhằm tạo cảm giác thư giãn và hỗ trợ giấc ngủ. Các nghiên cứu dược lý học hiện đại đã xác định cơ chế gắn kết của hoạt chất flavonoid apigenin với thụ thể GABA trong hệ thần kinh trung ương.',
      en: 'German Chamomile is an herbaceous plant belonging to the daisy family (Asteraceae), renowned for its long historical use as a calming night tisane. Modern neuropharmacological research has identified the competitive affinity of its flavonoid constituent apigenin for central nervous system GABA receptors.',
    },
    compounds: [
      {
        name: 'Apigenin',
        scientificDescription: {
          vi: 'Flavonoid sinh học chính có khả năng vượt qua hàng rào máu - não, liên kết chọn lọc với các thụ thể benzodiazepine trên phức hợp thụ thể GABA-A, mang lại tác dụng làm dịu và giảm kích thích thần kinh.',
          en: 'A prominent bioflavonoid capable of crossing the blood-brain barrier and binding selectively to benzodiazepine recognition sites on the GABA-A receptor complex, producing gentle anxiolytic and mild hypnotic effects.',
        },
      },
      {
        name: 'Chamazulene & alpha-Bisabolol',
        scientificDescription: {
          vi: 'Các hợp chất sesquiterpene trong tinh dầu hoa có tác dụng thư giãn cơ trơn, chống co thắt và làm dịu các cảm giác căng thẳng thực thể của cơ thể trước khi ngủ.',
          en: 'Sesquiterpene constituents found in the essential oil exhibiting antispasmodic, smooth-muscle relaxing, and anti-inflammatory properties that ease physical somatic tension before sleep.',
        },
      },
      {
        name: 'Luteolin & Quercetin',
        scientificDescription: {
          vi: 'Các chất chống oxy hóa thực vật hỗ trợ bảo vệ các tế bào thần kinh trước stress oxy hóa liên quan đến tình trạng mất ngủ và căng thẳng mạn tính.',
          en: 'Complementary plant polyphenols delivering neuroprotective antioxidant activity against cellular oxidative strain associated with chronic stress and sleep disruption.',
        },
      },
    ],
    biologicalMechanisms: [
      {
        title: {
          vi: 'Tương tác điều hòa thụ thể GABA-A tại vị trí Benzodiazepine',
          en: 'GABA-A Receptor Modulation at the Benzodiazepine Site',
        },
        description: {
          vi: 'GABA là chất dẫn truyền thần kinh ức chế chính trong não bộ. Hoạt chất apigenin trong cúc La Mã gắn cạnh tranh vào vị trí thụ thể benzodiazepine trung ương của phức hợp thụ thể GABA-A. Khác với các thuốc an thần tổng hợp (vốn là chất chủ vận toàn phần dễ gây nhờn thuốc và phụ thuộc), apigenin đóng vai trò phối tử có hoạt lực vừa phải, giúp tăng cường dẫn truyền ức chế tự nhiên mà không gây ức chế sâu hay giãn cơ vận động nặng.',
          en: 'GABA serves as the principal inhibitory neurotransmitter in the mammalian central nervous system. Apigenin competitively binds to central benzodiazepine binding pockets on GABA-A receptors. Unlike synthetic pharmaceutical agonists that risk rapid tolerance and physical dependence, apigenin acts as a moderate-affinity ligand, facilitating endogenous inhibitory neurotransmission without severe motor incoordination or heavy sedation.',
        },
      },
      {
        title: {
          vi: 'Giảm trạng thái kích thích vỏ não trước khi ngủ (Pre-sleep Hyperarousal)',
          en: 'Reduction of Pre-Sleep Cognitive Hyperarousal',
        },
        description: {
          vi: 'Bằng cách làm dịu hoạt động kích thích của hệ thần kinh giao cảm và giảm bớt các suy nghĩ lo âu lặp lại, cúc La Mã hỗ trợ tạo điều kiện tâm lý và sinh lý thuận lợi để cơ thể bước vào chu kỳ giấc ngủ tự nhiên.',
          en: 'By buffering sympathetic nervous tone and dampening rumination and anxious tension, chamomile establishes physiological conditions conducive to initiating natural sleep cycles.',
        },
      },
    ],
    actualFindings: [
      {
        title: {
          vi: 'Thử nghiệm lâm sàng trên người cao tuổi (Adib-Hajbaghery & Mousavi, 2017)',
          en: 'Clinical Trial in Elderly Adults (Adib-Hajbaghery & Mousavi, 2017)',
        },
        summary: {
          vi: 'Thử nghiệm lâm sàng ngẫu nhiên có đối chứng trên 60 người cao tuổi (từ 60 tuổi trở lên) dùng 200mg chiết xuất cúc La Mã dạng viên nang 2 lần/ngày trong 28 ngày liên tục. Kết quả cho thấy nhóm can thiệp có sự cải thiện rõ rệt và có ý nghĩa thống kê về điểm số chất lượng giấc ngủ theo thang đo PSQI so với nhóm chứng dùng giả dược.',
          en: 'A randomized controlled clinical trial in 60 older adults receiving 200 mg of standardized chamomile extract capsules twice daily for 28 consecutive days demonstrated statistically significant improvements in subjective sleep quality scores (PSQI) compared to the placebo cohort.',
        },
        modelType: 'clinical_trial',
      },
      {
        title: {
          vi: 'Thử nghiệm hoa tiêu mù đôi trên bệnh mất ngủ nguyên phát mạn tính (Zick và cs., 2011)',
          en: 'Double-Blind Pilot Trial in Chronic Primary Insomnia (Zick et al., 2011)',
        },
        summary: {
          vi: 'Thử nghiệm mù đôi, có đối chứng giả dược ở 34 bệnh nhân mắc chứng mất ngủ nguyên phát mạn tính sử dụng 270mg chiết xuất cúc La Mã 2 lần/ngày trong 28 ngày. Nghiên cứu ghi nhận tác dụng cải thiện khiêm tốn đối với chức năng hoạt động ban ngày và độ tỉnh táo, nhưng không ghi nhận thay đổi lớn trên các chỉ số nhật ký giấc ngủ như tổng thời gian ngủ hay hiệu suất giấc ngủ ở nhóm bệnh lý nặng này.',
          en: 'A randomized, double-blind, placebo-controlled pilot study in 34 patients with chronic primary insomnia taking 270 mg of standardized chamomile extract twice daily for 28 days observed modest daytime functioning benefits, but found limited significant differences in sleep diary metrics such as total sleep time or sleep efficiency in this chronic pathological cohort.',
        },
        modelType: 'clinical_trial',
      },
      {
        title: {
          vi: 'Nghiên cứu gắn kết thụ thể thần kinh in vitro & in vivo (Viola và cs., 1995)',
          en: 'Neuroreceptor Binding Study In Vitro & In Vivo (Viola et al., 1995)',
        },
        summary: {
          vi: 'Nghiên cứu kinh điển đã phân lập apigenin từ dịch chiết hoa cúc La Mã và chứng minh ái lực ức chế cạnh tranh với flunitrazepam gắn trên thụ thể benzodiazepine trung ương (Ki = 4 microM), đồng thời thể hiện tác dụng làm giảm lo âu trên mô hình mê cung nâng cao ở động vật.',
          en: 'A seminal pharmacological study isolated apigenin from chamomile flowers, demonstrating competitive inhibition of [3H]flunitrazepam binding to central benzodiazepine receptors (Ki = 4 microM) alongside clear anxiolytic behavior in animal elevated plus-maze tests.',
        },
        modelType: 'in_vitro',
      },
    ],
    evidenceLevel: 'human_clinical_trial',
    studyLimitations: {
      vi: [
        'Hiệu quả được quan sát rõ rệt nhất ở người lớn tuổi hoặc các trường hợp khó ngủ liên quan đến căng thẳng, lo âu tình huống; chưa có bằng chứng xác nhận hiệu quả điều trị đối với bệnh mất ngủ mạn tính nghiêm trọng kéo dài.',
        'Sự khác biệt đáng kể giữa các dạng bào chế: trà hãm hoa cúc truyền thống chứa hàm lượng apigenin sinh khả dụng thấp hơn và biến động hơn rất nhiều so với các chế phẩm cao khô chuẩn hóa dùng trong thử nghiệm lâm sàng.',
        'Nhiều nghiên cứu lâm sàng chủ yếu dựa trên thang đo tự báo cáo chủ quan (PSQI), còn hạn chế về dữ liệu ghi nhận khách quan bằng điện não đồ hoặc đa ký giấc ngủ (polysomnography).',
        'Thời gian theo dõi trong hầu hết các thử nghiệm lâm sàng chỉ kéo dài từ 2 đến 4 tuần, thiếu dữ liệu an toàn và hiệu quả theo dõi liên tục trên 6 tháng.',
      ],
      en: [
        'Clinical benefits appear most robust for situational sleep disruption, age-related sleep architecture changes, or mild stress-related restlessness, with limited evidence for severe chronic primary insomnia disorders.',
        'Pronounced variability across delivery methods: casual steeped herbal tisanes contain substantially lower, non-standardized bioavailable apigenin levels compared to concentrated standardized capsules.',
        'Most human trials rely upon subjective self-reported inventories (e.g., PSQI) rather than rigorous laboratory polysomnography.',
        'Intervention durations in trials rarely exceed 4 weeks, leaving long-term longitudinal efficacy and tolerance beyond 6 months uncharacterized.',
      ],
    },
    safetyAndContraindications: {
      vi: [
        'Dị ứng chéo: Những người có cơ địa dị ứng với các loài thực vật thuộc họ Cúc (Asteraceae/Compositae như cỏ phấn hương ragweed, hoa cúc vạn thọ, bồ công anh) cần cẩn trọng vì có thể xuất hiện phản ứng dị ứng hoặc viêm kết mạc tiếp xúc.',
        'Tác dụng an thần cộng gộp: Thận trọng khi sử dụng đồng thời với các thuốc an thần kinh, thuốc ngủ kê đơn hoặc rượu bia do nguy cơ làm tăng cảm giác buồn ngủ hoặc lơ mơ.',
        'Thành phần coumarin tự nhiên: Một số hợp chất dạng coumarin trong cúc La Mã đòi hỏi sự thận trọng và theo dõi khi dùng chung với các thuốc chống đông máu tổng hợp (như warfarin).',
        'Phụ nữ mang thai nên tránh dùng các dạng tinh dầu đậm đặc hoặc bổ sung viên uống liều cao do chưa có đủ dữ liệu kiểm chứng an toàn thai kỳ.',
      ],
      en: [
        'Cross-allergic reactivity: Individuals with known allergies to the Asteraceae/Compositae family (e.g., ragweed, chrysanthemums, daisies) should exercise caution due to potential contact dermatitis or hypersensitivity.',
        'Additive sedation: Caution is warranted when combining chamomile with central nervous system depressants, pharmaceutical hypnotics, or alcohol due to additive somnolence.',
        'Naturally occurring coumarins: Trace coumarin constituents require monitoring in patients receiving oral anticoagulants (e.g., warfarin).',
        'Pregnant women should avoid concentrated essential oils or excessive supplemental extract intake due to insufficient obstetric safety studies.',
      ],
    },
    references: [
      {
        title: 'The effects of chamomile extract on sleep quality among elderly people: A clinical trial',
        authors: 'Adib-Hajbaghery M, Mousavi SN',
        journal: 'Complementary Therapies in Medicine',
        year: 2017,
        url: 'https://pubmed.ncbi.nlm.nih.gov/29154054/',
        pmid: '29154054',
        doi: '10.1016/j.ctim.2017.09.010',
        studyType: 'human_clinical_trial',
      },
      {
        title: 'Preliminary examination of the efficacy and safety of a standardized chamomile extract for chronic primary insomnia: a randomized, double-blind, placebo-controlled pilot study',
        authors: 'Zick SM, Wright BD, Sen A, Arnedt JT',
        journal: 'BMC Complementary and Alternative Medicine',
        year: 2011,
        url: 'https://pubmed.ncbi.nlm.nih.gov/21939549/',
        pmid: '21939549',
        doi: '10.1186/1472-6882-11-78',
        studyType: 'human_clinical_trial',
      },
      {
        title: 'Apigenin, a component of Matricaria recutita flowers, is a central benzodiazepine receptors-ligand with anxiolytic effects',
        authors: 'Viola H, Wasowski C, Levi de Stein M, Wolfman C, Silveira R, Dajas F, Medina JH, Paladini AC',
        journal: 'Planta Medica',
        year: 1995,
        url: 'https://pubmed.ncbi.nlm.nih.gov/7617761/',
        pmid: '7617761',
        doi: '10.1055/s-2006-958058',
        studyType: 'in_vitro',
      },
    ],
    reviewStatus: 'approved',
    lastVerifiedDate: '2026-11-07',
    educationalDisclaimer: STANDARD_EDUCATIONAL_DISCLAIMER,
  },

  // --------------------------------------------------------------------------
  // ARTICLE 4: Lạc tiên (Passiflora incarnata) - Sleep / Rest
  // --------------------------------------------------------------------------
  {
    id: 'passiflora-incarnata',
    slug: 'lac-tien-passiflora-incarnata',
    topicKeys: ['sleep', 'insomnia'],
    imageUrl: '/healthclues/assets/botanical/passiflora-incarnata.webp',
    categoryBadge: {
      vi: '💜 Thảo mộc an dịu lo âu & giấc ngủ sâu',
      en: '💜 Anxiety Calming & Deep Sleep Herb',
    },
    keyHighlights: {
      vi: [
        'Tăng dẫn truyền GABA nội sinh, giảm lo âu bồn chồn & suy nghĩ miên man',
        'Cải thiện chất lượng và độ sâu chu kỳ giấc ngủ tự nhiên',
        'Thư giãn căng thẳng thần kinh trước khi đi ngủ (tổng quan hệ thống)',
      ],
      en: [
        'Boosts GABAergic signaling, easing anxiety restlessness & racing thoughts',
        'Improves sleep latency and natural restorative sleep architecture',
        'Soothes nighttime somatic and nervous tension (systematic review evidence)',
      ],
    },
    commonName: {
      vi: 'Lạc tiên tây / Lạc tiên',
      en: 'Passionflower / Purple Passionflower',
    },
    scientificName: 'Passiflora incarnata L.',
    shortIntro: {
      vi: 'Lạc tiên tây là loài dây leo lâu năm thuộc họ Lạc tiên (Passifloraceae), có nguồn gốc từ châu Mỹ và được ứng dụng rộng rãi trong y học thảo mộc châu Âu nhằm hỗ trợ làm dịu bồn chồn thần kinh. Các tổng quan hệ thống và nghiên cứu thực nghiệm hiện đại tập trung phân tích cơ chế điều hòa hệ dẫn truyền thần kinh GABA của dịch chiết lạc tiên.',
      en: 'Purple Passionflower is a perennial climbing vine native to the Americas, widely integrated into European herbal pharmacopeias for easing nervous restlessness. Contemporary systematic reviews and neuropharmacological studies focus on its direct modulation of the inhibitory GABAergic neurotransmitter system.',
    },
    compounds: [
      {
        name: 'Flavonoid C-glycosides (Vitexin, Isovitexin, Orientin, Isoorientin)',
        scientificDescription: {
          vi: 'Nhóm flavonoid glycoside phong phú cấu thành phần lớn hoạt chất sinh học, có khả năng điều hòa dẫn truyền thần kinh và làm giảm các triệu chứng lo âu thực thể.',
          en: 'A prominent family of C-glycosyl flavonoids constituting the primary bioactive fraction, linked to central neurotransmission modulation and reduction of somatic anxiety.',
        },
      },
      {
        name: 'Chrysin',
        scientificDescription: {
          vi: 'Hợp chất flavone tự nhiên có ái lực gắn kết với phức hợp thụ thể GABA-A và mang lại tác động an thần nhẹ trong các mô hình thực nghiệm.',
          en: 'A natural dietary flavone demonstrating binding affinity for the central GABA-A receptor complex, exerting mild calming actions in experimental models.',
        },
      },
      {
        name: 'Endogenous GABA (Gamma-aminobutyric acid)',
        scientificDescription: {
          vi: 'Dịch chiết lạc tiên tự nhiên chứa một hàm lượng GABA tự do đáng kể, trực tiếp tham gia vào các thử nghiệm gắn kết thụ thể in vitro.',
          en: 'Natural passionflower extracts contain measurable endogenous free GABA, directly contributing to in vitro receptor binding profiles.',
        },
      },
      {
        name: 'Harmala alkaloids (Harmine, Harmaline - dạng vết)',
        scientificDescription: {
          vi: 'Các alkaloid indol hiện diện với nồng độ rất nhỏ (dạng vết), có khả năng ức chế nhẹ men monoamine oxidase trong các khảo sát hóa thực vật.',
          en: 'Indole alkaloids present in minute trace quantities, capable of weak monoamine oxidase inhibition in phytopharmacological screenings.',
        },
      },
    ],
    biologicalMechanisms: [
      {
        title: {
          vi: 'Điều hòa hệ thống GABA và ức chế tái hấp thu GABA',
          en: 'GABAergic System Modulation & GABA Uptake Inhibition',
        },
        description: {
          vi: 'Nghiên cứu dược lý của Appel và cộng sự (2011) đã chứng minh dịch chiết chuẩn hóa Passiflora incarnata có khả năng ức chế sự tái hấp thu [3H]-GABA vào các synaptosome vỏ não chuột, đồng thời gắn chọn lọc vào cả thụ thể GABA-A và GABA-B, giúp duy trì nồng độ GABA ức chế trong khe synapse thần kinh.',
          en: 'Pharmacological evaluations by Appel et al. (2011) demonstrated that standardized Passiflora incarnata extract concentration-dependently inhibits [3H]-GABA uptake into cortical synaptosomes while binding to both GABA-A and GABA-B receptors, sustaining inhibitory transmitter concentrations in synaptic clefts.',
        },
      },
      {
        title: {
          vi: 'Điều hòa trục HPA và giảm phản ứng căng thẳng tâm thần',
          en: 'HPA-Axis Buffering & Attenuation of Stress Responses',
        },
        description: {
          vi: 'Bằng cách điều hòa trục hạ đồi - tuyến yên - tuyến thượng thận (HPA) và giảm trương lực giao cảm, lạc tiên giúp hạ thấp mức độ cảnh giác quá mức (hyperarousal), tạo điều kiện cho cơ thể dễ dàng đi vào giấc ngủ.',
          en: 'Through modulation of the hypothalamic-pituitary-adrenal (HPA) axis and suppression of autonomic sympathetic hyperarousal, passionflower reduces physiological vigilance, facilitating bedtime transition into restful sleep.',
        },
      },
    ],
    actualFindings: [
      {
        title: {
          vi: 'Tổng quan hệ thống các thử nghiệm lâm sàng (Janda và cs., 2020)',
          en: 'Systematic Review of Clinical Trials (Janda et al., 2020)',
        },
        summary: {
          vi: 'Tổng quan hệ thống phân tích 9 thử nghiệm lâm sàng ngẫu nhiên được bình duyệt trên tạp chí Nutrients ghi nhận Passiflora incarnata thể hiện tác dụng làm giảm lo âu và cải thiện một số khía cạnh của giấc ngủ. Đáng chú ý, các nghiên cứu ghi nhận hồ sơ an toàn thuận lợi, không gây suy giảm nhận thức tâm vận động hay suy giảm trí nhớ.',
          en: 'A systematic review published in Nutrients analyzing 9 randomized clinical trials reported that Passiflora incarnata demonstrated notable anxiolytic benefits and improved aspects of sleep disturbance, maintaining a favorable safety profile devoid of cognitive impairment or psychometric disruption.',
        },
        modelType: 'systematic_review',
      },
      {
        title: {
          vi: 'Thử nghiệm mù đôi ngẫu nhiên đối chứng giả dược (Ngan & Conduit, 2011)',
          en: 'Randomized Double-Blind Placebo-Controlled Trial (Ngan & Conduit, 2011)',
        },
        summary: {
          vi: 'Nghiên cứu chéo mù đôi trên 41 người trưởng thành khỏe mạnh có dao động nhẹ về chất lượng giấc ngủ uống trà hoa Lạc tiên hoặc trà giả dược trong 1 tuần. Kết quả phân tích nhật ký giấc ngủ ghi nhận điểm số chất lượng giấc ngủ chủ quan được cải thiện có ý nghĩa thống kê ở nhóm dùng trà Lạc tiên so với giả dược.',
          en: 'A double-blind, placebo-controlled crossover study in 41 healthy adults experiencing mild sleep fluctuations evaluated passionflower herbal tea versus placebo tisane over 7 days. Sleep diary analyses demonstrated a statistically significant improvement in subjective sleep quality ratings for the passionflower cohort.',
        },
        modelType: 'clinical_trial',
      },
      {
        title: {
          vi: 'Nghiên cứu cơ chế thụ thể GABA in vitro (Appel và cs., 2011)',
          en: 'In Vitro GABA Receptor Mechanistic Study (Appel et al., 2011)',
        },
        summary: {
          vi: 'Nghiên cứu chứng minh dịch chiết Lạc tiên ức chế phụ thuộc nồng độ sự thu nhận [3H]-GABA vào synaptosome vỏ não chuột và có ái lực gắn với các vị trí thụ thể GABA-A và GABA-B, cung cấp bằng chứng thực nghiệm về cơ chế an thần tự nhiên.',
          en: 'Laboratory assays demonstrated that passionflower extract concentration-dependently inhibits [3H]-GABA synaptosomal uptake and exhibits binding affinity for GABA-A and GABA-B receptors, offering direct experimental validation for its traditional sedative properties.',
        },
        modelType: 'in_vitro',
      },
    ],
    evidenceLevel: 'systematic_review',
    studyLimitations: {
      vi: [
        'Một số thử nghiệm lâm sàng trước đây sử dụng chế phẩm phối hợp đa thảo mộc (Lạc tiên kết hợp cùng Nữ lang Valerian hoặc Hoa bia Hops), gây khó khăn trong việc tách biệt tuyệt đối hiệu quả độc lập của riêng Lạc tiên.',
        'Các thử nghiệm đơn trị liệu bằng Lạc tiên thường có quy mô mẫu tương đối nhỏ (dưới 100 đối tượng) và thời gian can thiệp ngắn (từ 7 ngày đến 4 tuần).',
        'Cần thêm các thử nghiệm lâm sàng quy mô lớn sử dụng phương pháp đo đa ký giấc ngủ (polysomnography) để đánh giá chi tiết sự thay đổi về kiến trúc giấc ngủ (như tỷ lệ pha ngủ sâu SWS và ngủ mơ REM).',
        'Sự khác biệt về dạng chiết xuất (trà thảo mộc thông thường, cao cồn lỏng, hoặc viên nang chiết xuất cồn khô chuẩn hóa) ảnh hưởng lớn đến lượng hoạt chất thực tế hấp thu.',
      ],
      en: [
        'Several historical clinical studies utilized multi-herb formulas (e.g., combining passionflower with valerian or hops), confounding direct attribution of clinical effects solely to Passiflora incarnata.',
        'Monotherapy investigations have generally involved modest sample sizes (fewer than 100 subjects) and brief follow-up periods (ranging from 7 days to 4 weeks).',
        'Additional rigorous clinical trials utilizing objective laboratory polysomnography are required to map specific shifts in sleep architecture (such as deep slow-wave sleep and REM cycles).',
        'Delivery formats (aqueous herbal tea infusions, ethanolic fluid extracts, or standardized dry extracts) exhibit substantial disparity in bioavailable active constituent concentrations.',
      ],
    },
    safetyAndContraindications: {
      vi: [
        'Buồn ngủ ban ngày: Có thể gây cảm giác lơ mơ hoặc giảm độ tập trung ở một số người; tuyệt đối không lái xe, vận hành máy móc hoặc làm công việc đòi hỏi độ tỉnh táo cao ngay sau khi sử dụng.',
        'Tương tác thuốc: Tránh dùng chung với các thuốc ức chế thần kinh trung ương (thuốc ngủ, thuốc giải lo âu nhóm benzodiazepine, barbiturate) hoặc đồ uống có cồn do nguy cơ làm tăng tác dụng an thần quá mức.',
        'Chống chỉ định tuyệt đối trong thời kỳ mang thai: Một số nghiên cứu tiền lâm sàng cảnh báo các alkaloid có thể gây kích thích co bóp cơ trơn tử cung.',
        'Phụ nữ cho con bú và trẻ em cần tham khảo ý kiến nhân viên y tế trước khi dùng do thiếu dữ liệu an toàn độc tính lâm sàng chuyên sâu.',
      ],
      en: [
        'Daytime somnolence: May induce mild drowsiness, reduced alertness, or lightheadedness; avoid operating motor vehicles or hazardous machinery immediately following ingestion.',
        'Drug interactions: Avoid concurrent administration with central nervous system depressants (prescription hypnotics, benzodiazepines, barbiturates) or alcohol due to additive depressive effects.',
        'Absolute contraindication in pregnancy: Preclinical data indicate that certain alkaloid fractions may exert uterine-stimulating or oxytocic effects.',
        'Lactating mothers and pediatric populations should consult a licensed healthcare practitioner prior to use due to limited clinical safety data.',
      ],
    },
    references: [
      {
        title: 'Passiflora incarnata in Neuropsychiatric Disorders-A Systematic Review',
        authors: 'Janda K, Wojtkowska K, Jakubczyk K, Antoniewicz J, Skonieczna-Żydecka K',
        journal: 'Nutrients',
        year: 2020,
        url: 'https://pubmed.ncbi.nlm.nih.gov/33352740/',
        pmid: '33352740',
        doi: '10.3390/nu12123894',
        studyType: 'systematic_review',
      },
      {
        title: 'A double-blind, placebo-controlled investigation of the effects of Passiflora incarnata (passionflower) herbal tea on subjective sleep quality',
        authors: 'Ngan A, Conduit R',
        journal: 'Phytotherapy Research',
        year: 2011,
        url: 'https://pubmed.ncbi.nlm.nih.gov/21294203/',
        pmid: '21294203',
        doi: '10.1002/ptr.3400',
        studyType: 'human_clinical_trial',
      },
      {
        title: 'Modulation of the gamma-aminobutyric acid (GABA) system by Passiflora incarnata L.',
        authors: 'Appel K, Rose T, Fiebich B, Kammler T, Hoffmann C, Weiss G',
        journal: 'Phytotherapy Research',
        year: 2011,
        url: 'https://pubmed.ncbi.nlm.nih.gov/21089181/',
        pmid: '21089181',
        doi: '10.1002/ptr.3352',
        studyType: 'in_vitro',
      },
    ],
    reviewStatus: 'approved',
    lastVerifiedDate: '2026-11-07',
    educationalDisclaimer: STANDARD_EDUCATIONAL_DISCLAIMER,
  },
];

// Alias exports for consistency across existing codebase conventions
export const healthCluesBotanicals = botanicalLibrary;
export const BOTANICAL_ARTICLES = botanicalLibrary;

/**
 * Normalizes text for case-insensitive and diacritic-tolerant comparison
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Search botanical library by keyword in common name, scientific name, intro, compounds, or mechanisms.
 * Supports multi-language query matching across Vietnamese and English.
 */
export function searchBotanicalLibrary(
  query: string,
  locale?: 'vi' | 'en'
): BotanicalArticle[] {
  const cleanQuery = normalizeText(query);
  if (!cleanQuery) return botanicalLibrary;

  return botanicalLibrary.filter((item) => {
    // Topic keys match
    if (item.topicKeys.some((k) => normalizeText(k).includes(cleanQuery))) {
      return true;
    }

    // Scientific name match
    if (normalizeText(item.scientificName).includes(cleanQuery)) {
      return true;
    }

    // Common names match
    if (
      normalizeText(item.commonName.vi).includes(cleanQuery) ||
      normalizeText(item.commonName.en).includes(cleanQuery)
    ) {
      return true;
    }

    // Locale-specific or global text search
    if (!locale || locale === 'vi') {
      if (normalizeText(item.shortIntro.vi).includes(cleanQuery)) return true;
      if (
        item.compounds.some(
          (c) =>
            normalizeText(c.name).includes(cleanQuery) ||
            normalizeText(c.scientificDescription.vi).includes(cleanQuery)
        )
      ) {
        return true;
      }
      if (
        item.biologicalMechanisms.some(
          (m) =>
            normalizeText(m.title.vi).includes(cleanQuery) ||
            normalizeText(m.description.vi).includes(cleanQuery)
        )
      ) {
        return true;
      }
    }

    if (!locale || locale === 'en') {
      if (normalizeText(item.shortIntro.en).includes(cleanQuery)) return true;
      if (
        item.compounds.some(
          (c) =>
            normalizeText(c.name).includes(cleanQuery) ||
            normalizeText(c.scientificDescription.en).includes(cleanQuery)
        )
      ) {
        return true;
      }
      if (
        item.biologicalMechanisms.some(
          (m) =>
            normalizeText(m.title.en).includes(cleanQuery) ||
            normalizeText(m.description.en).includes(cleanQuery)
        )
      ) {
        return true;
      }
    }

    return false;
  });
}

/**
 * Filter botanicals by topic key (e.g. 'gout', 'uric-acid', 'sleep', 'insomnia').
 */
export function getBotanicalsByTopic(topicKey: string): BotanicalArticle[] {
  const target = normalizeText(topicKey);
  if (!target) return [];

  return botanicalLibrary.filter((item) =>
    item.topicKeys.some(
      (k) =>
        normalizeText(k) === target ||
        normalizeText(k).includes(target) ||
        target.includes(normalizeText(k))
    )
  );
}

/**
 * Filter botanicals by scientific evidence classification.
 */
export function filterByEvidenceLevel(
  level: BotanicalEvidenceLevel
): BotanicalArticle[] {
  return botanicalLibrary.filter((item) => item.evidenceLevel === level);
}

/**
 * Retrieve a single botanical article by its unique id.
 */
export function getBotanicalById(id: string): BotanicalArticle | undefined {
  return botanicalLibrary.find((item) => item.id === id);
}

/**
 * Retrieve a single botanical article by its URL-friendly slug.
 */
export function getBotanicalBySlug(slug: string): BotanicalArticle | undefined {
  return botanicalLibrary.find((item) => item.slug === slug);
}

/**
 * Backward-compatible helper for topic-based botanical filtering
 */
export function getRecommendedBotanicalsForTopic(topic: string): BotanicalArticle[] {
  const norm = topic.toLowerCase().trim();
  if (norm.includes("gout") || norm.includes("uric") || norm.includes("gut")) {
    return botanicalLibrary.filter(item => item.topicKeys.some(k => k === "gout" || k === "uric-acid"));
  }
  if (norm.includes("sleep") || norm.includes("ngu") || norm.includes("insomnia") || norm.includes("rest")) {
    return botanicalLibrary.filter(item => item.topicKeys.some(k => k === "sleep" || k === "insomnia"));
  }
  return getBotanicalsByTopic(topic);
}

export const searchBotanicals = searchBotanicalLibrary;
export type EvidenceClassification = BotanicalEvidenceLevel;

