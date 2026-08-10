/**
 * Client-side image compressor utility
 * Downscales images to max dimensions and compresses to JPEG
 * keeping base64 strings under 40-80KB to fit easily in Firestore docs.
 */
export async function compressFileForChat(file: File): Promise<{ name: string; url: string }> {
  return new Promise((resolve) => {
    // Non-image files or SVG
    if (!file.type.startsWith('image/') || file.type.includes('svg')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string || '';
        // If data URL is unreasonably huge (>250KB), resolve with truncated info notice
        if (result.length > 300000) {
          resolve({
            name: file.name,
            url: `data:text/plain;base64,${btoa(`Attached document: ${file.name} (${Math.round(file.size / 1024)} KB)`)}`
          });
        } else {
          resolve({ name: file.name, url: result });
        }
      };
      reader.onerror = () => resolve({ name: file.name, url: '' });
      reader.readAsDataURL(file);
      return;
    }

    // Image compression via HTML5 Canvas
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({ name: file.name, url: e.target?.result as string || '' });
          return;
        }

        // Draw image onto canvas
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Compress to JPEG with 0.65 quality (~30-60KB size)
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.65);
        resolve({ name: file.name, url: compressedDataUrl });
      };

      img.onerror = () => {
        resolve({ name: file.name, url: e.target?.result as string || '' });
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => resolve({ name: file.name, url: '' });
    reader.readAsDataURL(file);
  });
}
