import React, { useState, useRef, useCallback } from "react";
import { api } from "@/api/localDataService";
import { useSupabase } from "@/lib/supabase";
import { Upload, X, Image, Link, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function ImageUpload({
  value,
  onChange,
  bucket = "event-images",
  label = "Image",
  accept = "image/jpeg,image/png,image/webp,image/gif",
  maxSize = 5 * 1024 * 1024, // 5MB default
  className,
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [mode, setMode] = useState(value?.startsWith("http") ? "url" : "upload");
  const [urlInput, setUrlInput] = useState(value || "");
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const isSupabaseEnabled = useSupabase();

  const handleFileSelect = useCallback(async (file) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size
    if (file.size > maxSize) {
      toast.error(`File too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB`);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 100);

      let imageUrl;

      if (isSupabaseEnabled && api.storage?.uploadImage) {
        // Use Supabase storage
        imageUrl = await api.storage.uploadImage(file, bucket);
      } else {
        // Fallback: Convert to base64 data URL for localStorage mode
        imageUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }

      clearInterval(progressInterval);
      setUploadProgress(100);

      onChange(imageUrl);
      toast.success("Image uploaded successfully");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error.message || "Failed to upload image");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [bucket, maxSize, onChange, isSupabaseEnabled]);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, [handleFileSelect]);

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim());
      toast.success("Image URL set");
    }
  };

  const handleRemove = async () => {
    if (value && isSupabaseEnabled && api.storage?.deleteImage) {
      try {
        await api.storage.deleteImage(value);
      } catch (error) {
        console.error("Failed to delete image:", error);
      }
    }
    onChange("");
    setUrlInput("");
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setMode("upload")}
            className={cn(
              "px-2 py-1 text-xs rounded transition-colors",
              mode === "upload"
                ? "bg-[#2D5016] text-white"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            )}
          >
            <Upload className="w-3 h-3 inline mr-1" />
            Upload
          </button>
          <button
            type="button"
            onClick={() => setMode("url")}
            className={cn(
              "px-2 py-1 text-xs rounded transition-colors",
              mode === "url"
                ? "bg-[#2D5016] text-white"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            )}
          >
            <Link className="w-3 h-3 inline mr-1" />
            URL
          </button>
        </div>
      </div>

      {mode === "upload" ? (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={cn(
            "relative border-2 border-dashed rounded-lg transition-colors",
            dragActive
              ? "border-[#2D5016] bg-green-50"
              : "border-stone-300 hover:border-stone-400",
            isUploading && "pointer-events-none opacity-75"
          )}
        >
          {value ? (
            <div className="relative p-2">
              <img
                src={value}
                alt="Preview"
                className="w-full h-40 object-cover rounded-lg"
              />
              {!isUploading && (
                <button
                  type="button"
                  onClick={handleRemove}
                  className="absolute top-4 right-4 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="p-8 text-center cursor-pointer"
            >
              {isUploading ? (
                <div className="space-y-3">
                  <Loader2 className="w-10 h-10 mx-auto text-[#2D5016] animate-spin" />
                  <p className="text-sm text-stone-600">Uploading... {uploadProgress}%</p>
                  <div className="w-full bg-stone-200 rounded-full h-2 max-w-xs mx-auto">
                    <div
                      className="bg-[#2D5016] h-2 rounded-full transition-all"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              ) : (
                <>
                  <Upload className="w-10 h-10 mx-auto text-stone-400 mb-3" />
                  <p className="text-sm text-stone-600 mb-1">
                    Drag and drop an image, or click to browse
                  </p>
                  <p className="text-xs text-stone-400">
                    JPEG, PNG, WebP or GIF (max {Math.round(maxSize / 1024 / 1024)}MB)
                  </p>
                </>
              )}
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileInputChange}
            className="hidden"
          />
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleUrlSubmit}
              disabled={!urlInput.trim()}
            >
              Set
            </Button>
          </div>
          {value && (
            <div className="relative">
              <img
                src={value}
                alt="Preview"
                className="w-full h-40 object-cover rounded-lg border border-stone-200"
              />
              <button
                type="button"
                onClick={handleRemove}
                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {!isSupabaseEnabled && mode === "upload" && (
        <p className="text-xs text-amber-600">
          Note: Images are stored locally. For cloud storage, configure Supabase.
        </p>
      )}
    </div>
  );
}
