import { NextResponse } from 'next/server';
import { createAuthedSupabase } from '@/lib/supabaseServer';
import { normalizeQuestion } from '@/lib/normalize';

export async function POST(request: Request, context: { params: { id: string } }) {
  const supabase = createAuthedSupabase(request);
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }
  const body = await request.json();
  const { question_text, answer_value_json } = body || {};
  if (!question_text) {
    return NextResponse.json({ error: 'Missing question_text.' }, { status: 400 });
  }

  const normalized_text = normalizeQuestion(question_text);

  const { data: question, error: questionError } = await supabase
    .from('questions')
    .upsert(
      {
        user_id: userData.user.id,
        normalized_text,
        answer_value_json,
      },
      { onConflict: 'user_id,normalized_text' }
    )
    .select()
    .single();

  if (questionError) {
    return NextResponse.json({ error: questionError.message }, { status: 500 });
  }

  const { error: appQuestionError } = await supabase.from('application_questions').insert({
    application_id: context.params.id,
    question_text,
    normalized_text,
    answer_value_json,
    resolved: true,
  });

  if (appQuestionError) {
    return NextResponse.json({ error: appQuestionError.message }, { status: 500 });
  }

  await supabase.from('applications').update({ status: 'queued' }).eq('id', context.params.id);

  return NextResponse.json({ question });
}
