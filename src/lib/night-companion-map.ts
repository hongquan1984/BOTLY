export type JourneyNightStatus = 'available' | 'coming_soon';

export type JourneyNight = {
  night_number: number;
  title_en: string;
  title_vi: string;
  description_en: string;
  description_vi: string;
  preview_focus_en: string;
  preview_focus_vi: string;
  status: JourneyNightStatus;
  is_free: boolean;
};

export const JOURNEY_NIGHTS: readonly JourneyNight[] = [
  {
    night_number: 1,
    title_en: 'A Gentle Beginning',
    title_vi: 'Khởi đầu nhẹ nhàng',
    description_en: 'Try a brief guided practice, at whatever pace feels comfortable.',
    description_vi: 'Thử một bài hướng dẫn ngắn, theo nhịp bạn thấy dễ chịu.',
    preview_focus_en: 'A calm evening anchor combining gentle breathing or somatic grounding with quiet sound.',
    preview_focus_vi: 'Điểm tựa nhẹ nhàng kết hợp bài thở êm dịu hoặc thả lỏng cùng âm thanh tĩnh lặng.',
    status: 'available',
    is_free: true,
  },
  {
    night_number: 2,
    title_en: 'Rediscover Calm',
    title_vi: 'Tìm lại thanh thản',
    description_en: 'Find a way to set aside unfinished things before resting.',
    description_vi: 'Tìm cách tạm đặt những việc chưa xong xuống trước khi nghỉ.',
    preview_focus_en: 'Unload mental open loops and park today’s responsibilities safely for daylight.',
    preview_focus_vi: 'Gỡ bỏ các suy nghĩ còn vướng bận và gửi lại các việc cần làm cho ngày mai.',
    status: 'coming_soon',
    is_free: false,
  },
  {
    night_number: 3,
    title_en: 'Let the Tension Go',
    title_vi: 'Buông hết mỏi mệt',
    description_en: 'Take a moment to unwind your body after a long day.',
    description_vi: 'Dành một khoảng để thả lỏng cơ thể sau ngày dài.',
    preview_focus_en: 'Release physical stress carried in the jaw, shoulders, and breath without forcing a stretch.',
    preview_focus_vi: 'Thả lỏng sự căng cứng tích tụ ở hàm, vai và nhịp thở mà không cần gượng ép.',
    status: 'coming_soon',
    is_free: false,
  },
  {
    night_number: 4,
    title_en: 'Quiet the Mind',
    title_vi: 'Lắng dịu tâm trí',
    description_en: 'Practice letting thoughts pass without resolving each one.',
    description_vi: 'Tập để suy nghĩ đi qua mà không cần giải quyết từng chuyện.',
    preview_focus_en: 'Notice racing evening thoughts and let them drift like background noise.',
    preview_focus_vi: 'Quan sát các suy nghĩ dồn dập và để chúng nhẹ nhàng trôi qua như âm thanh nền.',
    status: 'coming_soon',
    is_free: false,
  },
  {
    night_number: 5,
    title_en: 'At Peace with the Night',
    title_vi: 'An yên khi đêm xuống',
    description_en: 'Create a comfortable end to the day you look forward to.',
    description_vi: 'Tạo một khoảng cuối ngày dễ chịu mà bạn muốn quay lại.',
    preview_focus_en: 'Transform bedtime from a pressured task into a sanctuary of warmth and restoration.',
    preview_focus_vi: 'Biến giờ đi ngủ từ áp lực thành một không gian ấm áp, thư thái để phục hồi.',
    status: 'coming_soon',
    is_free: false,
  },
  {
    night_number: 6,
    title_en: 'Ease Into Sleep',
    title_vi: 'Nhẹ lòng vào giấc',
    description_en: 'Rest without turning sleep into a performance test.',
    description_vi: 'Nghỉ ngơi mà không biến việc ngủ thành một bài kiểm tra.',
    preview_focus_en: 'Drop the sleep-effort trap: replace “I must sleep” with “I can simply rest”.',
    preview_focus_vi: 'Rời khỏi vòng lặp cố gắng ngủ: thay thế “phải ngủ” bằng sự thả lỏng nhẹ nhàng.',
    status: 'coming_soon',
    is_free: false,
  },
  {
    night_number: 7,
    title_en: 'Sleep Like a Child',
    title_vi: 'Giấc ngủ trẻ thơ',
    description_en: 'Embrace lying down with ease and keep what works for you.',
    description_vi: 'Hướng về cảm giác nằm xuống nhẹ lòng và giữ lại những điều hữu ích với bạn.',
    preview_focus_en: 'Consolidate the habits and mental anchors that gave you comfort across the week.',
    preview_focus_vi: 'Đúc kết những điểm tựa và thói quen hữu ích nhất đã giúp bạn an tâm suốt tuần qua.',
    status: 'coming_soon',
    is_free: false,
  },
] as const;

