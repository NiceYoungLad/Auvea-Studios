import { NextResponse } from 'next/server';
import { createAuthedSupabase } from '@/lib/supabaseServer';
import { parseResume } from '@/lib/parseResume';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const supabase = createAuthedSupabase(request);
  const form = await request.formData();
  const file = form.get('file');

  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'Missing file.' }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const storagePath = `${userData.user.id}/${Date.now()}-${file.name}`;
  const { error: uploadError } = await supabase.storage.from('resumes').upload(storagePath, buffer, {
    contentType: file.type || 'application/pdf',
  });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const parsed = await parseResume(buffer);

  const { data, error } = await supabase
    .from('resumes')
    .insert({
      user_id: userData.user.id,
      filename: file.name,
      storage_path: storagePath,
      parsed_json: parsed,
      active: true,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ resume: data, parsed });
}
