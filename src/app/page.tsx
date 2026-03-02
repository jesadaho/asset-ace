import type { Metadata } from "next";
import { Prompt } from "next/font/google";
import { AssetHubLandingPage } from "@/components/landing/AssetHubLandingPage";

const prompt = Prompt({
  weight: ["400", "500", "600", "700"],
  subsets: ["thai", "latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Porjai by AssetHub",
  description: "ผู้ช่วยส่วนตัวที่ดูแลคอนโดและบ้านให้เช่าบน AssetHub จัดการหาผู้เช่า ติดตามค่าเช่า และสรุปการเงินผ่าน LINE",
};

export default function HomePage() {
  return (
    <div className={prompt.className}>
      <AssetHubLandingPage />
    </div>
  );
}
