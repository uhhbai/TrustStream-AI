import { CountryRisk, FlaggedStreamItem, LivestreamSession, Product, Seller } from "@/types";

export const sellers: Seller[] = [
  {
    id: "seller-beauty-1",
    name: "LumiSkin Official",
    region: "Singapore",
    rating: 4.8,
    verified: true,
    pastViolations: 0
  },
  {
    id: "seller-fashion-1",
    name: "TrendLoop Closet",
    region: "Malaysia",
    rating: 4.2,
    verified: false,
    pastViolations: 1
  },
  {
    id: "seller-tech-1",
    name: "FlashDeal Tech Hub",
    region: "Indonesia",
    rating: 3.1,
    verified: false,
    pastViolations: 5
  }
];

export const products: Product[] = [
  {
    id: "product-serum",
    name: "LumiSkin Barrier Repair Serum",
    category: "Beauty",
    price: 42,
    currency: "SGD",
    evidence: [
      {
        id: "ev-serum-invoice",
        type: "authenticity",
        title: "Official distributor invoice",
        available: true,
        detail: "Invoice number and supplier details shown on stream."
      },
      {
        id: "ev-serum-test",
        type: "certification",
        title: "Dermatology lab report",
        available: true,
        detail: "Dermatologist-tested summary with date and lab brand."
      },
      {
        id: "ev-serum-returns",
        type: "returns",
        title: "Returns policy screenshot",
        available: true,
        detail: "7-day return policy shown via checkout panel."
      },
      {
        id: "ev-serum-demo",
        type: "demo",
        title: "Live texture demo",
        available: true,
        detail: "Seller demonstrates product texture and ingredient label."
      }
    ]
  },
  {
    id: "product-handbag",
    name: "UrbanLuxe Signature Handbag",
    category: "Fashion",
    price: 89,
    currency: "MYR",
    evidence: [
      {
        id: "ev-bag-auth",
        type: "authenticity",
        title: "Supplier receipt",
        available: false,
        detail: "Seller says available after checkout, not shown on stream."
      },
      {
        id: "ev-bag-stock",
        type: "stock",
        title: "Inventory dashboard",
        available: false,
        detail: "No stock dashboard shown while claiming low inventory."
      },
      {
        id: "ev-bag-returns",
        type: "returns",
        title: "Returns terms",
        available: true,
        detail: "Only exchange policy shown, no full refund guarantee."
      }
    ]
  },
  {
    id: "product-earbuds",
    name: "VoltX Pro Max Earbuds",
    category: "Electronics",
    price: 29,
    currency: "USD",
    evidence: [
      {
        id: "ev-tech-fda",
        type: "certification",
        title: "Regulatory approval proof",
        available: false,
        detail: "No valid certificate uploaded."
      },
      {
        id: "ev-tech-auth",
        type: "authenticity",
        title: "Brand authorization letter",
        available: false,
        detail: "Seller repeatedly claims official stock without proof."
      },
      {
        id: "ev-tech-demo",
        type: "demo",
        title: "Live functionality test",
        available: true,
        detail: "Audio demo shown but no battery test or serial verification."
      }
    ]
  }
];

