type PricingFields = {
  listingType?: string;
  saleWithTenant?: boolean;
  price?: number | null;
  salePrice?: number | null;
  monthlyRent?: number | null;
};

function normalizeAmount(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : undefined;
}

export function getInferredSalePrice(fields: PricingFields) {
  const explicitSalePrice = normalizeAmount(fields.salePrice);
  if (explicitSalePrice != null) return explicitSalePrice;

  if (fields.listingType === "sale" && fields.saleWithTenant !== true) {
    return normalizeAmount(fields.price);
  }

  return undefined;
}

export function getInferredMonthlyRent(fields: PricingFields) {
  const explicitMonthlyRent = normalizeAmount(fields.monthlyRent);
  if (explicitMonthlyRent != null) return explicitMonthlyRent;

  if (fields.listingType === "rent") {
    return normalizeAmount(fields.price);
  }

  if (fields.listingType === "sale" && fields.saleWithTenant === true) {
    return normalizeAmount(fields.price);
  }

  return undefined;
}

export function getPrimaryDisplayPrice(fields: PricingFields) {
  if (fields.listingType === "sale") {
    return getInferredSalePrice(fields) ?? getInferredMonthlyRent(fields) ?? 0;
  }

  return getInferredMonthlyRent(fields) ?? normalizeAmount(fields.price) ?? 0;
}

export function getStoredPrimaryPrice(fields: PricingFields) {
  if (fields.listingType === "sale") {
    return getInferredSalePrice(fields) ?? 0;
  }

  return getInferredMonthlyRent(fields) ?? 0;
}
