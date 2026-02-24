import React, { useState, useRef } from "react";
import { Paperclip, X, FileText, Image as ImageIcon, File } from "lucide-react";
import { supabase } from "../lib/supabase";
import { toast } from "react-hot-toast";

interface FileAttachment {
  url: string;
  name: string;
  size: number;
  type: string;
}

interface FileUploadProps {
  onFilesSelected: (files: FileAttachment[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFilesSelected,
  maxFiles = 5,
  maxSizeMB = 10,
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<FileAttachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    if (files.length === 0) return;

    // Check file count
    if (uploadedFiles.length + files.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`);
      return;
    }

    // Check file sizes
    const maxSize = maxSizeMB * 1024 * 1024;
    const oversizedFiles = files.filter((f) => f.size > maxSize);
    if (oversizedFiles.length > 0) {
      toast.error(`Files must be smaller than ${maxSizeMB}MB`);
      return;
    }

    setUploading(true);

    try {
      const uploadPromises = files.map(async (file) => {
        // Generate unique filename
        const fileExt = file.name.split(".").pop();
        const fileName = `${Math.random()
          .toString(36)
          .substring(2)}-${Date.now()}.${fileExt}`;
        const filePath = `fets-connect/${fileName}`;

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
          .from("attachments")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (error) throw error;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from("attachments")
          .getPublicUrl(filePath);

        return {
          url: urlData.publicUrl,
          name: file.name,
          size: file.size,
          type: file.type,
        };
      });

      const uploaded = await Promise.all(uploadPromises);
      const newFiles = [...uploadedFiles, ...uploaded];
      setUploadedFiles(newFiles);
      onFilesSelected(newFiles);

      toast.success(`${uploaded.length} file(s) uploaded successfully`);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload files. Please try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeFile = (index: number) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(newFiles);
    onFilesSelected(newFiles);
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <ImageIcon className="w-4 h-4" />;
    if (type.includes("pdf")) return <FileText className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        accept="image/*,.pdf,.doc,.docx,.txt,.xlsx,.xls"
      />

      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading || uploadedFiles.length >= maxFiles}
        className="p-2 hover:bg-slate-100 rounded-full text-slate-500 hover:text-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Attach files"
      >
        <Paperclip className="w-5 h-5" />
      </button>

      {uploading && (
        <div className="text-sm text-blue-600">Uploading files...</div>
      )}

      {uploadedFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {uploadedFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-2 text-sm"
            >
              <span className="text-slate-600">{getFileIcon(file.type)}</span>
              <div className="flex flex-col">
                <span className="text-slate-700 font-medium truncate max-w-[150px]">
                  {file.name}
                </span>
                <span className="text-xs text-slate-500">
                  {formatFileSize(file.size)}
                </span>
              </div>
              <button
                onClick={() => removeFile(index)}
                className="text-slate-400 hover:text-red-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
