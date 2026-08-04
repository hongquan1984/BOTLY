import { z } from "zod";

export const contactFormSchema = z.object({
  fullName: z
    .string()
    .min(2, "Vui lòng nhập họ tên")
    .max(80, "Họ tên quá dài"),
  phone: z
    .string()
    .min(9, "Số điện thoại không hợp lệ")
    .max(15, "Số điện thoại không hợp lệ")
    .regex(/^[0-9+\s()-]+$/, "Số điện thoại không hợp lệ"),
  email: z.string().email("Email không hợp lệ"),
  company: z.string().min(2, "Vui lòng nhập tên doanh nghiệp"),
  industry: z.string().min(1, "Vui lòng chọn ngành nghề"),
  employees: z.string().min(1, "Vui lòng chọn quy mô"),
  problem: z
    .string()
    .min(10, "Mô tả ngắn vấn đề cần tự động hóa (tối thiểu 10 ký tự)")
    .max(1000, "Nội dung quá dài"),
  platforms: z.string().optional(),
  budget: z.string().optional(),
});

export type ContactFormValues = z.infer<typeof contactFormSchema>;

export const demoFormSchema = z.object({
  fullName: z.string().min(2, "Vui lòng nhập họ tên"),
  phone: z
    .string()
    .min(9, "Số điện thoại không hợp lệ")
    .regex(/^[0-9+\s()-]+$/, "Số điện thoại không hợp lệ"),
  email: z.string().email("Email không hợp lệ"),
  interest: z.string().min(1, "Vui lòng chọn dịch vụ quan tâm"),
});

export type DemoFormValues = z.infer<typeof demoFormSchema>;
