export const painPoints = [
  {
    id: "repetitive",
    title: "Nhân viên mất nhiều giờ cho công việc lặp lại",
    description:
      "Nhập liệu, copy tin nhắn, cập nhật bảng tính và chuyển thông tin giữa các phần mềm chiếm phần lớn ngày làm việc.",
    insight: "Chi phí ẩn: thời gian nhân sự bị tiêu hao vào tác vụ thấp giá trị",
    icon: "Repeat",
  },
  {
    id: "slow-response",
    title: "Khách hàng phải chờ lâu mới được phản hồi",
    description:
      "Tin nhắn ngoài giờ, bình luận quảng cáo và inbox đa kênh dễ bị bỏ lỡ khi đội ngũ bận xử lý đơn.",
    insight: "Rủi ro: lead nguội nhanh khi không được phản hồi kịp",
    icon: "Clock",
  },
  {
    id: "leads",
    title: "Lead từ quảng cáo không được chăm sóc đúng lúc",
    description:
      "Chi phí quảng cáo tăng nhưng tỷ lệ chuyển đổi thấp vì thiếu quy trình follow-up đồng nhất.",
    insight: "Chi phí ẩn: ngân sách ads bị lãng phí do chăm sóc chậm",
    icon: "UserX",
  },
  {
    id: "data-silos",
    title: "Dữ liệu nằm rải rác ở nhiều phần mềm",
    description:
      "Facebook, Zalo, Shopee, Excel và CRM không đồng bộ khiến báo cáo sai lệch và khó ra quyết định.",
    insight: "Rủi ro: quyết định dựa trên dữ liệu thiếu và không kịp thời",
    icon: "Database",
  },
  {
    id: "livestream",
    title: "Livestream phụ thuộc quá nhiều vào con người",
    description:
      "Khó duy trì thời lượng dài, phụ thuộc lịch host và tốn chi phí sản xuất lặp lại cho từng phiên.",
    insight: "Chi phí ẩn: cơ hội bán hàng bị giới hạn theo giờ làm việc",
    icon: "Video",
  },
  {
    id: "reporting",
    title: "Quản lý không có báo cáo tức thời để ra quyết định",
    description:
      "Báo cáo cuối ngày hoặc cuối tuần khiến đội ngũ phản ứng chậm với biến động khách hàng và doanh số.",
    insight: "Rủi ro: chậm tối ưu chiến dịch và quy trình vận hành",
    icon: "BarChart3",
  },
] as const;
