# HEALTHCLUES · QUIZ BANK V1
**Mục đích:** Nội dung chuẩn để Codex triển khai bộ quiz tiếng Anh, kèm ghi chú giải nghĩa tiếng Việt cho chủ dự án.

**Quy tắc hiển thị:** Website khách hàng chỉ hiển thị tiếng Anh. Trong tài liệu này và trang preview quản trị, ghi chú VN xuất hiện ngay dưới câu EN. Không hiển thị `note_vi` công khai.
**Quy tắc flow:** C01–C10 = onboarding; C11–C33 = ngân hàng bổ sung, chỉ hỏi các câu liên quan theo nhánh, tổng cộng khoảng 12–20 câu sâu bao gồm tối đa 7 câu theo nhánh G/W/S/F. Không ép 33+7 câu cùng lúc. Ưu tiên opt-out, bỏ qua và lưu tiến độ.
**Câu hỏi:** Loại `single` = một đáp án, `multi` = nhiều đáp án, `country` = danh sách quốc gia; ngoài chọn lựa cụ thể, luôn có `Skip`/`Prefer not to say` tại những câu nhạy cảm.

## A. CORE — 33 câu hỏi

### C01 · START · single
**EN:** Are you 18 or older?

**Options (EN):** Yes | No.

**Ghi chú VN:** Xác nhận người dùng đủ 18 tuổi. Nếu không, dừng đăng ký tính năng cá nhân hóa V1.

*Logic:* `stop_if_no`.

### C02 · START · country
**EN:** Which country do you currently live in?

**Options (EN):** Country selector | Prefer not to say.

**Ghi chú VN:** Để ưu tiên nguồn và nguyên liệu phổ biến theo quốc gia. Không xin GPS hay địa chỉ.

*Logic:* `optional`.

### C03 · START · single
**EN:** What language would you prefer for your daily discoveries?

**Options (EN):** English | Another language.

**Ghi chú VN:** Giai đoạn đầu chỉ xuất bản tiếng Anh; nếu chọn khác, giải thích hiện chỉ hỗ trợ English.

*Logic:* `english_only_v1`.

### C04 · START · single
**EN:** Which health or wellness topic interests you most right now?

**Options (EN):** Healthy weight | Gout & uric acid | Sleep & rest | Digestion & gut health | Balanced nutrition | Stress & relaxation | Other.

**Ghi chú VN:** Chọn chủ đề muốn tìm hiểu, KHÔNG suy diễn đây là chẩn đoán bệnh. Kích hoạt nhánh câu hỏi tương ứng.

*Logic:* `branch_by_interest`.

### C05 · START · single
**EN:** What best describes why you are exploring this topic?

**Options (EN):** General curiosity | A condition diagnosed by a healthcare professional | A concern I have not discussed with a professional | Researching for someone else | Prefer not to say.

**Ghi chú VN:** Phân biệt mối quan tâm với bệnh đã được xác nhận. Không kiểm chứng hay tự chẩn đoán.

*Logic:* `sensitive_optional`.

### C06 · START · multi
**EN:** Which kinds of content would you like to discover?

**Options (EN):** Food & recipes | Natural ingredients and traditions | Everyday habits | Research explained | General treatment information | Free guides.

**Ghi chú VN:** Phân loại sở thích nội dung. Thuốc/điều trị chỉ là tài liệu giáo dục chung, không đưa chỉ định cá nhân.

*Logic:* `multi_1_to_4`.

### C07 · START · single
**EN:** How would you like the information presented?

**Options (EN):** Quick daily cards | Step-by-step recipes | Short research summaries | A mix of everything.

**Ghi chú VN:** Chọn định dạng trình bày ưa thích.

*Logic:* `required`.

### C08 · START · single
**EN:** How much time could you comfortably spend on a small daily activity?

**Options (EN):** 5 minutes | 10–15 minutes | 20–30 minutes | More than 30 minutes | I only want to read.

**Ghi chú VN:** Để lọc mức độ phức tạp của hoạt động, không tạo bài tập trị bệnh.

*Logic:* `required`.

### C09 · START · single
**EN:** How often would you like your dashboard refreshed?

**Options (EN):** Daily | Three times a week | Weekly.

**Ghi chú VN:** Tần suất làm mới dashboard; email là đồng ý riêng, không tự động bật.

*Logic:* `required`.

### C10 · START · single
**EN:** What would make the next two weeks most useful for you?

