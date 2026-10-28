import type { Metadata } from "next";
import { MonitorView } from "@/components/MonitorView";

export const metadata: Metadata = { title: "Monitor do governo atual" };

export default function Page() {
  return <MonitorView />;
}
