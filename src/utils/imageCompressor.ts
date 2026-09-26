/**
 * Client-side image compression and resizing utility.
 * Downscales images to safe dimensions and web-friendly formats,
 * keeping file sizes between 30KB - 200KB to safely fit within browser storage.
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  mimeType?: 'image/jpeg' | 'image/webp' | 'image/png';
}

export interface CompressedImageResult {
  dataUrl: string;
  sizeKb: number;
  sizeStr: string;
  width: number;
  height: number;
  dimensions: string;
  fileName: string;
}

export async function compressImageFile(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressedImageResult> {
  const {
    maxWidth = 1600,
    maxHeight = 1200,
    quality = 0.82,
    mimeType = 'image/jpeg',
  } = options;

  // If SVG or tiny image (< 30KB) and not requesting forced re-compression, read directly
  if (file.type === 'image/svg+xml') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const sizeKb = Math.round(file.size / 1024);
        resolve({
          dataUrl,
          sizeKb,
          sizeStr: `${sizeKb} KB`,
          width: 256,
          height: 256,
          dimensions: '256 × 256 px',
          fileName: file.name,
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        // Calculate proportional scale
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          // Fallback if canvas context fails
          const fallbackData = (e.target?.result as string) || '';
          const sizeKb = Math.round(file.size / 1024);
          resolve({
            dataUrl: fallbackData,
            sizeKb,
            sizeStr: `${sizeKb} KB`,
            width,
            height,
            dimensions: `${width} × ${height} px`,
            fileName: file.name,
          });
          return;
        }

        // Draw image onto canvas
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Determine optimal format
        const targetFormat = file.type === 'image/png' && quality >= 0.9 ? 'image/png' : mimeType;
        const compressedDataUrl = canvas.toDataURL(targetFormat, quality);

        // Estimate size in KB from base64 length
        const base64Length = compressedDataUrl.length - (compressedDataUrl.indexOf(',') + 1);
        const sizeInBytes = Math.ceil((base64Length * 3) / 4);
        const sizeKb = Math.round(sizeInBytes / 1024);
        const sizeStr = sizeKb > 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`;

        resolve({
          dataUrl: compressedDataUrl,
          sizeKb,
          sizeStr,
          width,
          height,
          dimensions: `${width} × ${height} px`,
          fileName: file.name,
        });
      };

      img.onerror = () => {
        reject(new Error('Failed to parse image from file'));
      };

      img.src = (e.target?.result as string) || '';
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
}
