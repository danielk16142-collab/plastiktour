// Reads the "Listings" and "Team" collections from the Wix CMS (Content Manager).
// Falls back to sample data if a collection doesn't exist yet or a query fails,
// so the site still renders correctly before the CMS is populated.
import { items } from "@wix/data";
import { media } from "@wix/sdk";

export type ListingStatus = "For Sale" | "Sold" | "Coming Soon";

export interface Listing {
  _id: string;
  title: string;
  address: string;
  price: number;
  beds: number;
  baths: number;
  sqft: number;
  status: ListingStatus;
  mainPhoto: string;
  gallery: string[];
  description: string;
}

export interface TeamMember {
  _id: string;
  name: string;
  title: string;
  headshot: string;
  bio: string;
  email: string;
  phone: string;
}

// Converts a Wix Media identifier ("wix:image://...") into a real, sized URL.
// Plain https:// URLs (used by the fallback sample data below) pass through untouched.
export function resolveImage(source: string | undefined, width = 1200, height = 900): string {
  if (!source) return "";
  if (!source.startsWith("wix:image://")) return source;
  try {
    return media.getScaledToFillImageUrl(source, width, height, {});
  } catch {
    return "";
  }
}

const FALLBACK_LISTINGS: Listing[] = [
  {
    _id: "fallback-1",
    title: "The Rosedale Estate",
    address: "18 Chestnut Park Road, Rosedale",
    price: 8950000,
    beds: 6,
    baths: 7,
    sqft: 9200,
    status: "For Sale",
    mainPhoto: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1400&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80",
    ],
    description:
      "A gated Rosedale estate set on one of the neighbourhood's widest lots, with a stone facade, a heated motor court, and gardens designed to hold their form through every season.",
  },
  {
    _id: "fallback-2",
    title: "Forest Hill Modern",
    address: "44 Old Forest Hill Road, Forest Hill",
    price: 6200000,
    beds: 5,
    baths: 6,
    sqft: 6800,
    status: "For Sale",
    mainPhoto: "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1400&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1200&q=80",
    ],
    description:
      "A rebuilt modern home behind a Forest Hill facade, with a double height living room, a chef's kitchen opening onto a cedar deck, and a lower level built for a family that entertains.",
  },
  {
    _id: "fallback-3",
    title: "The Bridle Path Manor",
    address: "22 Park Lane Circle, Bridle Path",
    price: 14500000,
    beds: 7,
    baths: 9,
    sqft: 12000,
    status: "Coming Soon",
    mainPhoto: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1400&q=80",
    gallery: [],
    description:
      "A private two acre Bridle Path property with a circular drive, an indoor pool, and a principal suite that occupies its own wing. Available for a preview showing before it reaches the market.",
  },
  {
    _id: "fallback-4",
    title: "Yorkville Sky Residence",
    address: "1 Yorkville Avenue, Penthouse 3",
    price: 4750000,
    beds: 3,
    baths: 4,
    sqft: 3400,
    status: "For Sale",
    mainPhoto: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1400&q=80",
    gallery: [],
    description:
      "A full floor Yorkville penthouse with wraparound terraces, unobstructed skyline views, and direct elevator access, steps from the city's finest galleries and dining rooms.",
  },
  {
    _id: "fallback-5",
    title: "Lawrence Park Classic",
    address: "110 Cheritan Avenue, Lawrence Park",
    price: 5395000,
    beds: 5,
    baths: 5,
    sqft: 5600,
    status: "Sold",
    mainPhoto: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1400&q=80",
    gallery: [],
    description:
      "A center hall Georgian on one of Lawrence Park's most requested crescents, thoughtfully restored while keeping its original millwork, leaded windows, and wide front porch.",
  },
  {
    _id: "fallback-6",
    title: "The Kingsway Retreat",
    address: "36 Prince Edward Drive, The Kingsway",
    price: 3895000,
    beds: 4,
    baths: 4,
    sqft: 4100,
    status: "For Sale",
    mainPhoto: "https://images.unsplash.com/photo-1600210492493-0946911123ea?auto=format&fit=crop&w=1400&q=80",
    gallery: [],
    description:
      "A quiet Kingsway retreat backing onto ravine, with a wall of windows facing the trees, a walkout lower level, and a garden built for long summer evenings.",
  },
];

const FALLBACK_TEAM: TeamMember[] = [
  {
    _id: "fallback-1",
    name: "Margaret Chen",
    title: "Broker of Record",
    headshot: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=800&q=80",
    bio: "Margaret has represented Toronto's finest properties for over twenty years, with a reputation for discretion and results in equal measure.",
    email: "margaret.chen@example.com",
    phone: "+1 (416) 555-0142",
  },
  {
    _id: "fallback-2",
    name: "David Whitfield",
    title: "Senior Real Estate Advisor",
    headshot: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=800&q=80",
    bio: "David built his career on Forest Hill and Rosedale estate sales, and still walks every listing personally before it meets a buyer.",
    email: "david.whitfield@example.com",
    phone: "+1 (416) 555-0198",
  },
  {
    _id: "fallback-3",
    name: "Priya Anand",
    title: "Real Estate Advisor",
    headshot: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=800&q=80",
    bio: "Priya works closely with international buyers relocating to Toronto, guiding them from first showing to closing table.",
    email: "priya.anand@example.com",
    phone: "+1 (416) 555-0173",
  },
  {
    _id: "fallback-4",
    name: "Marcus Bell",
    title: "Real Estate Advisor",
    headshot: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=800&q=80",
    bio: "Marcus specializes in new development and architecturally significant homes across the city's most established pockets.",
    email: "marcus.bell@example.com",
    phone: "+1 (416) 555-0165",
  },
];

// The "gallery" field is a plain Text field in the CMS holding comma-separated
// image URLs, so no Media Manager upload step is needed to seed or edit it.
function parseGallery(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((v) => resolveImage(String(v))).filter(Boolean);
  if (typeof value === "string" && value.trim()) {
    return value
      .split(",")
      .map((v) => resolveImage(v.trim()))
      .filter(Boolean);
  }
  return [];
}

function mapListing(item: Record<string, any>): Listing {
  return {
    _id: item._id,
    title: item.title ?? "",
    address: item.address ?? "",
    price: Number(item.price) || 0,
    beds: Number(item.beds) || 0,
    baths: Number(item.baths) || 0,
    sqft: Number(item.sqft) || 0,
    status: (item.status as ListingStatus) ?? "For Sale",
    mainPhoto: resolveImage(item.mainPhoto),
    gallery: parseGallery(item.gallery),
    description: item.description ?? "",
  };
}

function mapTeamMember(item: Record<string, any>): TeamMember {
  return {
    _id: item._id,
    name: item.name ?? "",
    title: item.title ?? "",
    headshot: resolveImage(item.headshot, 600, 600),
    bio: item.bio ?? "",
    email: item.email ?? "",
    phone: item.phone ?? "",
  };
}

export async function getListings(): Promise<Listing[]> {
  try {
    const results = await items.query("Listings").find();
    if (!results.items.length) return FALLBACK_LISTINGS;
    return results.items.map(mapListing);
  } catch {
    return FALLBACK_LISTINGS;
  }
}

export async function getListingById(id: string): Promise<Listing | undefined> {
  const all = await getListings();
  return all.find((listing) => listing._id === id);
}

export async function getTeam(): Promise<TeamMember[]> {
  try {
    const results = await items.query("Team").find();
    if (!results.items.length) return FALLBACK_TEAM;
    return results.items.map(mapTeamMember);
  } catch {
    return FALLBACK_TEAM;
  }
}

export function formatPrice(price: number): string {
  return price.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}
