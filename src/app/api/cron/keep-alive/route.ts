import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Vercel Cron - runs every 3 days to keep Supabase awake
export const runtime = 'edge';

export async function GET(request: Request) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Simple query to wake up the database
    const { error } = await supabase
      .from('site_settings')
      .select('id')
      .limit(1);

    if (error) throw error;

    return NextResponse.json({ 
      success: true, 
      message: 'Supabase pinged successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Keep-alive error:', error);
    return NextResponse.json({ error: 'Failed to ping Supabase' }, { status: 500 });
  }
}
