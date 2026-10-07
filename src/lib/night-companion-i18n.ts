import { createElement } from 'react';

export const SHOW_VI_TEST_COPY = false;

// Keep this dictionary separate so the Vietnamese test layer can be removed later without editing the flow.
export const VI = {
  quiz: {
    'A little context first': 'Mot chut thong tin truoc khi bat dau',
    'How would you like to describe yourself?': 'Ban muon mo ta ban than nhu the nao?',
    'Your nights': 'Nhung dem cua ban', 'Your sleep': 'Giac ngu cua ban', 'Your context': 'Bo canh cua ban', 'Your goal': 'Muc tieu cua ban',
    'What is getting in the way most often?': 'Dieu gi thuong can tro giac ngu cua ban nhat?',
    'How many nights per week does this usually happen?': 'Dieu nay thuong xay ra bao nhieu dem moi tuan?',
    '1â€“2 nights': '1-2 dem', '1Ã¢â‚¬â€œ2 nights': '1-2 dem', '3â€“4 nights': '3-4 dem', '3Ã¢â‚¬â€œ4 nights': '3-4 dem', '5+ nights': 'Tu 5 dem tro len',
    'How long has this been happening?': 'Tinh trang nay da keo dai bao lau?',
    'Which age range are you in?': 'Ban thuoc nhom tuoi nao?',
    'How much actual sleep do you get on an average night?': 'Trung binh moi dem ban thuc su ngu duoc bao lau?',
    'Your mind at night': 'Tam tri cua ban vao ban dem',
    'How tense or worried do you feel as bedtime approaches?': 'Gan gio ngu, ban cam thay cang thang hoac lo lang den muc nao?',
    'How active does your mind become when you try to sleep?': 'Khi co ngu, tam tri ban hoat dong den muc nao?',
    Personalization: 'Ca nhan hoa', 'What kind of sleep support do you currently use?': 'Hien ban dang dung hinh thuc ho tro giac ngu nao?',
    'Do any of these concerns feel relevant?': 'Moi ban tam nao duoi day phu hop voi ban?', 'What would make the biggest difference right now?': 'Dieu gi se tao ra khac biet lon nhat cho ban luc nay?',
    'Select all that apply.': 'Chon tat ca lua chon phu hop.', Continue: 'Tiep tuc', 'Letâ€™s look deeper': 'Xem ky hon', "Let's look deeper": 'Xem ky hon', 'Build my plan': 'Tao ke hoach cho toi',
    'A small reflection': 'Mot dieu nho de suy ngam', 'Weâ€™re starting to see your night pattern.': 'Mau hinh ban dem cua ban dang dan ro hon.', "We're starting to see your night pattern.": 'Mau hinh ban dem cua ban dang dan ro hon.',
    'Sleep is not a perfect 8-hour score.': 'Giac ngu khong phai la bai kiem tra phai du 8 gio.', 'Your evening pattern is becoming clearer.': 'Mau hinh buoi toi dang dan ro hon.',
    'You may be caught in a sleep-effort loop.': 'Ban co the dang mac vao vong lap cang co ngu cang cang thang.', 'Your answers are pointing toward a pattern.': 'Cac cau tra loi dang cho thay mot mau hinh.',
    'Letâ€™s build a starting plan for tonight.': 'Hay tao mot ke hoach bat dau cho toi nay.', "Let's build a starting plan for tonight.": 'Hay tao mot ke hoach bat dau cho toi nay.',
    "When sleep starts to feel like something you must make happen, the pressure itself can make winding down harder. We'll take this into account in your plan.": 'Khi ban cam thay minh buoc phai ngu, chinh ap luc do co the khien viec thu gian kho hon. Ke hoach se tinh den dieu nay.',
    'Sleep needs vary. Your pattern, consistency, and how you feel during the day matter too.': 'Nhu cau ngu khac nhau o moi nguoi. Mau hinh, su deu dan va cam giac ban ngay cua ban cung quan trong.',
    'Your biggest obstacle may be happening before you try to sleep. We will use your answers to choose a practical starting point.': 'Tro ngai lon nhat co the xuat hien truoc khi ban co ngu. Cau tra loi cua ban se giup chon diem bat dau thuc te.',
    'Several behavioral and mental factors may be affecting how easily you wind down. Letâ€™s build a starting plan for tonight.': 'Mot so yeu to trong thoi quen va tam tri co the anh huong den viec thu gian. Hay tao ke hoach bat dau cho toi nay.',
    "Several behavioral and mental factors may be affecting how easily you wind down. Let's build a starting plan for tonight.": 'Mot so yeu to trong thoi quen va tam tri co the anh huong den viec thu gian. Hay tao ke hoach bat dau cho toi nay.',
    'Whatâ€™s keeping you awake at night?': 'Dieu gi dang khien ban thuc giac hoac kho ngu?', 'WhatÃ¢â‚¬â„¢s keeping you awake at night?': 'Dieu gi dang khien ban thuc giac hoac kho ngu?',
    'Take the 2-minute Night Pattern Quiz and discover what may be getting in the way of winding down.': 'Lam quiz Night Pattern trong 2 phut de xem dieu gi co the dang can tro viec thu gian.',
    Understand: 'Hieu hon', Personalize: 'Ca nhan hoa', 'See what your nights may be responding to.': 'Xem nhung gi co the dang anh huong den cac dem cua ban.', 'Get a realistic starting plan for tonight.': 'Nhan diem bat dau thuc te cho toi nay.', 'Take your plan into Soulscape.': 'Mang ke hoach cua ban vao Soulscape.',
    'For general wellness and educational purposes. Not a medical diagnosis.': 'Danh cho suc khoe tong quat va giao duc. Khong phai chan doan y khoa.',
    Woman: 'Nu', Man: 'Nam', 'Non-binary': 'Phi nhi nguyen', 'Prefer not to say': 'Khong muon tra loi', Other: 'Khac',
    'I struggle to fall asleep': 'Toi kho di vao giac ngu', "I can't stop thinking": 'Toi khong the ngung suy nghi', 'I wake up during the night': 'Toi tinh giac giua dem', 'I feel anxious about sleep': 'Toi lo lang ve viec ngu', 'I stay on my phone too long': 'Toi dung dien thoai qua lau', 'My sleep schedule is inconsistent': 'Lich ngu cua toi khong deu', 'Stress follows me into bed': 'Cang thang theo toi len giuong', 'I keep delaying bedtime': 'Toi cu tri hoan gio di ngu',
    'Less than 1 month': 'Duoi 1 thang', '1â€“6 months': '1-6 thang', '1Ã¢â‚¬â€œ6 months': '1-6 thang', '6â€“12 months': '6-12 thang', '6Ã¢â‚¬â€œ12 months': '6-12 thang', 'More than a year': 'Hon 1 nam',
    '18â€“29': '18-29 tuoi', '18Ã¢â‚¬â€œ29': '18-29 tuoi', '30â€“39': '30-39 tuoi', '30Ã¢â‚¬â€œ39': '30-39 tuoi', '40â€“49': '40-49 tuoi', '40Ã¢â‚¬â€œ49': '40-49 tuoi', '50â€“59': '50-59 tuoi', '50Ã¢â‚¬â€œ59': '50-59 tuoi', '60+': '60 tuoi tro len',
    'Less than 5 hours': 'Duoi 5 gio', '5â€“6 hours': '5-6 gio', '5Ã¢â‚¬â€œ6 hours': '5-6 gio', '6â€“7 hours': '6-7 gio', '6Ã¢â‚¬â€œ7 hours': '6-7 gio', '7+ hours but still tired': 'Tu 7 gio nhung van met',
    'Not really': 'Hau nhu khong', 'A little': 'Mot chut', 'Quite a bit': 'Kha nhieu', 'Very tense': 'Rat cang thang', 'Quiet enough': 'Du yen', 'Some thoughts': 'Co mot vai suy nghi', 'Busy and hard to switch off': 'Ban ron va kho tat di', 'Very active / many open loops': 'Rat hoat dong / nhieu viec con dang do',
    None: 'Khong dung', Melatonin: 'Melatonin', 'Prescription sleep medication': 'Thuoc ngu ke don', 'Over-the-counter sleep aids': 'Thuoc ho tro ngu khong ke don', 'Morning grogginess': 'U oai buoi sang', 'Dependency concerns': 'Lo ngai le thuoc', "It doesn't always work": 'Khong phai luc nao cung hieu qua', 'I prefer a non-medication routine': 'Toi thich thoi quen khong dung thuoc', 'No concerns': 'Khong co moi ban tam nao',
    'Quiet my mind': 'Lam tam tri yen hon', 'Fall asleep more easily': 'De di vao giac ngu hon', 'Feel less anxious before bed': 'Bot lo lang truoc khi ngu', 'Stop waking during the night': 'Bot tinh giac giua dem', 'Put my phone down earlier': 'Dat dien thoai xuong som hon', 'Build a consistent sleep routine': 'Xay dung lich ngu deu dan', 'Feel calmer at night': 'Cam thay binh tinh hon vao ban dem',
  },
  pattern: { RACING_MIND: 'Tâm trí vẫn đang hoạt động', SLEEP_ANXIETY: 'Áp lực về giấc ngủ có thể đang tạo thêm căng thẳng', STRESS_CARRYOVER: 'Căng thẳng trong ngày có thể vẫn theo bạn lên giường', BEDTIME_PROCRASTINATION: 'Trở ngại có thể xuất hiện trước giờ ngủ', NIGHT_WAKING: 'Mẫu hình của bạn liên quan đến việc quay lại giấc ngủ', SLEEP_RHYTHM: 'Nhịp sinh hoạt có thể cần một điểm neo nhẹ nhàng hơn' },
  state: { MIND_WONT_STOP: 'Đầu óc tôi cứ suy nghĩ mãi', SLEEP_ANXIETY: 'Tôi đang lo lắng về việc ngủ', NOT_SLEEPY: 'Tôi mệt nhưng chưa buồn ngủ', WOKE_UP: 'Tôi lại tỉnh giấc', STRESS_CARRYOVER: 'Tôi vẫn còn mang theo căng thẳng từ hôm nay' },
  setup: {
    'Free Night 1 beta': 'Night 1 miễn phí để thử nghiệm', 'Set up tonight gently.': 'Chuẩn bị cho tối nay thật nhẹ nhàng.', 'No payment or account required. This is a wellness companion, not medical treatment.': 'Không cần thanh toán hay tạo tài khoản. Đây là công cụ hỗ trợ sức khỏe, không phải điều trị y khoa.',
    'What time would you ideally like to be asleep tonight?': 'Toi nay ban muon ngu vao khoang may gio?', 'What time do you usually wake up?': 'Ban thuong thuc day luc may gio?', 'What usually happens during your last hour before bed?': 'Trong mot gio cuoi truoc khi ngu, ban thuong lam gi?', 'What usually happens when you can’t sleep?': 'Khi khong ngu duoc, ban thuong lam gi?', 'What usually happens when you canâ€™t sleep?': 'Khi khong ngu duoc, ban thuong lam gi?', 'What usually happens when you canÃ¢â‚¬â„¢t sleep?': 'Khi khong ngu duoc, ban thuong lam gi?', 'Create my Night Profile': 'Tao ho so Night Profile',
    'Scrolling or watching videos': 'Luot dien thoai hoac xem video', 'Checking messages or work': 'Kiem tra tin nhan hoac cong viec', 'Thinking about unfinished things': 'Nghi ve nhung viec chua xong', 'Reading or doing something relaxing': 'Doc sach hoac lam viec thu gian', "I don't have a consistent routine": 'Toi chua co thoi quen deu dan', 'My thoughts get busier': 'Suy nghi cua toi tro nen nhieu hon', 'I check my phone': 'Toi kiem tra dien thoai', 'I check the time': 'Toi xem gio', 'I stay in bed trying harder': 'Toi nam tren giuong va co ngu hon', 'I get up for a while': 'Toi ra khoi giuong mot luc', 'It varies': 'Tuy hom',
  },
  action: {
    Continue: 'Tiep tuc', 'How’s tonight going?': 'Toi nay cua ban dang the nao?', 'Howâ€™s tonight going?': 'Toi nay cua ban dang the nao?', 'Choose what is happening now. Your Night Pattern stays separate from this Tonight State.': 'Chon dieu dang xay ra luc nay. Night Pattern van duoc giu rieng voi trang thai toi nay.', 'Still awake reset': 'Dieu chinh khi van con thuc', 'Night 1 plan': 'Ke hoach Night 1', optional: 'tuy chon', 'One short note (optional)': 'Mot ghi chu ngan (tuy chon)', 'A few words are enough': 'Vai tu la du', 'Read or follow at your pace': 'Doc hoac lam theo voi nhip cua ban', 'Voice audio is not included yet. The text version is complete and optional.': 'Chua co file giong doc. Ban chu da day du va tuy chon.', 'Optional background sound. No autoplay; pause or stop whenever you want.': 'Am thanh nen tuy chon. Khong tu phat; ban co the dung bat cu luc nao.', 'I’m done for tonight': 'Toi dung o day cho toi nay', 'Iâ€™m done for tonight': 'Toi dung o day cho toi nay', 'I’m still awake': 'Toi van con thuc', 'Iâ€™m still awake': 'Toi van con thuc', 'Night 1 review': 'Danh gia Night 1', 'How did tonight feel?': 'Toi nay ban cam thay the nao?', 'Module feedback': 'Phan hoi ve hoat dong', 'Save review': 'Luu danh gia', 'Save and rest': 'Luu va nghi', 'You can leave the review now. It is not a condition for resting.': 'Ban co the dung phan danh gia tai day. Danh gia khong phai dieu kien de ban nghi ngoi.', 'No Night 1 review saved yet.': 'Chua co danh gia Night 1 nao duoc luu.', 'Start from the quiz to create a Night Profile and choose tonight’s state.': 'Hay bat dau tu quiz de tao Night Profile va chon trang thai toi nay.', 'Your review is saved for future learning.': 'Danh gia cua ban da duoc luu de rut kinh nghiem cho lan sau.', 'Your pause is saved. You stopped before finishing every module, and that is okay.': 'Lan dung cua ban da duoc luu. Ban da dung truoc khi lam het hoat dong, va dieu do hoan toan on.', 'Night 1 is complete.': 'Night 1 da hoan tat.', 'Reset local test session': 'Dat lai phien test tren may nay', 'Review could not be saved. Nothing was marked complete.': 'Khong the luu danh gia. Chua hoat dong nao duoc danh dau hoan tat.', 'Your plan is ready, but saving progress failed.': 'Ke hoach da san sang nhung khong the luu tien do.', 'Could not save your Night Profile.': 'Khong the luu Night Profile cua ban.', 'Skip this step': 'Bo qua buoc nay', 'Skip writing': 'Bo qua phan ghi chu', 'Skip the list': 'Bo qua danh sach', 'Skip breathing': 'Bo qua bai tho', 'Skip audio': 'Bo qua am thanh', 'Skip body unwind': 'Bo qua phan tha long', 'Skip transition': 'Bo qua buoc chuyen tiep', 'Skip reset': 'Bo qua buoc dieu chinh', 'Skip activity': 'Bo qua hoat dong', 'Skip routine cue': 'Bo qua tin hieu thoi quen',
  },
  module: { 'Mental unload': 'Ghi ngắn điều đang vướng', 'Tomorrow list': 'Một việc nhỏ cho ngày mai', 'Gentle breathing': 'Thở nhẹ nhàng', 'Quiet ocean sound': 'Âm thanh biển êm dịu', 'Reduce sleep pressure': 'Giảm áp lực phải ngủ', 'Body unwind': 'Thả lỏng cơ thể', 'Screen transition': 'Chuyển khỏi màn hình', 'Back to rest': 'Quay lại nghỉ ngơi', 'Quiet activity': 'Hoạt động yên tĩnh', 'Routine cue': 'Tín hiệu khép lại ngày', 'Nothing to force. Let the next comfortable breath be enough.': 'Không cần ép buộc điều gì. Chỉ cần một nhịp thở dễ chịu tiếp theo.' },
} as const;