export type NightOneCtaStatus = 'start' | 'continue' | 'replay';

export function getNightOneCtaInfo(stage?: string, hasReview?: boolean): {
  status: NightOneCtaStatus;
  label_en: string;
  label_vi: string;
} {
  if (hasReview || stage === 'done' || stage === 'feedback') {
    return {
      status: 'replay',
      label_en: 'Replay Night 1',
      label_vi: 'Nghe lại Đêm 1',
    };
  }
  if (stage === 'tonight' || stage === 'plan' || stage === 'resting' || stage === 'review') {
    return {
      status: 'continue',
      label_en: 'Continue Night 1',
      label_vi: 'Tiếp tục Đêm 1',
    };
  }
  return {
    status: 'start',
    label_en: 'Start Night 1 — Free',
    label_vi: 'Bắt đầu Đêm 1 — Miễn phí',
  };
}

export type JourneyPreviewNight = {
  night_number: number;
  title_en: string;
  title_vi: string;
  summary_en: string;
  summary_vi: string;
  badge_en: string;
  badge_vi: string;
  status: 'available' | 'coming_soon';
};

export const JOURNEY_PREVIEW_NIGHTS: readonly JourneyPreviewNight[] = [
  {
    night_number: 1,
    title_en: 'A Gentle Beginning',
    title_vi: 'Khởi đầu nhẹ nhàng',
    summary_en: 'Begin with guided breathing and a background sound you choose.',
    summary_vi: 'Làm quen với bài thở có hướng dẫn và âm thanh bạn chọn.',
    badge_en: 'Start here',
    badge_vi: 'Bắt đầu tại đây',
    status: 'available',
  },
  {
    night_number: 2,
    title_en: 'Rediscover Calm',
    title_vi: 'Tìm lại thanh thản',
    summary_en: 'A quiet moment to close the day and set unfinished things aside.',
    summary_vi: 'Một khoảng lặng để khép lại ngày và đặt những việc chưa xong xuống.',
    badge_en: 'Coming soon',
    badge_vi: 'Đang chuẩn bị',
    status: 'coming_soon',
  },
  {
    night_number: 3,
    title_en: 'Let the Tension Go',
    title_vi: 'Buông hết mỏi mệt',
    summary_en: 'A guided practice to unwind after a long day.',
    summary_vi: 'Một bài hướng dẫn thả lỏng sau một ngày dài.',
    badge_en: 'Coming soon',
    badge_vi: 'Đang chuẩn bị',
    status: 'coming_soon',
  },
  {
    night_number: 4,
    title_en: 'Quiet the Mind',
    title_vi: 'Lắng dịu tâm trí',
    summary_en: 'Practice resting without working through every thought.',
    summary_vi: 'Thực hành nghỉ ngơi mà không phải giải quyết từng suy nghĩ.',
    badge_en: 'Coming soon',
    badge_vi: 'Đang chuẩn bị',
    status: 'coming_soon',
  },
  {
    night_number: 5,
    title_en: 'At Peace with the Night',
    title_vi: 'An yên khi đêm xuống',
    summary_en: 'Build a simple evening ritual you can return to.',
    summary_vi: 'Tạo một nghi thức buổi tối đơn giản, dễ quay lại.',
    badge_en: 'Coming soon',
    badge_vi: 'Đang chuẩn bị',
    status: 'coming_soon',
  },
  {
    night_number: 6,
    title_en: 'Ease Into Sleep',
    title_vi: 'Nhẹ lòng vào giấc',
    summary_en: 'Explore resting with less pressure to fall asleep.',
    summary_vi: 'Khám phá cách nghỉ ngơi với ít áp lực phải ngủ hơn.',
    badge_en: 'Coming soon',
    badge_vi: 'Đang chuẩn bị',
    status: 'coming_soon',
  },
  {
    night_number: 7,
    title_en: 'Sleep Like a Child',
    title_vi: 'Giấc ngủ trẻ thơ',
    summary_en: 'Bring your favorite practices together into a routine of your own.',
    summary_vi: 'Kết hợp những thực hành bạn thích thành khoảng nghỉ của riêng mình.',
    badge_en: 'Coming soon',
    badge_vi: 'Đang chuẩn bị',
    status: 'coming_soon',
  },
];

