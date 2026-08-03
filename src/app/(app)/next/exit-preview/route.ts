import { draftMode } from 'next/headers'

export async function GET(): Promise<Response> {
  const draft = await draftMode()
  draft.disable()
  return new Response('Đã tắt chế độ nháp (draft mode)')
}
