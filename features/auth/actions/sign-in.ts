"use server";

import { signIn } from "@/lib/auth";
import { z } from "zod";
import { signInFormSchema } from "../types";
import { AuthError } from "next-auth";

export async function signInWithEmail(values: z.infer<typeof signInFormSchema>) {
  try {
    const validatedFields = signInFormSchema.safeParse(values);

    if (!validatedFields.success) {
      return {
        success: false,
        error: "输入的数据无效",
      };
    }

    const { email, password } = validatedFields.data;

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      // 如果没有抛出错误，说明登录成功
      return {
        success: true,
        message: "登录成功",
      };
    } catch (error) {
      if (error instanceof AuthError) {
        switch (error.type) {
          case "CredentialsSignin":
            return {
              success: false,
              error: "邮箱或密码错误",
            };
          default:
            return {
              success: false,
              error: "登录失败，请稍后重试",
            };
        }
      }
      throw error;
    }
  } catch (error) {
    console.error("登录失败:", error);
    return {
      success: false,
      error: "登录失败，请稍后重试",
    };
  }
}
