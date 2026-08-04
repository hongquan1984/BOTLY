export const beforeAutomation = [
  "Quảng cáo",
  "Tin nhắn",
  "Nhân viên kiểm tra",
  "Nhập Excel",
  "Gọi lại",
  "Báo giá",
  "Chăm sóc",
  "Báo cáo thủ công",
] as const;

export const afterAutomation = [
  "Quảng cáo",
  "AI tiếp nhận",
  "Phân loại khách hàng",
  "Lưu CRM",
  "Gửi nội dung phù hợp",
  "Đặt lịch",
  "Nhắc nhân viên",
  "Theo dõi kết quả",
  "Báo cáo tự động",
] as const;

export const salesAutomationFlow = [
  { id: 1, title: "Khách bình luận trên Facebook", detail: "AI phát hiện comment quan tâm sản phẩm" },
  { id: 2, title: "AI gửi tin nhắn", detail: "Phản hồi ngay với kịch bản phù hợp" },
  { id: 3, title: "Thu thập nhu cầu", detail: "Hỏi sản phẩm, ngân sách, thời gian" },
  { id: 4, title: "Phân loại lead", detail: "Hot / Warm / Cold theo tiêu chí" },
  { id: 5, title: "Lưu CRM", detail: "Tự động tạo hoặc cập nhật hồ sơ" },
  { id: 6, title: "Gửi tài liệu", detail: "Catalogue, bảng giá, case study" },
  { id: 7, title: "Đặt lịch tư vấn", detail: "Đồng bộ lịch và xác nhận khách" },
  { id: 8, title: "Thông báo sales", detail: "Push cho nhân viên phụ trách" },
  { id: 9, title: "Theo dõi kết quả", detail: "Ghi nhận trạng thái chốt đơn" },
  { id: 10, title: "Chăm sóc sau bán", detail: "Nhắc sử dụng, upsell, xin đánh giá" },
] as const;
