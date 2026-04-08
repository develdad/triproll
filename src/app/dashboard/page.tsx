import Link from "next/link";

export const metadata = {
  title: "Dashboard - TripRoll",
  description: "Your TripRoll dashboard",
};

export default function DashboardPage() {
  return (
    <div className="max-w-6xl">
      {/* Welcome Section */}
      <div className="mb-8">
        <h2 className="text-3xl font-display text-charcoal mb-2">Welcome back, Traveler!</h2>
        <p className="text-slate">Ready for your next adventure?</p>
      </div>

      {/* CTA Card */}
      <div className="bg-gradient-to-br from-teal-deep to-ocean rounded-2xl p-8 sm:p-12 text-white mb-8 border border-teal-light/20">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-center">
          <div>
            <h3 className="text-2xl sm:text-3xl font-display mb-4">Start Your First Trip</h3>
            <p className="text-teal-light/90 mb-6">
              Take our Travel DNA vibe-check to discover your travel personality, then let our AI curate your perfect personalized trip.
            </p>
            <Link
              href="/travel-dna"
              className="inline-block bg-white text-teal-deep px-6 py-3 rounded-full font-semibold hover:shadow-lg transition-all"
            >
              Discover Your Travel DNA
            </Link>
          </div>
          <div className="text-6xl text-center">🌍</div>
        </div>
      </div>

      {/* Trips Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upcoming Trips */}
        <section>
          <h3 className="text-xl font-semibold text-charcoal mb-4">Upcoming Trips</h3>
          <div className="bg-white rounded-2xl border border-silver/20 p-8 text-center py-12">
            <div className="text-4xl mb-3">✈️</div>
            <p className="text-slate mb-4">No upcoming trips yet</p>
            <p className="text-sm text-silver mb-6">
              Start planning your next adventure to see it here.
            </p>
            <Link
              href="/trip/new"
              className="inline-block text-teal-deep border border-teal-deep px-4 py-2 rounded-full hover:bg-teal-light/10 transition-colors text-sm font-semibold"
            >
              Plan a Trip
            </Link>
          </div>
        </section>

        {/* Past Trips */}
        <section>
          <h3 className="text-xl font-semibold text-charcoal mb-4">Past Trips</h3>
          <div className="bg-white rounded-2xl border border-silver/20 p-8 text-center py-12">
            <div className="text-4xl mb-3">📸</div>
            <p className="text-slate mb-4">No past trips yet</p>
            <p className="text-sm text-silver">
              Your completed trips and memories will appear here.
            </p>
          </div>
        </section>
      </div>

      {/* Quick Stats */}
      <section className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-silver/20 p-6">
          <div className="text-2xl font-semibold text-teal-deep mb-1">0</div>
          <div className="text-sm text-slate">Trips Booked</div>
        </div>
        <div className="bg-white rounded-xl border border-silver/20 p-6">
          <div className="text-2xl font-semibold text-teal-deep mb-1">0</div>
          <div className="text-sm text-slate">Countries Visited</div>
        </div>
        <div className="bg-white rounded-xl border border-silver/20 p-6">
          <div className="text-2xl font-semibold text-teal-deep mb-1">0</div>
          <div className="text-sm text-slate">Days Traveled</div>
        </div>
      </section>
    </div>
  );
}
