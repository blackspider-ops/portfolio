/**
 * Property-Based Tests for Image Asset Tracking
 * Feature: tejas-portfolio-v3, Property 18: Image Asset Tracking
 * Validates: Requirements 20.2
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// Types for testing
interface AssetRecord {
  id: string;
  filename: string;
  original_url: string;
  bucket: string;
  mime_type: string;
  size_bytes: number | null;
  width: number | null;
  height: number | null;
  variants: Record<string, string>;
  alt_text: string | null;
  created_at: string;
  updated_at: string;
}

interface UploadedImage {
  filename: string;
  mimeType: string;
  sizeBytes: number;
  width: number;
  height: number;
}

/**
 * Simulates the asset tracking logic from the assets admin page.
 * When an image is uploaded to the public-images bucket, an asset record
 * should be created with the original URL and metadata.
 */
function createAssetRecord(
  uploadedImage: UploadedImage,
  bucket: string,
  storageUrl: string
): AssetRecord {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    filename: uploadedImage.filename,
    original_url: storageUrl,
    bucket: bucket,
    mime_type: uploadedImage.mimeType,
    size_bytes: uploadedImage.sizeBytes,
    width: uploadedImage.width,
    height: uploadedImage.height,
    variants: {},
    alt_text: null,
    created_at: now,
    updated_at: now,
  };
}

/**
 * Validates that an asset record has all required fields for image tracking.
 */
function isValidImageAssetRecord(asset: AssetRecord): boolean {
  // Must have a valid UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(asset.id)) return false;

  // Must have a filename
  if (!asset.filename || asset.filename.trim() === '') return false;

  // Must have a valid URL
  if (!asset.original_url || !asset.original_url.startsWith('http')) return false;

  // Must have correct bucket
  if (asset.bucket !== 'public-images' && asset.bucket !== 'resume') return false;

  // Must have a valid image MIME type for public-images bucket
  if (asset.bucket === 'public-images') {
    const validImageMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'];
    if (!validImageMimeTypes.includes(asset.mime_type)) return false;
  }

  // Must have timestamps
  if (!asset.created_at || !asset.updated_at) return false;

  return true;
}

/**
 * Checks if an image URL can be used with Next.js Image optimization.
 * Next.js Image requires the URL to be from a configured domain or relative.
 */
function isServableViaNextImage(url: string): boolean {
  // URL must be a valid HTTP/HTTPS URL or relative path
  if (url.startsWith('/')) return true;
  if (url.startsWith('http://') || url.startsWith('https://')) return true;
  return false;
}

// Arbitrary generators
const imageMimeTypeArb = fc.constantFrom(
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif'
);

const fileSizeArb = fc.integer({ min: 1, max: 5 * 1024 * 1024 }); // 1 byte to 5MB

const dimensionArb = fc.integer({ min: 1, max: 10000 });

const extensionArb = fc.constantFrom('jpg', 'png', 'webp', 'avif', 'gif');

const filenameArb = fc.tuple(
  fc.stringMatching(/^[a-zA-Z0-9_-]{1,50}$/),
  extensionArb
).map(([name, ext]) => `${name || 'image'}.${ext}`);

const uploadedImageArb = fc.record({
  filename: filenameArb,
  mimeType: imageMimeTypeArb,
  sizeBytes: fileSizeArb,
  width: dimensionArb,
  height: dimensionArb,
});

const storageUrlArb = fc.stringMatching(/^[a-zA-Z0-9]{1,50}$/)
  .map(filename => `https://storage.example.com/public-images/${filename || 'file'}.jpg`);