export const livestreamSessions: LivestreamSession[] = [
  {
    id: "session-beauty",
    title: "Night Skin Reset Live",
    country: "Singapore",
    scenario: "trustworthy",
    sellerId: "seller-beauty-1",
    productId: "product-serum",
    viewerCount: 928,
    transcript: [
      {
        id: "beauty-1",
        timestamp: "00:02",
        text: "Welcome everyone, this is our official brand item from LumiSkin."
      },
      {
        id: "beauty-2",
        timestamp: "00:08",
        text: "The serum is dermatologist tested, and here is the report date."
      },
      {
        id: "beauty-3",
        timestamp: "00:14",
        text: "You can see the ingredient list and texture on camera now."
      },
      {
        id: "beauty-4",
        timestamp: "00:23",
        text: "We offer free returns within 7 days if the seal is intact."
      },
      {
        id: "beauty-5",
        timestamp: "00:31",
        text: "Only 25 promo sets left tonight, but we restock weekly."
      },
      {
        id: "beauty-6",
        timestamp: "00:39",
        text: "No guaranteed miracle results, but most users report calmer skin in 2 weeks."
      },
      {
        id: "beauty-7",
        timestamp: "00:48",
        text: "Ask me any question before checkout and I will zoom in on the labels."
      }
    ]
  },
  {
    id: "session-fashion",
    title: "Luxury Look Bag Flash Sale",
    country: "Malaysia",
    scenario: "mixed",
    sellerId: "seller-fashion-1",
    productId: "product-handbag",
    viewerCount: 1744,
    transcript: [
      {
        id: "fashion-1",
        timestamp: "00:03",
        text: "This is 100% original and official brand item, trust me girls."
      },
      {
        id: "fashion-2",
        timestamp: "00:12",
        text: "Limited stock, only 6 pieces left and no restock this month."
      },
      {
        id: "fashion-3",
        timestamp: "00:20",
        text: "I cannot show the supplier invoice now but my regular buyers already know."
      },
      {
        id: "fashion-4",
        timestamp: "00:31",
        text: "Price drops from 299 to 89 right now, this deep discount ends in 2 minutes."
      },
      {
        id: "fashion-5",
        timestamp: "00:43",
        text: "Free returns yes, but only store credit for approved issues."
      },
      {
        id: "fashion-6",
        timestamp: "00:52",
        text: "If you miss this, you will regret because everyone else already checked out."
      }
    ]
  },
  {
    id: "session-tech",
    title: "Midnight Mega Gadget Drop",
    country: "Indonesia",
    scenario: "high_risk",
    sellerId: "seller-tech-1",
    productId: "product-earbuds",
    viewerCount: 4021,
    transcript: [
      {
        id: "tech-1",
        timestamp: "00:02",
        text: "These earbuds are FDA approved and guaranteed results for sound clarity."
      },
      {
        id: "tech-2",
        timestamp: "00:09",
        text: "100% original official brand item, no need to ask for proof."
      },
      {
        id: "tech-3",
        timestamp: "00:17",
        text: "Price slashed from 399 to 29 only for the next 90 seconds."
      },
      {
        id: "tech-4",
        timestamp: "00:24",
        text: "If you do not buy now, your family will miss the best deal of the year."
      },
      {
        id: "tech-5",
        timestamp: "00:33",
        text: "No refunds, no free returns, but trust me this never fails."
      },
      {
        id: "tech-6",
        timestamp: "00:42",
        text: "I repeat, click now now now, stock vanishes every second."
      }
    ]
  }
];

export const flaggedStreams: FlaggedStreamItem[] = [
  {
    sessionId: "session-tech",
    title: "Midnight Mega Gadget Drop",
    country: "Indonesia",
    riskLevel: "High",
    topPattern: "Deep discount pressure + unverifiable authenticity",
    flaggedCount: 14
  },
  {
    sessionId: "session-fashion",
    title: "Luxury Look Bag Flash Sale",
    country: "Malaysia",
    riskLevel: "Moderate",
    topPattern: "Unverified originality claim",
    flaggedCount: 7
  },
  {
    sessionId: "session-beauty",
    title: "Night Skin Reset Live",
    country: "Singapore",
    riskLevel: "Low",
    topPattern: "Mild urgency phrase",
    flaggedCount: 1
  }
];

export const topScamPatterns = [
  { pattern: "Fake urgency countdown", count: 58 },
  { pattern: "Official brand without proof", count: 49 },
  { pattern: "Extreme discount anchoring", count: 43 },
  { pattern: "Guaranteed results promise", count: 31 }
];

export const aseanRiskOverview: CountryRisk[] = [
  { country: "Indonesia", index: 78, trend: "rising" },
  { country: "Vietnam", index: 61, trend: "stable" },
  { country: "Thailand", index: 56, trend: "stable" },
  { country: "Malaysia", index: 52, trend: "declining" },
  { country: "Philippines", index: 48, trend: "rising" },
  { country: "Singapore", index: 29, trend: "declining" }
];

export const mockSummaries = {
  "session-beauty":
    "Mostly evidence-backed beauty stream with transparent return policy and minimal urgency pressure.",
  "session-fashion":
    "Mixed-quality stream with originality and stock claims that were not fully proven on-screen.",
  "session-tech":
    "High-risk electronics pitch with extreme urgency, unverifiable authenticity, and guarantee language."
};
