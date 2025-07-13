import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  // 将来的には、ここでリクエストからNPCのIDなどを受け取り、
  // Gemini APIにプロンプトを送信する処理が入ります。

  // 今は固定のメッセージを返す
  const message = "こんにちは！私はNPCです。";

  return NextResponse.json({ message });
}
