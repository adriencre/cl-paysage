import { useEffect, useCallback } from 'react'
import './Lightbox.css'

export default function Lightbox({ images, index, onClose, onNavigate }) {
  const handleKey = useCallback((e) => {
    if (e.key === 'Escape') onClose()
    if (e.key === 'ArrowRight') onNavigate(Math.min(index + 1, images.length - 1))
    if (e.key === 'ArrowLeft') onNavigate(Math.max(index - 1, 0))
  }, [index, images.length, onClose, onNavigate])

  useEffect(() => {
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [handleKey])

  return (
    <div className="lightbox-overlay" onClick={onClose} id="lightbox">
      <button className="lightbox-close" onClick={onClose} aria-label="Fermer">
        ✕
      </button>

      {index > 0 && (
        <button
          className="lightbox-nav lightbox-prev"
          onClick={(e) => { e.stopPropagation(); onNavigate(index - 1) }}
          aria-label="Précédent"
        >
          ‹
        </button>
      )}

      <img
        src={images[index].src}
        alt={images[index].alt || ''}
        className="lightbox-img"
        onClick={(e) => e.stopPropagation()}
      />

      {index < images.length - 1 && (
        <button
          className="lightbox-nav lightbox-next"
          onClick={(e) => { e.stopPropagation(); onNavigate(index + 1) }}
          aria-label="Suivant"
        >
          ›
        </button>
      )}

      <div className="lightbox-counter">
        {index + 1} / {images.length}
      </div>
    </div>
  )
}
