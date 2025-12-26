'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  bucket: string;
  label?: string;
  aspectRatio?: 'video' | 'square' | 'auto';
}

export function ImageUpload({ 
  value, 
  onChange, 
  bucket,
  label = 'Cover Image',
  aspectRatio = 'video'
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image exceeds 5MB limit');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const filename = `${bucket}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filename, file, { cacheControl: '3600', upsert: false });

      if (uploadError) {
        if (uploadError.message.includes('not found')) {
          setError(`Storage bucket "${bucket}" not found. Create it in Supabase dashboard.`);
        } else {
          setError(`Upload failed: ${uploadError.message}`);
        }
        return;
      }

      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filename);

      // Save to assets table
      await supabase.from('assets').insert({
        filename: file.name,
        original_url: urlData.publicUrl,
        bucket,
        mime_type: file.type,
        size_bytes: file.size,
        width: null,
        height: null,
        variants: {},
      });

      onChange(urlData.publicUrl);
    } catch (err) {
      console.error('Upload error:', err);
      setError('An error occurred during upload');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemove = () => {
    onChange('');
  };

  const aspectClass = {
    video: 'aspect-video',
    square: 'aspect-square',
    auto: '',
  }[aspectRatio];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-[var(--text)]">
          {label}
        </label>
        {value && (
          <button
            onClick={handleRemove}
            className="text-xs text-red-400 hover:text-red-300"
          >
            Remove
          </button>
        )}
      </div>

      {value ? (
        <div className="relative group">
          <img
            src={value}
            alt="Cover preview"
            className={`w-full ${aspectClass} object-cover rounded-lg border border-[var(--surface)]`}
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
            <label className="px-3 py-1.5 bg-white/20 text-white text-sm rounded cursor-pointer hover:bg-white/30">
              Replace
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleUpload}
                disabled={isUploading}
                className="hidden"
              />
            </label>
            <button
              onClick={handleRemove}
              className="px-3 py-1.5 bg-red-500/50 text-white text-sm rounded hover:bg-red-500/70"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <label className={`flex flex-col items-center justify-center w-full ${aspectClass || 'h-32'} border-2 border-dashed border-[var(--surface)] rounded-lg cursor-pointer hover:border-[var(--muted)] transition-colors bg-[var(--bg)]`}>
          <div className="flex flex-col items-center justify-center py-6">
            {isUploading ? (
              <div className="w-6 h-6 border-2 border-[var(--blue)] border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-8 h-8 text-[var(--muted)] mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm text-[var(--muted)]">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-[var(--muted)] mt-1">
                  PNG, JPG, GIF up to 5MB
                </p>
              </>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleUpload}
            disabled={isUploading}
            className="hidden"
          />
        </label>
      )}

      {/* URL input as fallback */}
      <div>
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--surface)] rounded-lg text-[var(--text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--blue)]"
          placeholder="Or paste image URL..."
        />
      </div>

      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}
