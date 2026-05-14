import { ImageResponse } from 'next/og'

export const size        = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '40px',
          background: 'linear-gradient(135deg, #0080ff 0%, #60a5fa 100%)',
        }}
      >
        <span
          style={{
            color: 'white',
            fontSize: '110px',
            fontWeight: '900',
            letterSpacing: '-8px',
            fontFamily: 'sans-serif',
          }}
        >
          M
        </span>
      </div>
    ),
    { ...size },
  )
}
