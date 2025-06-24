import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { 
  listFilesInS3, 
  deleteFileFromS3,
  checkFileExistsInS3 
} from "@/lib/s3";

// GET - 列出用户的文件
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
    const folder = searchParams.get("folder") ?? "uploads";
    const maxKeys = parseInt(searchParams.get("maxKeys") ?? "100");

    // 构建用户文件前缀
    const prefix = `${folder}/${session.user.id}/`;

    // 列出文件
    const listResult = await listFilesInS3(prefix, maxKeys);

    if (!listResult.success) {
      return NextResponse.json(
        { error: listResult.error ?? "获取文件列表失败" },
        { status: 500 }
      );
    }

    // 处理文件信息，提取有用的数据
    const files = listResult.files?.map(file => ({
      key: file.key,
      name: file.key.split('/').pop() ?? file.key,
      size: file.size,
      lastModified: file.lastModified,
      etag: file.etag,
      url: `/api/download?key=${encodeURIComponent(file.key)}`,
    })) ?? [];

    return NextResponse.json({
      success: true,
      data: {
        files,
        total: files.length,
        prefix,
      },
    });

  } catch (error) {
    console.error("获取文件列表错误:", error);
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }
}

// DELETE - 删除文件
export async function DELETE(request: NextRequest) {
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

    if (!key) {
      return NextResponse.json(
        { error: "缺少文件键参数" },
        { status: 400 }
      );
    }

    // 验证文件键是否属于当前用户
    if (!key.includes(`/${session.user.id}/`)) {
      return NextResponse.json(
        { error: "无权删除此文件" },
        { status: 403 }
      );
    }

    // 检查文件是否存在
    const existsResult = await checkFileExistsInS3(key);
    if (!existsResult.exists) {
      return NextResponse.json(
        { error: "文件不存在" },
        { status: 404 }
      );
    }

    // 删除文件
    const deleteResult = await deleteFileFromS3(key);

    if (!deleteResult.success) {
      return NextResponse.json(
        { error: deleteResult.error ?? "删除文件失败" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "文件删除成功",
    });

  } catch (error) {
    console.error("删除文件错误:", error);
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }
} 