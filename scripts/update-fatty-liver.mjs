const url = 'https://rswmadukvegraxfcdbcb.supabase.co/rest/v1';
const key = 'sb_secret_V0mR7XNH85YEwk7bsP9d4Q_XG7nk3ED';
const articleId = 'c0046ad7-a3b2-4ca8-9921-156b145f87af';

const enData = {
  title: 'Pineapple & Cucumber Juice for Fatty Liver: Hepatic Lipid Metabolism, Antioxidant Defense & Fructose Warnings',
  description: '3D molecular dissection of hepatocyte steatosis: evaluating the biochemical reality of pineapple bromelain, cucumber cucurbitacin, and carrot carotenoids in mitigating hepatic oxidative stress while cautioning against fructose-driven lipogenesis.',
  eyebrow: 'HEPATOLOGY & METABOLIC BIOCHEMISTRY',
  takeaway: 'While plant polyphenols and antioxidants in pineapple, cucumber, and carrot reduce hepatic oxidative stress and downregulate inflammatory cytokines, no beverage reverses fatty liver overnight. Crucially, excess liquid fructose stimulates hepatic de novo lipogenesis; prioritizing cucumber over pineapple and retaining fibrous pulp is essential.',
  reading_minutes: 6,
  evidence: 'promising',
  reviewed_at: '2026-09-08T00:00:00Z',
  tool: 'remedy-checker',
  seo_title: 'Pineapple Cucumber Juice for Fatty Liver: Hepatology Science & Fructose Realities',
  seo_description: 'Examine the gastroenterological evidence for pineapple cucumber juice: hepatic de novo lipogenesis, bromelain antioxidant pathways, and fatty liver reversal facts.',
  status: 'published',
  cover_image_alt: '3D futuristic biomedical simulation of hepatology, cellular lipid metabolism, pineapple and cucumber dissection',
  trust_meter: {
    score: 6.8,
    verdict: 'Antioxidant and hydration support for liver function, but viral overnight cure claims contradict hepatological science',
    primary_benefit: 'Reduces hepatic oxidative stress, supports mitochondrial beta-oxidation, and delivers cellular hydration',
    risk_level: 'moderate'
  },
  quick_recipe: {
    badge: 'LOW-FRUCTOSE LIVER-SAFE INFUSION',
    servings: '1 serving (250ml)',
    ingredients: [
      { item: 'Fresh English cucumber with skin', amount: '1 whole (150g)', note: 'Dominant base providing cellular hydration and cucurbitacin' },
      { item: 'Fresh pineapple (including core)', amount: '1/4 cup (40g only)', note: 'Strictly portioned to avoid liquid fructose surges' },
      { item: 'Fresh carrot', amount: '1/2 medium (50g)', note: 'Supplies beta-carotene to protect hepatic stellate cells' },
      { item: 'Fresh lemon juice', amount: '1/2 lemon', note: 'Provides citric acid and hesperidin for lipid mobilization' },
      { item: 'Purified water', amount: '150ml', note: 'Ensures optimal smooth dilution' }
    ],
    steps: [
      'Wash produce thoroughly under running water; leave cucumber unpeeled to retain protective dietary fiber and polyphenols.',
      'Place cucumber, limited pineapple portion, carrot, lemon juice, and water into a high-speed blender.',
      'Blend for 45-60 seconds into a rich, fibrous smoothie (do NOT strain through a sieve or cheesecloth).',
      'Consume immediately alongside a protein- or healthy-fat-rich breakfast to blunt glycemic absorption.'
    ],
    best_time: 'Drink in the morning alongside breakfast; avoid consuming on an empty stomach or late at night.',
    donts: [
      'NEVER juice large portions of pineapple alone (excess liquid fructose converts directly into hepatic triglycerides, worsening NAFLD).',
      'Do not strain out the fibrous pulp (insoluble fiber is mandatory to slow intestinal fructose absorption).',
      'Do not discontinue physician-prescribed metabolic or cardiovascular medications in reliance on social media overnight cures.'
    ]
  },
  fact_checks: [
    {
      myth: 'Drinking this juice cleanses and completely cures fatty liver in just one night.',
      reality: 'Nonalcoholic fatty liver disease (MASLD) represents cellular fat accumulation (>5% hepatocyte weight) accumulated over years. Reversal requires weeks of caloric deficit, physical exercise, and reduced de novo lipogenesis, measurable via ultrasound or FibroScan after 8-12 weeks.'
    },
    {
      myth: 'Because fruit juice is 100% natural, drinking 2 liters daily accelerates liver detoxification.',
      reality: 'Excess fructose bypasses hepatic phosphofructokinase regulation, converting straight into glycerol-3-phosphate for de novo lipogenesis. Limiting fruit sugars is mandatory in liver disease.'
    }
  ],
  faqs: [
    {
      question: 'Can fructose in fruit juices actually cause or worsen fatty liver?',
      answer: 'Yes! Unlike glucose, which can be utilized by every cell in the body, fructose is metabolized almost exclusively in the liver. High doses of liquid fructose rapidly generate acetyl-CoA and glycerol-3-phosphate, fueling hepatic de novo lipogenesis (DNL). That is why our science-backed formula strictly restricts pineapple to 40g and emphasizes fibrous cucumber.'
    },
    {
      question: 'What do clinical guidelines (AASLD / EASL) recommend for managing fatty liver?',
      answer: 'International hepatology guidelines recommend a 7-10% body weight reduction, a Mediterranean-style dietary pattern rich in monounsaturated fats and polyphenols, avoidance of sugar-sweetened beverages, and regular aerobic exercise (150 mins/week).'
    }
  ],
  safety_quiz: {
    title: 'Check Your Suitability',
    subtitle: 'Answer 3 quick questions (15 seconds) to confirm whether this liver-support smoothie fits your health profile.',
    questions: [
      {
        id: 'q1_nafld_grade',
        text: 'Have you been clinically diagnosed with Stage 2 or 3 NASH (liver inflammation or fibrosis)?',
        options: [
          { label: 'Mild Grade 1 steatosis or normal liver function' },
          { label: 'Advanced NASH / Stage 2-3 fibrosis', is_contraindicated: true, warning: 'MEDICAL OVERSIGHT REQUIRED: Advanced steatohepatitis demands strict clinical dietary management; avoid self-directed fruit juice cleanses.' }
        ]
      },
      {
        id: 'q2_insulin_resistance',
        text: 'Do you have Type 2 Diabetes, elevated HbA1c (>6.5%), or severe insulin resistance?',
        options: [
          { label: 'Normal insulin sensitivity' },
          { label: 'Type 2 Diabetes / severe insulin resistance', warning: 'FRUCTOSE RESTRICTION: Limit pineapple to 20-30g or substitute with leafy greens to protect glycemic control.' }
        ]
      },
      {
        id: 'q3_smoothie_vs_juice',
        text: 'How do you intend to prepare this drink?',
        options: [
          { label: 'Whole blended smoothie retaining complete pulp and fiber' },
          { label: 'Strained clear juice using a centrifugal juicer', is_contraindicated: true, warning: 'INCORRECT METHOD: Straining fiber creates a concentrated fructose bomb that accelerates liver fat accumulation.' }
        ]
      }
    ]
  },
  sections: [
    {
      title: '1. Hepatocyte Lipid Dynamics: Understanding Steatosis and De Novo Lipogenesis',
      paragraphs: [
        'Nonalcoholic Fatty Liver Disease (now clinically termed Metabolic dysfunction-Associated Steatotic Liver Disease - MASLD) is defined by the pathological accumulation of intracellular triglycerides exceeding 5% of total hepatocyte weight.',
        'The primary biochemical driver is an imbalance between hepatic lipid acquisition (free fatty acid uptake and De Novo Lipogenesis - DNL) and lipid clearance (mitochondrial β-oxidation and VLDL secretion).',
        'Crucially, liquid fructose is the most potent dietary driver of DNL. When consumed without adequate fiber, fructose flooding portal circulation bypasses the rate-limiting enzyme phosphofructokinase, funneling unchecked into triose-phosphates and acetyl-CoA, directly synthesizing fatty acids inside the liver.'
      ],
      image_url: '/articles/pineapple-cucumber-liver/cover.jpg',
      image_alt: '3D futuristic biomedical simulation of hepatology, cellular lipid metabolism, pineapple and cucumber dissection'
    },
    {
      title: '2. Phytochemical Adjuvants: Bromelain, Carotenoids and the Fructose Threshold',
      paragraphs: [
        'Despite viral exaggerations, botanical ingredients do possess legitimate hepatoprotective mechanisms when formulated with strict macronutrient awareness.',
        'Cucumbers provide over 95% bioavailable structured water and trace Cucurbitacin triterpenoids that attenuate inflammatory cytokine release within hepatic sinusoidal Kupffer cells.',
        'Carrots deliver lipophilic Beta-carotene and Falcarinol, potent antioxidants that quench lipid peroxidation radicals and suppress the pathological transdifferentiation of hepatic stellate cells into collagen-producing myofibroblasts.',
        'Pineapple supplies Bromelain and ascorbic acid; however, because pineapple contains approximately 10g of sugar per 100g (half of which is fructose), clinical safety mandates restricting pineapple to a modest 40g serving, ensuring the beverage delivers bioactives without triggering DNL.'
      ],
      bullets: [
        'Preserves cellular glutathione levels in hepatocytes combating oxidative strain.',
        'Enhances mitochondrial respiratory chain efficiency to support fatty acid oxidation.',
        'Provides essential hydration to support biliary excretion of metabolic conjugates.'
      ]
    }
  ],
  sources: [
    { label: 'AASLD Practice Guidance: The Clinical Assessment and Management of MASLD', url: 'https://www.aasld.org' },
    { label: 'Hepatology: Fructose and hepatic de novo lipogenesis mechanisms', url: 'https://journals.lww.com/hep' },
    { label: 'Journal of Agricultural and Food Chemistry: Cucurbitacins and carotenoids in hepatic protection', url: 'https://pubs.acs.org/journal/jafcau' }
  ],
  updated_at: new Date().toISOString()
};

