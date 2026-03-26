/**
 * Map slip / API bank hints to a public logo path under /bank-logos/{key}.svg
 * (simple initial badges — not official trademarks).
 */
export function inferBankLogoKey(
  bankName?: string | null,
  bankCode?: string | null
): string | null {
  const code = bankCode?.trim().toUpperCase();
  if (code) {
    const byCode: Record<string, string> = {
      KBANK: "kbank",
      KBNK: "kbank",
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
    if (byCode[code]) return byCode[code];
  }

  const n = (bankName ?? "").toLowerCase();
  if (!n.trim()) return null;

  const rules: [RegExp, string][] = [
    [/กสิกร|kasikorn|k\s*bank|kbank/i, "kbank"],
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

export function bankLogoPath(key: string): string {
  return `/bank-logos/${key}.svg`;
}
