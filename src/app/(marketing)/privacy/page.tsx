import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — Hilt Health",
  description: "How Hilt Health collects, uses, and protects your personal and health information.",
};

export default function PrivacyPage() {
  return (
    <>
      <main className="mx-auto max-w-[800px] px-6 py-16">
        <h1 className="mb-2 text-4xl font-bold text-ink">Privacy Policy</h1>
        <p className="mb-12 text-sm text-ash">Last updated: February 27, 2026</p>

        <div className="prose-hilt space-y-10 text-slate leading-relaxed [&_h2]:mb-4 [&_h2]:mt-0 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-ink [&_h3]:mb-2 [&_h3]:mt-0 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-ink [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_table]:w-full [&_table]:text-sm [&_th]:text-left [&_th]:pb-2 [&_th]:text-ink [&_th]:font-semibold [&_td]:py-2 [&_td]:pr-4 [&_td]:align-top [&_tr]:border-b [&_tr]:border-gray-100">

          <section>
            <h2>1. About This Policy</h2>
            <p>
              Hilt Health (&ldquo;we,&rdquo; &ldquo;us,&rdquo; &ldquo;our&rdquo;) provides AI-powered patient
              pre-screening software for healthcare clinics. This policy explains how we collect,
              use, disclose, and protect your personal information and personal health information
              in compliance with the <em>Personal Information Protection and Electronic Documents
              Act</em> (PIPEDA) and Ontario&rsquo;s <em>Personal Health Information Protection Act,
              2004</em> (PHIPA).
            </p>
            <p>
              Hilt Health is operated from Toronto, Ontario, Canada. If you have questions about this
              policy, contact our Privacy Officer:
            </p>
            <p>
              <strong>Privacy Officer</strong><br />
              Hilt Health<br />
              Toronto, Ontario, Canada<br />
              <a href="mailto:privacy@hilthealth.com" className="text-hilt-blue hover:underline">privacy@hilthealth.com</a>
            </p>
          </section>

          <section>
            <h2>2. Definitions</h2>
            <ul>
              <li><strong>Personal Information (PI)</strong> — Information about an identifiable individual, such as name, email, phone number, and clinic affiliation.</li>
              <li><strong>Personal Health Information (PHI)</strong> — Information about an individual&rsquo;s physical or mental health, health care history, or information collected during the provision of health care, as defined by PHIPA Section 4.</li>
              <li><strong>Health Information Custodian (HIC)</strong> — The clinic or healthcare provider that uses Hilt Health and is responsible for the patient&rsquo;s PHI under PHIPA.</li>
              <li><strong>De-identified Information</strong> — Information from which all identifying details have been removed such that it cannot reasonably be used to identify an individual.</li>
            </ul>
          </section>

          <section>
            <h2>3. Our Role</h2>
            <p>
              Hilt Health provides technology services to healthcare clinics (Health Information Custodians)
              under PHIPA. Depending on the arrangement with each clinic, Hilt Health operates as either an
              <strong> electronic service provider</strong> (PHIPA Section 10(4)) or an <strong>agent</strong> of
              the HIC (PHIPA Section 17). In either role, we process PHI only as authorized by the
              clinic and in accordance with PHIPA.
            </p>
            <p>
              The clinic remains the custodian of all patient health information. Hilt Health does not
              independently make health care decisions — the AI assists with information gathering
              only. All clinical decisions are made by the treating physician.
            </p>
          </section>

          <section>
            <h2>4. Information We Collect</h2>

            <h3>A. Patient Health Information (collected on behalf of clinics)</h3>
            <ul>
              <li>First name, last name, and date of birth (entered by the patient at check-in)</li>
              <li>Phone number (SMS-verified, collected when the clinic has the SMS add-on enabled or when required for identity verification)</li>
              <li>Symptoms and health concerns described during AI pre-screening conversations</li>
              <li>Full transcript of the AI conversation</li>
              <li>AI-generated pre-screening summaries</li>
              <li>Medications, allergies, and chronic conditions reported by the patient</li>
              <li>Date and time of the pre-screening session</li>
              <li>SMS message delivery records (visit summaries, follow-up reminders, review requests)</li>
              <li>Device and browser information used during the session</li>
            </ul>

            <h3>B. Clinic &amp; Prospect Information</h3>
            <ul>
              <li>Clinic name, contact person name, email address, phone number, and city</li>
              <li>Account credentials (for clinic dashboard access)</li>
              <li>Usage data and analytics</li>
            </ul>

            <h3>C. Technical Information (collected automatically)</h3>
            <ul>
              <li>IP address, browser type, and operating system</li>
              <li>Pages viewed and interactions on our website</li>
              <li>Access logs for security and audit purposes</li>
            </ul>
          </section>

          <section>
            <h2>5. How We Use Your Information</h2>

            <h3>Patient Health Information</h3>
            <ul>
              <li>Conducting AI-powered conversational pre-screening on behalf of the clinic</li>
              <li>Generating pre-screening summaries for the treating physician</li>
              <li>Providing the full conversation transcript to the clinic</li>
            </ul>
            <p>
              We do <strong>not</strong> use PHI for marketing, advertising, or any purpose unrelated
              to the clinical pre-screening service. We do <strong>not</strong> use PHI to train or
              fine-tune AI models.
            </p>

            <h3>Clinic &amp; Prospect Information</h3>
            <ul>
              <li>Setting up and managing clinic accounts</li>
              <li>Communicating about our services</li>
              <li>Processing payments and billing</li>
              <li>Improving our platform and user experience</li>
            </ul>
          </section>

          <section>
            <h2>6. Consent</h2>

            <h3>Patient Consent</h3>
            <p>
              Patient consent for the collection and use of PHI through Hilt Health is obtained by the
              clinic (the Health Information Custodian) in accordance with PHIPA Section 18. Clinics
              are responsible for ensuring patients provide <strong>informed, express consent</strong> before
              using Hilt Health&rsquo;s pre-screening service. This includes informing patients that:
            </p>
            <ul>
              <li>An AI system will ask questions about their symptoms</li>
              <li>Their conversation will be shared with the treating physician</li>
              <li>Their data is processed by a third-party AI service (see Section 8)</li>
              <li>They may decline to use the AI pre-screening without affecting their care</li>
            </ul>

            <h3>Withdrawal of Consent</h3>
            <p>
              Patients may withdraw consent at any time by informing the clinic. Withdrawal applies
              prospectively — it does not affect data already lawfully collected and used (PHIPA
              Section 21). Consequences of withdrawal (such as inability to use AI pre-screening)
              will be explained at the time of withdrawal.
            </p>

            <h3>Clinic Consent</h3>
            <p>
              Clinics consent to the collection and use of their business information when they
              register for Hilt Health or submit a contact form on our website. Clinics may withdraw
              consent by contacting us at <a href="mailto:privacy@hilthealth.com" className="text-hilt-blue hover:underline">privacy@hilthealth.com</a>.
            </p>
          </section>

          <section>
            <h2>7. AI Processing</h2>
            <p>
              Hilt Health uses artificial intelligence to conduct patient pre-screening conversations. It
              is important to understand:
            </p>
            <ul>
              <li><strong>The AI gathers information only.</strong> It does not diagnose, recommend treatment, or make clinical decisions. All medical decisions are made by the treating physician.</li>
              <li><strong>AI provider:</strong> Patient conversations are processed through a third-party large language model API. Conversation data is transmitted to the AI provider&rsquo;s servers for processing and is <strong>not retained by the AI provider</strong> for model training or improvement (per our contractual terms).</li>
              <li><strong>Cross-border processing:</strong> AI processing may occur on servers located in the United States. This means patient data is subject to U.S. laws, including potential access under the USA PATRIOT Act and CLOUD Act. See Section 8 for details.</li>
              <li><strong>Human review:</strong> The physician reviews all AI-generated summaries with the patient before relying on them for clinical decisions.</li>
              <li><strong>Limitations:</strong> AI pre-screening is not a substitute for professional medical assessment. The AI may produce inaccurate or incomplete information.</li>
            </ul>
          </section>

          <section>
            <h2>8. Third-Party Service Providers</h2>
            <p>
              We share information with the following third-party providers, each of which is bound
              by data processing agreements:
            </p>
            <table>
              <thead>
                <tr>
                  <th>Provider</th>
                  <th>Purpose</th>
                  <th>Data Shared</th>
                  <th>Location</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>AI language model provider</td>
                  <td>Processing patient pre-screening conversations</td>
                  <td>Conversation text (symptoms, responses)</td>
                  <td>United States</td>
                </tr>
                <tr>
                  <td>Cloud database provider</td>
                  <td>Data storage and hosting</td>
                  <td>All collected data</td>
                  <td>Determined by hosting region configuration</td>
                </tr>
              </tbody>
            </table>
            <p>
              We require all third-party providers to protect information with safeguards
              appropriate to its sensitivity and to use it only for the purposes specified in our
              agreements (PIPEDA Principle 4.1.3).
            </p>

            <h3>Cross-Border Data Transfers</h3>
            <p>
              Some of our service providers operate in the United States. When personal information
              or PHI is transferred outside Canada, it may be subject to the laws of that
              jurisdiction, including lawful access by foreign courts, law enforcement, or
              government authorities. We ensure contractual protections are in place and disclose
              this to you as required by PHIPA and PIPEDA.
            </p>
          </section>

          <section>
            <h2>9. Cookies and Tracking Technologies</h2>
            <p>
              Our website uses cookies and similar technologies for the following purposes:
            </p>
            <ul>
              <li><strong>Essential cookies:</strong> Required for basic site functionality such as page navigation and form submission. These cannot be disabled.</li>
              <li><strong>Analytics:</strong> We may use analytics tools to understand how visitors interact with our website. This data is aggregated and does not identify individual users.</li>
            </ul>
            <p>
              We do not use cookies for advertising or cross-site tracking. We do not sell or share
              cookie data with third parties for their own marketing purposes.
            </p>
          </section>

          <section>
            <h2>10. Communications and CASL Compliance</h2>
            <p>
              When you submit a contact or trial request form, you expressly consent to receiving
              commercial electronic messages from Hilt Health about our services, in compliance with
              Canada&rsquo;s <em>Anti-Spam Legislation</em> (CASL, S.C. 2010, c. 23).
            </p>
            <ul>
              <li>Every commercial message we send will identify Hilt Health as the sender and include our contact information</li>
              <li>Every message will contain a functional <strong>unsubscribe mechanism</strong></li>
              <li>Unsubscribe requests will be processed within <strong>10 business days</strong> as required by CASL s.11</li>
              <li>We will never send messages to addresses that have unsubscribed</li>
            </ul>
            <p>
              You may withdraw your consent to receive commercial messages at any time by clicking
              the unsubscribe link in any email or by contacting us at{" "}
              <a href="mailto:privacy@hilthealth.com" className="text-hilt-blue hover:underline">privacy@hilthealth.com</a>.
              Withdrawal of marketing consent does not affect transactional or service-related
              communications.
            </p>
          </section>

          <section>
            <h2>11. Data Security</h2>

            <p>
              We implement security safeguards appropriate to the sensitivity of the information we
              handle, as required by PIPEDA Principle 4.7 and PHIPA:
            </p>
            <ul>
              <li><strong>Encryption:</strong> All data is encrypted in transit (TLS) and at rest (AES-256)</li>
              <li><strong>Access controls:</strong> Role-based access ensures only authorized personnel can access PHI</li>
              <li><strong>Audit logging:</strong> All access to PHI is logged and monitored</li>
              <li><strong>Authentication:</strong> Secure authentication is required for all clinic dashboard access</li>
              <li><strong>Regular review:</strong> Security measures are reviewed and updated on an ongoing basis</li>
            </ul>
          </section>

          <section>
            <h2>12. Data Retention</h2>
            <p>We retain information only as long as necessary to fulfill the purposes for which it
              was collected, subject to legal minimum retention periods:</p>
            <table>
              <thead>
                <tr>
                  <th>Data Type</th>
                  <th>Retention Period</th>
                  <th>Basis</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Patient PHI (conversations, summaries)</td>
                  <td>Minimum 1 year; up to 10 years as directed by the clinic</td>
                  <td>PHIPA s.13; clinical record standards</td>
                </tr>
                <tr>
                  <td>Clinic account data</td>
                  <td>Duration of account plus 2 years</td>
                  <td>PIPEDA Principle 4.5</td>
                </tr>
                <tr>
                  <td>Prospect data (contact form submissions)</td>
                  <td>2 years from last contact</td>
                  <td>PIPEDA Principle 4.5</td>
                </tr>
                <tr>
                  <td>Technical / audit logs</td>
                  <td>2 years</td>
                  <td>Security and compliance</td>
                </tr>
                <tr>
                  <td>Breach records</td>
                  <td>Minimum 24 months</td>
                  <td>PIPEDA s.10.3</td>
                </tr>
              </tbody>
            </table>
            <p>
              After the applicable retention period, information is securely destroyed or
              de-identified.
            </p>
          </section>

          <section>
            <h2>13. Your Rights</h2>

            <h3>Access and Correction</h3>
            <p>
              You have the right to request access to the personal information or PHI we hold about
              you. You may also request corrections if the information is inaccurate or incomplete.
              We will respond to access requests within <strong>30 days</strong> (PIPEDA; PHIPA s.54(7)).
              A reasonable fee may apply for access to PHI records (PHIPA s.54(9)).
            </p>

            <h3>Deletion</h3>
            <p>
              You may request deletion of your personal information, subject to any legal obligation
              we have to retain it (such as minimum retention periods under PHIPA). For PHI, deletion
              requests should be directed to the clinic that collected your information.
            </p>

            <h3>Lock-Box (PHIPA s.23)</h3>
            <p>
              Patients have the right to restrict access to their PHI by certain custodians. If you
              wish to place a lock-box on your information, contact the clinic directly.
            </p>

            <p>
              To exercise any of these rights, contact us at{" "}
              <a href="mailto:privacy@hilthealth.com" className="text-hilt-blue hover:underline">privacy@hilthealth.com</a>.
            </p>
          </section>

          <section>
            <h2>14. Data Breach Notification</h2>
            <p>
              In the event of a breach of security safeguards involving personal information or PHI,
              we will:
            </p>
            <ul>
              <li>Assess whether there is a real risk of significant harm (RROSH) to affected individuals</li>
              <li>Report the breach to the <strong>Office of the Privacy Commissioner of Canada</strong> (OPC) if RROSH exists (PIPEDA s.10.1)</li>
              <li>Report the breach to the <strong>Information and Privacy Commissioner of Ontario</strong> (IPC) if it involves PHI (PHIPA and O. Reg. 329/04)</li>
              <li>Notify affected individuals as soon as feasible, including a description of the breach, what information was involved, steps we are taking, and steps they can take to protect themselves</li>
              <li>Notify the relevant clinic (HIC) immediately</li>
              <li>Maintain records of all breaches for a minimum of 24 months (PIPEDA s.10.3)</li>
            </ul>
          </section>

          <section>
            <h2>15. Children&rsquo;s Privacy</h2>
            <p>
              Hilt Health&rsquo;s patient pre-screening is used in clinical settings where patients of all
              ages may be seen. When a patient under the age of 16 uses Hilt Health, the clinic is
              responsible for obtaining consent from a parent or guardian (substitute decision-maker)
              in accordance with PHIPA Section 20 and the <em>Health Care Consent Act, 1996</em>.
            </p>
            <p>
              Our website and contact forms are not directed at individuals under 16. We do not
              knowingly collect personal information from children through our website.
            </p>
          </section>

          <section>
            <h2>16. Changes to This Policy</h2>
            <p>
              We may update this policy from time to time. If we make material changes, we will
              notify affected clinics by email and update the &ldquo;Last updated&rdquo; date at the
              top of this page. Continued use of Hilt Health after changes constitutes acceptance of the
              updated policy.
            </p>
          </section>

          <section>
            <h2>17. Complaints</h2>
            <p>
              If you have concerns about how we handle your information, you may:
            </p>
            <ul>
              <li>Contact our Privacy Officer at <a href="mailto:privacy@hilthealth.com" className="text-hilt-blue hover:underline">privacy@hilthealth.com</a></li>
              <li>File a complaint with the <strong>Office of the Privacy Commissioner of Canada</strong> (for PIPEDA matters) at <a href="https://www.priv.gc.ca" className="text-hilt-blue hover:underline" target="_blank" rel="noopener noreferrer">priv.gc.ca</a></li>
              <li>File a complaint with the <strong>Information and Privacy Commissioner of Ontario</strong> (for PHIPA matters) at <a href="https://www.ipc.on.ca" className="text-hilt-blue hover:underline" target="_blank" rel="noopener noreferrer">ipc.on.ca</a></li>
            </ul>
          </section>

          <section>
            <h2>18. Governing Law</h2>
            <p>
              This policy is governed by the laws of the Province of Ontario and the federal laws of
              Canada applicable therein.
            </p>
          </section>

        </div>
      </main>

      <footer className="bg-white py-12 border-t border-gray-100">
        <div className="mx-auto max-w-[1200px] px-6 text-center">
          <p className="mb-2 text-2xl font-bold text-hilt-blue tracking-tight">Hilt Health</p>
          <p className="mb-4 text-slate">
            Built in Toronto. Expanding across Canada.
          </p>
          <div className="mb-4 flex items-center justify-center gap-6 text-sm text-ash">
            <Link href="/blog" className="hover:text-slate transition-colors">
              Blog
            </Link>
            <Link href="/privacy" className="text-slate font-medium transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-slate transition-colors">
              Terms of Service
            </Link>
            <Link href="/pricing" className="hover:text-slate transition-colors">
              Pricing
            </Link>
            <a
              href="mailto:business@hilthealth.com"
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
