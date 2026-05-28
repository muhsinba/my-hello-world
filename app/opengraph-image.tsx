import { ImageResponse } from 'next/og'

export const alt = 'MS Partners Services — Beautify your life'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#1e3a8a',
          display: 'flex',
          alignItems: 'center',
          padding: 80,
          color: 'white',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            width: 280,
            height: 280,
            background: '#0f172a',
            borderRadius: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <div style={{ fontSize: 180, fontWeight: 900, letterSpacing: -8, lineHeight: 1 }}>
            MS
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            marginLeft: 60,
          }}
        >
          <div
            style={{
              fontSize: 80,
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: -2,
            }}
          >
            MS Partners Services
          </div>
          <div style={{ fontSize: 36, opacity: 0.75, marginTop: 24 }}>
            Beautify your life
          </div>
        </div>
      </div>
    ),
    { ...size },
  )
}
