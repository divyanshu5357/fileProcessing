import { ImageResponse } from 'next/og';

export const alt =
  'Gyanvatsala — Free PDF Editor, Image to PDF & Image Size Reducer Online';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px',
          background: 'linear-gradient(135deg, #0D1017 0%, #152238 55%, #0F292E 100%)',
          color: '#F8FAFC',
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '14px',
              background: '#0F766E',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '30px',
              fontWeight: 900,
              color: '#FFFFFF',
            }}
          >
            G
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.02em' }}>
              Gyanvatsala
            </span>
            <span style={{ fontSize: '16px', color: '#5EEAD4', fontWeight: 600 }}>
              www.gyanvatsala.in • Zero-Upload Client Processing
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', maxWidth: '1020px' }}>
          <div
            style={{
              fontSize: '56px',
              fontWeight: 900,
              lineHeight: 1.12,
              letterSpacing: '-0.03em',
              color: '#FFFFFF',
            }}
          >
            PDF Editor, Image to PDF &amp; Image Size Reducer
          </div>
          <div style={{ fontSize: '24px', lineHeight: 1.4, color: '#CBD5E1' }}>
            Edit PDF text, merge, split &amp; compress PDFs, convert JPG/PNG to PDF, and shrink images to 20KB–200KB privately in your browser.
          </div>
        </div>

        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
          {['Online PDF Editor', 'IMG to PDF', 'Image Size Reducer (KB)', 'PDF to Word', 'Scan Studio'].map(
            (badge) => (
              <div
                key={badge}
                style={{
                  padding: '10px 20px',
                  borderRadius: '999px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  fontSize: '18px',
                  fontWeight: 700,
                  color: '#E2E8F0',
                }}
              >
                {badge}
              </div>
            )
          )}
        </div>
      </div>
    ),
    { ...size }
  );
}
