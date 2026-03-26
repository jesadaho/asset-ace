import type { Metadata } from "next";
import { Prompt } from "next/font/google";
import { redirect } from "next/navigation";
import { AssetHubLandingPage } from "@/components/landing/AssetHubLandingPage";
import {
  getDeepLinkTargetFromSearchParams,
  searchParamsPropToURLSearchParams,
} from "@/lib/deep-link";

const prompt = Prompt({
  weight: ["400", "500", "600", "700"],
  subsets: ["thai", "latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Nicha by AssetHub",
  description:
    "ผู้ช่วยส่วนตัวที่ดูแลคอนโดและบ้านให้เช่าบน AssetHub จัดการหาผู้เช่า ติดตามค่าเช่า และสรุปการเงินผ่าน LINE",
};

type HomePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const raw = await searchParams;
  const deep = getDeepLinkTargetFromSearchParams(
    searchParamsPropToURLSearchParams(raw)
  );
  if (deep && deep !== "/") {
    redirect(deep);
  }

  return (
    <div className={prompt.className}>
      <AssetHubLandingPage />
    </div>
  );
}
