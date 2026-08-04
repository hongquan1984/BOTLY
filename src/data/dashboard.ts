export const dashboardStats = [
  { label: "AI Agents Online", value: "12", trend: "+2", tone: "cyan" },
  { label: "Active Workflows", value: "28", trend: "+5", tone: "blue" },
  { label: "Conversations Today", value: "1,248", trend: "+18%", tone: "purple" },
  { label: "New Leads", value: "186", trend: "+24", tone: "cyan" },
  { label: "Appointments", value: "42", trend: "+9", tone: "blue" },
  { label: "Hours Saved (est.)", value: "320h", trend: "tháng này", tone: "purple" },
  { label: "Cost Saved (est.)", value: "48tr", trend: "tham khảo", tone: "cyan" },
  { label: "Automation Success", value: "96.4%", trend: "ổn định", tone: "blue" },
] as const;

export const activityLog = [
  { time: "09:42", text: "AI Agent CSKH xử lý 36 hội thoại Zalo" },
  { time: "09:38", text: "Workflow lead Facebook → CRM hoàn tất 12 bản ghi" },
  { time: "09:25", text: "AI Livestream: cập nhật kịch bản sản phẩm SKU-204" },
  { time: "09:11", text: "Sales nhận 5 lead hot từ phân loại tự động" },
  { time: "08:58", text: "Báo cáo buổi sáng đã gửi cho quản lý" },
  { time: "08:40", text: "Đồng bộ Google Sheets ↔ HubSpot thành công" },
] as const;

export const chartSeries = {
  conversations: [42, 58, 51, 73, 68, 90, 84, 110, 102, 125, 118, 140],
  leads: [12, 18, 15, 22, 28, 25, 34, 30, 38, 42, 40, 48],
  labels: ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"],
} as const;

export const heroDashboardMetrics = [
  { label: "AI Agents", value: "08", sub: "đang hoạt động" },
  { label: "Workflow", value: "14", sub: "đang chạy" },
  { label: "Hội thoại", value: "326", sub: "hôm nay" },
  { label: "Lead mới", value: "47", sub: "24 giờ" },
  { label: "Giờ tiết kiệm", value: "86h", sub: "tuần này" },
  { label: "Doanh thu AI", value: "12.4tr", sub: "ước tính" },
] as const;
