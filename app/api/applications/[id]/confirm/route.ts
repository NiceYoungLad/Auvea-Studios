import { NextResponse } from 'next/server';
import { createAuthedSupabase } from '@/lib/supabaseServer';

export async function POST(request: Request, context: { params: { id: string } }) {
  const supabase = createAuthedSupabase(request);
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }
  const { error } = await supabase
    .from('applications')
    .update({ status: 'queued', review_required: false })
    .eq('id', context.params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
