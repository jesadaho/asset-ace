import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import { RentTransaction } from "@/lib/db/models/rentTransaction";
import { Property } from "@/lib/db/models/property";
import { getLineUserIdFromRequest } from "@/lib/auth/liff";
import { billCycleDescription } from "@/lib/rent/period";
import {
  bankLogoPath,
  extractReceiverTextHints,
  inferBankLogoKey,
  payerBankLogoKeyFromSenderBank,
  resolveBankLogoKey,
  sanitizeRentReceiveBankKey,
} from "@/lib/bank-logo";

const DEFAULT_RECEIVER_LOGO_URL = "/bill-icons/receiver-default.svg";

type EasySlipSenderBank = {
  id?: string;
  name?: string;
  short?: string;
};

type RawSlipShape = {
  sender?: {
    bank?: EasySlipSenderBank;
  };
  receiver?: {
    bank?: string | { name?: { th?: string; en?: string } | string; code?: string };
    account?: {
      name?: { th?: string; en?: string };
      bank?: {
        name?: { th?: string; en?: string } | string;
        code?: string;
      };
      number?: string;
    };
  };
};

function bankNameFromField(
  name: { th?: string; en?: string } | string | undefined
): string | undefined {
  if (!name) return undefined;
  if (typeof name === "string") return name.trim() || undefined;
  return name.th?.trim() || name.en?.trim() || undefined;
}

function receiverFromTxRaw(raw: Record<string, unknown> | undefined): {
  accountName?: string;
  bankName?: string;
  bankCode?: string;
  accountNumber?: string;
} {
  if (!raw) return {};
  const slip = raw.rawSlip as RawSlipShape | undefined;
  const rec = slip?.receiver;
  const acc = rec?.account;
  const accountName = acc?.name?.th?.trim() || acc?.name?.en?.trim();
  const bankCode =
    typeof acc?.bank?.code === "string"
      ? acc.bank.code.trim()
      : typeof rec?.bank === "object" &&
          rec.bank &&
          typeof (rec.bank as { code?: string }).code === "string"
        ? (rec.bank as { code: string }).code.trim()
        : undefined;

  let bankName = bankNameFromField(acc?.bank?.name);
  if (!bankName && typeof rec?.bank === "string") {
    bankName = rec.bank.trim() || undefined;
  }
  if (!bankName && rec?.bank && typeof rec.bank === "object") {
    bankName = bankNameFromField(
      (rec.bank as { name?: { th?: string; en?: string } | string }).name
    );
  }

  return {
    accountName,
    bankName,
    bankCode,
    accountNumber:
      typeof acc?.number === "string" ? acc.number.trim() : undefined,
  };
}

function senderBankFromRawSlip(
  rawSlip: unknown
): EasySlipSenderBank | undefined {
  if (!rawSlip || typeof rawSlip !== "object") return undefined;
  const slip = rawSlip as RawSlipShape;
  const bank = slip.sender?.bank;
  if (!bank || typeof bank !== "object") return undefined;
  return bank;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ txId: string }> }
) {
  const lineUserId = await getLineUserIdFromRequest(request);
  if (!lineUserId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { txId } = await params;
  if (!txId || !mongoose.Types.ObjectId.isValid(txId)) {
    return NextResponse.json({ message: "Invalid id" }, { status: 400 });
  }

  await connectDB();
  const tx = await RentTransaction.findById(txId).lean();
  if (!tx) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  const property = await Property.findById(tx.propertyId).lean();
  if (!property) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  const ownerId = property.ownerId?.trim();
  const tenantLineId = property.tenantLineId?.trim();
  const agentLineId = property.agentLineId?.trim();
  const submitter = tx.submittedByLineUserId?.trim();

  const allowed =
    lineUserId === ownerId ||
    lineUserId === tenantLineId ||
    lineUserId === agentLineId ||
    lineUserId === submitter;

  if (!allowed) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  if (tx.status !== "accepted") {
    return NextResponse.json({ message: "Bill not available" }, { status: 404 });
  }

  const raw =
    tx.raw && typeof tx.raw === "object"
      ? (tx.raw as Record<string, unknown>)
      : undefined;
  const recv = receiverFromTxRaw(raw);
  const rawSlip = raw?.rawSlip;
  const senderBank = senderBankFromRawSlip(rawSlip);

  const payerBankId =
    typeof senderBank?.id === "string" ? senderBank.id.trim() : undefined;
  const payerBankName =
    typeof senderBank?.name === "string" ? senderBank.name.trim() : undefined;
  const payerBankShort =
    typeof senderBank?.short === "string" ? senderBank.short.trim() : undefined;

  const payerLogoKey = payerBankLogoKeyFromSenderBank(senderBank);
  const payerBankLogoUrl = payerLogoKey ? bankLogoPath(payerLogoKey) : null;

  const receiverWalkHints = extractReceiverTextHints(rawSlip);
  const combinedLine = [recv.bankName, recv.accountNumber]
    .filter(Boolean)
    .join(" ")
    .trim();

  let receiverLogoKey = inferBankLogoKey(recv.bankName, recv.bankCode);
  if (!receiverLogoKey && combinedLine) {
    receiverLogoKey = inferBankLogoKey(combinedLine, null);
  }
  if (!receiverLogoKey) {
    receiverLogoKey = resolveBankLogoKey(receiverWalkHints);
  }
  if (!receiverLogoKey) {
    receiverLogoKey = inferBankLogoKey(tx.toName, null);
  }
  const slipReceiverLogoUrl = receiverLogoKey
    ? bankLogoPath(receiverLogoKey)
    : null;

  const ownerRentBankKey = sanitizeRentReceiveBankKey(
    (property as { rentReceiveBankKey?: string }).rentReceiveBankKey
  );

  let receiverBankLogoUrl: string;
  let receiverBankLogoSource: "owner" | "slip" | "default";
  if (ownerRentBankKey) {
    receiverBankLogoUrl = bankLogoPath(ownerRentBankKey);
    receiverBankLogoSource = "owner";
  } else if (slipReceiverLogoUrl) {
    receiverBankLogoUrl = slipReceiverLogoUrl;
    receiverBankLogoSource = "slip";
  } else {
    receiverBankLogoUrl = DEFAULT_RECEIVER_LOGO_URL;
    receiverBankLogoSource = "default";
  }

  const ownerRecvName = (
    property as { rentReceiveAccountName?: string }
  ).rentReceiveAccountName?.trim();
  const ownerRecvNumber = (
    property as { rentReceiveAccountNumber?: string }
  ).rentReceiveAccountNumber?.trim();

  const contractStart = property.contractStartDate;
  let cycleLabel: string | null = null;
  if (
    contractStart instanceof Date &&
    !Number.isNaN(contractStart.getTime())
  ) {
    cycleLabel = billCycleDescription(contractStart, tx.periodKey);
  }

  return NextResponse.json({
    propertyName: property.name ?? "ทรัพย์",
    amount: tx.amount,
    status: "paid" as const,
    slipDate:
      tx.slipDate instanceof Date ? tx.slipDate.toISOString() : undefined,
    periodKey: tx.periodKey,
    cycleLabel,
    fromName: tx.fromName,
    toName: tx.toName,
    payerBankId,
    payerBankName,
    payerBankShort,
    payerBankLogoUrl,
    receiverAccountName: ownerRecvName || recv.accountName || tx.toName,
    receiverBankName: recv.bankName,
    receiverBankCode: recv.bankCode,
    receiverAccountNumber: ownerRecvNumber || recv.accountNumber,
    receiverBankLogoUrl,
    receiverBankLogoSource,
  });
}
