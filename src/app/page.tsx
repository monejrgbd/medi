import Navbar from "@/components/Navbar";
import SignUpForm from "@/components/SignUpForm";
import FadeIn from "@/components/FadeIn";
import { getAllPosts } from "@/lib/blog";

function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/60 to-white pt-20 pb-24">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <FadeIn>
            <h1 className="mb-6 text-4xl font-bold leading-tight tracking-tight text-ink sm:text-5xl lg:text-[56px] lg:leading-[1.1]">
              Your patients shouldn&apos;t wait.
              <br />
              Neither should you.
            </h1>
            <p className="mb-8 max-w-xl text-lg leading-relaxed text-slate">
              Hilthealth uses AI to gather patient symptoms before the appointment
              so your doctor walks in prepared, not behind. The doctor stays in
              control. The AI just does the legwork. Built in Toronto
              and expanding across Canada.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <a
                href="#contact"
                className="inline-block rounded-xl bg-hilt-blue px-8 py-4 text-lg font-semibold text-white transition-colors hover:bg-hilt-blue-dark"
              >
                Request Free Trial
              </a>
              <a
                href="?interest=demo#contact"
                className="inline-block rounded-xl border-2 border-hilt-blue px-8 py-4 text-lg font-semibold text-hilt-blue transition-colors hover:bg-hilt-blue/5"
              >
                Request Demo
              </a>
            </div>
            <p className="mt-3 text-sm text-slate">
              200 credits free. No card required.
            </p>
          </FadeIn>

          {/* Tablet mockup */}
          <FadeIn delay={0.2}>
            <div className="flex justify-center lg:justify-end">
              <div className="relative">
                <div className="absolute -inset-4 rounded-3xl bg-hilt-blue/5 blur-2xl" />
                <div className="relative w-[320px] rounded-2xl border border-gray-200 bg-white p-6 shadow-xl rotate-1 sm:w-[380px]">
                  <div className="mb-4 flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-hilt-blue" />
                    <span className="text-sm font-semibold text-hilt-blue">hilthealth</span>
                  </div>
                  <div className="space-y-3">
                    <div className="rounded-xl bg-snow p-3">
                      <p className="text-sm text-slate">
                        Welcome to the clinic! What brings you in today?
                      </p>
                    </div>
                    <div className="ml-8 rounded-xl bg-hilt-blue/10 p-3">
                      <p className="text-sm text-ink">
                        I&apos;ve had a persistent headache for about 3 days now
                      </p>
                    </div>
                    <div className="rounded-xl bg-snow p-3">
                      <p className="text-sm text-slate">
                        I&apos;m sorry to hear that. Can you describe the pain? Is it
                        sharp, dull, or throbbing?
                      </p>
                    </div>
                    <div className="ml-8 rounded-xl bg-hilt-blue/10 p-3">
                      <p className="text-sm text-ink">
                        It&apos;s a dull ache behind my eyes, worse in the morning
                      </p>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <div className="h-2 w-2 animate-pulse rounded-full bg-hilt-blue" />
                      <span className="text-xs text-ash">Hilthealth is typing...</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}

