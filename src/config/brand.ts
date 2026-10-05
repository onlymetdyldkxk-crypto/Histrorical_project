/**
 * ============================================================
 * CENTRAL BRAND CONFIGURATION
 * ------------------------------------------------------------
 * Everything brand-related is configurable from this one file:
 * website name, tagline, currency, contact details, nav labels,
 * footer content and social placeholders.
 *
 * Colors, typography, radius and shadows live in src/index.css
 * inside the @theme block at the top of that file.
 *
 * NOTE: The name below is an intentional placeholder.
 * Replace it when the final brand is decided.
 * ============================================================
 */
export const brand = {
  name: "Modi Script Transliteration Service Provider",
  shortName: "MSTSP",
  tagline: "Careful, expert transliteration of Modi script historical documents.",
  description:
    "Submit a Modi script historical or difficult-to-read document, tell us what you need, and our expert team will review it, confirm a fair quote, and deliver accurate transliteration in a clear, readable format.",
  heroLine: "Make Modi script historical documents easier to read & understand.",

  currency: "₹",
  currencyCode: "INR",

  contact: {
    email: "hello@modiscript-transliteration.example",
    phone: "+91 98000 00000",
    address: "Archive House, Old Town Lane, Pune",
  },
  social: {
    instagram: "#",
    linkedin: "#",
    x: "#",
  },

  nav: [
    { label: "Home", to: "/" },
    { label: "How It Works", to: "/how-it-works" },
    { label: "Services", to: "/services" },
    { label: "My Requests", to: "/dashboard" },
    { label: "Help", to: "/help" },
  ],

  footer: {
    blurb:
      "A quiet, human-first service for historical and hard-to-read documents. Every request is reviewed, quoted and processed manually by our team.",
    columns: [
      {
        title: "Service",
        links: [
          { label: "About", to: "/#about" },
          { label: "How It Works", to: "/how-it-works" },
          { label: "Services", to: "/services" },
        ],
      },
      {
        title: "Support",
        links: [
          { label: "Privacy", to: "/help#privacy" },
          { label: "Terms", to: "/help#terms" },
          { label: "Contact", to: "/help#contact" },
          { label: "Help", to: "/help" },
        ],
      },
    ],
  },
} as const;
