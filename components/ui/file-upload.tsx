"use client";

import React, { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Upload, 
  X, 
  File, 
  Image, 
  Video, 
  Music,
  FileText,
  AlertCircle,
  Check
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onUploadComplete?: (files: UploadedFile[]) => void;
  onUploadError?: (error: string) => void;
  maxFiles?: number;
  maxSize?: number; // MB
  acceptedTypes?: string[];
  folder?: string;
  className?: string;
}

interface UploadedFile {
  key: string;
  url: string;
  originalName: string;
  size: number;
  type: string;
  category: string;
}

interface FileWithProgress {
  file: File;
  progress: number;
  status: "pending" | "uploading" | "success" | "error";
  error?: string;
  result?: UploadedFile;
}

// 文件类型图标映射
const getFileIcon = (type: string) => {
  if (type.startsWith("image/")) return Image;
  if (type.startsWith("video/")) return Video;
  if (type.startsWith("audio/")) return Music;
  if (type.includes("pdf") || type.includes("document") || type.includes("text")) return FileText;
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

export function FileUpload({
  onUploadComplete,
  onUploadError,
  maxFiles = 5,
  maxSize = 10, // 10MB
  acceptedTypes = ["image/*", "application/pdf", "text/*"],
  folder = "uploads",
  className,
}: FileUploadProps) {
  const [files, setFiles] = useState<FileWithProgress[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): string | null => {
    // 检查文件大小
    if (file.size > maxSize * 1024 * 1024) {
      return `文件大小超过 ${maxSize}MB 限制`;
    }

    // 检查文件类型
    const isAccepted = acceptedTypes.some(type => {
      if (type.endsWith("/*")) {
        const category = type.replace("/*", "");
        return file.type.startsWith(category);
      }
      return file.type === type;
    });

    if (!isAccepted) {
      return "不支持的文件类型";
    }

    return null;
  }, [maxSize, acceptedTypes]);

  const uploadFile = async (fileWithProgress: FileWithProgress): Promise<void> => {
    const formData = new FormData();
    formData.append("file", fileWithProgress.file);
    formData.append("folder", folder);

    try {
      setFiles(prev => prev.map(f => 
        f.file === fileWithProgress.file 
          ? { ...f, status: "uploading", progress: 0 }
          : f
      ));

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "上传失败");
      }

      const result = await response.json();
      
      setFiles(prev => prev.map(f => 
        f.file === fileWithProgress.file 
          ? { 
              ...f, 
              status: "success", 
              progress: 100,
              result: result.data
            }
          : f
      ));

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "上传失败";
      setFiles(prev => prev.map(f => 
        f.file === fileWithProgress.file 
          ? { ...f, status: "error", error: errorMessage }
          : f
      ));
      onUploadError?.(errorMessage);
    }
  };

  const handleFiles = useCallback((newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    
    // 检查文件数量限制
    if (files.length + fileArray.length > maxFiles) {
      onUploadError?.(`最多只能上传 ${maxFiles} 个文件`);
      return;
    }

    const validFiles: FileWithProgress[] = [];
    const errors: string[] = [];

    fileArray.forEach(file => {
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        validFiles.push({
          file,
          progress: 0,
          status: "pending",
        });
      }
    });

    if (errors.length > 0) {
      onUploadError?.(errors.join("\n"));
    }

    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles]);
      
      // 开始上传
      validFiles.forEach(fileWithProgress => {
        uploadFile(fileWithProgress);
      });
    }
  }, [files.length, maxFiles, validateFile, onUploadError]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      handleFiles(droppedFiles);
    }
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      handleFiles(selectedFiles);
    }
    // 清空输入框
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [handleFiles]);

  const removeFile = useCallback((fileToRemove: FileWithProgress) => {
    setFiles(prev => prev.filter(f => f.file !== fileToRemove.file));
  }, []);

  const handleUploadComplete = useCallback(() => {
    const successFiles = files
      .filter(f => f.status === "success" && f.result)
      .map(f => f.result!);
    
    if (successFiles.length > 0) {
      onUploadComplete?.(successFiles);
    }
  }, [files, onUploadComplete]);

  // 当所有文件上传完成时触发回调
  React.useEffect(() => {
    const allCompleted = files.length > 0 && files.every(f => f.status === "success" || f.status === "error");
    if (allCompleted) {
      handleUploadComplete();
    }
  }, [files, handleUploadComplete]);

  return (
    <div className={cn("w-full", className)}>
      {/* 拖拽上传区域 */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
          isDragOver 
            ? "border-primary bg-primary/5" 
            : "border-muted-foreground/25 hover:border-primary/50"
        )}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground mb-2">
          拖拽文件到此处或点击选择文件
        </p>
        <p className="text-xs text-muted-foreground">
          支持 {acceptedTypes.join(", ")} 格式，最大 {maxSize}MB
        </p>
        <Button variant="outline" className="mt-4">
          选择文件
        </Button>
      </div>

      {/* 隐藏的文件输入框 */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptedTypes.join(",")}
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* 文件列表 */}
      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((fileWithProgress, index) => {
            const FileIcon = getFileIcon(fileWithProgress.file.type);
            
            return (
              <Card key={index} className="p-3">
                <CardContent className="p-0">
                  <div className="flex items-center space-x-3">
                    <FileIcon className="h-8 w-8 text-muted-foreground flex-shrink-0" />
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {fileWithProgress.file.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(fileWithProgress.file.size)}
                      </p>
                      
                      {fileWithProgress.status === "uploading" && (
                        <Progress 
                          value={fileWithProgress.progress} 
                          className="mt-2 h-2"
                        />
                      )}
                      
                      {fileWithProgress.status === "error" && (
                        <p className="text-xs text-destructive mt-1">
                          {fileWithProgress.error}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {fileWithProgress.status === "success" && (
                        <Check className="h-4 w-4 text-green-500" />
                      )}
                      {fileWithProgress.status === "error" && (
                        <AlertCircle className="h-4 w-4 text-destructive" />
                      )}
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(fileWithProgress)}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
} 