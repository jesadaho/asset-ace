import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";

type LineWebhookEvent = {
  type: string;
  replyToken?: string;
  message?: {
    id?: string;
    type?: string;
    text?: string;
  };
};

type LineWebhookBody = {
  events?: LineWebhookEvent[];
};

type EasySlipSuccessResponse = {
  success?: boolean;
  data?: {
    amountInSlip?: number;
    rawSlip?: {
      date?: string;
      sender?: {
        account?: {
          name?: { th?: string; en?: string };
        };
      };
      receiver?: {
        account?: {
          name?: { th?: string; en?: string };
        };
      };
    };
  };
};

function verifySignature(
  rawBody: string,
  signature: string,
  channelSecret: string
): boolean {
  const expected = createHmac("sha256", channelSecret)
    .update(rawBody)
    .digest("base64");
  const signatureBuffer = Buffer.from(signature, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");

  if (signatureBuffer.length !== expectedBuffer.length) return false;
  return timingSafeEqual(signatureBuffer, expectedBuffer);
}

async function replyText(replyToken: string, text: string): Promise<void> {
  const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN?.trim();
  if (!accessToken) {
    console.warn(
      "[line-webhook] LINE_CHANNEL_ACCESS_TOKEN missing, skip reply"
    );
    return;
  }

  const res = await fetch("https://api.line.me/v2/bot/message/reply", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      replyToken,
      messages: [{ type: "text", text }],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(
      "[line-webhook] reply API failed:",
      res.status,
      body.slice(0, 300)
    );
  }
}

async function fetchLineMessageImage(messageId: string): Promise<{
  ok: boolean;
  bytes?: ArrayBuffer;
  contentType?: string;
  error?: string;
}> {
  const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN?.trim();
  if (!accessToken) {
    return { ok: false, error: "LINE_CHANNEL_ACCESS_TOKEN missing" };
  }

  try {
    const res = await fetch(
      `https://api-data.line.me/v2/bot/message/${messageId}/content`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return {
        ok: false,
        error: `LINE content API failed (${res.status}): ${body.slice(0, 200)}`,
      };
    }

    const bytes = await res.arrayBuffer();
    const contentType = res.headers.get("content-type") ?? "image/jpeg";
    return { ok: true, bytes, contentType };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

async function verifySlipWithEasySlip(
  imageBytes: ArrayBuffer,
  contentType: string,
  messageId: string
): Promise<{ ok: boolean; status?: number; bodyText: string }> {
  const endpoint =
    process.env.EASYSLIP_ENDPOINT?.trim() ||
    "https://api.easyslip.com/v2/verify/bank";
  const formData = new FormData();
  const ext = contentType.includes("png") ? "png" : "jpg";
  formData.append(
    "image",
    new Blob([imageBytes], { type: contentType }),
    `line-slip-${messageId}.${ext}`
  );

  const headers: Record<string, string> = {};
  const apiKey = process.env.EASYSLIP_API_KEY?.trim();
  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers,
      body: formData,
    });

    const bodyText = await res.text().catch(() => "");
    return { ok: res.ok, status: res.status, bodyText: bodyText.slice(0, 1200) };
  } catch (err) {
    return {
      ok: false,
      bodyText: err instanceof Error ? err.message : String(err),
    };
  }
}

function formatEasySlipResult(bodyText: string): string {
  try {
    const parsed = JSON.parse(bodyText) as EasySlipSuccessResponse;
    const amount = parsed.data?.amountInSlip;
    const senderName =
      parsed.data?.rawSlip?.sender?.account?.name?.th ||
      parsed.data?.rawSlip?.sender?.account?.name?.en ||
      "-";
    const receiverName =
      parsed.data?.rawSlip?.receiver?.account?.name?.th ||
      parsed.data?.rawSlip?.receiver?.account?.name?.en ||
      "-";
    const date = parsed.data?.rawSlip?.date || "-";
    const amountText =
      typeof amount === "number"
        ? `${amount.toLocaleString("th-TH", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })} บาท`
        : "-";

    return `จำนวนเงิน ${amountText}\nจาก ${senderName}\nไปยัง ${receiverName}\nวันที่ ${date}`;
  } catch {
    return `ผลตรวจสลิป:\n${bodyText || "OK"}`;
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, message: "LINE webhook is running" });
}

export async function POST(request: NextRequest) {
  const channelSecret = process.env.LINE_CHANNEL_SECRET?.trim();
  if (!channelSecret) {
    return NextResponse.json(
      { message: "Missing LINE_CHANNEL_SECRET" },
      { status: 500 }
    );
  }

  const signature = request.headers.get("x-line-signature");
  if (!signature) {
    return NextResponse.json(
      { message: "Missing x-line-signature" },
      { status: 400 }
    );
  }

  const rawBody = await request.text();
  if (!verifySignature(rawBody, signature, channelSecret)) {
    return NextResponse.json({ message: "Invalid signature" }, { status: 401 });
  }

  let payload: LineWebhookBody;
  try {
    payload = JSON.parse(rawBody) as LineWebhookBody;
  } catch {
    return NextResponse.json({ message: "Invalid JSON payload" }, { status: 400 });
  }

  const events = payload.events ?? [];
  for (const event of events) {
    if (
      event.type === "message" &&
      event.message?.type === "text" &&
      event.replyToken
    ) {
      const incoming = event.message.text?.trim() || "(empty message)";
      await replyText(event.replyToken, `Received: ${incoming}`);
    }

    if (
      event.type === "message" &&
      event.message?.type === "image" &&
      event.message.id &&
      event.replyToken
    ) {
      const image = await fetchLineMessageImage(event.message.id);
      if (!image.ok || !image.bytes) {
        await replyText(
          event.replyToken,
          `โหลดรูปจาก LINE ไม่สำเร็จ: ${image.error ?? "unknown error"}`
        );
        continue;
      }

      const verifyResult = await verifySlipWithEasySlip(
        image.bytes,
        image.contentType ?? "image/jpeg",
        event.message.id
      );

      if (!verifyResult.ok) {
        await replyText(
          event.replyToken,
          `ตรวจสอบสลิปไม่สำเร็จ (${verifyResult.status ?? "error"}): ${verifyResult.bodyText || "no response body"}`
        );
        continue;
      }

      await replyText(
        event.replyToken,
        formatEasySlipResult(verifyResult.bodyText || "OK")
      );
    }
  }

  return NextResponse.json({ ok: true });
}
