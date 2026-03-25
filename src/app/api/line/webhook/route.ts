import { createHmac, timingSafeEqual } from "crypto";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import { Property } from "@/lib/db/models/property";
import { BindCode } from "@/lib/db/models/bindCode";

type LineSource = {
  type: string;
  userId?: string;
  groupId?: string;
  roomId?: string;
};

type LineWebhookEvent = {
  type: string;
  replyToken?: string;
  source?: LineSource;
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

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function clampDay(year: number, monthIndex: number, day: number): number {
  const last = new Date(year, monthIndex + 1, 0).getDate();
  return Math.min(day, last);
}

function daysBetween(a: Date, b: Date): number {
  return Math.floor((b.getTime() - a.getTime()) / (86400 * 1000));
}

const TH_MONTHS_SHORT = [
  "ม.ค.",
  "ก.พ.",
  "มี.ค.",
  "เม.ย.",
  "พ.ค.",
  "มิ.ย.",
  "ก.ค.",
  "ส.ค.",
  "ก.ย.",
  "ต.ค.",
  "พ.ย.",
  "ธ.ค.",
];

function formatThaiDayMonth(d: Date): string {
  const day = d.getDate();
  const m = TH_MONTHS_SHORT[d.getMonth()] ?? "";
  return `${day} ${m}`;
}

/** Next due date computed from contractStartDate day-of-month (clamped). */
function getNextDueDateFromContractStart(
  contractStartDate: Date,
  now: Date
): Date | null {
  const start = startOfDay(contractStartDate);
  if (Number.isNaN(start.getTime())) return null;
  const today = startOfDay(now);
  if (today < start) return start;

  const dueDay = start.getDate();
  const y = today.getFullYear();
  const m = today.getMonth();
  const dThis = clampDay(y, m, dueDay);
  let due = startOfDay(new Date(y, m, dThis));
  if (due <= today) {
    const nm = m === 11 ? 0 : m + 1;
    const ny = m === 11 ? y + 1 : y;
    const dNext = clampDay(ny, nm, dueDay);
    due = startOfDay(new Date(ny, nm, dNext));
  }
  return due < start ? start : due;
}

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

/** LINE quick reply label max 20 chars (Messaging API). */
function clipLabel(label: string): string {
  return Array.from(label).slice(0, 20).join("");
}

const NICHCHA_TRIGGER = "นิชา";

/** ข้อความต้อนรับเมื่อพิมพ์ "นิชา" ในกลุ่ม */
const NICHCHA_INTRO =
  "นิชามาแล้วค่ะ!\nมาๆ เดี๋ยวนิชาช่วยจัดการให้";

function webAppUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    "https://app.assethub.in.th"
  );
}

/** ไอคอนขาว-ดำ (PNG ใน public/nicha-menu/) — สไตล์เส้น outline คล้ายเมนู LINE แบบขุนทอง */
function nichaMenuIconUrl(
  name: "bind" | "bill" | "building" | "add" | "help" | "due"
): string {
  const base = webAppUrl().replace(/\/$/, "");
  return `${base}/nicha-menu/${name}.png`;
}

/** LIFF / web: เปิด path ในแอป (เช็ค role ฝั่งแอปตามหน้า) */
function buildLiffPathUri(path: string): string {
  const liffId = process.env.NEXT_PUBLIC_LIFF_ID?.trim();
  if (liffId) {
    return `https://liff.line.me/${liffId}?path=${encodeURIComponent(path)}`;
  }
  const base = webAppUrl().replace(/\/$/, "");
  return `${base}/?path=${encodeURIComponent(path)}`;
}

type NichaQuickReplyItem =
  | {
      kind: "message";
      label: string;
      text: string;
      imageUrl: string;
    }
  | {
      kind: "uri";
      label: string;
      uri: string;
      imageUrl: string;
    };

