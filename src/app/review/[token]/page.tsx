import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Metadata } from "next";
import ReviewForm from "./ReviewForm";

interface PageProps {
  params: Promise<{ token: string }>;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function getReviewPage(token: string) {
  if (!UUID_RE.test(token)) return null;

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    }
  );

  const { data, error } = await supabase.rpc("get_review_page", {
    p_token: token,
  });

  if (error || !data?.success) return null;
  return data;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { token } = await params;
  const data = await getReviewPage(token);

  if (!data) {
    return { title: "Rate Your Visit" };
  }

  return {
    title: `Rate Your Visit — ${data.clinic_name}`,
  };
}

export default async function ReviewPage({ params }: PageProps) {
  const { token } = await params;
  const data = await getReviewPage(token);

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            This review link is invalid.
          </h1>
          <p className="text-gray-600">
            The link may have expired or is not valid.
          </p>
        </div>
      </div>
    );
  }

  if (data.already_submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Thank You!
          </h1>
          <p className="text-gray-600">
            You&apos;ve already submitted feedback. We appreciate it!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-md px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-xl font-bold text-gray-900">
            {data.clinic_name}
          </h1>
          {data.doctor_name && (
            <p className="text-sm text-gray-500 mt-1">
              Dr. {data.doctor_name}
            </p>
          )}
        </div>

        <ReviewForm token={token} isDemo={!!data.is_demo} recentReviews={data.recent_reviews ?? []} />

        <div className="text-center py-6">
          <a
            href="https://hilthealth.com"
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Powered by Hilt Health
          </a>
        </div>
      </div>
    </div>
  );
}
