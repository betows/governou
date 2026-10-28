import type { Metadata } from "next";
import { FactCheckView } from "@/components/FactCheckView";

export const metadata: Metadata = { title: "Checagem de fake news" };

export default function Page() {
  return <FactCheckView />;
}
