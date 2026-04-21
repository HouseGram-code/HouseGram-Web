import { ImageResponse } from 'next/og';

// Image metadata
export const size = {
  width: 512,
  height: 512,
};

export const contentType = 'image/png';

// Image generation
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 128,
          background: 'linear-gradient(135deg, #42a5f5 0%, #1976d2 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          borderRadius: '64px',
        }}
      >
        <svg
          width="380"
          height="380"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* House shape */}
          <path
            d="M50 25 L70 40 L70 70 L30 70 L30 40 Z"
            fill="white"
          />
          {/* Door */}
          <rect
            x="42"
            y="52"
            width="16"
            height="18"
            fill="#1976d2"
          />
          {/* Window/Chimney */}
          <circle
            cx="50"
            cy="35"
            r="3"
            fill="white"
          />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}