const viData = {
  title: 'Nước Ép Dứa & Dưa Leo Với Gan Nhiễm Mỡ: Cơ Chế Hóa Sinh Tế Bào Gan, Chống Oxy Hóa & Cảnh Báo Fructose',
  description: 'Mổ xẻ giải phẫu sinh hóa tế bào gan: giải mã thực tế y học của Bromelain trong dứa, Cucurbitacin trong dưa chuột, Beta-carotene trong cà rốt trong việc giảm stress oxy hóa gan, đồng thời cảnh báo nguy cơ tăng sinh mỡ gan từ đường Fructose.',
  eyebrow: 'BỆNH HỌC GAN MẬT & HÓA SINH CHUYỂN HÓA',
  takeaway: 'Polyphenol và chất chống oxy hóa trong dứa, dưa leo và cà rốt có tác dụng bảo vệ tế bào gan khỏi stress oxy hóa, nhưng không có thức uống nào chữa khỏi gan nhiễm mỡ sau một đêm. Đặc biệt, đường Fructose lỏng kích thích gan tổng hợp mỡ mới; cần ưu tiên dưa leo hơn dứa và giữ nguyên chất xơ.',
  reading_minutes: 6,
  evidence: 'promising',
  reviewed_at: '2026-09-08T00:00:00Z',
  tool: 'remedy-checker',
  seo_title: 'Nước ép dứa và dưa leo trị gan nhiễm mỡ: Cơ chế khoa học và cảnh báo Fructose',
  seo_description: 'Phân tích y khoa về nước ép dứa, dưa leo, cà rốt với bệnh gan nhiễm mỡ: cơ chế tổng hợp mỡ De Novo Lipogenesis, vai trò của bromelain và nguyên tắc kiểm soát fructose.',
  status: 'published',
  cover_image_alt: 'Mô phỏng 3D giải phẫu tế bào gan nhiễm mỡ và các thành phần hóa sinh trong dứa, dưa chuột, cà rốt',
  trust_meter: {
    score: 6.8,
    verdict: 'Có tác dụng hỗ trợ chống oxy hóa tế bào gan, nhưng tuyên bố chữa khỏi gan nhiễm mỡ sau 1 đêm là hoàn toàn phản khoa học',
    primary_benefit: 'Giảm nồng độ gốc tự do ROS tại mô gan, hỗ trợ quá trình beta-oxy hóa axit béo và cấp nước tế bào',
    risk_level: 'moderate'
  },
  quick_recipe: {
    badge: 'CÔNG THỨC GAN KHỎE ÍT FRUCTOSE 2 PHÚT',
    servings: '1 ly (250ml)',
    ingredients: [
      { item: 'Dưa chuột tươi rửa sạch để nguyên vỏ', amount: '1 quả lớn (150g)', note: 'Thành phần nền chủ đạo cấp nước và cucurbitacin' },
      { item: 'Dứa tươi chín (lấy cả cùi lõi)', amount: '1/4 miếng nhỏ (khoảng 40g)', note: 'Khống chế nghiêm ngặt lượng đường fructose' },
      { item: 'Cà rốt tươi', amount: '1/2 củ (50g)', note: 'Bổ sung Beta-carotene bảo vệ tế bào sao gan' },
      { item: 'Nước cốt chanh', amount: '1/2 quả', note: 'Axit citric và hesperidin hỗ trợ chuyển hóa lipid' },
      { item: 'Nước lọc', amount: '150ml', note: 'Giúp sinh tố lỏng mịn dễ uống' }
    ],
    steps: [
      'Rửa sạch nguyên liệu dưới vòi nước chảy; giữ nguyên vỏ dưa chuột để tận dụng chất xơ không hòa tan và polyphenol.',
      'Cắt nhỏ dưa chuột, dứa, cà rốt cho vào máy xay sinh tố cùng nước cốt chanh và nước lọc.',
      'Xay nhuyễn cả bã mịn trong 45-60 giây (tuyệt đối KHÔNG lọc bỏ bã qua rây hay vải xô).',
      'Uống ngay trong bữa ăn sáng hoặc sau khi ăn nhẹ có kèm protein để làm chậm hấp thu đường.'
    ],
    best_time: 'Uống vào buổi sáng cùng bữa ăn; tránh uống khi bụng đói cồn cào hoặc đêm muộn.',
    donts: [
      'TUYỆT ĐỐI KHÔNG ép cả nửa quả hoặc nguyên quả dứa lấy nước ngọt (đường fructose lỏng sẽ chuyển hóa thẳng thành mỡ gan triglyxerit).',
      'Không lọc bỏ bã chất xơ (chất xơ giúp làm chậm tốc độ ruột hấp thu đường fructose vào tĩnh mạch cửa gan).',
      'Không tự ý ngưng thuốc điều trị mỡ máu, tiểu đường của bác sĩ chuyên khoa để uống nước ép thay thế.'
    ]
  },
  fact_checks: [
    {
      myth: 'Uống ly nước ép dứa dưa leo này trước khi ngủ sẽ quét sạch 100% mỡ trong gan chỉ sau đúng 1 đêm.',
      reality: 'Gan nhiễm mỡ (MASLD) là sự tích tụ chất béo trung tính trên 5% trọng lượng gan tích lũy qua nhiều năm. Quá trình thoái biến mỡ gan đòi hỏi thâm hụt calo, vận động thể lực và kiểm soát đường huyết trong tối thiểu 8-12 tuần, kiểm chứng qua siêu âm hoặc FibroScan.'
    },
    {
      myth: 'Cứ là nước ép từ hoa quả tự nhiên thì uống càng nhiều càng giải độc gan tốt.',
      reality: 'Đường Fructose trong nước ép hoa quả được chuyển hóa 100% tại gan. Uống quá nhiều nước ép trái cây ngọt là một trong những nguyên nhân hàng đầu gây bùng phát gan nhiễm mỡ không do rượu.'
    }
  ],
  faqs: [
    {
      question: 'Tại sao đường Fructose trong hoa quả lại nguy hiểm cho người bị gan nhiễm mỡ?',
      answer: 'Không giống như glucose có thể được mọi tế bào cơ bắp tiêu thụ, 100% đường Fructose phải được gan chuyển hóa. Tại tế bào gan, fructose bỏ qua bước kiểm soát enzyme phosphofructokinase, nhanh chóng phân cắt thành triose phosphate và chuyển hóa thẳng thành Acetyl-CoA và Glycerol-3-phosphate - nguyên liệu chính tổng hợp Triglyceride (quá trình De Novo Lipogenesis). Do đó, người gan nhiễm mỡ phải kiểm soát chặt chẽ lượng dứa và ưu tiên dưa leo.'
    },
    {
      question: 'Các hiệp hội gan mật quốc tế (AASLD/EASL) khuyến nghị phác đồ điều trị gan nhiễm mỡ chuẩn mực như thế nào?',
      answer: 'Phác đồ chuẩn mực bao gồm: Giảm 7-10% trọng lượng cơ thể, áp dụng chế độ ăn Địa Trung Hải giàu chất béo không bão hòa đơn, cắt giảm hoàn toàn nước ngọt và đồ uống chứa siro ngô giàu fructose (HFCS), tập thể dục nhịp điệu 150 phút/tuần và điều trị các bệnh lý nền như đề kháng insulin.'
    }
  ],
  safety_quiz: {
    title: 'Kiểm tra độ phù hợp của bạn',
    subtitle: 'Trả lời 3 câu hỏi nhanh (15 giây) để xem công thức dưa leo dứa này có an toàn và phù hợp với tình trạng gan của bạn không.',
    questions: [
      {
        id: 'q1_liver_stage',
        text: 'Bạn đã từng được bác sĩ chẩn đoán gan nhiễm mỡ độ mấy (hoặc có viêm gan thoái hóa mỡ NASH không)?',
        options: [
          { label: 'Nhiễm mỡ độ 1 nhẹ hoặc chức năng gan bình thường' },
          { label: 'Gan nhiễm mỡ độ 2-3 / viêm gan NASH / xơ hóa gan', is_contraindicated: true, warning: 'CẦN THEO DÕI Y KHOA: Viêm gan thoái hóa mỡ tiến triển cần phác đồ điều trị của bác sĩ chuyên khoa gan mật; tuyệt đối không tự ý dùng các liệu pháp detox hoa quả.' }
        ]
      },
      {
        id: 'q2_insulin_diabetes',
        text: 'Bạn có đang mắc bệnh đái tháo đường type 2, tiền tiểu đường hoặc béo phì bụng không?',
        options: [
          { label: 'Đường huyết và cân nặng bình thường' },
          { label: 'Tiểu đường type 2 / kháng insulin', warning: 'GIẢM FRUCTOSE: Giảm lượng dứa xuống còn 20-30g hoặc thay bằng rau bina xanh để tránh làm tăng chỉ số HbA1c.' }
        ]
      },
      {
        id: 'q3_smoothie_vs_juice',
        text: 'Bạn dự định pha chế công thức này theo phương pháp nào?',
        options: [
          { label: 'Xay sinh tố giữ nguyên toàn bộ chất xơ và bã mịn' },
          { label: 'Dùng máy ép vắt kiệt lấy nước trong bỏ bã', is_contraindicated: true, warning: 'SAI PHƯƠNG PHÁP: Vắt kiệt bỏ bã sẽ biến thức uống thành dung dịch đường fructose đậm đặc hấp thu nhanh, kích thích gan tạo thêm mỡ.' }
        ]
      }
    ]
  },
  sections: [
    {
      title: '1. Cơ chế sinh học phân tử: Tích tụ Triglyceride & Quá trình De Novo Lipogenesis',
      paragraphs: [
        'Bệnh gan nhiễm mỡ không do rượu (nay được y học quốc tế chuẩn hóa thành Bệnh gan nhiễm mỡ liên quan đến rối loạn chuyển hóa - MASLD) được định nghĩa là tình trạng tích tụ chất béo trung tính (Triglyceride) vượt quá 5% tổng trọng lượng tế bào gan (Hepatocyte).',
        'Nguyên nhân cốt lõi bắt nguồn từ sự mất cân bằng giữa lượng lipid hấp thu vào gan (axit béo tự do từ máu và quá trình sinh mỡ mới De Novo Lipogenesis - DNL) so với khả năng giải phóng lipid của gan (quá trình β-oxy hóa tại ty thể và bài tiết lipoprotein VLDL).',
        'Điều đáng chú ý: Đường Fructose lỏng là chất kích thích DNL mạnh nhất trong chế độ ăn uống. Khi một lượng lớn fructose đi vào tĩnh mạch cửa gan mà không có chất xơ làm chậm, nó bỏ qua enzyme kiểm soát phosphofructokinase, chuyển hóa ồ ạt thành Acetyl-CoA và Glycerol-3-phosphate, thúc đẩy gan tự sản xuất ra các hạt mỡ mới.'
      ],
      image_url: '/articles/pineapple-cucumber-liver/cover.jpg',
      image_alt: 'Mô phỏng 3D giải phẫu tế bào gan nhiễm mỡ và các thành phần hóa sinh trong dứa, dưa chuột, cà rốt'
    },
    {
      title: '2. Vai trò của Bromelain, Carotenoid & Ngưỡng an toàn Fructose',
      paragraphs: [
        'Bỏ qua những lời đồn thổi "chữa khỏi sau 1 đêm", các thành phần thực vật trong công thức vẫn mang lại giá trị hỗ trợ quý giá nếu được dùng đúng liều lượng sinh học.',
        'Dưa chuột cung cấp 95% nước có tính kiềm nhẹ và hợp chất Cucurbitacin, giúp duy trì thể tích tế bào gan (cell volume regulation) và giảm phóng thích cytokine gây viêm từ đại thực bào Kupffer.',
        'Cà rốt cung cấp Beta-carotene và Falcarinol - những chất chống oxy hóa tan trong mỡ bảo vệ màng ty thể tế bào gan khỏi tổn thương peroxit hóa lipid (Lipid Peroxidation), đồng thời ngăn chặn các tế bào sao gan (Hepatic Stellate Cells) chuyển dạng thành nguyên bào sợi gây xơ gan.',
        'Dứa cung cấp enzyme Bromelain và Vitamin C; tuy nhiên, vì 100g dứa chứa khoảng 10g đường (trong đó một nửa là fructose), công thức khoa học bắt buộc phải khống chế lượng dứa ở mức thấp (40g) để lấy enzyme mà không vượt ngưỡng kích hoạt DNL.'
      ],
      bullets: [
        'Bảo tồn nồng độ chất chống oxy hóa nội sinh Glutathione trong tế bào gan.',
        'Tối ưu hóa chức năng màng ty thể hỗ trợ quá trình đốt mỡ sinh năng lượng.',
        'Cung cấp nước và chất điện giải hỗ trợ gan bài tiết dịch mật đào thải chất cặn bã.'
      ]
    }
  ],
  sources: [
    { label: 'AASLD Practice Guidance: The Clinical Assessment and Management of MASLD', url: 'https://www.aasld.org' },
    { label: 'Hepatology: Fructose and hepatic de novo lipogenesis mechanisms', url: 'https://journals.lww.com/hep' },
    { label: 'Journal of Agricultural and Food Chemistry: Cucurbitacins and carotenoids in hepatic protection', url: 'https://pubs.acs.org/journal/jafcau' }
  ],
  updated_at: new Date().toISOString()
};

async function update() {
  console.log('1. Updating wellness_articles cover_image_url...');
  const resArt = await fetch(`${url}/wellness_articles?id=eq.${articleId}`, {
    method: 'PATCH',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation'
    },
    body: JSON.stringify({
      cover_image_url: '/articles/pineapple-cucumber-liver/cover.jpg',
      updated_at: new Date().toISOString()
    })
  });
  console.log('Article update status:', resArt.status, await resArt.json());

  console.log('2. Updating EN translation...');
  const resEn = await fetch(`${url}/wellness_article_translations?article_id=eq.${articleId}&locale=eq.en`, {
    method: 'PATCH',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation'
    },
    body: JSON.stringify(enData)
  });
  console.log('EN update status:', resEn.status, await resEn.json());

  console.log('3. Updating VI translation...');
  const resVi = await fetch(`${url}/wellness_article_translations?article_id=eq.${articleId}&locale=eq.vi`, {
    method: 'PATCH',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation'
    },
    body: JSON.stringify(viData)
  });
  console.log('VI update status:', resVi.status, await resVi.json());
}

update().catch(console.error);
