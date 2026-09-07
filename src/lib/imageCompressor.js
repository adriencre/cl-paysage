/**
 * Resizes and compresses an image on the client side (especially for mobile photos
 * which can be 5MB - 15MB each) to ensure fast uploads, compliance with Netlify's 6MB
 * limit, and avoiding localStorage 5MB quota errors.
 */
export async function compressImage(file, maxWidth = 1600, maxHeight = 1600, quality = 0.82) {
  // If not an image, return as-is
  if (!file.type.startsWith('image/')) {
    return { file, dataUrl: null }
  }

  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)

    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target.result

      img.onload = () => {
        let width = img.width
        let height = img.height

        // Calculate new dimensions keeping aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width)
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height)
            height = maxHeight
          }
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)

        // Convert to lightweight JPEG data URL
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality)

        // Also create a compressed Blob/File for server upload
        canvas.toBlob(
          (blob) => {
            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '') + '.jpg', {
              type: 'image/jpeg',
              lastModified: Date.now(),
            })
            resolve({ file: compressedFile, dataUrl: compressedDataUrl })
          },
          'image/jpeg',
          quality
        )
      }

      img.onerror = () => {
        // In case of error (corrupt file), fallback to original file
        resolve({ file, dataUrl: event.target.result })
      }
    }

    reader.onerror = () => {
      resolve({ file, dataUrl: null })
    }
  })
}
