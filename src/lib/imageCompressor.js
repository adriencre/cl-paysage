/**
 * Resizes and compresses an image on the client side (especially for mobile photos
 * which can be 5MB - 15MB each) with full mobile Safari/Android safety (no black background).
 */
export async function compressImage(file, maxWidth = 1920, maxHeight = 1920, quality = 0.85) {
  if (!file || !file.type.startsWith('image/')) {
    return { file, dataUrl: null }
  }

  // If already lightweight (< 800 Ko), return as-is to avoid unnecessary canvas manipulation
  if (file.size < 800 * 1024) {
    const objectUrl = URL.createObjectURL(file)
    return { file, dataUrl: objectUrl }
  }

  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file)
    const img = new Image()
    img.src = objectUrl

    img.onload = () => {
      try {
        let width = img.naturalWidth || img.width
        let height = img.naturalHeight || img.height

        if (!width || !height) {
          return resolve({ file, dataUrl: objectUrl })
        }

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

        if (!ctx) {
          return resolve({ file, dataUrl: objectUrl })
        }

        // Fill background with white to avoid pitch black output when exporting to JPEG on iOS
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, width, height)
        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(objectUrl)
            if (!blob) {
              return resolve({ file, dataUrl: null })
            }
            const cleanName = (file.name || 'photo').replace(/\.[^/.]+$/, '') + '.jpg'
            const compressedFile = new File([blob], cleanName, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            })
            const previewUrl = URL.createObjectURL(blob)
            resolve({ file: compressedFile, dataUrl: previewUrl })
          },
          'image/jpeg',
          quality
        )
      } catch (err) {
        console.warn('[ImageCompressor] Canvas compression fallback:', err)
        URL.revokeObjectURL(objectUrl)
        resolve({ file, dataUrl: null })
      }
    }

    img.onerror = () => {
      console.warn('[ImageCompressor] Image load error on mobile')
      URL.revokeObjectURL(objectUrl)
      resolve({ file, dataUrl: null })
    }
  })
}
