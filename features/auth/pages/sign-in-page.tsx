"use client";

<<<<<<< HEAD
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
        toast.success(result.message || "登录成功");
        router.push(PATHS.ADMIN_HOME);
      } else {
        toast.error(result.error || "登录失败");
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
=======
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { IconBrandGithub } from "@/components/icons";
import { ModeToggle } from "@/components/mode-toggle";

import { PATHS } from "@/constants";

import { signInWithGithub } from "../actions/sign-in";

export const SignInPage = () => {
  const router = useRouter();

  return (
    <div className="grid h-screen w-screen place-content-center">
      <Card className="relative w-[320px] animate-fade rounded-3xl py-4 sm:w-full sm:min-w-[360px] sm:max-w-none">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>后台登录</span>
            <ModeToggle />
          </CardTitle>
          <CardDescription>选择你喜欢的方式进行登录</CardDescription>
        </CardHeader>
        <CardFooter>
          <div className="grid w-full gap-4">
            <Button
              variant="default"
              className="!w-full"
              type="button"
              onClick={handleSignInWithGithub}
            >
              <IconBrandGithub className="mr-2 text-base" /> 使用 Github 登录
            </Button>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  或者
                </span>
              </div>
            </div>
            <Button
              variant="default"
              className="!w-full"
              type="button"
              onClick={handleGoHome}
            >
              回首页
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );

  async function handleSignInWithGithub() {
    await signInWithGithub();
  }

  function handleGoHome() {
    router.push(PATHS.SITE_HOME);
  }
};
>>>>>>> 65d1fdd994ea331c20263c70f824dc1d644ebec0
