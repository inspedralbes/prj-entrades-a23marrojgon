import ConcertDashboard from "@/components/ConcertDashboard";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Concerts BCN – TixFlow",
  description:
    "Descobreix els pròxims concerts a Barcelona en temps real. Dades actualitzades de Palau Sant Jordi, Razzmatazz i més.",
};

export default function ConcertsPage() {
  return (
    <div className="container mx-auto px-4 py-10">
      <ConcertDashboard />
    </div>
  );
}
