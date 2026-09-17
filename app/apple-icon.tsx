import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#CA0538',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            color: '#FFFFFF',
            fontSize: 68,
            fontWeight: 900,
            letterSpacing: -4,
            transform: 'skewX(-8deg)',
            fontFamily: 'system-ui, -apple-system, "Helvetica Neue", Arial',
          }}
        >
          <span style={{ display: 'flex' }}>RELAY</span>
          <div
            style={{
              width: 18,
              height: 18,
              borderRadius: '50%',
              border: '4px solid #FFFFFF',
              marginBottom: 4,
              display: 'flex',
            }}
          />
        </div>
      </div>
    ),
    size
  );
}
