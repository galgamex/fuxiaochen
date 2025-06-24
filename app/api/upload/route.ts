import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { 
  uploadFileToS3, 
  generateFileKey, 
  generateUploadPresignedUrl 
} from "@/lib/s3";

// 允许的文件类型
const ALLOWED_FILE_TYPES = {
  image: ["image/jpeg", "image/png", "image/gif", "image/webp"],
  document: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
  ],
  video: ["video/mp4", "video/webm", "video/ogg"],
  audio: ["audio/mp3", "audio/wav", "audio/ogg"],
};

// 文件大小限制（字节）
const FILE_SIZE_LIMITS = {
  image: 5 * 1024 * 1024, // 5MB
  document: 10 * 1024 * 1024, // 10MB
  video: 100 * 1024 * 1024, // 100MB
  audio: 20 * 1024 * 1024, // 20MB
};

// 验证文件类型
function validateFileType(contentType: string): string | null {
  for (const [category, types] of Object.entries(ALLOWED_FILE_TYPES)) {
    if (types.includes(contentType)) {
      return category;
    }
  }
  return null;
}

// POST - 直接上传文件
export async function POST(request: NextRequest) {
  try {
    // 验证用户认证
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "未授权访问" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const folder = formData.get("folder") as string ?? "uploads";

    if (!file) {
      return NextResponse.json(
        { error: "未找到文件" },
        { status: 400 }
      );
    }

    // 验证文件类型
    const fileCategory = validateFileType(file.type);
    if (!fileCategory) {
      return NextResponse.json(
        { error: "不支持的文件类型" },
        { status: 400 }
      );
    }

    // 验证文件大小
    const sizeLimit = FILE_SIZE_LIMITS[fileCategory as keyof typeof FILE_SIZE_LIMITS];
    if (file.size > sizeLimit) {
      return NextResponse.json(
        { error: `文件大小超过限制 (最大 ${Math.round(sizeLimit / 1024 / 1024)}MB)` },
        { status: 400 }
      );
    }

    // 生成文件键
    const fileKey = generateFileKey(file.name, `${folder}/${session.user.id}`);

    // 转换文件为 Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 上传到 S3
    const uploadResult = await uploadFileToS3({
      key: fileKey,
      file: buffer,
      contentType: file.type,
      metadata: {
        originalName: file.name,
        uploadedBy: session.user.id,
        category: fileCategory,
      },
      acl: "private", // 默认私有，可根据需要调整
    });

    if (!uploadResult.success) {
      return NextResponse.json(
        { error: uploadResult.error ?? "上传失败" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        key: uploadResult.key,
        url: uploadResult.url,
        originalName: file.name,
        size: file.size,
        type: file.type,
        category: fileCategory,
      },
    });

  } catch (error) {
    console.error("文件上传错误:", error);
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }
}

// GET - 生成预签名上传 URL
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
    const fileName = searchParams.get("fileName");
    const contentType = searchParams.get("contentType");
    const folder = searchParams.get("folder") ?? "uploads";

    if (!fileName || !contentType) {
      return NextResponse.json(
        { error: "缺少必要参数" },
        { status: 400 }
      );
    }

    // 验证文件类型
    const fileCategory = validateFileType(contentType);
    if (!fileCategory) {
      return NextResponse.json(
        { error: "不支持的文件类型" },
        { status: 400 }
      );
    }

    // 生成文件键
    const fileKey = generateFileKey(fileName, `${folder}/${session.user.id}`);

    // 生成预签名 URL
    const presignedResult = await generateUploadPresignedUrl(
      fileKey,
      contentType,
      3600 // 1小时过期
    );

    if (!presignedResult.success) {
      return NextResponse.json(
        { error: presignedResult.error ?? "生成上传 URL 失败" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        uploadUrl: presignedResult.url,
        key: fileKey,
        expiresIn: 3600,
      },
    });

  } catch (error) {
    console.error("生成预签名 URL 错误:", error);
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }
} 