import { NextResponse } from 'next/server';
import { createAuthedSupabase } from '@/lib/supabaseServer';

export const runtime = 'nodejs';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
    const supabase = createAuthedSupabase(request);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
        return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const jobId = params.id;
    const body = await request.json().catch(() => ({}));
    const newStatus = body.status;

    if (!['saved', 'new', 'seen', 'applied', 'failed'].includes(newStatus)) {
        return NextResponse.json({ error: 'Invalid status.' }, { status: 400 });
    }

    // Verify the job belongs to this user (via the company)
    const { data: job, error: fetchError } = await supabase
        .from('jobs')
        .select('id, company:companies(user_id)')
        .eq('id', jobId)
        .maybeSingle();

    if (fetchError || !job) {
        return NextResponse.json({ error: 'Job not found.' }, { status: 404 });
    }

    const { error: updateError } = await supabase
        .from('jobs')
        .update({ status: newStatus })
        .eq('id', jobId);

    if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: jobId, status: newStatus });
}
