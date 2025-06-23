import { z } from "zod";

// 登录表单验证
export const signInFormSchema = z.object({
  email: z
    .string()
    .min(1, "请输入邮箱")
    .email("请输入有效的邮箱地址"),
  password: z
    .string()
    .min(1, "请输入密码")
    .min(6, "密码至少6个字符"),
});

export type SignInFormData = z.infer<typeof signInFormSchema>;

// 注册表单验证
export const signUpFormSchema = z.object({
  name: z
    .string()
    .min(1, "请输入姓名")
    .max(50, "姓名不能超过50个字符"),
  email: z
    .string()
    .min(1, "请输入邮箱")
    .email("请输入有效的邮箱地址"),
  password: z
    .string()
    .min(1, "请输入密码")
    .min(6, "密码至少6个字符")
    .max(100, "密码不能超过100个字符"),
  confirmPassword: z
    .string()
    .min(1, "请确认密码"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "两次输入的密码不一致",
  path: ["confirmPassword"],
});

export type SignUpFormData = z.infer<typeof signUpFormSchema>;

// 邮箱验证表单验证
export const verifyEmailFormSchema = z.object({
  email: z
    .string()
    .min(1, "请输入邮箱")
    .email("请输入有效的邮箱地址"),
  code: z
    .string()
    .min(1, "请输入验证码")
    .length(6, "验证码为6位字符"),
});

export type VerifyEmailFormData = z.infer<typeof verifyEmailFormSchema>;

// 忘记密码表单验证
export const forgotPasswordFormSchema = z.object({
  email: z
    .string()
    .min(1, "请输入邮箱")
    .email("请输入有效的邮箱地址"),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordFormSchema>;

// 重置密码表单验证
export const resetPasswordFormSchema = z.object({
  email: z
    .string()
    .min(1, "请输入邮箱")
    .email("请输入有效的邮箱地址"),
  code: z
    .string()
    .min(1, "请输入验证码")
    .length(6, "验证码为6位字符"),
  newPassword: z
    .string()
    .min(1, "请输入新密码")
    .min(6, "密码至少6个字符")
    .max(100, "密码不能超过100个字符"),
  confirmPassword: z
    .string()
    .min(1, "请确认密码"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "两次输入的密码不一致",
  path: ["confirmPassword"],
});

export type ResetPasswordFormData = z.infer<typeof resetPasswordFormSchema>;

// 为了向后兼容，添加别名
export const signupSchema = signUpFormSchema;
export type SignupDTO = SignUpFormData;
