import type { Metadata } from "next";
import { Methodology } from "@/components/Methodology";

export const metadata: Metadata = { title: "Metodologia" };

export default function Page() {
  return <Methodology />;
}
