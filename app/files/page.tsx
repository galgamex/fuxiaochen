"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { FileUpload } from "@/components/ui/file-upload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Download, 
  Trash2, 
  File, 
  Image, 
  Video, 
  Music, 
  FileText,
  RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FileItem {
  key: string;
  name: string;
  size: number;
  lastModified: string;
  etag: string;
  url: string;
}

interface UploadedFile {
  key: string;
  url: string;
  originalName: string;
  size: number;
  type: string;
  category: string;
}

// 文件类型图标映射
const getFileIcon = (name: string) => {
  const extension = name.split('.').pop()?.toLowerCase();
  
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension ?? '')) return Image;
  if (['mp4', 'webm', 'ogg', 'avi', 'mov'].includes(extension ?? '')) return Video;
  if (['mp3', 'wav', 'ogg', 'flac'].includes(extension ?? '')) return Music;
  if (['pdf', 'doc', 'docx', 'txt'].includes(extension ?? '')) return FileText;
  return File;
};

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// 格式化日期
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleString('zh-CN');
};

export default function FilesPage() {
  const { data: session, status } = useSession();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);

  // 获取文件列表
  const fetchFiles = async () => {
    if (!session?.user?.id) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/files');
      if (response.ok) {
        const result = await response.json();
        setFiles(result.data.files || []);
      } else {
        console.error('获取文件列表失败');
      }
    } catch (error) {
      console.error('获取文件列表错误:', error);
    } finally {
      setLoading(false);
    }
  };

  // 删除文件
  const deleteFile = async (key: string) => {
    if (!confirm('确定要删除这个文件吗？')) return;
    
    try {
      const response = await fetch(`/api/files?key=${encodeURIComponent(key)}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setFiles(prev => prev.filter(file => file.key !== key));
      } else {
        const error = await response.json();
        alert(`删除失败: ${error.error}`);
      }
    } catch (error) {
      console.error('删除文件错误:', error);
      alert('删除文件时发生错误');
    }
  };

  // 下载文件
  const downloadFile = async (key: string, name: string) => {
    try {
      const response = await fetch(`/api/download?key=${encodeURIComponent(key)}`);
      if (response.ok) {
        const result = await response.json();
        // 创建一个临时链接来下载文件
        const link = document.createElement('a');
        link.href = result.data.downloadUrl;
        link.download = name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        const error = await response.json();
        alert(`下载失败: ${error.error}`);
      }
    } catch (error) {
      console.error('下载文件错误:', error);
      alert('下载文件时发生错误');
    }
  };

  // 上传完成回调
  const handleUploadComplete = (uploadedFiles: UploadedFile[]) => {
    console.log('上传完成:', uploadedFiles);
    fetchFiles(); // 刷新文件列表
  };

  // 上传错误回调
  const handleUploadError = (error: string) => {
    console.error('上传错误:', error);
    alert(`上传错误: ${error}`);
  };

  useEffect(() => {
    if (session?.user?.id) {
      fetchFiles();
    }
  }, [session]);

  if (status === "loading") {
    return <div className="flex justify-center items-center h-64">加载中...</div>;
  }

  if (!session) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>请先登录以访问文件管理功能</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">文件管理</h1>
        <p className="text-muted-foreground">上传和管理您的文件</p>
      </div>

      {/* 文件上传区域 */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>上传文件</CardTitle>
        </CardHeader>
        <CardContent>
          <FileUpload
            onUploadComplete={handleUploadComplete}
            onUploadError={handleUploadError}
            maxFiles={10}
            maxSize={50} // 50MB
            acceptedTypes={[
              "image/*",
              "application/pdf",
              "text/*",
              "video/*",
              "audio/*",
              "application/msword",
              "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            ]}
            folder="uploads"
          />
        </CardContent>
      </Card>

      {/* 文件列表 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>我的文件</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchFiles}
            disabled={loading}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
            刷新
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              加载中...
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              暂无文件，请上传一些文件
            </div>
          ) : (
            <div className="space-y-2">
              {files.map((file) => {
                const FileIcon = getFileIcon(file.name);
                
                return (
                  <div
                    key={file.key}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <FileIcon className="h-8 w-8 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatFileSize(file.size)} • {formatDate(file.lastModified)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadFile(file.key, file.name)}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        下载
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteFile(file.key)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        删除
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 