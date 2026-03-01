import type { Metadata } from "next";
import { AssetHubLandingPage } from "@/components/landing/AssetHubLandingPage";

export const metadata: Metadata = {
  title: "AssetHub",
  description: "Find your perfect living space. Browse condos and properties with quick search.",
};

export default function HomePage() {
  return <AssetHubLandingPage />;
}