**Options (EN):** Find interesting new information | Explore simple recipes | Build a small routine | Understand the research better.

**Ghi chú VN:** Mục tiêu ngắn hạn giúp hệ thống chọn ưu tiên, không đặt kết quả điều trị.

*Logic:* `required`.

### C11 · DEEP · single
**EN:** How long has this topic been relevant to you?

**Options (EN):** A few days | Weeks | Months | Years | I am just curious | Prefer not to say.

**Ghi chú VN:** Ngữ cảnh quan tâm theo thời gian, không dùng xác định bệnh.

*Logic:* `optional`.

### C12 · DEEP · single
**EN:** How often does this concern come up for you?

**Options (EN):** Most days | A few times a week | Occasionally | Not applicable | Prefer not to say.

**Ghi chú VN:** Tần suất tự khai báo; chỉ dùng để chọn nội dung thông tin, không phân tầng bệnh.

*Logic:* `optional`.

### C13 · DEEP · single
**EN:** How much does this concern affect your daily routine?

**Options (EN):** Not at all | A little | Moderately | A lot | Prefer not to say.

**Ghi chú VN:** Đo mức độ ảnh hưởng tự nhận; nếu ảnh hưởng nhiều, nhắc tham khảo chuyên gia thay vì tự xử lý.

*Logic:* `optional`.

### C14 · DEEP · single
**EN:** When is this concern most noticeable?

**Options (EN):** Morning | After meals | Afternoon | Evening or night | It varies | Not applicable.

**Ghi chú VN:** Ngữ cảnh thời gian, dùng chọn lịch nội dung chung chứ không suy ra nguyên nhân bệnh.

*Logic:* `optional`.

### C15 · DEEP · single
**EN:** Have you discussed this concern with a healthcare professional?

**Options (EN):** Yes | No | Not applicable | Prefer not to say.

**Ghi chú VN:** Khuyến khích tìm chuyên gia khi cần; không cố điền khoảng trống bằng suy đoán AI.

*Logic:* `optional`.

### C16 · DEEP · multi
**EN:** What have you already explored or tried?

**Options (EN):** Reading wellness articles | Changing everyday meals | Simple daily routines | Professional advice | Nothing yet | Prefer not to say.

**Ghi chú VN:** Hiểu trải nghiệm đã thử theo loại hoạt động, không thu thông tin liều thuốc hoặc tác dụng chữa bệnh.

*Logic:* `optional`.

### C17 · DEEP · multi
**EN:** What usually gets in the way of trying something new?

**Options (EN):** Time | Cost | Ingredients unavailable | Too complicated | Unsure whether it is safe | Hard to stay consistent | Other.

**Ghi chú VN:** Cơ sở gợi ý lựa chọn đơn giản hơn và hỏi lý do chưa thử vào các ngày tiếp theo.

*Logic:* `optional`.

### C18 · DEEP · single
**EN:** What kind of encouragement would you prefer?

**Options (EN):** Gentle reminders | More alternatives | Short explanations | Progress summaries | No reminders.

**Ghi chú VN:** Cá nhân hóa cách phản hồi, tránh gây áp lực.

*Logic:* `optional`.

### C19 · DEEP · single
**EN:** Which description best fits your weekday schedule?

**Options (EN):** Mostly regular hours | Shift work or changing hours | Home-based flexible schedule | Varies a lot | Prefer not to say.

**Ghi chú VN:** Điều chỉnh thời điểm gợi ý thực hành; không cần lịch làm việc chi tiết.

*Logic:* `optional`.

### C20 · DEEP · single
**EN:** How often do you prepare food at home?

**Options (EN):** Most days | A few days a week | Rarely | I do not prepare food | Prefer not to say.

**Ghi chú VN:** Chọn công thức phù hợp khả năng tự nấu.

*Logic:* `optional`.

### C21 · DEEP · single
**EN:** Which eating style sounds most like you?

**Options (EN):** Mostly plant-based | Mixed meals | No specific style | Other | Prefer not to say.

**Ghi chú VN:** Định hướng khẩu vị, không suy ra chế độ ăn y khoa.

*Logic:* `optional`.

### C22 · DEEP · single
**EN:** What is your preferred budget for everyday recipes?

**Options (EN):** Budget-friendly | Moderate | Flexible | Prefer not to say.

**Ghi chú VN:** Ưu tiên công thức theo chi phí, không cần hỏi thu nhập.

*Logic:* `optional`.

### C23 · DEEP · multi
**EN:** Are there foods or ingredients you simply prefer to avoid?

