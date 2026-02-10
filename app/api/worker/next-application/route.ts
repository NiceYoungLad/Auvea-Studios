import { NextResponse } from 'next/server';
import { createServiceSupabase } from '@/lib/supabaseServer';

export async function POST(request: Request) {
  const workerSecret = process.env.WORKER_SECRET;
  const auth = request.headers.get('x-worker-key');
  if (!workerSecret || auth !== workerSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceSupabase();
  const { data, error } = await supabase
    .from('applications')
    .select('*, job:jobs(*)')
    .eq('status', 'queued')
    .order('started_at', { ascending: true })
    .limit(1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const application = data?.[0];
  if (!application) {
    return NextResponse.json({ application: null });
  }

  await supabase.from('applications').update({ status: 'running' }).eq('id', application.id);
  return NextResponse.json({ application });
}
