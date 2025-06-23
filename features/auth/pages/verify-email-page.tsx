"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Input } from "@/components/ui/input";

import { ModeToggle } from "@/components/mode-toggle";

import { PATHS } from "@/constants";

import { verifyEmail, resendVerificationEmail } from "../actions/verify-email";
import { verifyEmailFormSchema, type VerifyEmailFormData } from "../types";

export const VerifyEmailPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isResending, setIsResending] = React.useState(false);

  const emailFromUrl = searchParams.get("email") ?? "";

  const form = useForm<VerifyEmailFormData>({
    resolver: zodResolver(verifyEmailFormSchema),
    defaultValues: {
      email: emailFromUrl,
      code: "",
    },
  });

  const onSubmit = async (data: VerifyEmailFormData) => {
    setIsLoading(true);
    try {
      const result = await verifyEmail(data);
      
      if (result.success) {
        toast.success(result.message ?? "验证成功");
        router.push(PATHS.AUTH_SIGN_IN);
      } else {
        toast.error(result.error ?? "验证失败");
      }
    } catch (error) {
      console.error("验证失败:", error);
      toast.error("验证失败，请稍后重试");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = async () => {
    const email = form.getValues("email");
    if (!email) {
      toast.error("请输入邮箱地址");
      return;
    }

    setIsResending(true);
    try {
      const result = await resendVerificationEmail(email);
      
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      console.error("重发邮件失败:", error);
      toast.error("重发失败，请稍后重试");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="grid h-screen w-screen place-content-center">
      <Card className="relative w-[320px] animate-fade rounded-3xl py-4 sm:w-full sm:min-w-[400px] sm:max-w-none">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>邮箱验证</span>
            <ModeToggle />
          </CardTitle>
          <CardDescription>
            请输入发送到您邮箱的6位验证码
          </CardDescription>
        </CardHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>邮箱</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="请输入邮箱地址"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>验证码</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="请输入6位验证码"
                        maxLength={6}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            
            <CardFooter className="flex flex-col space-y-4">
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? "验证中..." : "验证邮箱"}
              </Button>
              
              <div className="flex flex-col space-y-2 text-sm text-center">
                <button
                  type="button"
                  onClick={handleResendEmail}
                  disabled={isResending}
                  className="text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
                >
                  {isResending ? "发送中..." : "没收到邮件？重新发送"}
                </button>
                
                <div className="flex items-center justify-center space-x-1">
                  <span className="text-muted-foreground">已完成验证？</span>
                  <Link 
                    href={PATHS.AUTH_SIGN_IN}
                    className="text-primary hover:underline"
                  >
                    立即登录
                  </Link>
                </div>
              </div>
              
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
                variant="outline"
                className="w-full"
                type="button"
                onClick={() => router.push(PATHS.SITE_HOME)}
              >
                返回首页
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}; 