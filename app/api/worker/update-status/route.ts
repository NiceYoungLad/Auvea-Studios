import { NextResponse } from 'next/server';
import { createServiceSupabase } from '@/lib/supabaseServer';

export async function POST(request: Request) {
  const workerSecret = process.env.WORKER_SECRET;
  const auth = request.headers.get('x-worker-key');
  if (!workerSecret || auth !== workerSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { application_id, status, error } = body || {};
  if (!application_id || !status) {
    return NextResponse.json({ error: 'Missing fields.' }, { status: 400 });
  }

  const supabase = createServiceSupabase();
  const { error: updateError } = await supabase
    .from('applications')
    .update({
      status,
      error: error || null,
      submitted_at: status === 'submitted' ? new Date().toISOString() : null,
    })
    .eq('id', application_id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
