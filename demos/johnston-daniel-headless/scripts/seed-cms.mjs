// One-time script to populate the "Listings" and "Team" CMS collections with
// sample data. Run this AFTER you've created both collections in the Wix
// Dashboard's Content Manager (see the field spec in README.md).
//
// Usage:
//   WIX_API_KEY=... WIX_ACCOUNT_ID=... WIX_SITE_ID=... node scripts/seed-cms.mjs
//
// Where to find each value:
//   WIX_API_KEY    Generate a fresh one at manage.wix.com/account/api-keys
//   WIX_ACCOUNT_ID In wix.config.json at your project root ("accountId")
//   WIX_SITE_ID    In wix.config.json at your project root ("siteId" or "metaSiteId")
//
// This script is idempotent-ish: it inserts with fixed IDs, so re-running it
// after the first successful run will fail on duplicate IDs. Delete the
// existing items in the Content Manager first if you want to reseed.

import { createClient, ApiKeyStrategy } from "@wix/sdk";
import { items } from "@wix/data";

const { WIX_API_KEY, WIX_ACCOUNT_ID, WIX_SITE_ID } = process.env;

if (!WIX_API_KEY || !WIX_ACCOUNT_ID || !WIX_SITE_ID) {
  console.error(
    "Missing required env vars. Set WIX_API_KEY, WIX_ACCOUNT_ID, and WIX_SITE_ID before running this script.",
  );
  process.exit(1);
}

const client = createClient({
  modules: { items },
  auth: ApiKeyStrategy({
    apiKey: WIX_API_KEY,
    accountId: WIX_ACCOUNT_ID,
    siteId: WIX_SITE_ID,
  }),
});

const listings = [
  {
    _id: "jd-listing-1",
    title: "The Rosedale Estate",
    address: "18 Chestnut Park Road, Rosedale",
    price: 8950000,
    beds: 6,
    baths: 7,
    sqft: 9200,
    status: "For Sale",
    mainPhoto: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1400&q=80",
    gallery:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80, https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80",
    description:
      "A gated Rosedale estate set on one of the neighbourhood's widest lots, with a stone facade, a heated motor court, and gardens designed to hold their form through every season.",
  },
  {
    _id: "jd-listing-2",
    title: "Forest Hill Modern",
    address: "44 Old Forest Hill Road, Forest Hill",
    price: 6200000,
    beds: 5,
    baths: 6,
    sqft: 6800,
    status: "For Sale",
    mainPhoto: "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1400&q=80",
    gallery: "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1200&q=80",
    description:
      "A rebuilt modern home behind a Forest Hill facade, with a double height living room, a chef's kitchen opening onto a cedar deck, and a lower level built for a family that entertains.",
  },
  {
    _id: "jd-listing-3",
    title: "The Bridle Path Manor",
    address: "22 Park Lane Circle, Bridle Path",
    price: 14500000,
    beds: 7,
    baths: 9,
    sqft: 12000,
    status: "Coming Soon",
    mainPhoto: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1400&q=80",
    gallery: "",
    description:
      "A private two acre Bridle Path property with a circular drive, an indoor pool, and a principal suite that occupies its own wing. Available for a preview showing before it reaches the market.",
  },
  {
    _id: "jd-listing-4",
    title: "Yorkville Sky Residence",
    address: "1 Yorkville Avenue, Penthouse 3",
    price: 4750000,
    beds: 3,
    baths: 4,
    sqft: 3400,
    status: "For Sale",
    mainPhoto: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1400&q=80",
    gallery: "",
    description:
      "A full floor Yorkville penthouse with wraparound terraces, unobstructed skyline views, and direct elevator access, steps from the city's finest galleries and dining rooms.",
  },
  {
    _id: "jd-listing-5",
    title: "Lawrence Park Classic",
    address: "110 Cheritan Avenue, Lawrence Park",
    price: 5395000,
    beds: 5,
    baths: 5,
    sqft: 5600,
    status: "Sold",
    mainPhoto: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1400&q=80",
    gallery: "",
    description:
      "A center hall Georgian on one of Lawrence Park's most requested crescents, thoughtfully restored while keeping its original millwork, leaded windows, and wide front porch.",
  },
  {
    _id: "jd-listing-6",
    title: "The Kingsway Retreat",
    address: "36 Prince Edward Drive, The Kingsway",
    price: 3895000,
    beds: 4,
    baths: 4,
    sqft: 4100,
    status: "For Sale",
    mainPhoto: "https://images.unsplash.com/photo-1600210492493-0946911123ea?auto=format&fit=crop&w=1400&q=80",
    gallery: "",
    description:
      "A quiet Kingsway retreat backing onto ravine, with a wall of windows facing the trees, a walkout lower level, and a garden built for long summer evenings.",
  },
];

const team = [
  {
    _id: "jd-team-1",
    name: "Margaret Chen",
    title: "Broker of Record",
    headshot: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=800&q=80",
    bio: "Margaret has represented Toronto's finest properties for over twenty years, with a reputation for discretion and results in equal measure.",
    email: "margaret.chen@example.com",
    phone: "+1 (416) 555-0142",
  },
  {
    _id: "jd-team-2",
    name: "David Whitfield",
    title: "Senior Real Estate Advisor",
    headshot: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=800&q=80",
    bio: "David built his career on Forest Hill and Rosedale estate sales, and still walks every listing personally before it meets a buyer.",
    email: "david.whitfield@example.com",
    phone: "+1 (416) 555-0198",
  },
  {
    _id: "jd-team-3",
    name: "Priya Anand",
    title: "Real Estate Advisor",
    headshot: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=800&q=80",
    bio: "Priya works closely with international buyers relocating to Toronto, guiding them from first showing to closing table.",
    email: "priya.anand@example.com",
    phone: "+1 (416) 555-0173",
  },
  {
    _id: "jd-team-4",
    name: "Marcus Bell",
    title: "Real Estate Advisor",
    headshot: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=800&q=80",
    bio: "Marcus specializes in new development and architecturally significant homes across the city's most established pockets.",
    email: "marcus.bell@example.com",
    phone: "+1 (416) 555-0165",
  },
];

async function seed() {
  console.log(`Inserting ${listings.length} listings...`);
  for (const listing of listings) {
    try {
      await client.items.insert("Listings", listing);
      console.log(`  OK: ${listing.title}`);
    } catch (error) {
      console.error(`  FAILED: ${listing.title} — ${error?.message ?? error}`);
    }
  }

  console.log(`Inserting ${team.length} team members...`);
  for (const member of team) {
    try {
      await client.items.insert("Team", member);
      console.log(`  OK: ${member.name}`);
    } catch (error) {
      console.error(`  FAILED: ${member.name} — ${error?.message ?? error}`);
    }
  }

  console.log("Done.");
}

seed();
