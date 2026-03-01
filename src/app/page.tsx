import type { Metadata } from "next";
import { AssetHubLandingPage } from "@/components/landing/AssetHubLandingPage";

export const metadata: Metadata = {
  title: "Porjai by AssetHub",
  description: "ผู้ช่วยส่วนตัวที่ดูแลคอนโดและบ้านให้เช่าบน AssetHub จัดการหาผู้เช่า ติดตามค่าเช่า และสรุปการเงินผ่าน LINE",
};

export default function HomePage() {
  return <AssetHubLandingPage />;
}
