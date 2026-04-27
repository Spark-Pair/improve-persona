import React, { useEffect, useMemo } from 'react'
import { Modal } from './UI'

export function PhotoViewer({ isOpen, onClose, blob, title = 'Photo' }) {
  const objectUrl = useMemo(() => {
    if (!blob) return null
    return URL.createObjectURL(blob)
  }, [blob])

  useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [objectUrl])

  if (!blob) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="rounded-2xl overflow-auto border border-white/10 bg-black/20">
        <img
          src={objectUrl}
          alt={title}
          className="w-full h-auto block select-none"
          style={{ touchAction: 'pinch-zoom' }}
        />
      </div>
    </Modal>
  )
}
