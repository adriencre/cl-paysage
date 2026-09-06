import { useState, useRef, useCallback, useEffect } from 'react'
import './BeforeAfter.css'

export default function BeforeAfter({ before, after, alt = 'Avant / Après' }) {
  const [position, setPosition] = useState(50)
  const containerRef = useRef(null)
  const isDragging = useRef(false)
  const imgRef = useRef(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  const handleMove = useCallback((clientX) => {
    const rect = containerRef.current.getBoundingClientRect()
    const x = clientX - rect.left
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100))
    setPosition(pct)
  }, [])

  const onMouseDown = (e) => {
    e.preventDefault()
    isDragging.current = true
    handleMove(e.clientX)
  }

  const onTouchStart = (e) => {
    isDragging.current = true
    handleMove(e.touches[0].clientX)
  }

  useEffect(() => {
    const onMouseMove = (e) => {
      if (isDragging.current) handleMove(e.clientX)
    }
    const onTouchMove = (e) => {
      if (isDragging.current) handleMove(e.touches[0].clientX)
    }
    const onEnd = () => { isDragging.current = false }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onEnd)
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('touchend', onEnd)

    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onEnd)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onEnd)
    }
  }, [handleMove])

  const handleImgLoad = () => {
    if (imgRef.current) {
      setDimensions({
        width: imgRef.current.naturalWidth,
        height: imgRef.current.naturalHeight,
      })
    }
  }

  const aspectRatio = dimensions.height > 0 ? dimensions.width / dimensions.height : 16 / 9

  return (
    <div
      ref={containerRef}
      className="before-after"
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      style={{ aspectRatio }}
      id="before-after-slider"
    >
      {/* After image (background) */}
      <img
        ref={imgRef}
        src={after}
        alt={`${alt} — Après`}
        className="before-after-img"
        onLoad={handleImgLoad}
      />

      {/* Before image (clipped) */}
      <div
        className="before-after-before"
        style={{ width: `${position}%` }}
      >
        <img
          src={before}
          alt={`${alt} — Avant`}
          className="before-after-img"
          style={{ width: containerRef.current ? containerRef.current.offsetWidth + 'px' : '100%' }}
        />
      </div>

      {/* Slider line */}
      <div className="before-after-slider" style={{ left: `${position}%` }}>
        <div className="before-after-handle">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="8,4 4,12 8,20" />
            <polyline points="16,4 20,12 16,20" />
          </svg>
        </div>
      </div>

      {/* Labels */}
      <span className="before-after-label before-after-label-before">Avant</span>
      <span className="before-after-label before-after-label-after">Après</span>
    </div>
  )
}