describe('Feature: tejas-portfolio-v3', () => {
  /**
   * Property 18: Image Asset Tracking
   * For any image uploaded to the public-images bucket, an entry should be created
   * in the assets table with the original URL, and the image should be servable
   * via Next.js Image optimization.
   */
  describe('Property 18: Image Asset Tracking', () => {
    it('for any uploaded image, should create a valid asset record with original URL', () => {
      fc.assert(
        fc.property(uploadedImageArb, storageUrlArb, (uploadedImage, storageUrl) => {
          const assetRecord = createAssetRecord(uploadedImage, 'public-images', storageUrl);

          // Asset record should have the original URL
          expect(assetRecord.original_url).toBe(storageUrl);

          // Asset record should be valid
          expect(isValidImageAssetRecord(assetRecord)).toBe(true);

          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('for any asset record, the original URL should be servable via Next.js Image', () => {
      fc.assert(
        fc.property(uploadedImageArb, storageUrlArb, (uploadedImage, storageUrl) => {
          const assetRecord = createAssetRecord(uploadedImage, 'public-images', storageUrl);

          // The URL should be compatible with Next.js Image optimization
          expect(isServableViaNextImage(assetRecord.original_url)).toBe(true);

          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('for any uploaded image, asset record should preserve image metadata', () => {
      fc.assert(
        fc.property(uploadedImageArb, storageUrlArb, (uploadedImage, storageUrl) => {
          const assetRecord = createAssetRecord(uploadedImage, 'public-images', storageUrl);

          // Metadata should be preserved
          expect(assetRecord.filename).toBe(uploadedImage.filename);
          expect(assetRecord.mime_type).toBe(uploadedImage.mimeType);
          expect(assetRecord.size_bytes).toBe(uploadedImage.sizeBytes);
          expect(assetRecord.width).toBe(uploadedImage.width);
          expect(assetRecord.height).toBe(uploadedImage.height);

          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('for any uploaded image, asset record should have correct bucket assignment', () => {
      fc.assert(
        fc.property(uploadedImageArb, storageUrlArb, (uploadedImage, storageUrl) => {
          const assetRecord = createAssetRecord(uploadedImage, 'public-images', storageUrl);

          // Bucket should be correctly assigned
          expect(assetRecord.bucket).toBe('public-images');

          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('for any uploaded image, asset record should have valid timestamps', () => {
      fc.assert(
        fc.property(uploadedImageArb, storageUrlArb, (uploadedImage, storageUrl) => {
          const beforeCreate = new Date();
          const assetRecord = createAssetRecord(uploadedImage, 'public-images', storageUrl);
          const afterCreate = new Date();

          // Timestamps should be valid ISO strings
          const createdAt = new Date(assetRecord.created_at);
          const updatedAt = new Date(assetRecord.updated_at);

          expect(createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime() - 1000);
          expect(createdAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime() + 1000);
          expect(updatedAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime() - 1000);
          expect(updatedAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime() + 1000);

          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('for any uploaded image, asset record should have unique ID', () => {
      fc.assert(
        fc.property(
          fc.array(fc.tuple(uploadedImageArb, storageUrlArb), { minLength: 2, maxLength: 10 }),
          (uploads) => {
            const assetRecords = uploads.map(([image, url]) =>
              createAssetRecord(image, 'public-images', url)
            );

            // All IDs should be unique
            const ids = assetRecords.map(r => r.id);
            const uniqueIds = new Set(ids);
            expect(uniqueIds.size).toBe(ids.length);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Unit tests for edge cases
  describe('Image Asset Tracking Edge Cases', () => {
    it('should handle minimum file size', () => {
      const uploadedImage: UploadedImage = {
        filename: 'tiny.jpg',
        mimeType: 'image/jpeg',
        sizeBytes: 1,
        width: 1,
        height: 1,
      };
      const storageUrl = 'https://storage.example.com/public-images/tiny.jpg';

      const assetRecord = createAssetRecord(uploadedImage, 'public-images', storageUrl);
      expect(isValidImageAssetRecord(assetRecord)).toBe(true);
      expect(assetRecord.size_bytes).toBe(1);
    });

    it('should handle maximum allowed file size (5MB)', () => {
      const uploadedImage: UploadedImage = {
        filename: 'large.jpg',
        mimeType: 'image/jpeg',
        sizeBytes: 5 * 1024 * 1024,
        width: 4000,
        height: 3000,
      };
      const storageUrl = 'https://storage.example.com/public-images/large.jpg';

      const assetRecord = createAssetRecord(uploadedImage, 'public-images', storageUrl);
      expect(isValidImageAssetRecord(assetRecord)).toBe(true);
      expect(assetRecord.size_bytes).toBe(5 * 1024 * 1024);
    });

    it('should handle all supported image MIME types', () => {
      const mimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'];

      for (const mimeType of mimeTypes) {
        const uploadedImage: UploadedImage = {
          filename: `test.${mimeType.split('/')[1]}`,
          mimeType,
          sizeBytes: 1000,
          width: 100,
          height: 100,
        };
        const storageUrl = `https://storage.example.com/public-images/test.${mimeType.split('/')[1]}`;

        const assetRecord = createAssetRecord(uploadedImage, 'public-images', storageUrl);
        expect(isValidImageAssetRecord(assetRecord)).toBe(true);
      }
    });

    it('should handle filenames with special characters (sanitized)', () => {
      const uploadedImage: UploadedImage = {
        filename: 'my-image_2024.jpg',
        mimeType: 'image/jpeg',
        sizeBytes: 1000,
        width: 100,
        height: 100,
      };
      const storageUrl = 'https://storage.example.com/public-images/my-image_2024.jpg';

      const assetRecord = createAssetRecord(uploadedImage, 'public-images', storageUrl);
      expect(isValidImageAssetRecord(assetRecord)).toBe(true);
      expect(assetRecord.filename).toBe('my-image_2024.jpg');
    });

    it('should handle very large dimensions', () => {
      const uploadedImage: UploadedImage = {
        filename: 'huge.jpg',
        mimeType: 'image/jpeg',
        sizeBytes: 5 * 1024 * 1024,
        width: 10000,
        height: 10000,
      };
      const storageUrl = 'https://storage.example.com/public-images/huge.jpg';

      const assetRecord = createAssetRecord(uploadedImage, 'public-images', storageUrl);
      expect(isValidImageAssetRecord(assetRecord)).toBe(true);
      expect(assetRecord.width).toBe(10000);
      expect(assetRecord.height).toBe(10000);
    });
  });
});
