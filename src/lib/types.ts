export type TravelDNAAxes = {
  adventure: number;    // -1 (relaxation) to 1 (adventure)
  social: number;       // -1 (solitary) to 1 (social)
  structure: number;    // -1 (spontaneous) to 1 (structured)
  cultural: number;     // -1 (sensory) to 1 (cultural)
  budget: number;       // -1 (budget) to 1 (splurge)
  energy: number;       // -1 (calm) to 1 (energetic)
};

export type TravelDNAArchetype =
  | "Explorer-Wanderer"
  | "Luxury Lounger"
  | "Culture Seeker"
  | "Thrill Chaser"
  | "Mindful Nomad";

export type TravelDNAResult = {
  axes: TravelDNAAxes;
  archetype: TravelDNAArchetype;
  completedAt: string;
};

export type TripRequest = {
  id?: string;
  userId?: string;
  departureDate: string;
  returnDate: string;
  budgetMin: number;
  budgetMax: number;
  partySize: number;
  partyType: "solo" | "couple" | "small-group" | "group";
  departureCity: string;
  constraints: {
    dietary: string[];
    mobility: string[];
    passport: string[];
    other: string;
  };
  travelDNA?: TravelDNAResult;
  status: "draft" | "submitted" | "curating" | "ready" | "booked" | "completed";
  createdAt: string;
};

export type Trip = {
  id: string;
  userId: string;
  tripRequest: TripRequest;
  destination: string;
  startDate: string;
  endDate: string;
  price: number;
  itinerary: {
    flights: { departure: string; arrival: string; airline: string };
    accommodation: { name: string; nights: number };
    activities: string[];
  };
  status: "available" | "booked" | "completed" | "cancelled";
  createdAt: string;
};

export type Destination = {
  id: string;
  name: string;
  country: string;
  region: string;
  lat: number;
  lng: number;
  description: string;
  imageUrl: string;
  tags: string[];
  avgPrice: number;
  bestTime: string;
};

export type User = {
  id: string;
  email: string;
  name: string;
  travelDNA?: TravelDNAResult;
  createdAt: string;
  trips: Trip[];
};

export type TravelDNAQuestion = {
  id: number;
  axis: keyof TravelDNAAxes;
  question: string;
  optionA: {
    label: string;
    emoji: string;
    image: string;
    gradientFrom: string;
    gradientTo: string;
    value: number;
  };
  optionB: {
    label: string;
    emoji: string;
    image: string;
    gradientFrom: string;
    gradientTo: string;
    value: number;
  };
};
