export const benefits = [
  {
    title: "Giảm việc thủ công",
    description: "Giảm nhập liệu, copy tin nhắn và cập nhật bảng tính lặp lại.",
    icon: "Layers",
  },
  {
    title: "Phản hồi khách hàng nhanh hơn",
    description: "Tiếp nhận tin nhắn và bình luận gần như ngay lập tức.",
    icon: "Zap",
  },
  {
    title: "Vận hành xuyên suốt 24/7",
    description: "Hệ thống làm việc ngoài giờ mà không tăng ca nhân sự.",
    icon: "Moon",
  },
  {
    title: "Hạn chế sai sót nhập liệu",
    description: "Đồng bộ tự động giúp giảm lỗi copy-paste giữa các phần mềm.",
    icon: "ShieldCheck",
  },
  {
    title: "Dữ liệu được kết nối",
    description: "Lead, hội thoại, đơn hàng và báo cáo nằm trên một luồng.",
    icon: "Link2",
  },
  {
    title: "Nhân viên tập trung công việc giá trị cao",
    description: "Sales và CSKH dành thời gian cho tư vấn, chốt đơn và giữ chân.",
    icon: "Target",
  },
] as const;

export const benefitCounters = [
  { value: 60, suffix: "%", label: "Tiết kiệm thời gian cho tác vụ phù hợp" },
  { value: 5, suffix: "s", label: "Phản hồi khách hàng trong vài giây" },
  { value: 24, suffix: "/7", label: "Vận hành liên tục" },
  { value: 15, suffix: "+", label: "Kết nối nhiều nền tảng" },
  { value: 100, suffix: "+", label: "Tác vụ tự động mỗi ngày" },
  { value: 1, suffix: "s", label: "Báo cáo theo thời gian thực" },
] as const;
