import type { Metadata } from "next";
import { CompareView } from "@/components/CompareView";

export const metadata: Metadata = { title: "Comparar governos" };

export default function Page() {
  return <CompareView />;
}
