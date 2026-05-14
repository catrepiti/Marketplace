import { ImageResponse } from 'next/og'

export const size        = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '7px',
          background: 'linear-gradient(135deg, #0080ff 0%, #60a5fa 100%)',
          boxShadow: '0 0 12px rgba(0,128,255,0.5)',
        }}
      >
        <span
          style={{
            color: 'white',
            fontSize: '20px',
            fontWeight: '900',
            letterSpacing: '-1.5px',
            fontFamily: 'sans-serif',
            marginTop: '1px',
          }}
        >
          M
        </span>
      </div>
    ),
    { ...size },
  )
}