const NIGHT_ACCENTED_VI: Record<string, string> = {
  'Free Night 1 beta': 'Night 1 miễn phí để thử nghiệm', 'Set up tonight gently.': 'Chuẩn bị cho tối nay thật nhẹ nhàng.',
  'No payment or account required. This is a wellness companion, not medical treatment.': 'Không cần thanh toán hoặc tạo tài khoản. Đây là công cụ hỗ trợ sức khỏe, không phải điều trị y khoa.',
  'What time would you ideally like to be asleep tonight?': 'Tối nay bạn muốn ngủ vào khoảng mấy giờ?', 'What time do you usually wake up?': 'Bạn thường thức dậy lúc mấy giờ?',
  'What usually happens during your last hour before bed?': 'Trong một giờ cuối trước khi ngủ, bạn thường làm gì?', 'What usually happens when you can’t sleep?': 'Khi không ngủ được, bạn thường làm gì?',
  'Create my Night Profile': 'Tạo hồ sơ Night Profile', Continue: 'Tiếp tục', 'How’s tonight going?': 'Tối nay của bạn thế nào?',
  'Night 1 plan': 'Kế hoạch Night 1', optional: 'tùy chọn', 'Why this is suggested': 'Vì sao bước này được gợi ý',
  'I’m still awake': 'Tôi vẫn còn thức', 'I’m done for tonight': 'Tôi dừng ở đây cho tối nay', 'Skip this audio': 'Bỏ qua bài nghe',
  'Start listening': 'Bắt đầu nghe', Pause: 'Tạm dừng', 'Stop listening': 'Dừng nghe', Retry: 'Thử lại',
  'Background timer': 'Hẹn tắt âm thanh nền', 'Background sound': 'Âm thanh nền', 'No background': 'Không dùng nền',
  'More sound options': 'Thêm lựa chọn âm thanh', 'Guided practice': 'Bài hướng dẫn', 'Guided volume': 'Âm lượng bài hướng dẫn',
  'Background volume': 'Âm lượng nền', 'Your audio for tonight': 'Bài nghe cho tối nay', 'No guided voice file is available': 'Chưa có file giọng đọc',
  'Mental unload': 'Ghi ngắn điều đang vướng', 'Tomorrow list': 'Một việc nhỏ cho ngày mai', 'Gentle breathing': 'Thở nhẹ nhàng',
  'Quiet ocean sound': 'Âm thanh biển êm dịu', 'Reduce sleep pressure': 'Giảm áp lực phải ngủ', 'Body unwind': 'Thả lỏng cơ thể',
  'Screen transition': 'Chuyển khỏi màn hình', 'Back to rest': 'Quay lại nghỉ ngơi', 'Quiet activity': 'Hoạt động yên tĩnh', 'Routine cue': 'Tín hiệu khép lại ngày',
  'MIND_WONT_STOP': 'Đầu óc tôi cứ suy nghĩ mãi', 'SLEEP_ANXIETY': 'Tôi đang lo lắng về việc ngủ', 'NOT_SLEEPY': 'Tôi mệt nhưng chưa buồn ngủ',
  'WOKE_UP': 'Tôi lại tỉnh giấc', 'STRESS_CARRYOVER': 'Tôi vẫn còn mang theo căng thẳng từ hôm nay',
  'RACING_MIND': 'Tâm trí vẫn đang hoạt động', 'BEDTIME_PROCRASTINATION': 'Trở ngại có thể xuất hiện trước giờ ngủ', 'NIGHT_WAKING': 'Mẫu hình liên quan đến việc quay lại giấc ngủ', 'SLEEP_RHYTHM': 'Nhịp sinh hoạt cần một điểm neo nhẹ nhàng hơn',
};

