"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

import { sendPasswordResetEmail } from "../actions/forgot-password";
import { forgotPasswordFormSchema, type ForgotPasswordFormData } from "../types";

export const ForgotPasswordPage = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const [emailSent, setEmailSent] = React.useState(false);

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordFormSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    try {
      const result = await sendPasswordResetEmail(data.email);
      
      if (result.success) {
        toast.success(result.message);
        setEmailSent(true);
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      console.error("发送重置邮件失败:", error);
      toast.error("发送失败，请稍后重试");
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="grid h-screen w-screen place-content-center">
        <Card className="relative w-[320px] animate-fade rounded-3xl py-4 sm:w-full sm:min-w-[400px] sm:max-w-none">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>邮件已发送</span>
              <ModeToggle />
            </CardTitle>
            <CardDescription>
              密码重置链接已发送到您的邮箱，请查收
            </CardDescription>
          </CardHeader>
          
          <CardContent className="text-center space-y-4">
            <div className="text-sm text-muted-foreground">
              <p>请检查您的邮箱（包括垃圾邮件文件夹）</p>
              <p>如果您没有收到邮件，请等待几分钟后重试</p>
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4">
            <Link href={PATHS.AUTH_RESET_PASSWORD} className="w-full">
              <Button className="w-full">
                已收到邮件，去重置密码
              </Button>
            </Link>
            
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setEmailSent(false)}
            >
              重新发送
            </Button>
            
            <div className="flex items-center justify-center space-x-1 text-sm">
              <span className="text-muted-foreground">记起密码了？</span>
              <Link 
                href={PATHS.AUTH_SIGN_IN}
                className="text-primary hover:underline"
              >
                立即登录
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid h-screen w-screen place-content-center">
      <Card className="relative w-[320px] animate-fade rounded-3xl py-4 sm:w-full sm:min-w-[400px] sm:max-w-none">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>忘记密码</span>
            <ModeToggle />
          </CardTitle>
          <CardDescription>
            输入您的邮箱地址，我们将发送重置密码的链接
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
                        placeholder="请输入您的邮箱地址"
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
                {isLoading ? "发送中..." : "发送重置邮件"}
              </Button>
              
              <div className="flex items-center justify-center space-x-1 text-sm">
                <span className="text-muted-foreground">记起密码了？</span>
                <Link 
                  href={PATHS.AUTH_SIGN_IN}
                  className="text-primary hover:underline"
                >
                  立即登录
                </Link>
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