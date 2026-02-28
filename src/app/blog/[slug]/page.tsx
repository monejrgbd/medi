import { Metadata } from "next";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import { getAllPosts, getPostBySlug } from "@/lib/blog";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return {};

  return {
    title: `${post.title} — Hilthealth`,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) notFound();

  return (
    <>
      <Navbar />
      <main className="bg-white">
        <article className="mx-auto max-w-[780px] px-6 pt-16 pb-20">
          <div className="mb-10">
            <a
              href="/blog"
              className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-hilt-blue hover:underline"
            >
              <svg
                width="16"
                height="16"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 19.5 8.25 12l7.5-7.5"
                />
              </svg>
              Back to Blog
            </a>
            <p className="mb-2 text-sm text-ash">{post.date}</p>
          </div>

          <div
            className="prose"
            dangerouslySetInnerHTML={{ __html: post.contentHtml }}
          />
        </article>

        {/* CTA */}
        <section className="bg-snow py-16 border-t border-gray-100">
          <div className="mx-auto max-w-[780px] px-6 text-center">
            <h2 className="mb-3 text-2xl font-bold text-ink">
              Ready to reduce wait times at your clinic?
            </h2>
            <p className="mb-6 text-slate">
              Hilthealth uses AI to pre-screen patients before they see the doctor.
              Start with 200 free credits.
            </p>
            <a
              href="/#contact"
              className="inline-block rounded-xl bg-hilt-blue px-8 py-4 text-lg font-semibold text-white transition-colors hover:bg-hilt-blue-dark"
            >
              Request Free Trial
            </a>
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
        </div>
      </footer>
    </>
  );
}
