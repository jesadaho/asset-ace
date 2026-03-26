import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import { RentTransaction } from "@/lib/db/models/rentTransaction";
import { Property } from "@/lib/db/models/property";
import { getLineUserIdFromRequest } from "@/lib/auth/liff";
import { billCycleDescription } from "@/lib/rent/period";

type RawSlipShape = {
  receiver?: {
    account?: {
      name?: { th?: string; en?: string };
      bank?: { name?: { th?: string; en?: string } | string };
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
  accountNumber?: string;
} {
  if (!raw) return {};
  const slip = raw.rawSlip as RawSlipShape | undefined;
  const acc = slip?.receiver?.account;
  const accountName = acc?.name?.th?.trim() || acc?.name?.en?.trim();
  return {
    accountName,
    bankName: bankNameFromField(acc?.bank?.name),
    accountNumber:
      typeof acc?.number === "string" ? acc.number.trim() : undefined,
  };
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
    receiverAccountName: recv.accountName ?? tx.toName,
    receiverBankName: recv.bankName,
    receiverAccountNumber: recv.accountNumber,
  });
}