export function viForQuiz(text: string): string {
  const exact = VI.quiz[text as keyof typeof VI.quiz];
  if (exact) return exact;
  if (text.includes('nights') && text.includes('1')) return '1-2 dem';
  return '';
}
export function viForAction(text: string): string { return NIGHT_ACCENTED_VI[text] || VI.action[text as keyof typeof VI.action] || VI.setup[text as keyof typeof VI.setup] || VI.module[text as keyof typeof VI.module] || ''; }
export function viForPattern(pattern: string): string { return NIGHT_ACCENTED_VI[pattern] || VI.pattern[pattern as keyof typeof VI.pattern] || ''; }
export function viForState(state: string): string { return NIGHT_ACCENTED_VI[state] || VI.state[state as keyof typeof VI.state] || ''; }
export function viForModule(text: string): string { return NIGHT_ACCENTED_VI[text] || VI.module[text as keyof typeof VI.module] || viForAction(text); }

function repairVietnamese(text: string): string {
  try {
    const bytes = Uint8Array.from(Array.from(text), character => character.charCodeAt(0));
    const decoded = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    return decoded;
  } catch {
    return text;
  }
}

export function BilingualLine({ english, vietnamese, className = '' }: { english: string; vietnamese?: string; className?: string }) {
  const vi = vietnamese || viForAction(english) || viForQuiz(english);
  return createElement('span', { className }, english, SHOW_VI_TEST_COPY && vi ? createElement('span', { className: 'mt-1 block text-[0.88em] font-normal leading-5 text-teal-200/80' }, repairVietnamese(vi)) : null);
}
