import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getSignedUrlForS3 } from "@/lib/s3";

// GET - 获取文件下载链接
export async function GET(request: NextRequest) {
  try {
    // 验证用户认证
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "未授权访问" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");
    const expiresIn = parseInt(searchParams.get("expiresIn") ?? "3600");

    if (!key) {
      return NextResponse.json(
        { error: "缺少文件键参数" },
        { status: 400 }
      );
    }

    // 验证文件键是否属于当前用户（基于路径）
    if (!key.includes(`/${session.user.id}/`)) {
      return NextResponse.json(
        { error: "无权访问此文件" },
        { status: 403 }
      );
    }

    // 生成预签名下载 URL
    const signedUrlResult = await getSignedUrlForS3(key, expiresIn);

    if (!signedUrlResult.success) {
      return NextResponse.json(
        { error: signedUrlResult.error ?? "生成下载链接失败" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        downloadUrl: signedUrlResult.url,
        expiresIn,
        key,
      },
    });

  } catch (error) {
    console.error("生成下载链接错误:", error);
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }
} 