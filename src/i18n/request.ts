import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";

const supportedLocales = ["th", "en"] as const;
const defaultLocale = "th";

export default getRequestConfig(async () => {
  const store = await cookies();
  const locale = store.get("NEXT_LOCALE")?.value ?? defaultLocale;
  const safeLocale = supportedLocales.includes(locale as (typeof supportedLocales)[number])
    ? locale
    : defaultLocale;

  return {
    locale: safeLocale,
    messages: (await import(`../../messages/${safeLocale}.json`)).default,
  };
});
