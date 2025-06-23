"use server";

import { prisma } from "@/lib/prisma";
import { generateVerificationCode, hashPassword } from "@/lib/utils";
import { sendEmail, generatePasswordResetEmailHtml } from "@/lib/email";

export const sendPasswordResetEmail = async (email: string) => {
  try {
    // 查找用户
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // 为了安全考虑，即使用户不存在也返回成功
      return { success: true, message: "如果该邮箱已注册，您将收到密码重置邮件" };
    }

    // 删除旧的重置记录
    await prisma.verificationToken.deleteMany({
      where: { 
        identifier: `reset:${email}`,
      },
    });

    // 生成重置验证码
    const resetCode = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10分钟后过期

    // 创建重置记录
    await prisma.verificationToken.create({
      data: {
        identifier: `reset:${email}`,
        token: resetCode,
        expires: expiresAt,
      },
    });

    // 发送重置邮件
    const emailHtml = generatePasswordResetEmailHtml(user.name || "用户", resetCode);
    const emailResult = await sendEmail({
      to: email,
      subject: "密码重置 - 重置您的密码",
      html: emailHtml,
    });

    if (!emailResult.success) {
      return { success: false, error: "邮件发送失败，请稍后重试" };
    }

    return { success: true, message: "密码重置邮件已发送，请查收" };
  } catch (error) {
    console.error("发送密码重置邮件失败:", error);
    return { success: false, error: "发送失败，请稍后重试" };
  }
};

export interface ResetPasswordParams {
  email: string;
  code: string;
  newPassword: string;
}

export const resetPassword = async ({ email, code, newPassword }: ResetPasswordParams) => {
  try {
    // 查找重置记录
    const resetToken = await prisma.verificationToken.findUnique({
      where: {
        identifier_token: {
          identifier: `reset:${email}`,
          token: code,
        },
      },
    });

    if (!resetToken) {
      return { success: false, error: "验证码无效" };
    }

    // 检查是否过期
    if (resetToken.expires < new Date()) {
      // 删除过期的重置记录
      await prisma.verificationToken.delete({
        where: {
          identifier_token: {
            identifier: `reset:${email}`,
            token: code,
          },
        },
      });
      return { success: false, error: "验证码已过期，请重新获取" };
    }

    // 加密新密码
    const hashedPassword = await hashPassword(newPassword);

    // 更新用户密码
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });

    // 删除重置记录
    await prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: `reset:${email}`,
          token: code,
        },
      },
    });

    return { success: true, message: "密码重置成功！" };
  } catch (error) {
    console.error("密码重置失败:", error);
    return { success: false, error: "重置失败，请稍后重试" };
  }
}; 