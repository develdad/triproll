import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Keep private app surfaces out of the index.
      disallow: ["/dashboard", "/trip/", "/auth/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
