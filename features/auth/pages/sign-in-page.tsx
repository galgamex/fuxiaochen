"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { signInFormSchema, type SignInFormData } from "../types";
import { signInWithEmail } from "../actions/sign-in";
import { PATHS } from "@/constants";

export function SignInPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm<SignInFormData>({
    resolver: zodResolver(signInFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: SignInFormData) => {
    setIsLoading(true);
    try {
      const result = await signInWithEmail(values);
      
      if (result.success) {
        toast.success(result.message ?? "登录成功");
        router.push(PATHS.ADMIN_HOME);
      } else {
        toast.error(result.error ?? "登录失败");
      }
    } catch (error) {
      console.error("登录错误:", error);
      toast.error("登录失败，请稍后重试");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">登录</CardTitle>
          <CardDescription className="text-center">
            输入您的邮箱和密码以登录您的账户
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>邮箱</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="请输入邮箱"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>密码</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="请输入密码"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "登录中..." : "登录"}
              </Button>
            </form>
          </Form>

          <div className="text-center space-y-2">
            <div>
              <Link
                href={PATHS.AUTH_FORGOT_PASSWORD}
                className="text-sm text-blue-600 hover:underline"
              >
                忘记密码？
              </Link>
            </div>
            <div className="text-sm">
              还没有账户？{" "}
              <Link
                href={PATHS.AUTH_SIGN_UP}
                className="text-blue-600 hover:underline"
              >
                立即注册
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
