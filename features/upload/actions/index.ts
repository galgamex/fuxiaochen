"use server";

import { Upload } from "@aws-sdk/lib-storage";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// 验证环境变量
function validateEnvVars() {
  const required = [
    'AWS_REGION',
    'AWS_ACCESS_KEY_ID', 
    'AWS_SECRET_ACCESS_KEY',
    'AWS_S3_BUCKET_NAME',
    'AWS_S3_ENDPOINT',
    'NEXT_PUBLIC_S3_STORAGE_URL'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`缺少必要的环境变量: ${missing.join(', ')}`);
  }
}

// 初始化S3客户端
function createS3Client() {
  validateEnvVars();
  
  return new S3Client({
    region: process.env.AWS_REGION!,
    endpoint: process.env.AWS_S3_ENDPOINT,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
    forcePathStyle: true, // 对于Cloudflare R2等S3兼容服务很重要
  });
}

/**
 * 上传文件到S3
 * 支持File对象和FormData对象
 */
export async function uploadFile(input: File | FormData): Promise<string | { url?: string; error?: string }> {
  try {
    let file: File;
    
    // 处理不同的输入类型
    if (input instanceof FormData) {
      const fileFromFormData = input.get("file") as File;
      if (!fileFromFormData || !(fileFromFormData instanceof File)) {
        throw new Error("FormData中未找到有效的文件");
      }
      file = fileFromFormData;
    } else if (input instanceof File) {
      file = input;
    } else {
      throw new Error("无效的输入类型，期望File或FormData对象");
    }

    console.log("开始上传文件:", {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified
    });
    
    // 验证文件
    if (!file || file.size === 0) {
      const error = "文件为空或无效";
      return input instanceof FormData ? { error } : Promise.reject(new Error(error));
    }
    
    // 处理文件名，如果为空则生成一个默认名称
    let fileName = file.name;
    if (!fileName || fileName.trim() === '') {
      // 根据文件类型生成默认文件名
      const extension = file.type ? file.type.split('/')[1] ?? 'bin' : 'bin';
      fileName = `file.${extension}`;
      console.log("文件名为空，使用默认名称:", fileName);
    }
    
    // 文件大小限制 (50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      const error = "文件大小超过50MB限制";
      return input instanceof FormData ? { error } : Promise.reject(new Error(error));
    }
    
    const s3Client = createS3Client();
    // 安全处理文件名，替换特殊字符
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const finalFileName = `${Date.now()}-${sanitizedFileName}`;
    const fileBuffer = await file.arrayBuffer();

    console.log("准备上传到S3:", {
      bucket: process.env.AWS_S3_BUCKET_NAME,
      key: finalFileName,
      size: fileBuffer.byteLength,
      contentType: file.type || 'application/octet-stream'
    });

    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: process.env.AWS_S3_BUCKET_NAME!,
        Key: finalFileName,
        Body: Buffer.from(fileBuffer),
        ContentType: file.type || 'application/octet-stream',
      },
    });

    const result = await upload.done();
    console.log("上传成功:", result);

    // 返回完整的文件URL
    const fileUrl = `${process.env.NEXT_PUBLIC_S3_STORAGE_URL}/${finalFileName}`;
    console.log("文件URL:", fileUrl);
    
    // 根据输入类型返回不同格式
    return input instanceof FormData ? { url: fileUrl } : fileUrl;
  } catch (error) {
    console.error("文件上传详细错误:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      inputType: input instanceof FormData ? 'FormData' : input instanceof File ? 'File' : typeof input,
      env: {
        hasRegion: !!process.env.AWS_REGION,
        hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
        hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
        hasBucket: !!process.env.AWS_S3_BUCKET_NAME,
        hasEndpoint: !!process.env.AWS_S3_ENDPOINT,
        hasStorageUrl: !!process.env.NEXT_PUBLIC_S3_STORAGE_URL,
      }
    });
    
    const errorMessage = error instanceof Error ? error.message : "未知错误";
    
    if (input instanceof FormData) {
      return { error: `文件上传失败: ${errorMessage}` };
    } else {
      throw new Error(`文件上传失败: ${errorMessage}`);
    }
  }
}

/**
 * 获取预签名上传URL
 */
export async function getPresignedUploadUrl(fileName: string, contentType: string): Promise<string> {
  try {
    // 验证参数
    if (!fileName) {
      throw new Error("文件名不能为空");
    }
    
    const s3Client = createS3Client();
    // 安全处理文件名，替换特殊字符
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const key = `${Date.now()}-${sanitizedFileName}`;
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME!,
      Key: key,
      ContentType: contentType,
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    return signedUrl;
  } catch (error) {
    console.error("获取预签名URL失败:", error);
    throw new Error(`获取预签名URL失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

/**
 * 批量上传文件
 */
export async function uploadFiles(files: File[]): Promise<string[]> {
  try {
    if (!files || files.length === 0) {
      throw new Error("没有文件需要上传");
    }
    
    const uploadPromises = files.map(async (file) => {
      const result = await uploadFile(file);
      // 对于File类型输入，uploadFile返回string
      return result as string;
    });
    const urls = await Promise.all(uploadPromises);
    return urls;
  } catch (error) {
    console.error("批量上传失败:", error);
    throw new Error(`批量上传失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
} 