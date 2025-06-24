import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// 验证环境变量
function validateS3Config() {
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
    console.error(`缺少必要的S3环境变量: ${missing.join(', ')}`);
    throw new Error(`缺少必要的S3环境变量: ${missing.join(', ')}`);
  }
}

// 初始化时验证配置
validateS3Config();

// S3 客户端配置
const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
  endpoint: process.env.AWS_S3_ENDPOINT,
  forcePathStyle: true, // 对于Cloudflare R2等S3兼容服务很重要
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME!;
const PUBLIC_URL = process.env.NEXT_PUBLIC_S3_STORAGE_URL!;

// 文件上传接口
export interface UploadFileOptions {
  key: string;
  file: Buffer | Uint8Array | string;
  contentType?: string;
  metadata?: Record<string, string>;
  acl?: "private" | "public-read" | "public-read-write";
}

// 上传文件到 S3
export async function uploadFileToS3(options: UploadFileOptions): Promise<{
  success: boolean;
  url?: string;
  key?: string;
  error?: string;
}> {
  try {
    console.log("开始上传文件到S3:", {
      key: options.key,
      contentType: options.contentType,
      size: options.file instanceof Buffer ? options.file.length : 'unknown'
    });

    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: BUCKET_NAME,
        Key: options.key,
        Body: options.file,
        ContentType: options.contentType ?? "application/octet-stream",
        Metadata: options.metadata,
        // 注意：Cloudflare R2 可能不支持 ACL，如果出错可以移除这行
        // ACL: options.acl ?? "private",
      },
    });

    const result = await upload.done();
    console.log("S3上传成功:", result);
    
    // 使用配置的公共URL
    const fileUrl = `${PUBLIC_URL}/${options.key}`;
    
    return {
      success: true,
      url: fileUrl,
      key: options.key,
    };
  } catch (error) {
    console.error("S3 上传失败:", {
      error: error instanceof Error ? error.message : String(error),
      key: options.key,
      bucket: BUCKET_NAME,
      endpoint: process.env.AWS_S3_ENDPOINT
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : "上传失败",
    };
  }
}

// 删除 S3 文件
export async function deleteFileFromS3(key: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
    
    return { success: true };
  } catch (error) {
    console.error("S3 删除失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "删除失败",
    };
  }
}

// 获取文件的预签名 URL（用于私有文件访问）
export async function getSignedUrlForS3(
  key: string,
  expiresIn = 3600
): Promise<{
  success: boolean;
  url?: string;
  error?: string;
}> {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn });
    
    return {
      success: true,
      url,
    };
  } catch (error) {
    console.error("生成预签名 URL 失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "生成 URL 失败",
    };
  }
}

// 检查文件是否存在
export async function checkFileExistsInS3(key: string): Promise<{
  exists: boolean;
  metadata?: Record<string, unknown>;
  error?: string;
}> {
  try {
    const command = new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const response = await s3Client.send(command);
    
    return {
      exists: true,
      metadata: {
        contentType: response.ContentType,
        contentLength: response.ContentLength,
        lastModified: response.LastModified,
        etag: response.ETag,
      },
    };
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'name' in error && error.name === "NotFound") {
      return { exists: false };
    }
    
    console.error("检查文件存在性失败:", error);
    return {
      exists: false,
      error: error instanceof Error ? error.message : "检查失败",
    };
  }
}

// 列出指定前缀的文件
export async function listFilesInS3(
  prefix?: string,
  maxKeys = 1000
): Promise<{
  success: boolean;
  files?: {
    key: string;
    size: number;
    lastModified: Date;
    etag: string;
  }[];
  error?: string;
}> {
  try {
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: prefix,
      MaxKeys: maxKeys,
    });

    const response = await s3Client.send(command);
    
    const files = response.Contents?.map(item => ({
      key: item.Key ?? "",
      size: item.Size ?? 0,
      lastModified: item.LastModified ?? new Date(),
      etag: item.ETag ?? "",
    })) ?? [];

    return {
      success: true,
      files,
    };
  } catch (error) {
    console.error("列出文件失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "列出文件失败",
    };
  }
}

// 生成上传预签名 URL（用于前端直接上传）
export async function generateUploadPresignedUrl(
  key: string,
  contentType: string,
  expiresIn = 3600
): Promise<{
  success: boolean;
  url?: string;
  fields?: Record<string, string>;
  error?: string;
}> {
  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn });
    
    return {
      success: true,
      url,
    };
  } catch (error) {
    console.error("生成上传预签名 URL 失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "生成上传 URL 失败",
    };
  }
}

// 工具函数：生成唯一的文件键
export function generateFileKey(
  originalName: string,
  folder?: string
): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = originalName.split('.').pop();
  const baseName = originalName.split('.').slice(0, -1).join('.');
  
  const fileName = `${baseName}_${timestamp}_${randomString}.${extension}`;
  
  return folder ? `${folder}/${fileName}` : fileName;
}

// 工具函数：从 URL 提取文件键
export function extractKeyFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    // 移除开头的 '/'
    return pathname.startsWith('/') ? pathname.substring(1) : pathname;
  } catch {
    return null;
  }
}

export { s3Client }; 