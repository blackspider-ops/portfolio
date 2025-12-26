'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { revalidateContent } from '@/app/admin/actions/revalidate';
import type { Asset } from '@/types/database';

type BucketFilter = 'all' | 'public-images' | 'resume';

export default function AdminAssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [bucketFilter, setBucketFilter] = useState<BucketFilter>('all');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const fetchAssets = useCallback(async () => {
    setIsLoading(true);
    let query = supabase
      .from('assets')
      .select('*')
      .order('created_at', { ascending: false });

    if (bucketFilter !== 'all') {
      query = query.eq('bucket', bucketFilter);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching assets:', error);
    } else {
      setAssets(data || []);
    }
    setIsLoading(false);
  }, [supabase, bucketFilter]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadProgress('Uploading...');

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress(`Uploading ${i + 1}/${files.length}: ${file.name}`);

        // Validate file type
        if (!file.type.startsWith('image/')) {
          alert(`${file.name} is not an image file`);
          continue;
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
          alert(`${file.name} exceeds 5MB limit`);
          continue;
        }

        // Generate unique filename
        const ext = file.name.split('.').pop();
        const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('public-images')
          .upload(filename, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          alert(`Failed to upload ${file.name}: ${uploadError.message}`);
          continue;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('public-images')
          .getPublicUrl(filename);

        // Get image dimensions
        const dimensions = await getImageDimensions(file);

        // Create asset record
        const { error: insertError } = await supabase.from('assets').insert({
          filename: file.name,
          original_url: urlData.publicUrl,
          bucket: 'public-images',
          mime_type: file.type,
          size_bytes: file.size,
          width: dimensions.width,
          height: dimensions.height,
          variants: {},
        });

        if (insertError) {
          console.error('Insert error:', insertError);
          alert(`Failed to track ${file.name}: ${insertError.message}`);
        }
      }

      // Refresh assets list
      await fetchAssets();
    } catch (error) {
      console.error('Upload error:', error);
      alert('An error occurred during upload');
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };


  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (file.type !== 'application/pdf') {
      alert('Please upload a PDF file');
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      alert('File exceeds 10MB limit');
      return;
    }

    setIsUploading(true);
    setUploadProgress('Uploading resume...');

    try {
      const filename = `resume-${Date.now()}.pdf`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('resume')
        .upload(filename, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        alert(`Failed to upload resume: ${uploadError.message}`);
        return;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('resume')
        .getPublicUrl(filename);

      // Create asset record
      const { error: insertError } = await supabase.from('assets').insert({
        filename: file.name,
        original_url: urlData.publicUrl,
        bucket: 'resume',
        mime_type: file.type,
        size_bytes: file.size,
        width: null,
        height: null,
        variants: {},
      });

      if (insertError) {
        console.error('Insert error:', insertError);
        alert(`Failed to track resume: ${insertError.message}`);
      }

      // Revalidate resume page - Requirement 23.2
      await revalidateContent('page', 'resume');

      // Refresh assets list
      await fetchAssets();
    } catch (error) {
      console.error('Upload error:', error);
      alert('An error occurred during upload');
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
      if (resumeInputRef.current) {
        resumeInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async (asset: Asset) => {
    if (!confirm(`Are you sure you want to delete ${asset.filename}?`)) return;

    try {
      // Extract filename from URL for storage deletion
      const urlParts = asset.original_url.split('/');
      const storageFilename = urlParts[urlParts.length - 1];

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from(asset.bucket)
        .remove([storageFilename]);

      if (storageError) {
        console.error('Storage delete error:', storageError);
        // Continue to delete from database even if storage delete fails
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('assets')
        .delete()
        .eq('id', asset.id);

      if (dbError) {
        console.error('Database delete error:', dbError);
        alert('Failed to delete asset record');
        return;
      }

      setAssets(assets.filter((a) => a.id !== asset.id));
      if (selectedAsset?.id === asset.id) {
        setSelectedAsset(null);
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('An error occurred during deletion');
    }
  };

  const handleUpdateAltText = async (asset: Asset, altText: string) => {
    const { error } = await supabase
      .from('assets')
      .update({ alt_text: altText, updated_at: new Date().toISOString() })
      .eq('id', asset.id);

    if (error) {
      console.error('Update error:', error);
      alert('Failed to update alt text');
      return;
    }

    setAssets(assets.map((a) => (a.id === asset.id ? { ...a, alt_text: altText } : a)));
    if (selectedAsset?.id === asset.id) {
      setSelectedAsset({ ...selectedAsset, alt_text: altText });
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('URL copied to clipboard!');
    } catch {
      alert('Failed to copy URL');
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[var(--text)]">Assets</h1>
        <div className="flex gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="hidden"
            id="image-upload"
          />
          <label
            htmlFor="image-upload"
            className={`inline-flex items-center gap-2 px-4 py-2 bg-[var(--blue)] text-white text-sm font-medium rounded-lg hover:bg-[var(--blue)]/90 transition-colors cursor-pointer ${
              isUploading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <ImageIcon />
            Upload Images
          </label>
          <input
            ref={resumeInputRef}
            type="file"
            accept="application/pdf"
            onChange={handleResumeUpload}
            className="hidden"
            id="resume-upload"
          />
          <label
            htmlFor="resume-upload"
            className={`inline-flex items-center gap-2 px-4 py-2 bg-[var(--surface)] text-[var(--text)] text-sm font-medium rounded-lg hover:bg-[var(--surface)]/80 transition-colors border border-[var(--surface)] cursor-pointer ${
              isUploading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <DocumentIcon />
            Upload Resume
          </label>
        </div>
      </div>

      {/* Upload Progress */}
      {uploadProgress && (
        <div className="mb-6 p-4 bg-[var(--surface)] rounded-lg border border-[var(--blue)]/50">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-[var(--blue)] border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-[var(--text)]">{uploadProgress}</span>
          </div>
        </div>
      )}

      {/* Bucket Filter */}
      <div className="flex gap-2 mb-6">
        {(['all', 'public-images', 'resume'] as BucketFilter[]).map((bucket) => (
          <button
            key={bucket}
            onClick={() => setBucketFilter(bucket)}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              bucketFilter === bucket
                ? 'bg-[var(--blue)] text-white'
                : 'bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            {bucket === 'all' ? 'All' : bucket === 'public-images' ? 'Images' : 'Resume'}
          </button>
        ))}
      </div>


      <div className="flex gap-6">
        {/* Assets Grid */}
        <div className="flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-[var(--blue)] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : assets.length === 0 ? (
            <div className="text-center py-12 bg-[var(--surface)] rounded-lg border border-[var(--surface)]">
              <p className="text-[var(--muted)] mb-4">No assets found</p>
              <p className="text-sm text-[var(--muted)]">
                Upload images or a resume to get started
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {assets.map((asset) => (
                <AssetCard
                  key={asset.id}
                  asset={asset}
                  isSelected={selectedAsset?.id === asset.id}
                  onSelect={() => setSelectedAsset(asset)}
                  onDelete={() => handleDelete(asset)}
                  onCopyUrl={() => copyToClipboard(asset.original_url)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Asset Details Panel */}
        {selectedAsset && (
          <AssetDetailsPanel
            asset={selectedAsset}
            onClose={() => setSelectedAsset(null)}
            onUpdateAltText={(altText) => handleUpdateAltText(selectedAsset, altText)}
            onCopyUrl={() => copyToClipboard(selectedAsset.original_url)}
            onDelete={() => handleDelete(selectedAsset)}
          />
        )}
      </div>
    </div>
  );
}

function AssetCard({
  asset,
  isSelected,
  onSelect,
  onDelete,
  onCopyUrl,
}: {
  asset: Asset;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onCopyUrl: () => void;
}) {
  const isImage = asset.mime_type.startsWith('image/');
  const isPdf = asset.mime_type === 'application/pdf';

  return (
    <div
      onClick={onSelect}
      className={`group relative bg-[var(--surface)] rounded-lg border overflow-hidden cursor-pointer transition-all ${
        isSelected
          ? 'border-[var(--blue)] ring-2 ring-[var(--blue)]/20'
          : 'border-[var(--surface)] hover:border-[var(--blue)]/50'
      }`}
    >
      {/* Preview */}
      <div className="aspect-square bg-[var(--bg)] flex items-center justify-center overflow-hidden">
        {isImage ? (
          <img
            src={asset.original_url}
            alt={asset.alt_text || asset.filename}
            className="w-full h-full object-cover"
          />
        ) : isPdf ? (
          <div className="flex flex-col items-center gap-2 text-[var(--muted)]">
            <DocumentIcon className="w-12 h-12" />
            <span className="text-xs">PDF</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-[var(--muted)]">
            <FileIcon className="w-12 h-12" />
            <span className="text-xs">{asset.mime_type}</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-sm text-[var(--text)] truncate" title={asset.filename}>
          {asset.filename}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-[var(--muted)]">
            {formatFileSize(asset.size_bytes)}
          </span>
          {asset.width && asset.height && (
            <span className="text-xs text-[var(--muted)]">
              {asset.width}×{asset.height}
            </span>
          )}
        </div>
      </div>

      {/* Quick Actions (visible on hover) */}
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onCopyUrl();
          }}
          className="p-1.5 bg-[var(--bg)]/90 rounded text-[var(--muted)] hover:text-[var(--text)] transition-colors"
          title="Copy URL"
        >
          <CopyIcon className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1.5 bg-[var(--bg)]/90 rounded text-[var(--muted)] hover:text-red-400 transition-colors"
          title="Delete"
        >
          <TrashIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Bucket Badge */}
      <div className="absolute top-2 left-2">
        <span
          className={`px-2 py-0.5 text-xs font-medium rounded ${
            asset.bucket === 'resume'
              ? 'bg-[var(--violet)]/20 text-[var(--violet)]'
              : 'bg-[var(--blue)]/20 text-[var(--blue)]'
          }`}
        >
          {asset.bucket === 'resume' ? 'Resume' : 'Image'}
        </span>
      </div>
    </div>
  );
}


function AssetDetailsPanel({
  asset,
  onClose,
  onUpdateAltText,
  onCopyUrl,
  onDelete,
}: {
  asset: Asset;
  onClose: () => void;
  onUpdateAltText: (altText: string) => void;
  onCopyUrl: () => void;
  onDelete: () => void;
}) {
  const [altText, setAltText] = useState(asset.alt_text || '');
  const [isSaving, setIsSaving] = useState(false);
  const isImage = asset.mime_type.startsWith('image/');

  const handleSaveAltText = async () => {
    setIsSaving(true);
    await onUpdateAltText(altText);
    setIsSaving(false);
  };

  return (
    <div className="w-80 bg-[var(--surface)] rounded-lg border border-[var(--surface)] p-4 sticky top-24 h-fit">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[var(--text)]">Asset Details</h3>
        <button
          onClick={onClose}
          className="p-1 text-[var(--muted)] hover:text-[var(--text)] transition-colors"
        >
          <CloseIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Preview */}
      <div className="aspect-video bg-[var(--bg)] rounded-lg mb-4 flex items-center justify-center overflow-hidden">
        {isImage ? (
          <img
            src={asset.original_url}
            alt={asset.alt_text || asset.filename}
            className="w-full h-full object-contain"
          />
        ) : (
          <DocumentIcon className="w-16 h-16 text-[var(--muted)]" />
        )}
      </div>

      {/* Metadata */}
      <div className="space-y-3 mb-4">
        <div>
          <label className="text-xs text-[var(--muted)] block mb-1">Filename</label>
          <p className="text-sm text-[var(--text)] break-all">{asset.filename}</p>
        </div>
        <div>
          <label className="text-xs text-[var(--muted)] block mb-1">Type</label>
          <p className="text-sm text-[var(--text)]">{asset.mime_type}</p>
        </div>
        <div>
          <label className="text-xs text-[var(--muted)] block mb-1">Size</label>
          <p className="text-sm text-[var(--text)]">{formatFileSize(asset.size_bytes)}</p>
        </div>
        {asset.width && asset.height && (
          <div>
            <label className="text-xs text-[var(--muted)] block mb-1">Dimensions</label>
            <p className="text-sm text-[var(--text)]">
              {asset.width} × {asset.height} px
            </p>
          </div>
        )}
        <div>
          <label className="text-xs text-[var(--muted)] block mb-1">Uploaded</label>
          <p className="text-sm text-[var(--text)]">
            {new Date(asset.created_at).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Alt Text (for images) */}
      {isImage && (
        <div className="mb-4">
          <label className="text-xs text-[var(--muted)] block mb-1">Alt Text</label>
          <textarea
            value={altText}
            onChange={(e) => setAltText(e.target.value)}
            placeholder="Describe this image for accessibility..."
            className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--surface)] rounded-lg text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--blue)] resize-none"
            rows={3}
          />
          <button
            onClick={handleSaveAltText}
            disabled={isSaving || altText === (asset.alt_text || '')}
            className="mt-2 w-full px-3 py-1.5 bg-[var(--blue)] text-white text-sm font-medium rounded-lg hover:bg-[var(--blue)]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save Alt Text'}
          </button>
        </div>
      )}

      {/* URL */}
      <div className="mb-4">
        <label className="text-xs text-[var(--muted)] block mb-1">URL</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={asset.original_url}
            readOnly
            className="flex-1 px-3 py-2 bg-[var(--bg)] border border-[var(--surface)] rounded-lg text-xs text-[var(--muted)] font-mono truncate"
          />
          <button
            onClick={onCopyUrl}
            className="px-3 py-2 bg-[var(--bg)] border border-[var(--surface)] rounded-lg text-[var(--muted)] hover:text-[var(--text)] transition-colors"
            title="Copy URL"
          >
            <CopyIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <a
          href={asset.original_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 px-3 py-2 bg-[var(--bg)] text-[var(--text)] text-sm font-medium rounded-lg hover:bg-[var(--bg)]/80 transition-colors text-center border border-[var(--surface)]"
        >
          Open
        </a>
        <button
          onClick={onDelete}
          className="px-3 py-2 bg-red-500/10 text-red-400 text-sm font-medium rounded-lg hover:bg-red-500/20 transition-colors border border-red-500/20"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

// Helper functions
function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => {
      resolve({ width: 0, height: 0 });
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(file);
  });
}

function formatFileSize(bytes: number | null): string {
  if (bytes === null) return 'Unknown';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Icons
function ImageIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
  );
}

function DocumentIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  );
}

function FileIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  );
}

function CopyIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
    </svg>
  );
}

function TrashIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
  );
}

function CloseIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
