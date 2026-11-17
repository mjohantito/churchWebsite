// The ONE entry point every form uses. Currently a stub that waits and
// succeeds. Later: insert into Supabase (`form_submissions` table) and let a
// database webhook / edge function notify staff.

export type FormType = 'new_member' | 'prayer_request' | 'choir_signup';

export type FormPayload = Record<string, string>;

export interface SubmitResult {
  ok: true;
  id: string;
}

export async function submitForm(type: FormType, payload: FormPayload): Promise<SubmitResult> {
  await new Promise((resolve) => setTimeout(resolve, 900));
  if (import.meta.env.DEV) console.info('[submitForm stub]', type, payload);
  return { ok: true, id: `stub-${Date.now()}` };
}
