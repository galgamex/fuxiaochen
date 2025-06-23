"use server";

import { prisma } from "@/lib/prisma";
import { hashPassword, generateVerificationCode } from "@/lib/utils";
import { sendEmail, generateVerificationEmailHtml } from "@/lib/email";

export interface SignUpParams {
  name: string;
  email: string;
  password: string;
}

export const signUp = async ({ name, email, password }: SignUpParams) => {
  try {
    // 检查邮箱是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { success: false, error: "该邮箱已被注册" };
    }

    // 加密密码
    const hashedPassword = await hashPassword(password);

    // 生成验证码
    const verificationCode = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10分钟后过期

    // 创建用户（未验证状态）
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        emailVerified: null, // 未验证
      },
    });

    // 创建验证记录
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: verificationCode,
        expires: expiresAt,
      },
    });

    // 发送验证邮件
    const emailHtml = generateVerificationEmailHtml(name, verificationCode);
    const emailResult = await sendEmail({
      to: email,
      subject: "邮箱验证 - 请验证您的邮箱地址",
      html: emailHtml,
    });

    if (!emailResult.success) {
      // 如果邮件发送失败，删除创建的用户和验证记录
      await prisma.user.delete({ where: { id: user.id } });
      await prisma.verificationToken.deleteMany({ where: { identifier: email } });
      return { success: false, error: "邮件发送失败，请稍后重试" };
    }

    return { 
      success: true, 
      message: "注册成功！验证邮件已发送到您的邮箱，请查收并完成验证。" 
    };
  } catch (error) {
    console.error("注册失败:", error);
    return { success: false, error: "注册失败，请稍后重试" };
  }
}; 