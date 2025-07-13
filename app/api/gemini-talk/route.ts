import { NextResponse } from 'next/server';
import { GoogleGenerativeAI, Content } from '@google/generative-ai';

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  throw new Error('GEMINI_API_KEY is not defined in .env.local');
}
const genAI = new GoogleGenerativeAI(API_KEY);

// メッセージの型定義
interface Message {
  sender: 'player' | 'npc';
  text: string;
}

export async function POST(request: Request) {
  try {
    const { history } = await request.json();

    // Gemini APIが要求する形式に会話履歴を変換
    const geminiHistory: Content[] = history.map((msg: Message) => ({
      role: msg.sender === 'player' ? 'user' : 'model',
      parts: [{ text: msg.text }],
    }));

    // 最後のメッセージ（ユーザーからの新しい入力）を削除して、プロンプトとして使用
    const lastMessage = geminiHistory.pop();
    if (!lastMessage) {
      return NextResponse.json({ message: "..." }); // 会話が空の場合は何も返さない
    }

    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      // システムへの指示
      systemInstruction: "あなたは、とあるRPGの村人です。簡潔に、村人らしい口調で返答してください。",
    });

    const chat = model.startChat({
      history: geminiHistory, // これまでの会話履歴をコンテキストとして渡す
    });

    const result = await chat.sendMessage(lastMessage.parts[0].text);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ message: text });

  } catch (error) {
    console.error("Gemini API call failed:", error);
    return NextResponse.json(
      { message: "AIとの対話に失敗しました。" },
      { status: 500 }
    );
  }
}