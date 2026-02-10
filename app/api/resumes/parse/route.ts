import { NextResponse } from 'next/server';
import { createAuthedSupabase } from '@/lib/supabaseServer';
import { parseResume } from '@/lib/parseResume';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const supabase = createAuthedSupabase(request);
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }
  const body = await request.json();
  const { resume_id } = body || {};
  if (!resume_id) {
    return NextResponse.json({ error: 'Missing resume_id.' }, { status: 400 });
  }

  const { data, error } = await supabase.from('resumes').select('*').eq('id', resume_id).single();
  if (error || !data) {
    return NextResponse.json({ error: 'Resume not found.' }, { status: 404 });
  }

  const { data: file, error: downloadError } = await supabase.storage
    .from('resumes')
    .download(data.storage_path);
  if (downloadError || !file) {
    return NextResponse.json({ error: 'Unable to download resume.' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const parsed = await parseResume(buffer);

  const { error: updateError } = await supabase
    .from('resumes')
    .update({ parsed_json: parsed })
    .eq('id', resume_id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ parsed });
}