function ProblemSection() {
  const problems = [
    {
      icon: (
        <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="#2563EB" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      ),
      text: "Patients sit in the waiting room for 30+ minutes while the doctor works through the same intake questions with every person ahead of them",
    },
    {
      icon: (
        <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="#2563EB" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
        </svg>
      ),
      text: "Doctors spend the first 5 minutes of every appointment gathering basic information instead of diagnosing",
    },
    {
      icon: (
        <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="#2563EB" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
        </svg>
      ),
      text: "Your front desk is juggling check ins, phone calls, and paperwork. Intake gets rushed.",
    },
  ];

  return (
    <section className="bg-snow py-20">
      <div className="mx-auto max-w-[1200px] px-6">
        <FadeIn>
          <h2 className="mb-12 text-center text-3xl font-bold text-ink sm:text-4xl">
            The waiting room problem
          </h2>
        </FadeIn>
        <div className="grid gap-6 sm:grid-cols-3">
          {problems.map((p, i) => (
            <FadeIn key={i} delay={i * 0.1}>
              <div className="h-full rounded-2xl bg-white p-8 text-center shadow-sm border border-gray-100">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-hilt-blue/10">
                  {p.icon}
                </div>
                <p className="text-lg font-medium leading-relaxed text-ink">{p.text}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    {
      num: "1",
      title: "Patient checks in",
      desc: "Hand them a tablet. They start a natural conversation with our AI. No forms, no clipboards.",
    },
    {
      num: "2",
      title: "AI asks the right questions",
      desc: "Patients share symptoms at their own pace, without feeling rushed. The result is more accurate, more detailed information than a hurried intake form.",
    },
    {
      num: "3",
      title: "Doctor gets a head start",
      desc: "Before the patient walks in, the doctor gets a summary and the full chat. They review it, confirm details with the patient, and ask their own follow ups. The AI prepares. The doctor decides.",
    },
  ];

  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-[1200px] px-6">
        <FadeIn>
          <h2 className="mb-16 text-center text-3xl font-bold text-ink sm:text-4xl">
            How Hilthealth works
          </h2>
        </FadeIn>
        <div className="grid gap-12 sm:grid-cols-3 sm:gap-8">
          {steps.map((s, i) => (
            <FadeIn key={s.num} delay={i * 0.15}>
              <div className="text-center">
                <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-hilt-blue text-xl font-bold text-white shadow-lg shadow-hilt-blue/25">
                  {s.num}
                </div>
                <h3 className="mb-3 text-xl font-semibold text-ink">{s.title}</h3>
                <p className="leading-relaxed text-slate">{s.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

function BenefitsSection() {
  const benefits = [
    {
      title: "See more patients",
      desc: "The AI handles intake so your doctors can focus on what they trained for. Diagnosing and treating, not interviewing.",
      icon: (
        <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#2563EB" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
        </svg>
      ),
    },
    {
      title: "More accurate symptoms",
      desc: "Patients share details at their own pace without feeling rushed. The doctor still asks their own questions, but they start with better information.",
      icon: (
        <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#2563EB" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
        </svg>
      ),
    },
    {
      title: "Happier patients",
      desc: "No more clipboards. No more repeating symptoms. Patients feel heard from the moment they sit down.",
      icon: (
        <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#2563EB" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z" />
        </svg>
      ),
    },
    {
      title: "Fully customizable",
      desc: "Every clinic is different. Hilthealth adapts to your workflow with custom screening questions, specialty specific protocols, and your preferred summary format.",
      icon: (
        <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#2563EB" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
        </svg>
      ),
    },
  ];

  return (
    <section className="bg-snow py-20">
      <div className="mx-auto max-w-[1200px] px-6">
        <FadeIn>
          <h2 className="mb-12 text-center text-3xl font-bold text-ink sm:text-4xl">
            Why clinics choose Hilthealth
          </h2>
        </FadeIn>
        <div className="grid gap-6 sm:grid-cols-2">
          {benefits.map((b, i) => (
            <FadeIn key={i} delay={i * 0.1}>
              <div className="h-full rounded-2xl bg-white p-8 shadow-sm border border-gray-100">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-hilt-blue/10">
                  {b.icon}
                </div>
                <h3 className="mb-2 text-xl font-semibold text-ink">{b.title}</h3>
                <p className="leading-relaxed text-slate">{b.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

function TrustStrip() {
  const badges = [
    {
      label: "PHIPA compliant",
      icon: (
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
        </svg>
      ),
    },
    {
      label: "Data encrypted end-to-end",
      icon: (
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
        </svg>
      ),
    },
    {
      label: "Built in Canada",
      icon: (
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955a1.126 1.126 0 0 1 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
        </svg>
      ),
    },
  ];

  return (
    <section className="bg-white py-12 border-y border-gray-100">
      <div className="mx-auto max-w-[1200px] px-6">
        <FadeIn>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            {badges.map((b, i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded-full bg-snow px-5 py-2.5 text-sm font-medium text-slate"
              >
                {b.icon}
                {b.label}
              </div>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

function DemoBanner() {
  return (
    <section className="bg-hilt-blue py-16">
      <div className="mx-auto max-w-[1200px] px-6 text-center">
        <FadeIn>
          <h2 className="mb-3 text-3xl font-bold text-white sm:text-4xl">
            See Hilthealth in action
          </h2>
          <p className="mx-auto mb-8 max-w-xl text-lg text-white/80">
            Book a 15-minute demo and we&apos;ll walk you through how Hilthealth
            works for your clinic.
          </p>
          <a
            href="?interest=demo#contact"
            className="inline-block rounded-xl bg-white px-8 py-4 text-lg font-semibold text-hilt-blue transition-colors hover:bg-gray-50"
          >
            Request Demo
          </a>
        </FadeIn>
      </div>
    </section>
  );
}

function BlogSection() {
  const posts = getAllPosts().slice(0, 3);

  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-[1200px] px-6">
        <FadeIn>
          <div className="mb-12 flex items-end justify-between">
            <h2 className="text-3xl font-bold text-ink sm:text-4xl">
              From the blog
            </h2>
            <a
              href="/blog"
              className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-hilt-blue hover:underline"
            >
              View all articles
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
                  d="M8.25 4.5l7.5 7.5-7.5 7.5"
                />
              </svg>
            </a>
          </div>
        </FadeIn>
        <div className="grid gap-6 sm:grid-cols-3">
          {posts.map((post, i) => (
            <FadeIn key={post.slug} delay={i * 0.1}>
              <a
                href={`/blog/${post.slug}`}
                className="group block h-full rounded-2xl border border-gray-100 bg-snow p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <h3 className="mb-2 text-lg font-semibold leading-snug text-ink group-hover:text-hilt-blue transition-colors">
                  {post.title}
                </h3>
                <p className="text-sm leading-relaxed text-slate line-clamp-2">
                  {post.description}
                </p>
              </a>
            </FadeIn>
          ))}
        </div>
        <div className="mt-8 text-center sm:hidden">
          <a
            href="/blog"
            className="inline-flex items-center gap-1 text-sm font-medium text-hilt-blue hover:underline"
          >
            View all articles
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
                d="M8.25 4.5l7.5 7.5-7.5 7.5"
              />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}

function ContactSection() {
  return (
    <section id="contact" className="bg-snow py-20">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="mx-auto max-w-2xl text-center">
          <FadeIn>
            <SignUpForm />
          </FadeIn>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-white py-12 border-t border-gray-100">
      <div className="mx-auto max-w-[1200px] px-6 text-center">
        <p className="mb-2 text-2xl font-bold text-hilt-blue tracking-tight">hilthealth</p>
        <p className="mb-4 text-slate">
          Built in Toronto. Expanding across Canada.
        </p>
        <div className="mb-4 flex items-center justify-center gap-6 text-sm text-ash">
          <a href="/blog" className="hover:text-slate transition-colors">
            Blog
          </a>
          <a href="/privacy" className="hover:text-slate transition-colors">
            Privacy Policy
          </a>
          <a href="/pricing" className="hover:text-slate transition-colors">
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
  );
}

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <ProblemSection />
        <HowItWorksSection />
        <BenefitsSection />
        <TrustStrip />
        <DemoBanner />
        <BlogSection />
        <ContactSection />
      </main>
      <Footer />
    </>
  );
}
