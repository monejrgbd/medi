import { MetadataRoute } from "next";

const BASE_URL = "https://hilthealth.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/d/",
          "/login",
          "/signup",
          "/reset-password",
          "/update-password",
          "/auth/",
          "/checkin/",
          "/queue/",
          "/review/",
          "/summary/",
          "/s/",
          "/demo",
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
