"use server";

import { prisma } from "@/lib/prisma";

export interface VerifyEmailParams {
  email: string;
  code: string;
}

export const verifyEmail = async ({ email, code }: VerifyEmailParams) => {
  try {
    // 查找验证记录
    const verificationToken = await prisma.verificationToken.findUnique({
      where: {
        identifier_token: {
          identifier: email,
          token: code,
        },
      },
    });

    if (!verificationToken) {
      return { success: false, error: "验证码无效" };
    }

    // 检查是否过期
    if (verificationToken.expires < new Date()) {
      // 删除过期的验证记录
      await prisma.verificationToken.delete({
        where: {
          identifier_token: {
            identifier: email,
            token: code,
          },
        },
      });
      return { success: false, error: "验证码已过期，请重新获取" };
    }

    // 更新用户邮箱验证状态
    await prisma.user.update({
      where: { email },
      data: { emailVerified: new Date() },
    });

    // 删除验证记录
    await prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: email,
          token: code,
        },
      },
    });

    return { success: true, message: "邮箱验证成功！" };
  } catch (error) {
    console.error("邮箱验证失败:", error);
    return { success: false, error: "验证失败，请稍后重试" };
  }
};

export const resendVerificationEmail = async (email: string) => {
  try {
    const { sendEmail, generateVerificationEmailHtml } = await import("@/lib/email");
    const { generateVerificationCode } = await import("@/lib/utils");

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return { success: false, error: "用户不存在" };
    }

    if (user.emailVerified) {
      return { success: false, error: "邮箱已验证，无需重复验证" };
    }

    // 删除旧的验证记录
    await prisma.verificationToken.deleteMany({
      where: { identifier: email },
    });

    // 生成新的验证码
    const verificationCode = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10分钟后过期

    // 创建新的验证记录
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: verificationCode,
        expires: expiresAt,
      },
    });

    // 发送验证邮件
    const emailHtml = generateVerificationEmailHtml(user.name ?? "用户", verificationCode);
    const emailResult = await sendEmail({
      to: email,
      subject: "邮箱验证 - 请验证您的邮箱地址",
      html: emailHtml,
    });

    if (!emailResult.success) {
      return { success: false, error: "邮件发送失败，请稍后重试" };
    }

    return { success: true, message: "验证邮件已重新发送，请查收" };
  } catch (error) {
    console.error("重发验证邮件失败:", error);
    return { success: false, error: "发送失败，请稍后重试" };
  }
}; 