function getNichaQuickReplyItems(): NichaQuickReplyItem[] {
  return [
    {
      kind: "uri",
      label: "ผูกกลุ่มกับสินทรัพย์",
      uri: buildLiffPathUri("/owner/properties/bind"),
      imageUrl: nichaMenuIconUrl("bind"),
    },
    {
      kind: "message",
      label: "ดูบิลทั้งหมด",
      text: "#ดูบิลทั้งหมด",
      imageUrl: nichaMenuIconUrl("bill"),
    },
    {
      kind: "uri",
      label: "ดูสินทรัพย์ทั้งหมด",
      uri: buildLiffPathUri("/owner/properties"),
      imageUrl: nichaMenuIconUrl("building"),
    },
    {
      kind: "uri",
      label: "เพิ่มสินทรัพย์",
      uri: buildLiffPathUri("/owner/properties/add"),
      imageUrl: nichaMenuIconUrl("add"),
    },
    {
      kind: "message",
      label: "เช็กวันจ่ายค่าเช่า",
      text: "#เช็กวันจ่ายค่าเช่า",
      imageUrl: nichaMenuIconUrl("due"),
    },
    {
      kind: "message",
      label: "วิธีใช้",
      text: "#วิธีใช้",
      imageUrl: nichaMenuIconUrl("help"),
    },
  ];
}

/** คีย์หลักใช้รูปแบบ #คำสั่ง (ตรงกับข้อความที่ Quick Reply ส่ง) */
const NICHCHA_MENU_HINTS: Record<string, string> = {
  "#ผูกกลุ่มกับสินทรัพย์":
    "ผูกกลุ่มได้ 2 วิธี:\n1) กดเมนู “ผูกกลุ่มกับสินทรัพย์” แล้วเลือกทรัพย์ในแอป (แนะนำ)\n2) พิมพ์ `/bind` ตามด้วยรหัสทรัพย์ 24 ตัว\nตัวอย่าง: `/bind 674a1b2c3d4e5f678901234`",
  "#ดูบิลทั้งหมด":
    "ฟีเจอร์นี้พัฒนาอยู่ — เปิดดูจากแอปได้ที่ " + webAppUrl(),
  "#ดูสินทรัพย์ทั้งหมด":
    "กดปุ่มเมนู \"ดูสินทรัพย์ทั้งหมด\" เพื่อเปิดหน้าทรัพย์ของฉันในแอป หรือพิมพ์คำสั่งนี้ หรือเข้า: " +
    webAppUrl() +
    "/owner/properties",
  "#เพิ่มสินทรัพย์":
    "กดปุ่มเมนู \"เพิ่มสินทรัพย์\" เพื่อเปิดหน้าเพิ่มทรัพย์ หรือเข้า: " +
    webAppUrl() +
    "/owner/properties/add",
  "#วิธีใช้":
    "• พิมพ์ นิชา เพื่อเปิดเมนู\n• ผูกกลุ่ม: กดเมนู “ผูกกลุ่มกับสินทรัพย์” หรือพิมพ์ /bind\n• ส่งรูปสลิปในกลุ่มที่ผูกแล้ว ระบบจะตรวจสลิปให้\n• เช็กวันจ่ายค่าเช่า: ดูจากวันเริ่มสัญญาในหน้าแก้ไขทรัพย์ (ระบบนับรอบจากวันเริ่มสัญญา)\n• แอป: " +
    webAppUrl(),
};

function getNichaMenuHint(incoming: string): string | undefined {
  const direct = NICHCHA_MENU_HINTS[incoming];
  if (direct) return direct;
  const normalized = incoming.startsWith("#")
    ? incoming
    : `#${incoming}`;
  return NICHCHA_MENU_HINTS[normalized];
}

function mapNichaQuickReplyPayloadItem(item: NichaQuickReplyItem) {
  if (item.kind === "uri") {
    return {
      type: "action" as const,
      imageUrl: item.imageUrl,
      action: {
        type: "uri" as const,
        label: clipLabel(item.label),
        uri: item.uri,
      },
    };
  }
  return {
    type: "action" as const,
    imageUrl: item.imageUrl,
    action: {
      type: "message" as const,
      label: clipLabel(item.label),
      text: item.text,
    },
  };
}

