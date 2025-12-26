import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    
    if (!path || path.length === 0) {
      return NextResponse.json({ error: 'Path required' }, { status: 400 });
    }

    // Reconstruct the path: bucket/filename
    const imagePath = path.join('/');
    
    // Build the Supabase storage URL
    const supabaseImageUrl = `${SUPABASE_URL}/storage/v1/object/public/${imagePath}`;
    
    // Fetch the image from Supabase
    const response = await fetch(supabaseImageUrl, {
      headers: {
        'Accept': 'image/*',
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/png';

    // Return the image with caching headers
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable', // Cache for 1 year
      },
    });
  } catch (error) {
    console.error('Error proxying image:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
