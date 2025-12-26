import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://portfolio.dev';
const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || 'Portfolio';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Get parameters from URL
    const title = searchParams.get('title') || SITE_NAME;
    const description = searchParams.get('description') || '';
    const type = searchParams.get('type') || 'default'; // 'blog', 'project', 'default'
    const tags = searchParams.get('tags')?.split(',').filter(Boolean) || [];
    const authorName = searchParams.get('author') || '';
    const authorInitials = authorName ? authorName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '';

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#0A0D11',
            padding: '60px',
            position: 'relative',
          }}
        >
          {/* Blueprint grid background */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: `
                linear-gradient(rgba(91, 156, 255, 0.03) 1px, transparent 1px),
                linear-gradient(90deg, rgba(91, 156, 255, 0.03) 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px',
            }}
          />

          {/* Content container */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: '100%',
              position: 'relative',
              zIndex: 1,
            }}
          >
            {/* Top section with type badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {type === 'blog' && (
                <div
                  style={{
                    backgroundColor: 'rgba(91, 156, 255, 0.15)',
                    color: '#5B9CFF',
                    padding: '8px 20px',
                    borderRadius: '20px',
                    fontSize: '24px',
                    fontWeight: 600,
                  }}
                >
                  Blog Post
                </div>
              )}
              {type === 'project' && (
                <div
                  style={{
                    backgroundColor: 'rgba(167, 139, 250, 0.15)',
                    color: '#A78BFA',
                    padding: '8px 20px',
                    borderRadius: '20px',
                    fontSize: '24px',
                    fontWeight: 600,
                  }}
                >
                  Project
                </div>
              )}
            </div>

            {/* Main content */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Title */}
              <div
                style={{
                  fontSize: title.length > 50 ? '52px' : '64px',
                  fontWeight: 700,
                  color: '#E8EDF2',
                  lineHeight: 1.1,
                  letterSpacing: '-0.02em',
                  maxWidth: '1000px',
                }}
              >
                {title}
              </div>

              {/* Description */}
              {description && (
                <div
                  style={{
                    fontSize: '28px',
                    color: '#A1ACB7',
                    lineHeight: 1.4,
                    maxWidth: '900px',
                  }}
                >
                  {description.length > 150
                    ? description.slice(0, 150) + '...'
                    : description}
                </div>
              )}

              {/* Tags */}
              {tags.length > 0 && (
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  {tags.slice(0, 4).map((tag) => (
                    <div
                      key={tag}
                      style={{
                        backgroundColor: 'rgba(91, 156, 255, 0.1)',
                        color: '#5B9CFF',
                        padding: '6px 16px',
                        borderRadius: '16px',
                        fontSize: '20px',
                      }}
                    >
                      {tag}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer with branding */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              {/* Author info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                {/* Monogram */}
                {authorInitials && (
                  <div
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #5B9CFF 0%, #A78BFA 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '24px',
                      fontWeight: 700,
                      color: '#0A0D11',
                    }}
                  >
                    {authorInitials}
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {authorName && (
                    <div
                      style={{
                        fontSize: '24px',
                        fontWeight: 600,
                        color: '#E8EDF2',
                      }}
                    >
                      {authorName}
                    </div>
                  )}
                  <div
                    style={{
                      fontSize: '18px',
                      color: '#A1ACB7',
                    }}
                  >
                    {new URL(SITE_URL).hostname}
                  </div>
                </div>
              </div>

              {/* Decorative gradient line */}
              <div
                style={{
                  width: '200px',
                  height: '4px',
                  background: 'linear-gradient(90deg, #5B9CFF 0%, #A78BFA 100%)',
                  borderRadius: '2px',
                }}
              />
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error('Error generating OG image:', error);
    return new Response('Failed to generate image', { status: 500 });
  }
}
