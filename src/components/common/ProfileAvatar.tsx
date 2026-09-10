import { resolve_media_url } from '../../utils/media'
import type { CSSProperties } from 'react'

interface ProfileAvatarProps {
  src?: string | null
  name?: string | null
  className?: string
  style?: CSSProperties
}

export default function ProfileAvatar({ src, name, className = 'avatar', style }: ProfileAvatarProps) {
  const imageUrl = resolve_media_url(src)
  const label = (name || '사용자').slice(0, 2)

  return (
    <div className={className} style={style}>
      {imageUrl ? <img src={imageUrl} alt="" /> : label}
    </div>
  )
}