**Options (EN):** Dairy | Nuts | Seafood | Meat | Spicy foods | None | Other.

**Ghi chú VN:** Sở thích tránh nguyên liệu khác với dị ứng; không dùng câu này để đánh giá an toàn.

*Logic:* `optional_exclusive_none`.

### C24 · DEEP · single
**EN:** Do you have any known food allergies?

**Options (EN):** Yes | No | Not sure | Prefer not to say.

**Ghi chú VN:** Nếu Có/Không chắc: không tự đảm bảo công thức an toàn. Yêu cầu xác nhận nguyên liệu từ nhãn và chuyên gia khi cần.

*Logic:* `safety_gate`.

### C25 · DEEP · single
**EN:** Has a healthcare professional advised you to follow any food or activity restrictions?

**Options (EN):** Yes | No | Not sure | Prefer not to say.

**Ghi chú VN:** Nếu Có/Không chắc: không tự tạo công thức hoặc hoạt động cá nhân hóa có thể xung đột.

*Logic:* `safety_gate`.

### C26 · DEEP · single
**EN:** How consistent is your sleep schedule?

**Options (EN):** Very consistent | Somewhat variable | Highly variable | I work shifts | Prefer not to say.

**Ghi chú VN:** Ghi nhận thói quen ngủ, không chẩn đoán mất ngủ.

*Logic:* `optional`.

### C27 · DEEP · single
**EN:** How would you describe your energy during a typical day?

**Options (EN):** Mostly steady | Often low | Goes up and down | Prefer not to say.

**Ghi chú VN:** Thông tin tự nhận về năng lượng; không suy ra nguyên nhân bệnh.

*Logic:* `optional`.

### C28 · DEEP · single
**EN:** How stressful does a typical day feel?

**Options (EN):** Low stress | Some stress | High stress | Prefer not to say.

**Ghi chú VN:** Để cân đối tần suất và mức độ phức tạp của nội dung, không chẩn đoán tâm lý.

*Logic:* `optional`.

### C29 · DEEP · single
**EN:** How active is a typical day for you?

**Options (EN):** Mostly seated | Light activity | Moderate activity | Very active | Prefer not to say.

**Ghi chú VN:** Bối cảnh sinh hoạt, không kê chế độ tập luyện nhằm điều trị.

*Logic:* `optional`.

### C30 · DEEP · single
**EN:** Do you usually feel more comfortable in warm or cool environments?

**Options (EN):** Warm | Cool | Either | No preference | Prefer not to say.

**Ghi chú VN:** Câu lấy cảm hứng từ vấn chẩn Đông y để hiểu sở thích môi trường; tuyệt đối không chấm thể hàn/nhiệt.

*Logic:* `optional_not_diagnostic`.

### C31 · DEEP · single
**EN:** How would you describe your usual appetite and digestion?

**Options (EN):** Generally comfortable | Variable appetite | Occasional digestive discomfort | Not sure | Prefer not to say.

**Ghi chú VN:** Ghi nhận cảm nhận chung, không suy ra tỳ vị hoặc bệnh đường tiêu hóa.

*Logic:* `optional_not_diagnostic`.

### C32 · DEEP · single
**EN:** Do you take medicines or supplements that could affect what you choose to try?

**Options (EN):** Yes | No | Not sure | Prefer not to say.

**Ghi chú VN:** Không cần nhập tên thuốc ở V1. Nếu Có/Không chắc: không đề xuất dùng thảo dược hoặc bổ sung theo cá nhân.

*Logic:* `safety_gate`.

### C33 · DEEP · single
**EN:** Are you experiencing any new, severe, or quickly worsening symptoms?

**Options (EN):** Yes | No | Prefer not to say.

**Ghi chú VN:** Nếu Có: hiển thị thông báo cần đánh giá y tế kịp thời; tạm dừng hoạt động tự thử liên quan sức khỏe. Không kết luận nguyên nhân.

*Logic:* `urgent_gate`.

## Nhánh: Gout & uric acid (7 câu)

### G01
**EN:** Is gout a clinician-confirmed diagnosis for you, or a topic you want to understand?

**Options (EN):** Confirmed diagnosis | General interest | I am unsure | Prefer not to say.

**Ghi chú VN:** Không tự xác nhận gout từ triệu chứng.

### G02
**EN:** Are you currently experiencing a painful or swollen joint episode?

**Options (EN):** Yes | No | Unsure | Prefer not to say.

