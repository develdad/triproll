import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TripNewContent from "./_content";

export const metadata = {
  title: "New Trip - TripRoll",
  description: "Plan your next trip with TripRoll",
};

export default function TripNewPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 pt-16">
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
          <TripNewContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
