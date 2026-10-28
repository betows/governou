import type { Metadata } from "next";
import { MapView } from "@/components/MapView";

export const metadata: Metadata = { title: "Mapa do voto" };

export default function Page() {
  return <MapView />;
}