**Ghi chú VN:** Nếu có vấn đề cấp tính, không gợi ý tự điều trị; hướng dẫn tìm đánh giá chuyên môn.

### G03
**EN:** Do you have a hot, swollen joint together with fever or feeling very unwell?

**Options (EN):** Yes | No | Unsure | Prefer not to say.

**Ghi chú VN:** Nếu Có/Không chắc trong bối cảnh cấp: thông báo cần đánh giá y tế khẩn; không đưa phương án tự chữa.

### G04
**EN:** Which gout-related information interests you most?

**Options (EN):** Foods and drinks | Everyday habits | Research findings | General treatment information.

**Ghi chú VN:** Phân loại chủ đề tài liệu, không chọn thuốc hoặc phác đồ.

### G05
**EN:** Which food or drink subjects would you like to read about?

**Options (EN):** Seafood | Red meat | Sugary drinks | Alcohol | Plant-based proteins | No preference.

**Ghi chú VN:** Hỏi chủ đề muốn đọc, không mặc định cấm hoặc khuyên dùng nhóm thực phẩm nào.

### G06
**EN:** Have you received specific food or drink restrictions from a clinician?

**Options (EN):** Yes | No | Unsure | Prefer not to say.

**Ghi chú VN:** Nếu có hạn chế: không để AI đề xuất trái với hướng dẫn chuyên môn.

### G07
**EN:** What is your biggest barrier to exploring food-related changes?

**Options (EN):** Cost | Preparation time | Taste | Limited ingredients | Safety concerns | Other.

**Ghi chú VN:** Để chọn tài liệu và công thức sinh hoạt thông thường dễ tiếp cận hơn.

## Nhánh: Healthy weight (7 câu)

### W01
**EN:** What are you most interested in?

**Options (EN):** Balanced eating | Easy meal ideas | Everyday movement | Long-term habits | Research explanations.

**Ghi chú VN:** Tập trung thói quen, tránh lời hứa giảm cân nhanh.

### W02
**EN:** How predictable are your meal times?

**Options (EN):** Mostly regular | Often irregular | Shift-based | Prefer not to say.

**Ghi chú VN:** Để gợi ý nội dung tổ chức bữa ăn.

### W03
**EN:** How often do you eat meals you prepared yourself?

**Options (EN):** Most days | Sometimes | Rarely | Prefer not to say.

**Ghi chú VN:** Để định dạng công thức thực tế.

### W04
**EN:** Which type of recipe would you actually use?

**Options (EN):** Under 10 minutes | Few ingredients | Budget-friendly | Batch cooking.

**Ghi chú VN:** Để học ưu tiên công thức.

### W05
**EN:** Has a healthcare professional advised you not to pursue weight loss or to follow a specific plan?

**Options (EN):** Yes | No | Unsure | Prefer not to say.

**Ghi chú VN:** Nếu Có/Không chắc: không tạo kế hoạch thay đổi cân nặng; chỉ đưa nội dung giáo dục chung.

### W06
**EN:** What makes lifestyle changes hardest to keep up?

**Options (EN):** Time | Cost | Work schedule | Motivation | Too many rules | Other.

**Ghi chú VN:** Để điều chỉnh mức độ đơn giản và áp lực.

### W07
**EN:** How would you prefer to measure progress?

**Options (EN):** Activities completed | New recipes explored | Consistency of routine | I prefer not to track.

**Ghi chú VN:** Không đặt mục tiêu cân nặng hoặc calo từ quiz.

## Nhánh: Sleep & rest (7 câu)

### S01
**EN:** What part of sleep or rest interests you most?

**Options (EN):** Falling asleep | Staying asleep | More regular bedtime | Relaxation | Research.

**Ghi chú VN:** Chọn nhóm nội dung, không kết luận rối loạn giấc ngủ.

### S02
**EN:** How often do you have difficulty sleeping or resting?

**Options (EN):** 1–2 nights a week | 3–4 nights | 5–7 nights | Not applicable | Prefer not to say.

**Ghi chú VN:** Dùng xác định nhu cầu thông tin, không chẩn đoán.

### S03
**EN:** What time does your evening routine usually begin?

**Options (EN):** Before 8 PM | 8–10 PM | After 10 PM | It varies | Prefer not to say.

**Ghi chú VN:** Để chọn thời điểm gửi checklist nếu người dùng đồng ý.

### S04
**EN:** Do you work shifts or have a frequently changing sleep schedule?

