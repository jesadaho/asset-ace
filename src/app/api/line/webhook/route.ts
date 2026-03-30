import { createHmac, timingSafeEqual } from "crypto";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import { Property } from "@/lib/db/models/property";
import { BindCode } from "@/lib/db/models/bindCode";
import { RentTransaction } from "@/lib/db/models/rentTransaction";
import { periodKeyFromSlipDate, rentPeriodThaiMonthYear } from "@/lib/rent/period";
import { User } from "@/lib/db/models/user";
import { pushMessages, pushToGroup } from "@/lib/line/push";

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
  postback?: {
    data?: string;
  };
};

type LineWebhookBody = {
  events?: LineWebhookEvent[];
};

type EasySlipRawSlip = {
  date?: string;
  sender?: {
    account?: {
      name?: { th?: string; en?: string };
      bank?: { name?: { th?: string; en?: string } | string };
      number?: string;
    };
  };
  receiver?: {
    account?: {
      name?: { th?: string; en?: string };
      bank?: { name?: { th?: string; en?: string } | string };
      number?: string;
    };
  };
  channel?: string;
  transChannel?: string;
  sendingBank?: string;
};

type EasySlipSuccessResponse = {
  success?: boolean;
  data?: {
    amountInSlip?: number;
    rawSlip?: EasySlipRawSlip;
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

type ReplyMessage =
  | { type: "text"; text: string }
  | { type: "flex"; altText: string; contents: unknown };

async function replyMessages(
  replyToken: string,
  messages: ReplyMessage[]
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
      messages: messages.slice(0, 5),
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(
      "[line-webhook] reply (multi) API failed:",
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
      label: "ผูกแชทกลุ่มกับสินทรัพย์",
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
const BIND_GROUP_PROPERTY_HINT =
  "ผูกแชทกลุ่มได้ 2 วิธี:\n1) กดเมนู “ผูกแชทกลุ่มกับสินทรัพย์” แล้วเลือกทรัพย์ในแอป (แนะนำ)\n2) พิมพ์ `/bind` ตามด้วยรหัสทรัพย์ 24 ตัว\nตัวอย่าง: `/bind 674a1b2c3d4e5f678901234`";

const NICHCHA_MENU_HINTS: Record<string, string> = {
  /** legacy hashtag — ยังรองรับผู้ที่พิมพ์คำเดิม */
  "#ผูกกลุ่มกับสินทรัพย์": BIND_GROUP_PROPERTY_HINT,
  "#ผูกแชทกลุ่มกับสินทรัพย์": BIND_GROUP_PROPERTY_HINT,
  "#ดูบิลทั้งหมด":
    "หลังโอนค่าเช่าและนิชายืนยันสลิปแล้ว จะมีลิงก์บิลในแชท — หรือเปิดดูประวัติที่หน้าทรัพย์ในแอป: " +
    buildLiffPathUri("/owner/properties"),
  "#ดูสินทรัพย์ทั้งหมด":
    "กดปุ่มเมนู \"ดูสินทรัพย์ทั้งหมด\" เพื่อเปิดหน้าทรัพย์ของฉันในแอป หรือพิมพ์คำสั่งนี้ หรือเข้า: " +
    webAppUrl() +
    "/owner/properties",
  "#เพิ่มสินทรัพย์":
    "กดปุ่มเมนู \"เพิ่มสินทรัพย์\" เพื่อเปิดหน้าเพิ่มทรัพย์ หรือเข้า: " +
    webAppUrl() +
    "/owner/properties/add",
  "#วิธีใช้":
    "• พิมพ์ นิชา เพื่อเปิดเมนู\n• ผูกแชทกลุ่ม: กดเมนู “ผูกแชทกลุ่มกับสินทรัพย์” หรือพิมพ์ /bind\n• ส่งรูปสลิปในกลุ่มที่ผูกแล้ว ระบบจะตรวจสลิปให้\n• เช็กวันจ่ายค่าเช่า: ดูจากวันเริ่มสัญญาในหน้าแก้ไขทรัพย์ (ระบบนับรอบจากวันเริ่มสัญญา)\n• แอป: " +
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
    // Avoid truncating JSON; webhook needs full body to parse slip details reliably.
    return { ok: res.ok, status: res.status, bodyText: bodyText.slice(0, 20_000) };
  } catch (err) {
    return {
      ok: false,
      bodyText: err instanceof Error ? err.message : String(err),
    };
  }
}

function toCents(x: number): number {
  return Math.round(x * 100);
}

function formatBaht(x: number): string {
  return `${x.toLocaleString("th-TH")}.–`;
}

function slipPaymentChannelLabel(rawSlip: EasySlipRawSlip | undefined): string {
  if (!rawSlip) return "โอนเงิน";
  const r = rawSlip as Record<string, unknown>;
  for (const key of ["channel", "transChannel", "sendingBank", "appName"]) {
    const v = r[key];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  const bank = rawSlip.sender?.account?.bank?.name;
  if (typeof bank === "string" && bank.trim()) return bank.trim();
  if (bank && typeof bank === "object") {
    const th = (bank as { th?: string }).th;
    const en = (bank as { en?: string }).en;
    if (th?.trim()) return th.trim();
    if (en?.trim()) return en.trim();
  }
  return "โอนเงิน";
}

function formatSlipAmountLine(x: number): string {
  return `${x.toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** Last token single letter → add period (Thai slip initials). */
function polishTrailingInitial(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  const last = parts[parts.length - 1];
  if (last.length === 1 && !last.endsWith(".")) {
    parts[parts.length - 1] = `${last}.`;
  }
  return parts.join(" ");
}

function stripLeadingThaiHonorific(s: string): string {
  return s.replace(/^\s*(นางสาว|นาง|นาย|ด\.ช\.|ด\.ญ\.)\s+/u, "").trim();
}

function formatPayerPartyForReceipt(fromName: string): string {
  const core = polishTrailingInitial(stripLeadingThaiHonorific(fromName));
  if (!core) return "คุณผู้จ่าย";
  return `คุณ${core}`;
}

function formatReceiverPartyForReceipt(toName: string): string {
  const t = toName.trim();
  if (!t) return "ผู้รับเงิน";
  const polished = polishTrailingInitial(t);
  if (/^(นาย|นางสาว|นาง)\s/u.test(polished)) {
    return polished.replace(/\s+/g, " ");
  }
  const core = polishTrailingInitial(stripLeadingThaiHonorific(t));
  return core ? `คุณ${core}` : polished;
}

function buildPaidRentConfirmationText(args: {
  propertyName: string;
  periodKey: string;
  fromName?: string;
  toName?: string;
  slipAmount: number;
}): string {
  const { propertyName, periodKey, fromName, toName, slipAmount } = args;
  const periodLabel =
    rentPeriodThaiMonthYear(periodKey) ?? periodKey;
  const payer = formatPayerPartyForReceipt(fromName?.trim() || "");
  const receiver = formatReceiverPartyForReceipt(toName?.trim() || "");
  return [
    "ยืนยันการรับชำระเงินสำเร็จ ✨",
    "",
    `🏢 ${propertyName}`,
    `🗓️ ค่าเช่ารอบเดือน: ${periodLabel}`,
    `👤 ${payer} ➔ ${receiver}`,
    `💰 ยอดโอน: ${formatSlipAmountLine(slipAmount)} บาท`,
    "✅ สถานะ: ชำระเรียบร้อยแล้วค่ะ",
  ].join("\n");
}

function buildPaidRentFlex(args: {
  propertyName: string;
  payerLabel: string;
  amount: number;
  billUri: string;
}) {
  const { propertyName, payerLabel, amount, billUri } = args;
  const amountCompact = amount.toLocaleString("th-TH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  const contents = {
    type: "bubble",
    header: {
      type: "box",
      layout: "horizontal",
      spacing: "md",
      paddingAll: "16px",
      backgroundColor: "#55BEB0",
      contents: [
        {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "text",
              text: propertyName.slice(0, 120),
              weight: "bold",
              color: "#FFFFFF",
              size: "sm",
              wrap: true,
            },
            {
              type: "text",
              text: "ชำระเรียบร้อย",
              weight: "bold",
              color: "#FFFFFF",
              size: "xl",
              margin: "sm",
            },
          ],
          flex: 1,
        },
        {
          type: "text",
          text: "🎉",
          size: "3xl",
          flex: 0,
          gravity: "center",
        },
      ],
    },
    body: {
      type: "box",
      layout: "vertical",
      spacing: "md",
      paddingAll: "16px",
      contents: [
        {
          type: "box",
          layout: "horizontal",
          spacing: "md",
          contents: [
            { type: "text", text: "👤", flex: 0, size: "lg" },
            {
              type: "text",
              text: payerLabel.slice(0, 60),
              weight: "bold",
              size: "md",
              flex: 1,
              wrap: true,
            },
            {
              type: "text",
              text: amountCompact,
              weight: "bold",
              size: "lg",
              flex: 0,
              align: "end",
              color: "#0F172A",
            },
          ],
        },
      ],
    },
    footer: {
      type: "box",
      layout: "vertical",
      spacing: "sm",
      paddingAll: "12px",
      contents: [
        {
          type: "button",
          style: "primary",
          color: "#55BEB0",
          height: "md",
          action: {
            type: "uri",
            label: "ดูรายละเอียด",
            uri: billUri,
          },
        },
      ],
    },
  };

  return {
    type: "flex" as const,
    altText: `ยืนยันการรับชำระเงินสำเร็จ ${propertyName} ${amountCompact} บาท`,
    contents,
  };
}

function buildOwnerApprovalFlex(args: {
  txId: string;
  propertyName: string;
  expectedRent: number;
  slipAmount: number;
  ownerName?: string;
}) {
  const { txId, propertyName, expectedRent, slipAmount, ownerName } = args;
  const headerText =
    `🏠 ทรัพย์: ${propertyName}\n` +
    `💰 ยอดที่ตั้งไว้: ${formatBaht(expectedRent)}\n` +
    `💵 ยอดในสลิป: ${formatBaht(slipAmount)}\n\n` +
    `พี่${ownerName ? ` ${ownerName}` : ""} ช่วยระบุเหตุผลและกดอนุมัติให้นิชาหน่อยนะคะ:`;

  const mkBtn = (label: string, reasonCode: string) => {
    const isWrongTransfer = reasonCode === "โอนผิด";
    return {
      type: "button",
      // Make "โอนผิด" look like a danger action (red bg, white text).
      style: "primary",
      ...(isWrongTransfer ? { color: "#D32F2F" } : null),
      height: "sm",
      action: {
        type: "postback",
        label,
        data: `nicha_rent_approve|tx=${txId}|reason=${encodeURIComponent(reasonCode)}`,
        displayText: isWrongTransfer
          ? `อนุมัติ: ${label} (ไม่อนุมัติ)`
          : `อนุมัติ: ${label}`,
      },
    };
  };

  const contents = {
    type: "bubble",
    body: {
      type: "box",
      layout: "vertical",
      spacing: "md",
      contents: [
        { type: "text", text: headerText, wrap: true, size: "sm" },
        {
          type: "box",
          layout: "vertical",
          spacing: "sm",
          contents: [
            mkBtn("รวมค่าน้ำ/ไฟ", "รวมค่าน้ำ/ไฟ"),
            mkBtn("หักภาษี 5%", "หักภาษี 5%"),
            mkBtn("จ่ายยอดค้าง", "จ่ายยอดค้าง"),
            mkBtn("อื่นๆ/อนุมัติเลย", "อื่นๆ/อนุมัติเลย"),
            mkBtn("โอนผิด", "โอนผิด"),
          ],
        },
      ],
    },
  };

  return {
    type: "flex" as const,
    altText: `ขออนุมัติยอดค่าเช่า: ${propertyName}`,
    contents,
  };
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
        "กลุ่มนี้ยังไม่ได้ผูกกับสินทรัพย์ค่ะ กดเมนู “ผูกแชทกลุ่มกับสินทรัพย์” ก่อนนะคะ 💚"
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
    if (!event.replyToken) continue;

    const source = event.source;
    const groupId =
      source?.type === "group" && source.groupId ? source.groupId : undefined;
    const lineUserId = source?.userId;

    if (event.type === "postback" && event.postback?.data && lineUserId) {
      const data = event.postback.data;
      if (data.startsWith("nicha_rent_approve|")) {
        const parts = data.split("|").slice(1);
        const kv: Record<string, string> = {};
        for (const p of parts) {
          const [k, ...rest] = p.split("=");
          if (!k) continue;
          kv[k] = rest.join("=") ?? "";
        }
        const txId = kv.tx;
        const reason = kv.reason ? decodeURIComponent(kv.reason) : "";
        if (!txId || !mongoose.Types.ObjectId.isValid(txId)) {
          await replyText(event.replyToken, "ข้อมูลการอนุมัติไม่ถูกต้องค่ะ 💚");
          continue;
        }
        try {
          await connectDB();
          const tx = await RentTransaction.findById(txId).lean();
          if (!tx) {
            await replyText(event.replyToken, "ไม่พบรายการนี้แล้วค่ะ 💚");
            continue;
          }
          const propertyId = (tx as { propertyId: mongoose.Types.ObjectId }).propertyId;
          const prop = await Property.findById(propertyId)
            .select("ownerId name lineGroupId")
            .lean();
          const ownerId = (prop as { ownerId?: string } | null)?.ownerId?.trim();
          if (!ownerId || ownerId !== lineUserId) {
            await replyText(event.replyToken, "ขอโทษค่ะ รายการนี้อนุมัติได้เฉพาะเจ้าของทรัพย์เท่านั้น 💚");
            continue;
          }
          const propName = (prop as { name?: string } | null)?.name?.trim() || "ทรัพย์";
          const groupToNotify = (tx as { lineGroupId?: string }).lineGroupId?.trim()
            || (prop as { lineGroupId?: string } | null)?.lineGroupId?.trim();

          const isWrongTransfer = reason.trim() === "โอนผิด";

          await RentTransaction.updateOne(
            { _id: (tx as { _id: mongoose.Types.ObjectId })._id },
            {
              $set: {
                status: isWrongTransfer ? "rejected" : "accepted",
                remark: reason || undefined,
                approvedAt: new Date(),
                approvedByLineUserId: lineUserId,
              },
            }
          );

          if (isWrongTransfer) {
            await replyText(event.replyToken, "รับทราบค่ะ นิชาจะยังไม่อนุมัติรายการนี้นะคะ ⛔️");
            if (groupToNotify) {
              await pushToGroup(
                groupToNotify,
                `อัปเดตจากเจ้าของห้อง: รายการสลิปของ ${propName} “โอนผิด” จึงยังไม่ถูกบันทึกเป็นค่าเช่านะคะ 💚`
              );
            }
          } else {
            // Align property payment timestamp with slip date.
            const slipDate = (tx as { slipDate?: Date }).slipDate;
            if (slipDate) {
              await Property.updateOne(
                { _id: propertyId },
                { $set: { lastRentPaidAt: slipDate instanceof Date ? slipDate : new Date(slipDate) } }
              );
            }

            await replyText(event.replyToken, "อนุมัติเรียบร้อยค่ะ ✅");

            if (groupToNotify) {
              const remarkText = reason ? ` (บันทึกเพิ่มเติม: ${reason})` : "";
              await pushToGroup(
                groupToNotify,
                `ได้รับยอดชำระของ ${propName} เรียบร้อยแล้วค่ะ ✅${remarkText} ขอบคุณมากนะคะ 💚`
              );
            }
          }
        } catch (e) {
          console.error("[line-webhook] postback approve", e);
          await replyText(event.replyToken, "ระบบขัดข้อง ลองใหม่ภายหลังนะคะ 💚");
        }
        continue;
      }
    }

    if (event.type !== "message") continue;

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
        // Unrecognized text in group: no reply (avoid debug echo / chat noise in prod).
        continue;
      }
      // Text outside group context (e.g. 1:1): no automatic reply.
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

      let groupProperty:
        | {
            _id: mongoose.Types.ObjectId;
            name?: string;
            monthlyRent?: number;
            contractStartDate?: Date;
          }
        | undefined;
      if (groupId) {
        try {
          await connectDB();
          const prop = await Property.findOne({ lineGroupId: groupId })
            .select("_id name monthlyRent contractStartDate")
            .lean();
          if (!prop) {
            groupProperty = undefined;
          } else {
            groupProperty = prop as {
              _id: mongoose.Types.ObjectId;
              name?: string;
              monthlyRent?: number;
              contractStartDate?: Date;
            };
          }
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

      const isSuccess = isEasySlipSuccessJson(verifyResult.bodyText);

      if (groupId && isSuccess) {
        if (!groupProperty) {
          await replyText(
            event.replyToken,
            "ยังไม่ได้ผูกกลุ่มกับสินทรัพย์ค่ะ กดเมนู “ผูกแชทกลุ่มกับสินทรัพย์” ก่อนนะคะ 💚"
          );
          continue;
        }

        let parsed: EasySlipSuccessResponse | null = null;
        try {
          parsed = JSON.parse(verifyResult.bodyText) as EasySlipSuccessResponse;
        } catch {
          parsed = null;
        }

        const slipAmount = parsed?.data?.amountInSlip;
        const slipDateRaw = parsed?.data?.rawSlip?.date;
        const fromName =
          parsed?.data?.rawSlip?.sender?.account?.name?.th ||
          parsed?.data?.rawSlip?.sender?.account?.name?.en ||
          undefined;
        const toName =
          parsed?.data?.rawSlip?.receiver?.account?.name?.th ||
          parsed?.data?.rawSlip?.receiver?.account?.name?.en ||
          undefined;

        const rent = groupProperty.monthlyRent;
        const contractStartDate = groupProperty.contractStartDate;
        const slipDate = slipDateRaw ? new Date(slipDateRaw) : null;

        if (
          typeof rent !== "number" ||
          Number.isNaN(rent) ||
          !contractStartDate ||
          !slipDate ||
          Number.isNaN(slipDate.getTime()) ||
          typeof slipAmount !== "number" ||
          Number.isNaN(slipAmount)
        ) {
          try {
            await connectDB();
            await RentTransaction.create({
              propertyId: groupProperty._id,
              lineGroupId: groupId,
              lineMessageId: event.message.id,
              submittedByLineUserId: lineUserId,
              slipDate: slipDate && !Number.isNaN(slipDate.getTime()) ? slipDate : new Date(),
              amount: typeof slipAmount === "number" ? slipAmount : 0,
              fromName,
              toName,
              periodKey: "unknown",
              status: "error",
              reason: "missing-config-or-slip-fields",
              raw: parsed?.data?.rawSlip ? { rawSlip: parsed.data.rawSlip } : undefined,
            });
          } catch (e) {
            console.error("[line-webhook] rent tx error record", e);
          }

          await replyText(
            event.replyToken,
            "ตรวจสลิปได้ แต่ยังตั้งค่าทรัพย์ไม่ครบค่ะ (ต้องมีวันเริ่มสัญญาและค่าเช่ารายเดือน) กรุณาตั้งค่าในหน้าแก้ไขทรัพย์ก่อนนะคะ 💚"
          );
          continue;
        }

        const periodKey = periodKeyFromSlipDate(contractStartDate, slipDate);
        if (!periodKey) {
          await replyText(
            event.replyToken,
            "ไม่สามารถระบุรอบค่าเช่าจากวันเริ่มสัญญาได้ค่ะ กรุณาตรวจสอบวันเริ่มสัญญาอีกครั้ง 💚"
          );
          continue;
        }

        let paidBillTxId: string | null = null;
        try {
          await connectDB();

          const existingByMessage = await RentTransaction.findOne({
            lineMessageId: event.message.id,
          })
            .select("_id status")
            .lean();
          if (existingByMessage) {
            await replyText(event.replyToken, "สลิปนี้เคยส่งแล้วค่ะ 💚");
            continue;
          }

          const alreadyPaid = await RentTransaction.findOne({
            propertyId: groupProperty._id,
            periodKey,
            status: "accepted",
          })
            .select("_id")
            .lean();
          if (alreadyPaid) {
            await RentTransaction.create({
              propertyId: groupProperty._id,
              lineGroupId: groupId,
              lineMessageId: event.message.id,
              submittedByLineUserId: lineUserId,
              slipDate,
              amount: slipAmount,
              fromName,
              toName,
              periodKey,
              status: "duplicate",
              reason: "already-paid-period",
              raw: parsed?.data?.rawSlip ? { rawSlip: parsed.data.rawSlip } : undefined,
            });
            await replyText(event.replyToken, "เดือนนี้มีการบันทึกการชำระแล้วค่ะ 💚");
            continue;
          }

          if (toCents(slipAmount) !== toCents(rent)) {
            const tx = await RentTransaction.create({
              propertyId: groupProperty._id,
              lineGroupId: groupId,
              lineMessageId: event.message.id,
              submittedByLineUserId: lineUserId,
              slipDate,
              amount: slipAmount,
              fromName,
              toName,
              periodKey,
              status: "pending_owner_approve",
              reason: `amount-mismatch expected=${rent} got=${slipAmount}`,
              raw: parsed?.data?.rawSlip ? { rawSlip: parsed.data.rawSlip } : undefined,
            });

            // 1) Notify group (tenant-facing) without asking tenant to act.
            await replyText(
              event.replyToken,
              `นิชาตรวจพบยอดเงินไม่ตรงกับค่าเช่าค่ะ! 🧐\n\n` +
                `🏠 ทรัพย์: ${groupProperty.name?.trim() || "ทรัพย์"}\n` +
                `💰 ยอดที่ตั้งไว้: ${formatBaht(rent)}\n` +
                `💵 ยอดในสลิป: ${formatBaht(slipAmount)}\n\n` +
                `รบกวนพี่เจ้าของห้องช่วยระบุเหตุผลและกดอนุมัติให้นิชาทาง DM หน่อยนะคะ`
            );

            // 2) DM owner with approval buttons.
            try {
              const ownerLineUserId = (await Property.findById(groupProperty._id)
                .select("ownerId")
                .lean()) as { ownerId?: string } | null;
              const ownerId = ownerLineUserId?.ownerId?.trim();
              if (ownerId) {
                const owner = await User.findOne({ lineUserId: ownerId })
                  .select("name")
                  .lean();
                const ownerName = (owner as { name?: string } | null)?.name?.trim();

                await pushMessages(ownerId, [
                  {
                    type: "text",
                    text:
                      `นิชาตรวจพบยอดเงินไม่ตรงกับค่าเช่าค่ะ! 🧐\n\n` +
                      `🏠 ทรัพย์: ${groupProperty.name?.trim() || "ทรัพย์"}\n` +
                      `💰 ยอดที่ตั้งไว้: ${formatBaht(rent)}\n` +
                      `💵 ยอดในสลิป: ${formatBaht(slipAmount)}\n\n` +
                      `รบกวนพี่เจ้าของห้องช่วยระบุเหตุผลและกดอนุมัติให้นิชาหน่อยนะคะ`,
                  },
                  buildOwnerApprovalFlex({
                    txId: (tx as { _id: mongoose.Types.ObjectId })._id.toString(),
                    propertyName: groupProperty.name?.trim() || "ทรัพย์",
                    expectedRent: rent,
                    slipAmount,
                    ownerName,
                  }),
                ]);
              }
            } catch (e) {
              console.error("[line-webhook] owner approve DM", e);
            }
            continue;
          }

          const txDoc = await RentTransaction.create({
            propertyId: groupProperty._id,
            lineGroupId: groupId,
            lineMessageId: event.message.id,
            submittedByLineUserId: lineUserId,
            slipDate,
            amount: slipAmount,
            fromName,
            toName,
            periodKey,
            status: "accepted",
            raw: parsed?.data?.rawSlip ? { rawSlip: parsed.data.rawSlip } : undefined,
          });
          paidBillTxId = txDoc._id.toString();

          await Property.updateOne(
            { _id: groupProperty._id },
            { $set: { lastRentPaidAt: slipDate } }
          );
        } catch (e) {
          console.error("[line-webhook] rent tx persist", e);
          await replyText(event.replyToken, "ระบบบันทึกข้อมูลขัดข้อง ลองใหม่ภายหลังนะคะ 💚");
          continue;
        }

        if (paidBillTxId) {
          const propTitle = groupProperty.name?.trim() || "ทรัพย์";
          const payer = fromName?.trim() || "ผู้จ่าย";
          const billUri = buildLiffPathUri(`/bill/${paidBillTxId}`);
          const confirmationText = buildPaidRentConfirmationText({
            propertyName: propTitle,
            periodKey,
            fromName,
            toName,
            slipAmount,
          });
          await replyMessages(event.replyToken, [
            { type: "text", text: confirmationText },
            buildPaidRentFlex({
              propertyName: propTitle,
              payerLabel: payer,
              amount: slipAmount,
              billUri,
            }),
          ]);
        }
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
