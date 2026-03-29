/**
 * Map slip / API bank hints to vendored PNG paths under /bank-logos/{SYMBOL}.png
 * (icons sourced from https://github.com/casperstack/thai-banks-logo — see public/bank-logos/NOTICE.txt).
 */

/** PromptPay-style numeric bank id: coerce number or "4" → "004" for lookup. */
function normalizeNumericBankId(
  id: string | number | null | undefined
): string | null {
  if (id == null) return null;
  const raw = String(id).trim();
  if (!raw) return null;
  if (!/^\d+$/.test(raw)) return null;
  return raw.length <= 3 ? raw.padStart(3, "0") : raw;
}

/**
 * Thai slip / PromptPay style numeric bank id (e.g. EasySlip `sender.bank.id` "004").
 */
export function bankLogoKeyFromNumericBankId(
  id: string | number | null | undefined
): string | null {
  const t = normalizeNumericBankId(id);
  if (!t) return null;
  const map: Record<string, string> = {
    "002": "bbl",
    "004": "kbank",
    "006": "ktb",
    "011": "ttb",
    "014": "scb",
    "022": "cimb",
    "024": "uob",
    "025": "bay",
    "030": "gsb",
    "034": "baac",
    "066": "icbc",
    "067": "tisco",
    "073": "lhb",
  };
  return map[t] ?? null;
}

export function inferBankLogoKey(
  bankName?: string | null,
  bankCode?: string | null
): string | null {
  const code = bankCode?.trim();
  if (code) {
    const fromNumeric = bankLogoKeyFromNumericBankId(code);
    if (fromNumeric) return fromNumeric;
    const upper = code.toUpperCase();
    const byCode: Record<string, string> = {
      KBANK: "kbank",
      KBNK: "kbank",
      KB: "kbank",
      SCB: "scb",
      BBL: "bbl",
      KTB: "ktb",
      TTB: "ttb",
      TMB: "ttb",
      BAY: "bay",
      GSB: "gsb",
      BAAC: "baac",
      CIMB: "cimb",
      UOB: "uob",
      LHB: "lhb",
      TISCO: "tisco",
      ICBC: "icbc",
    };
    if (byCode[upper]) return byCode[upper];
  }

  const n = (bankName ?? "").toLowerCase();
  if (!n.trim()) return null;

  const rules: [RegExp, string][] = [
    [
      /กสิกร|kasikorn|k\s*bank|kbank|k\s*plus|key\s*plus|k\+\s*plus/i,
      "kbank",
    ],
    [/ไทยพาณิชย์|scb|siam\s*commercial/i, "scb"],
    [/กรุงเทพ|bangkok\s*bank|^bbl$/i, "bbl"],
    [/กรุงไทย|krung\s*thai|^ktb$/i, "ktb"],
    [/ทหารไทย|ธนชาต|ttb|tmb/i, "ttb"],
    [/กรุงศรี|krungsri|ayudhya|^bay$/i, "bay"],
    [/ออมสิน|^gsb$/i, "gsb"],
    [/ธ\.?\s*ก\.?\s*ส\.?|baac|เกษตร/i, "baac"],
    [/ซีไอเอ็มบี|cimb/i, "cimb"],
    [/ยูโอบี|uob/i, "uob"],
    [/แลนด์|land\s*and\s*house|^lhb$/i, "lhb"],
    [/ทิสโก้|tisco/i, "tisco"],
    [/ไอซีบีซี|icbc/i, "icbc"],
  ];

  for (const [re, key] of rules) {
    if (re.test(n)) return key;
  }
  return null;
}

/** Keys that match `public/bank-logos/{KEY_UPPERCASE}.png` (e.g. kbank → KBANK.png) */
export const BANK_LOGO_FILE_KEYS = [
  "kbank",
  "scb",
  "bbl",
  "ktb",
  "ttb",
  "bay",
  "gsb",
  "baac",
  "cimb",
  "uob",
  "lhb",
  "tisco",
  "icbc",
] as const;

export type BankLogoFileKey = (typeof BANK_LOGO_FILE_KEYS)[number];

const BANK_LOGO_KEY_SET = new Set<string>(BANK_LOGO_FILE_KEYS);

/** Normalize owner-stored rent payout bank key (settings / PATCH). */
export function sanitizeRentReceiveBankKey(
  input: string | null | undefined
): BankLogoFileKey | null {
  const k = input?.trim().toLowerCase();
  if (!k || !BANK_LOGO_KEY_SET.has(k)) return null;
  return k as BankLogoFileKey;
}

export function bankLogoPath(key: string): string {
  const k = key.trim().toLowerCase();
  const symbol = BANK_LOGO_KEY_SET.has(k) ? k.toUpperCase() : key.trim().toUpperCase();
  return `/bank-logos/${symbol}.png`;
}

/** EasySlip-style sender.bank / sender.account.bank → logo key. */
export function payerBankLogoKeyFromSenderBank(bank: {
  id?: string | number;
  name?: string;
  short?: string;
  code?: string;
} | null | undefined): string | null {
  if (!bank || typeof bank !== "object") return null;
  const name =
    typeof bank.name === "string" && bank.name.trim()
      ? bank.name.trim()
      : null;
  const short =
    typeof bank.short === "string" && bank.short.trim()
      ? bank.short.trim()
      : null;
  const code =
    typeof bank.code === "string" && bank.code.trim()
      ? bank.code.trim()
      : null;
  const idNorm =
    bank.id != null &&
    (typeof bank.id === "string" || typeof bank.id === "number")
      ? normalizeNumericBankId(bank.id) ?? String(bank.id).trim() || null
      : null;

  return (
    inferBankLogoKey(name, short) ||
    inferBankLogoKey(name, code) ||
    inferBankLogoKey(null, code) ||
    inferBankLogoKey(null, idNorm)
  );
}

/** Collect short string leaves under `rawSlip.receiver` for bank-name inference. */
export function extractReceiverTextHints(rawSlip: unknown): string[] {
  if (!rawSlip || typeof rawSlip !== "object") return [];
  const root = rawSlip as Record<string, unknown>;
  const receiver = root.receiver;
  if (!receiver || typeof receiver !== "object") return [];

  const out: string[] = [];
  const walk = (obj: unknown, depth: number) => {
    if (depth <= 0 || obj == null) return;
    if (typeof obj === "string") {
      const t = obj.trim();
      if (t.length >= 2 && t.length < 200) out.push(t);
      return;
    }
    if (typeof obj !== "object" || Array.isArray(obj)) return;
    for (const v of Object.values(obj as Record<string, unknown>)) {
      walk(v, depth - 1);
    }
  };
  walk(receiver, 8);
  return out;
}

/** Try each hint until a bank key matches (order matters — prefer structured bank name first). */
export function resolveBankLogoKey(
  hints: (string | null | undefined)[]
): string | null {
  const seen = new Set<string>();
  for (const h of hints) {
    if (!h?.trim()) continue;
    const t = h.trim();
    if (seen.has(t)) continue;
    seen.add(t);
    const key = inferBankLogoKey(t, null) || inferBankLogoKey(null, t);
    if (key) return key;
  }
  return null;
}
