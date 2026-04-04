import { NextRequest, NextResponse } from "next/server";
import { createTag, getLatestCommitSha } from "@/lib/github";
import { sendMessage } from "@/lib/telegram";

const TAG_PATTERN = /^v\d+\.\d+\.\d+$/;

interface TelegramMessage {
  chat: { id: number };
  text?: string;
}

interface TelegramUpdate {
  message?: TelegramMessage;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let update: TelegramUpdate;

  try {
    update = (await req.json()) as TelegramUpdate;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const message = update.message;
  if (!message) {
    return NextResponse.json({ ok: true });
  }

  const chatId = message.chat.id;
  const text = (message.text ?? "").trim();

  // Only handle /build commands
  if (!text.startsWith("/build")) {
    return NextResponse.json({ ok: true });
  }

  const parts = text.split(/\s+/);
  const tag = parts[1];

  if (!tag) {
    await sendMessage(chatId, "❌ Missing tag. Example: /build v1.0.10");
    return NextResponse.json({ ok: true });
  }

  if (!TAG_PATTERN.test(tag)) {
    await sendMessage(chatId, "❌ Invalid tag format. Example: /build v1.0.10");
    return NextResponse.json({ ok: true });
  }

  try {
    const sha = await getLatestCommitSha();
    const result = await createTag(tag, sha);

    if (result === "exists") {
      await sendMessage(chatId, `❌ Tag ${tag} already exists`);
    } else {
      await sendMessage(chatId, `🚀 Build ${tag} triggered`);
    }
  } catch (err) {
    console.error("[webhook] GitHub error:", err);
    await sendMessage(chatId, "❌ Failed to create tag");
  }

  return NextResponse.json({ ok: true });
}