async function replyTextWithQuickReply(
  replyToken: string,
  text: string,
  items: NichaQuickReplyItem[]
): Promise<void> {
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
      messages: [
        {
          type: "text",
          text,
          quickReply: {
            items: items.map(mapNichaQuickReplyPayloadItem),
          },
        },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(
      "[line-webhook] reply quickReply failed:",
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

function isEasySlipSuccessJson(bodyText: string): boolean {
  try {
    const parsed = JSON.parse(bodyText) as { success?: boolean };
    return parsed.success === true;
  } catch {
    return false;
  }
}

async function handleBindCommand(
  replyToken: string,
  text: string,
  groupId: string,
  lineUserId: string
): Promise<void> {
  const trimmed = text.trim();
  const mObjectId = trimmed.match(/^\/bind\s+([a-fA-F0-9]{24})$/);
  const mCode = trimmed.match(/^\/bind\s+(\d{6})$/);
  if (!mObjectId && !mCode) {
    await replyText(
      replyToken,
      "รูปแบบ: /bind ตามด้วยรหัสทรัพย์ (24 ตัว) หรือโค้ด 6 หลัก (จากหน้า bind ในแอป)"
    );
    return;
  }
  const propertyId = mObjectId?.[1];
  const code = mCode?.[1];

  try {
    await connectDB();
    let resolvedPropertyId: string | null = null;
    if (propertyId) {
      if (!mongoose.Types.ObjectId.isValid(propertyId)) {
        await replyText(replyToken, "รหัสทรัพย์ไม่ถูกต้อง");
        return;
      }
      resolvedPropertyId = propertyId;
    } else if (code) {
      const token = await BindCode.findOne({ code, usedAt: { $exists: false } });
      if (!token) {
        await replyText(replyToken, "โค้ดนี้ใช้ไม่ได้แล้วหรือหมดอายุแล้ว");
        return;
      }
      const expiresAt = (token as { expiresAt?: Date }).expiresAt;
      if (!expiresAt || expiresAt.getTime() < Date.now()) {
        await replyText(replyToken, "โค้ดนี้หมดอายุแล้ว");
        return;
      }
      // Only the creator (owner/agent) can use their own code.
      const createdBy = (token as { createdByLineUserId?: string }).createdByLineUserId;
      if (createdBy && createdBy !== lineUserId) {
        await replyText(replyToken, "โค้ดนี้ไม่ใช่ของคุณ");
        return;
      }
      resolvedPropertyId = (token as { propertyId: mongoose.Types.ObjectId }).propertyId.toString();
      await BindCode.updateOne(
        { _id: (token as { _id: mongoose.Types.ObjectId })._id },
        { $set: { usedAt: new Date(), usedByLineUserId: lineUserId } }
      );
    }
    if (!resolvedPropertyId) {
      await replyText(replyToken, "ไม่สามารถผูกกลุ่มได้ (missing property)");
      return;
    }
    const taken = await Property.findOne({ lineGroupId: groupId }).lean();
    if (taken && taken._id.toString() !== resolvedPropertyId) {
      await replyText(
        replyToken,
        "กลุ่ม LINE นี้ผูกกับทรัพย์อื่นแล้ว กรุณาแก้ไขในแอปก่อน"
      );
      return;
    }

    const property = await Property.findOne({
      _id: resolvedPropertyId,
      $or: [{ ownerId: lineUserId }, { agentLineId: lineUserId }],
    });
    if (!property) {
      await replyText(
        replyToken,
        "ไม่พบทรัพย์หรือคุณไม่มีสิทธิ์ผูกกลุ่มกับทรัพย์นี้"
      );
      return;
    }

    property.lineGroupId = groupId;
    await property.save();
    const propertyName =
      (property as { name?: string }).name?.trim() || "ทรัพย์";
    await replyText(
      replyToken,
      `เชื่อมต่อ ${propertyName} สำเร็จ! ✅\n\nเรื่องค่าเช่าและติดตามทรัพย์ ปล่อยให้นิชาดูแลแทนได้เลยนะคะ!💚`
    );
  } catch (err) {
    console.error("[line-webhook] bind error", err);
    await replyText(replyToken, "บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง");
  }
}

async function handleRentDueInquiry(
  replyToken: string,
  groupId: string
): Promise<void> {
  try {
    await connectDB();
    const prop = await Property.findOne({ lineGroupId: groupId }).lean();
    if (!prop) {
      await replyText(
        replyToken,
        "กลุ่มนี้ยังไม่ได้ผูกกับสินทรัพย์ค่ะ กดเมนู “ผูกกลุ่มกับสินทรัพย์” ก่อนนะคะ 💚"
      );
      return;
    }
    const name = (prop as { name?: string }).name?.trim() || "ทรัพย์";
    const contractStartDate = (prop as { contractStartDate?: Date }).contractStartDate;
    const monthlyRent = (prop as { monthlyRent?: number }).monthlyRent;
    if (!contractStartDate) {
      await replyText(
        replyToken,
        `รายการค่าเช่า: ${name} 🏠\n\nยังไม่มีวันเริ่มสัญญาในระบบค่ะ กรุณาตั้ง “วันเริ่มสัญญา” ในหน้าแก้ไขทรัพย์ก่อนนะคะ 💚`
      );
      return;
    }
    const due = getNextDueDateFromContractStart(
      contractStartDate instanceof Date ? contractStartDate : new Date(contractStartDate),
      new Date()
    );
    if (!due) {
      await replyText(
        replyToken,
        `รายการค่าเช่า: ${name} 🏠\n\nไม่สามารถคำนวณวันครบกำหนดได้ค่ะ กรุณาตรวจสอบวันเริ่มสัญญาอีกครั้ง 💚`
      );
      return;
    }
    const today = startOfDay(new Date());
    const remaining = Math.max(0, daysBetween(today, due));
    const amount = typeof monthlyRent === "number" && !Number.isNaN(monthlyRent) ? monthlyRent : 0;

    await replyText(
      replyToken,
      `รายการค่าเช่า: ${name} 🏠\n\n` +
        `🗓 วันครบกำหนด: ${formatThaiDayMonth(due)}\n` +
        `💰 ยอดชำระ: ${amount.toLocaleString("th-TH")} บาท\n` +
        `⏳ สถานะ: เหลืออีก ${remaining} วัน\n\n` +
        `หากชำระแล้ว สามารถส่งสลิปแจ้งนิชาในกลุ่มนี้ได้เลยนะคะ 💚`
    );
  } catch (e) {
    console.error("[line-webhook] rent due inquiry", e);
    await replyText(replyToken, "ระบบขัดข้อง ลองใหม่ภายหลังนะคะ 💚");
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
    if (event.type !== "message" || !event.replyToken) continue;

    const source = event.source;
    const groupId =
      source?.type === "group" && source.groupId ? source.groupId : undefined;
    const lineUserId = source?.userId;

    if (event.message?.type === "text" && event.message.text != null) {
      const incoming = event.message.text.trim();
      if (groupId && lineUserId) {
        if (incoming.startsWith("/bind")) {
          await handleBindCommand(
            event.replyToken,
            incoming,
            groupId,
            lineUserId
          );
          continue;
        }
        if (incoming === NICHCHA_TRIGGER) {
          await replyTextWithQuickReply(
            event.replyToken,
            NICHCHA_INTRO,
            getNichaQuickReplyItems()
          );
          continue;
        }
        if (incoming === "#เช็กวันจ่ายค่าเช่า" || incoming === "เช็กวันจ่ายค่าเช่า") {
          await handleRentDueInquiry(event.replyToken, groupId);
          continue;
        }
        const menuHint = getNichaMenuHint(incoming);
        if (menuHint) {
          await replyText(event.replyToken, menuHint);
          continue;
        }
        await replyText(
          event.replyToken,
          `Received: ${incoming || "(empty message)"}`
        );
        continue;
      }
      await replyText(
        event.replyToken,
        `Received: ${incoming || "(empty message)"}`
      );
      continue;
    }

    if (
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

      let propertyIdForPayment: string | undefined;
      if (groupId) {
        try {
          await connectDB();
          const prop = await Property.findOne({ lineGroupId: groupId })
            .select("_id")
            .lean();
          if (!prop) {
            await replyText(
              event.replyToken,
              "ยังไม่ได้ผูกกลุ่มกับทรัพย์ พิมพ์ /bind ตามด้วยรหัสทรัพย์ (จากแอป)"
            );
            continue;
          }
          propertyIdForPayment = (prop as { _id: mongoose.Types.ObjectId })._id.toString();
        } catch (e) {
          console.error("[line-webhook] group property lookup", e);
          await replyText(event.replyToken, "ระบบขัดข้อง ลองใหม่ภายหลัง");
          continue;
        }
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

      if (
        propertyIdForPayment &&
        verifyResult.ok &&
        isEasySlipSuccessJson(verifyResult.bodyText)
      ) {
        try {
          await connectDB();
          await Property.updateOne(
            { _id: propertyIdForPayment },
            { $set: { lastRentPaidAt: new Date() } }
          );
        } catch (e) {
          console.error("[line-webhook] lastRentPaidAt update", e);
        }
      }

      await replyText(
        event.replyToken,
        formatEasySlipResult(verifyResult.bodyText || "OK")
      );
    }
  }

  return NextResponse.json({ ok: true });
}
