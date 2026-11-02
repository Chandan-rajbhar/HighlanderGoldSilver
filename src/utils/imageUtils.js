/**
 * Compresses and resizes an image file to a lightweight JPEG Base64 data URL
 * Ensures profiles load instantly with ~20KB-40KB storage footprint.
 * 
 * @param {File} file - Image file from user's file input
 * @param {number} maxWidth - Maximum width in pixels (default 320)
 * @param {number} maxHeight - Maximum height in pixels (default 320)
 * @param {number} quality - JPEG quality 0.0 - 1.0 (default 0.88)
 * @returns {Promise<string>} - Clean Base64 Data URL
 */
export const compressImageFile = (file, maxWidth = 320, maxHeight = 320, quality = 0.88) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      return reject(new Error('No file provided'));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to decode image'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Maintain aspect ratio while bounding within maxWidth/maxHeight
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(event.target.result);
        }

        // Fill background white to handle any transparency cleanly
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.src = event.target.result;
    };

    reader.readAsDataURL(file);
  });
};

