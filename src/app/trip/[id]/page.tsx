import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface TripDetailPageProps {
  params: {
    id: string;
  };
}

export const metadata = {
  title: "Trip Details - TripRoll",
  description: "Your trip details",
};

export default function TripDetailPage({ params }: TripDetailPageProps) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 pt-16 px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl border border-silver/20 p-8 sm:p-12">
            <h1 className="text-3xl sm:text-4xl font-display text-charcoal mb-4">
              Trip {params.id}
            </h1>

            <div className="prose prose-sm max-w-none text-slate">
              <p>
                Trip details for ID: {params.id} will be displayed here once the trip is created and confirmed.
              </p>

              <div className="mt-8 space-y-4">
                <div className="p-4 rounded-lg bg-cloud">
                  <h3 className="font-semibold text-charcoal mb-2">Destination</h3>
                  <p className="text-slate">Coming soon</p>
                </div>

                <div className="p-4 rounded-lg bg-cloud">
                  <h3 className="font-semibold text-charcoal mb-2">Itinerary</h3>
                  <p className="text-slate">Coming soon</p>
                </div>

                <div className="p-4 rounded-lg bg-cloud">
                  <h3 className="font-semibold text-charcoal mb-2">Total Price</h3>
                  <p className="text-slate">Coming soon</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
