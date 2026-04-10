import { redirect } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getTrip } from "@/app/actions";

interface TripDetailPageProps {
  params: Promise<{ id: string }>;
}

export const metadata = {
  title: "Your Trip - TripRoll",
  description: "Your personalized trip details and itinerary",
};

export default async function TripDetailPage({ params }: TripDetailPageProps) {
  const { id } = await params;
  const trip = await getTrip(id);

  if (!trip) {
    redirect("/dashboard");
  }

  const itinerary = trip.itinerary as {
    flights: {
      outbound: { from: string; to: string; date: string; airline: string; estimatedHours?: number };
      return: { from: string; to: string; date: string; airline: string; estimatedHours?: number };
    };
    accommodation: { name: string; nights: number; type: string };
    activities: string[];
    travelInfo?: {
      estimatedOneWayHours: number;
      travelDaysEachWay: number;
      stayNights: number;
      activityDays: number;
    };
  };

  const totalPrice = (trip.price_cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });

  const startDate = new Date(trip.start_date).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const endDate = new Date(trip.end_date).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const totalNights = Math.max(
    1,
    Math.ceil(
      (new Date(trip.end_date).getTime() -
        new Date(trip.start_date).getTime()) /
        (1000 * 60 * 60 * 24)
    )
  );

  // Use travelInfo if available (new trips), fall back to totalNights (legacy)
  const stayNights = itinerary.travelInfo?.stayNights ?? totalNights;
  const activityDays = itinerary.travelInfo?.activityDays ?? itinerary.activities.length;
  const estimatedFlightHours = itinerary.travelInfo?.estimatedOneWayHours ?? itinerary.flights.outbound.estimatedHours;

  return (
    <div className="flex flex-col min-h-screen bg-cloud">
      <Navbar />

      <main className="flex-1 pt-20 pb-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Hero / Destination Header */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-deep to-teal-bright p-8 sm:p-12 text-white">
            <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-sm font-medium">
              {trip.status === "available"
                ? "Ready to Book"
                : trip.status === "booked"
                ? "Booked"
                : trip.status}
            </div>

            <p className="text-teal-light/80 text-sm font-medium uppercase tracking-wider mb-2">
              Your Destination
            </p>
            <h1 className="text-4xl sm:text-5xl font-display mb-2">
              {trip.destination_name}
            </h1>
            <p className="text-xl text-white/80">{trip.destination_country}</p>

            <div className="mt-6 flex flex-wrap gap-6 text-sm">
              <div>
                <span className="text-white/60 block">Dates</span>
                <span className="font-medium">
                  {startDate} &ndash; {endDate}
                </span>
              </div>
              <div>
                <span className="text-white/60 block">Trip Length</span>
                <span className="font-medium">
                  {totalNights} {totalNights === 1 ? "night" : "nights"} total
                </span>
              </div>
              {stayNights < totalNights && (
                <div>
                  <span className="text-white/60 block">On the Ground</span>
                  <span className="font-medium">
                    {stayNights} {stayNights === 1 ? "night" : "nights"}
                  </span>
                </div>
              )}
              {estimatedFlightHours && (
                <div>
                  <span className="text-white/60 block">Flight Time</span>
                  <span className="font-medium">~{estimatedFlightHours}h each way</span>
                </div>
              )}
              <div>
                <span className="text-white/60 block">Total Price</span>
                <span className="font-medium text-lg">{totalPrice}</span>
              </div>
            </div>
          </div>

          {/* Flights */}
          <div className="bg-white rounded-2xl border border-silver/20 p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-teal-bright/10 flex items-center justify-center text-xl">
                &#9992;
              </div>
              <h2 className="text-xl font-display text-charcoal">Flights</h2>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {/* Outbound */}
              <div className="p-4 rounded-xl bg-cloud border border-silver/10">
                <p className="text-xs font-medium uppercase tracking-wider text-teal-bright mb-3">
                  Outbound
                </p>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-charcoal font-semibold">
                    {itinerary.flights.outbound.from}
                  </span>
                  <span className="text-silver">&rarr;</span>
                  <span className="text-charcoal font-semibold">
                    {itinerary.flights.outbound.to}
                  </span>
                </div>
                <p className="text-sm text-slate">
                  {new Date(
                    itinerary.flights.outbound.date
                  ).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
                <p className="text-sm text-slate mt-1">
                  {itinerary.flights.outbound.airline}
                  {itinerary.flights.outbound.estimatedHours && (
                    <span className="text-silver ml-2">~{itinerary.flights.outbound.estimatedHours}h</span>
                  )}
                </p>
              </div>

              {/* Return */}
              <div className="p-4 rounded-xl bg-cloud border border-silver/10">
                <p className="text-xs font-medium uppercase tracking-wider text-peach mb-3">
                  Return
                </p>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-charcoal font-semibold">
                    {itinerary.flights.return.from}
                  </span>
                  <span className="text-silver">&rarr;</span>
                  <span className="text-charcoal font-semibold">
                    {itinerary.flights.return.to}
                  </span>
                </div>
                <p className="text-sm text-slate">
                  {new Date(itinerary.flights.return.date).toLocaleDateString(
                    "en-US",
                    {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    }
                  )}
                </p>
                <p className="text-sm text-slate mt-1">
                  {itinerary.flights.return.airline}
                  {itinerary.flights.return.estimatedHours && (
                    <span className="text-silver ml-2">~{itinerary.flights.return.estimatedHours}h</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Accommodation */}
          <div className="bg-white rounded-2xl border border-silver/20 p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-peach/10 flex items-center justify-center text-xl">
                &#127976;
              </div>
              <h2 className="text-xl font-display text-charcoal">
                Accommodation
              </h2>
            </div>

            <div className="p-4 rounded-xl bg-cloud border border-silver/10">
              <h3 className="text-charcoal font-semibold text-lg">
                {itinerary.accommodation.name}
              </h3>
              <div className="flex gap-4 mt-2 text-sm text-slate">
                <span>{itinerary.accommodation.type}</span>
                <span>
                  {itinerary.accommodation.nights}{" "}
                  {itinerary.accommodation.nights === 1 ? "night" : "nights"}
                </span>
              </div>
            </div>
          </div>

          {/* Activities */}
          <div className="bg-white rounded-2xl border border-silver/20 p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-mint/20 flex items-center justify-center text-xl">
                &#127758;
              </div>
              <h2 className="text-xl font-display text-charcoal">
                Activities &amp; Experiences
              </h2>
            </div>

            <div className="space-y-3">
              {itinerary.activities.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-start gap-4 p-4 rounded-xl bg-cloud border border-silver/10"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-teal-bright/10 flex items-center justify-center text-sm font-semibold text-teal-bright">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-charcoal font-medium">{activity}</p>
                    <p className="text-xs text-slate mt-1">
                      Day {index + 1} of {activityDays}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Price Summary & CTA */}
          <div className="bg-white rounded-2xl border border-silver/20 p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-sand/40 flex items-center justify-center text-xl">
                &#128176;
              </div>
              <h2 className="text-xl font-display text-charcoal">
                Price Summary
              </h2>
            </div>

            <div className="flex items-end justify-between p-4 rounded-xl bg-cloud border border-silver/10">
              <div>
                <p className="text-sm text-slate">Total package price</p>
                <p className="text-3xl font-display text-charcoal mt-1">
                  {totalPrice}
                </p>
                <p className="text-xs text-slate mt-1">
                  Includes flights, accommodation, and activities
                </p>
              </div>
              {trip.status === "available" && (
                <button
                  className="px-6 py-3 rounded-full bg-peach text-white font-semibold hover:bg-coral transition-colors cursor-not-allowed opacity-75"
                  disabled
                  title="Booking coming soon"
                >
                  Book This Trip
                </button>
              )}
            </div>
            {trip.status === "available" && (
              <p className="text-xs text-slate text-center mt-3">
                Booking functionality coming soon. Your trip details are saved.
              </p>
            )}
          </div>

          {/* Back links */}
          <div className="flex flex-wrap gap-4 justify-center pt-2 pb-8">
            <Link
              href="/dashboard"
              className="px-6 py-2.5 rounded-full border border-silver/30 text-slate hover:text-charcoal hover:border-charcoal/30 transition-colors text-sm font-medium"
            >
              Back to Dashboard
            </Link>
            <Link
              href="/trip/new"
              className="px-6 py-2.5 rounded-full bg-teal-bright text-white hover:bg-teal-deep transition-colors text-sm font-medium"
            >
              Plan Another Trip
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
