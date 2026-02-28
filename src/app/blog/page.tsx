import { Metadata } from "next";
import Navbar from "@/components/Navbar";
import { getAllPosts } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog — Hilthealth | Walk-In Clinic Insights for Canadian Healthcare",
  description:
    "Practical guides on walk-in clinic wait times, AI pre-screening, patient intake, and the family doctor shortage in Canada.",
};

export default function BlogPage() {
  const posts = getAllPosts();

  const pillars = posts.filter((p) => p.pillar === "self");
  const articles = posts.filter((p) => p.pillar !== "self");

  return (
    <>
      <Navbar />
      <main className="bg-white">
        {/* Hero */}
        <section className="bg-gradient-to-b from-blue-50/60 to-white pt-20 pb-16">
          <div className="mx-auto max-w-[1200px] px-6">
            <h1 className="mb-4 text-4xl font-bold tracking-tight text-ink sm:text-5xl">
              Blog
            </h1>
            <p className="max-w-2xl text-lg leading-relaxed text-slate">
              Practical guides on reducing wait times, modernizing patient
              intake, and running a better walk-in clinic in Canada.
            </p>
          </div>
        </section>

        {/* Pillar guides */}
        <section className="py-16">
          <div className="mx-auto max-w-[1200px] px-6">
            <h2 className="mb-8 text-2xl font-bold text-ink">
              Comprehensive Guides
            </h2>
            <div className="grid gap-6 sm:grid-cols-2">
              {pillars.map((post) => (
                <a
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="group rounded-2xl border border-gray-100 bg-white p-8 shadow-sm transition-shadow hover:shadow-md"
                >
                  <span className="mb-3 inline-block rounded-full bg-hilt-blue/10 px-3 py-1 text-xs font-semibold text-hilt-blue">
                    Pillar Guide
                  </span>
                  <h3 className="mb-2 text-xl font-semibold text-ink group-hover:text-hilt-blue transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-slate line-clamp-2">
                    {post.description}
                  </p>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* All articles */}
        <section className="bg-snow py-16">
          <div className="mx-auto max-w-[1200px] px-6">
            <h2 className="mb-8 text-2xl font-bold text-ink">All Articles</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {articles.map((post) => (
                <a
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
                >
                  <h3 className="mb-2 text-lg font-semibold text-ink group-hover:text-hilt-blue transition-colors leading-snug">
                    {post.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-slate line-clamp-2">
                    {post.description}
                  </p>
                </a>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white py-12 border-t border-gray-100">
        <div className="mx-auto max-w-[1200px] px-6 text-center">
          <p className="mb-2 text-2xl font-bold text-hilt-blue tracking-tight">
            hilthealth
          </p>
          <p className="mb-4 text-slate">
            Built in Toronto. Expanding across Canada.
          </p>
          <div className="mb-4 flex items-center justify-center gap-6 text-sm text-ash">
            <a
              href="/blog"
              className="hover:text-slate transition-colors"
            >
              Blog
            </a>
            <a
              href="/privacy"
              className="hover:text-slate transition-colors"
            >
              Privacy Policy
            </a>
            <a
              href="/pricing"
              className="hover:text-slate transition-colors"
            >
              Pricing
            </a>
            <a
              href="mailto:hello@hilthealth.com"
              className="hover:text-slate transition-colors"
            >
              Contact
            </a>
          </div>
          <p className="text-xs text-ash">Built in Canada</p>
          <p className="mt-2 text-xs text-ash">Powered by <a href="https://veldsystems.com" target="_blank" rel="noopener noreferrer" className="hover:text-slate transition-colors underline">veldsystems.com</a></p>
        </div>
      </footer>
    </>
  );
}
