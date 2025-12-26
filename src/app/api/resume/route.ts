import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Try assets table first
    const { data: assetData } = await supabase
      .from('assets')
      .select('original_url')
      .eq('bucket', 'resume')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    let resumeUrl = assetData?.original_url;
    
    if (!resumeUrl) {
      // Fallback: try storage directly
      const { data: storageData } = await supabase
        .storage
        .from('resume')
        .list('', { limit: 1, sortBy: { column: 'created_at', order: 'desc' } });
      
      if (storageData && storageData.length > 0) {
        const { data: urlData } = supabase
          .storage
          .from('resume')
          .getPublicUrl(storageData[0].name);
        resumeUrl = urlData?.publicUrl;
      }
    }
    
    if (!resumeUrl) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
    }
    
    // Fetch the PDF from Supabase
    const response = await fetch(resumeUrl);
    
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch resume' }, { status: 500 });
    }
    
    const pdfBuffer = await response.arrayBuffer();
    
    // Return the PDF with appropriate headers
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="resume.pdf"',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('Error fetching resume:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