**Options (EN):** Yes | No | Prefer not to say.

**Ghi chú VN:** Phân biệt bối cảnh lịch sinh hoạt.

### S05
**EN:** What would you enjoy as an evening activity?

**Options (EN):** Short reading | Calm audio | Gentle stretching | Journaling | Just information.

**Ghi chú VN:** Chọn hoạt động wellness nhẹ, không tự đưa liệu pháp điều trị.

### S06
**EN:** Have you noticed loud snoring, gasping during sleep, or significant daytime sleepiness?

**Options (EN):** Yes | No | Unsure | Prefer not to say.

**Ghi chú VN:** Nếu Có/Không chắc: nêu rằng nên trao đổi với chuyên gia về vấn đề giấc ngủ; không tự chẩn đoán.

### S07
**EN:** What usually makes an evening routine hard to follow?

**Options (EN):** Too little time | Family or work schedule | Screen time | Noise | Hard to stay consistent | Other.

**Ghi chú VN:** Để chọn nội dung và hoạt động dễ thực hiện hơn.

## Nhánh: General wellness (fallback) (7 câu)

### F01
**EN:** Which daily area would you like to explore first?

**Options (EN):** Food | Rest | Movement | Mindfulness | General research.

**Ghi chú VN:** Nhánh dự phòng cho chủ đề chưa có bộ chuyên sâu.

### F02
**EN:** Would you rather read or try something practical?

**Options (EN):** Read | Try a simple activity | Both.

**Ghi chú VN:** Chọn loại nội dung.

### F03
**EN:** What is your preferred recipe style?

**Options (EN):** Simple ingredients | Fast preparation | Budget-friendly | No recipes.

**Ghi chú VN:** Chọn công thức thông thường.

### F04
**EN:** Would you like research citations in each card?

**Options (EN):** Always | Only when important | Open on demand.

**Ghi chú VN:** Chọn cách hiển thị nguồn; nguồn vẫn phải sẵn có.

### F05
**EN:** How many content cards feel comfortable per day?

**Options (EN):** 1 | 2 | 3.

**Ghi chú VN:** Chống quá tải.

### F06
**EN:** What would make you return tomorrow?

**Options (EN):** New information | Continue a routine | Review saved items | Weekly summary.

**Ghi chú VN:** Hiểu động lực sử dụng.

### F07
**EN:** Which topic should we avoid suggesting?

**Options (EN):** Free text | None.

**Ghi chú VN:** Lưu yêu cầu tránh nội dung; không dùng làm chẩn đoán.

## B. Các thông báo đồng ý và an toàn (không tính vào số câu quiz)

**User-facing EN disclosure, before optional sensitive questions:** “This experience helps you discover general wellness information. It does not diagnose conditions, recommend prescription medicines, or replace healthcare professionals. You can skip sensitive questions.”

**Bản giải nghĩa VN (chỉ admin):** Đây là công cụ khám phá nội dung wellness, không phải công cụ chẩn đoán hay kê đơn; có thể bỏ qua câu hỏi nhạy cảm.

**Consent for storing optional health-related answers (EN, unchecked):** “I agree to store my optional health-related answers to personalize my HealthClues experience. I can change or delete them at any time.”

**Ghi chú VN:** Xin đồng ý riêng nếu lưu câu trả lời liên quan sức khỏe, ghi phiên bản consent, thời điểm, thao tác thu hồi, chính sách quyền riêng tư.

**Email updates (EN, unchecked, separate):** “Email me wellness discoveries at the frequency I choose. I can unsubscribe any time.”

**Ghi chú VN:** Consent email tách biệt, mặc định tắt. Không đồng nhất với đồng ý lưu hồ sơ hoặc chấp thuận điều khoản.

**Safety notice when indicated (EN):** “This quiz cannot assess symptoms or determine whether an activity is safe for you. If you have new, severe, or rapidly worsening symptoms, seek timely medical assessment. In an emergency, contact local emergency services.”

**Ghi chú VN:** Tạm dừng gợi ý hành động/recipe cá nhân liên quan sức khỏe, không cố suy đoán mức độ nguy hiểm hoặc tìm liệu pháp thay thế.

**Result page disclaimer (EN):** “Your Discovery Profile reflects your interests and preferences—not a medical diagnosis or treatment plan.”

**Ghi chú VN:** Hồ sơ thể hiện sở thích và mục tiêu tìm hiểu, không kết luận thể bệnh Đông y, bệnh y khoa hay phác đồ điều trị.

