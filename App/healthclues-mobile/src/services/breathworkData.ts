// HealthClues Breathwork & Mindfulness Data

export interface BreathPhase {
  name: "inhale" | "hold" | "exhale" | "hold_empty";
  label: string;
  labelEn?: string;
  durationSec: number;
  instruction: string;
  instructionEn?: string;
}

export interface BreathExercise {
  id: string;
  name: string;
  nameEn?: string;
  category: "sleep" | "stress" | "hypnosis";
  categoryLabel: string;
  categoryLabelEn?: string;
  emoji: string;
  summary: string;
  summaryEn?: string;
  scientificContext: string;
  scientificContextEn?: string;
  cycles: number;
  totalDurationMin: string;
  totalDurationMinEn?: string;
  phases: BreathPhase[];
  bodyScanSteps?: {
    title: string;
    titleEn?: string;
    desc: string;
    descEn?: string;
    durationSec: number;
  }[];
}

export const BREATH_EXERCISES: BreathExercise[] = [
  {
    id: "breath_478",
    name: "Kỹ Thuật Thở 4-7-8 (Harvard Sleep)",
    nameEn: "4-7-8 Breathing (Harvard Sleep)",
    category: "sleep",
    categoryLabel: "Ru Ngủ Sâu",
    categoryLabelEn: "Deep Sleep",
    emoji: "🌬️",
    summary: "Hít 4s · Nín 7s · Thở 8s giúp kích hoạt hệ thần kinh phó giao cảm, hạ nhịp tim và đưa não vào giấc ngủ tự nhiên.",
    summaryEn: "Inhale 4s · Hold 7s · Exhale 8s to activate the parasympathetic nervous system, lower heart rate, and induce natural sleep.",
    scientificContext: "Nghiên cứu của TS. Andrew Weil (ĐH Harvard): Tỷ lệ 4:7:8 làm tăng nồng độ CO2 nhẹ, làm giãn mạch máu não và giải phóng melatonin tự nhiên.",
    scientificContextEn: "Harvard study by Dr. Andrew Weil: The 4:7:8 ratio creates mild CO2 retention, dilating cerebral vessels and releasing natural melatonin.",
    cycles: 4,
    totalDurationMin: "2 phút",
    totalDurationMinEn: "2 mins",
    phases: [
      {
        name: "inhale",
        label: "HÍT VÀO",
        labelEn: "INHALE",
        durationSec: 4,
        instruction: "Hít sâu bằng mũi, đưa không khí xuống căng phồng bụng",
        instructionEn: "Inhale deeply through your nose, expanding your lower abdomen",
      },
      {
        name: "hold",
        label: "NÍN THỞ",
        labelEn: "HOLD",
        durationSec: 7,
        instruction: "Giữ hơi tĩnh lặng, để oxy thẩm thấu vào từng tế bào",
        instructionEn: "Hold still and calm, allowing oxygen to diffuse into every cell",
      },
      {
        name: "exhale",
        label: "THỞ RA",
        labelEn: "EXHALE",
        durationSec: 8,
        instruction: "Thở ra chậm rãi qua miệng tạo âm thanh phù nhẹ, buông bỏ mọi áp lực",
        instructionEn: "Exhale slowly through your mouth with a soft whoosh, releasing all tension",
      },
    ],
  },
  {
    id: "breath_box",
    name: "Thở Hộp 4-4-4-4 (Box Breathing)",
    nameEn: "Box Breathing 4-4-4-4",
    category: "stress",
    categoryLabel: "Xả Stress",
    categoryLabelEn: "Stress Relief",
    emoji: "📦",
    summary: "Kỹ thuật của lính đặc nhiệm SEAL giúp hạ cortisol tức thì, lấy lại sự bình tĩnh và tập trung cao độ.",
    summaryEn: "Navy SEAL technique to instantly drop cortisol, restore composure, and sharpen mental clarity.",
    scientificContext: "Mayo Clinic: Box breathing điều hòa hệ thần kinh thực vật, làm giảm nhịp tim và ổn định huyết áp trong vòng 90 giây.",
    scientificContextEn: "Mayo Clinic: Box breathing regulates autonomic nerve activity, lowering heart rate and stabilizing blood pressure within 90 seconds.",
    cycles: 4,
    totalDurationMin: "3 phút",
    totalDurationMinEn: "3 mins",
    phases: [
      {
        name: "inhale",
        label: "HÍT VÀO",
        labelEn: "INHALE",
        durationSec: 4,
        instruction: "Hít đều đặn 4 giây lấp đầy phổi",
        instructionEn: "Inhale smoothly for 4 seconds, filling your lungs evenly",
      },
      {
        name: "hold",
        label: "GIỮ HƠI",
        labelEn: "HOLD",
        durationSec: 4,
        instruction: "Nín thở 4 giây tĩnh tại",
        instructionEn: "Hold breath for 4 seconds in stillness",
      },
      {
        name: "exhale",
        label: "THỞ RA",
        labelEn: "EXHALE",
        durationSec: 4,
        instruction: "Thở ra êm dịu 4 giây xả hết thán khí",
        instructionEn: "Exhale gently for 4 seconds, completely emptying stale air",
      },
      {
        name: "hold_empty",
        label: "GIỮ TRỐNG",
        labelEn: "HOLD EMPTY",
        durationSec: 4,
        instruction: "Nín thở 4 giây trước chu kỳ tiếp theo",
        instructionEn: "Pause empty for 4 seconds before the next cycle",
      },
    ],
  },
  {
    id: "breath_coherent",
    name: "Thở Nhịp Sinh Học 5-5 (Coherent Breathing)",
    nameEn: "Coherent Breathing 5-5",
    category: "stress",
    categoryLabel: "Thư Giãn",
    categoryLabelEn: "Relaxation",
    emoji: "🧘",
    summary: "Duy trì tần số 6 nhịp thở/phút, đưa nhịp tim và nhịp thở về trạng thái cộng hưởng đồng pha tối ưu.",
    summaryEn: "Maintains 6 breaths per minute, aligning heart rate variability and respiration into optimal resonance.",
    scientificContext: "Frontiers Public Health: Coherent breathing tối đa hóa biến thiên nhịp tim (HRV), chỉ số vàng của tuổi thọ và khả năng kháng stress.",
    scientificContextEn: "Frontiers Public Health: Coherent breathing maximizes Heart Rate Variability (HRV), the golden biomarker of stress resistance.",
    cycles: 6,
    totalDurationMin: "3 phút",
    totalDurationMinEn: "3 mins",
    phases: [
      {
        name: "inhale",
        label: "HÍT VÀO",
        labelEn: "INHALE",
        durationSec: 5,
        instruction: "Hít vào êm dịu bằng mũi, cảm nhận ngực và bụng nở rộng",
        instructionEn: "Inhale smoothly through your nose, expanding chest and belly",
      },
      {
        name: "exhale",
        label: "THỞ RA",
        labelEn: "EXHALE",
        durationSec: 5,
        instruction: "Thở ra đều đặn, thả lỏng toàn bộ cơ bắp",
        instructionEn: "Exhale steadily, relaxing all facial and neck muscles",
      },
    ],
  },
  {
    id: "hypnosis_bodyscan",
    name: "Thôi Miên Thả Lỏng Từng Nhóm Cơ (Body Scan 5p)",
    nameEn: "Progressive Muscle Relaxation (5m Body Scan)",
    category: "hypnosis",
    categoryLabel: "Thôi Miên",
    categoryLabelEn: "Hypnosis",
    emoji: "✨",
    summary: "Hướng dẫn quét chánh niệm qua 5 vùng cơ thể từ đỉnh đầu đến ngón chân để giải phóng toàn bộ vi căng thẳng trước giờ ngủ.",
    summaryEn: "Mindful scan through 5 body regions from crown to toes to release micro-tensions before sleep.",
    scientificContext: "JAMA Intern Med: Mindfulness body scan cải thiện chất lượng giấc ngủ ở người mất ngủ mãn tính sau 6 tuần.",
    scientificContextEn: "JAMA Intern Med: Mindfulness body scan improves sleep quality and reduces insomnia severity after 6 weeks.",
    cycles: 1,
    totalDurationMin: "5 phút",
    totalDurationMinEn: "5 mins",
    phases: [
      {
        name: "inhale",
        label: "THẢ LỎNG",
        labelEn: "RELAX",
        durationSec: 10,
        instruction: "Nhắm mắt lại, lắng nghe cơ thể và buông xuôi trên giường",
        instructionEn: "Close your eyes, listen to your body, and rest peacefully in bed",
      },
    ],
    bodyScanSteps: [
      {
        title: "Bước 1: Trán & Cơ Mặt",
        titleEn: "Step 1: Forehead & Facial Muscles",
        desc: "Thả lỏng vầng trán, khóe mắt, buông lỏng hai quai hàm, tách nhẹ hai hàm răng.",
        descEn: "Soften your forehead, eyelids, and relax your jaw muscles, separating your teeth slightly.",
        durationSec: 60,
      },
      {
        title: "Bước 2: Cổ & Đôi Vai",
        titleEn: "Step 2: Neck & Shoulders",
        desc: "Cảm nhận sức nặng của đôi vai chìm sâu xuống mặt nệm, buông bỏ gánh nặng trong ngày.",
        descEn: "Feel the weight of your shoulders sinking into the mattress, letting go of the day's burdens.",
        durationSec: 60,
      },
      {
        title: "Bước 3: Lồng Ngực & Bụng",
        titleEn: "Step 3: Chest & Abdomen",
        desc: "Để hơi thở tự nhiên tuôn chảy, lồng ngực và bụng nâng lên hạ xuống nhẹ nhàng như sóng vỗ.",
        descEn: "Let your breath flow naturally, chest and belly rising and falling like gentle ocean waves.",
        durationSec: 60,
      },
      {
        title: "Bước 4: Cánh Tay & Bàn Tay",
        titleEn: "Step 4: Arms & Hands",
        desc: "Hai cánh tay ấm dần lên, các ngón tay thả lỏng buông lơi tự nhiên.",
        descEn: "Your arms grow pleasantly heavy and warm, fingers resting loose and limp.",
        durationSec: 60,
      },
      {
        title: "Bước 5: Đôi Chân & Chìm Vào Giấc Ngủ",
        titleEn: "Step 5: Legs & Drifting Asleep",
        desc: "Toàn bộ sức nặng cơ thể được nâng đỡ, tâm trí trôi vào giấc ngủ thanh bình.",
        descEn: "Your whole body is fully supported, allowing your mind to drift into peaceful slumber.",
        durationSec: 60,
      },
    ],
  },
];
