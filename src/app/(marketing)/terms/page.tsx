import Link from "next/link";

export const metadata = {
  title: "Terms of Service — Hilt Health",
  description: "Terms and conditions for using the Hilt Health AI-powered patient pre-screening platform.",
};

export default function TermsPage() {
  return (
    <>
      <main className="mx-auto max-w-[800px] px-6 py-16">
        <h1 className="mb-2 text-4xl font-bold text-ink">Terms of Service</h1>
        <p className="mb-12 text-sm text-ash">Last updated: March 6, 2026</p>

        <div className="prose-hilt space-y-10 text-slate leading-relaxed [&_h2]:mb-4 [&_h2]:mt-0 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-ink [&_h3]:mb-2 [&_h3]:mt-0 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-ink [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1 [&_table]:w-full [&_table]:text-sm [&_th]:text-left [&_th]:pb-2 [&_th]:text-ink [&_th]:font-semibold [&_td]:py-2 [&_td]:pr-4 [&_td]:align-top [&_tr]:border-b [&_tr]:border-gray-100">

          <section>
            <h2>1. Introduction</h2>
            <p>
              These Terms of Service (&ldquo;Terms&rdquo;) are a legally binding agreement between you
              and Hilt Health (&ldquo;we,&rdquo; &ldquo;us,&rdquo; &ldquo;our&rdquo;), operated from
              Toronto, Ontario, Canada. They govern your access to and use of the Hilt Health platform,
              including our website, AI-powered patient pre-screening software, dashboards, APIs, and
              related services (collectively, the &ldquo;Service&rdquo;).
            </p>
            <p>
              By creating an account, accessing, or using the Service, you agree to be bound by these
              Terms. If you are accepting these Terms on behalf of a clinic, organization, or other legal
              entity, you represent and warrant that you have the authority to bind that entity. If you
              do not agree to these Terms, do not use the Service.
            </p>
          </section>

          <section>
            <h2>2. Definitions</h2>
            <ul>
              <li><strong>Platform</strong> — The Hilt Health software-as-a-service application, including all features, tools, and interfaces.</li>
              <li><strong>Clinic</strong> — A healthcare organization or practice that subscribes to and uses the Service. The Clinic is the Health Information Custodian (HIC) under Ontario&rsquo;s <em>Personal Health Information Protection Act, 2004</em> (PHIPA).</li>
              <li><strong>Owner</strong> — The individual who creates the Clinic&rsquo;s Hilt Health account and holds administrative privileges.</li>
              <li><strong>Staff</strong> — Individuals granted access to the Platform by the Owner or a Manager, including doctors, receptionists, and managers.</li>
              <li><strong>Patient</strong> — An individual who uses the AI pre-screening feature at the direction of a Clinic.</li>
              <li><strong>AI Pre-Screening</strong> — The AI-powered conversational intake process that collects patient symptom information before a physician visit.</li>
              <li><strong>Credits</strong> — The usage units that determine the volume of AI pre-screening sessions available to a Clinic.</li>
              <li><strong>PHI</strong> — Personal Health Information as defined by PHIPA Section 4.</li>
            </ul>
          </section>

          <section>
            <h2>3. Eligibility</h2>
            <p>
              The Service is available to licensed healthcare clinics and their authorized personnel
              operating in compliance with applicable healthcare laws and regulations. By using the
              Service, you represent that:
            </p>
            <ul>
              <li>You are at least 18 years of age</li>
              <li>You have the legal capacity to enter into a binding agreement</li>
              <li>If acting on behalf of a Clinic, you are duly authorized to do so</li>
              <li>Your use of the Service complies with all applicable federal, provincial, and local laws</li>
            </ul>
          </section>

          <section>
            <h2>4. Account Registration and Security</h2>
            <p>
              The Owner registers for the Service by creating an account with a valid email address and
              password. The Owner may then create Staff accounts (username, password, and full name) and
              assign roles (doctor, receptionist, manager) at each location.
            </p>
            <p>
              You are responsible for:
            </p>
            <ul>
              <li>Maintaining the confidentiality of all account credentials</li>
              <li>All activity that occurs under your account or Staff accounts you create</li>
              <li>Promptly notifying us at <a href="mailto:security@hilthealth.com" className="text-hilt-blue hover:underline">security@hilthealth.com</a> if you suspect unauthorized access</li>
              <li>Deactivating or removing Staff accounts when personnel leave or no longer require access</li>
            </ul>
            <p>
              We are not liable for any loss or damage arising from unauthorized use of your account
              credentials.
            </p>
          </section>

          <section>
            <h2>5. Description of the Service</h2>
            <p>
              Hilt Health provides AI-powered conversational pre-screening software for healthcare
              clinics. The Service enables patients to describe their symptoms to an AI agent before
              seeing a physician. The physician receives a structured summary, full conversation
              transcript, and AI-generated diagnostic opinion.
            </p>
            <p>
              <strong>The Service is an information-gathering tool only.</strong> The AI does not
              diagnose medical conditions, recommend treatments, prescribe medications, or make any
              clinical decisions. All medical decisions are made solely by the treating physician. The
              AI-generated diagnostic opinion is provided as a reference for the physician and is not a
              medical diagnosis.
            </p>
          </section>

          <section>
            <h2>6. Clinic Responsibilities</h2>
            <p>
              As a Clinic using the Service, you agree to:
            </p>
            <ul>
              <li><strong>Obtain informed patient consent</strong> — You are the Health Information Custodian under PHIPA and are responsible for obtaining informed, express consent from each patient before they use the AI pre-screening, in accordance with PHIPA Section 18. This includes informing patients that an AI system will collect their health information, that their conversation will be shared with the treating physician, and that data is processed by third-party services.</li>
              <li><strong>Comply with applicable laws</strong> — You must comply with all applicable healthcare privacy and data protection legislation, including PHIPA, PIPEDA, the <em>Regulated Health Professions Act, 1991</em>, and any other applicable provincial or federal laws.</li>
              <li><strong>Retain clinical responsibility</strong> — The AI pre-screening does not replace professional medical assessment. You are solely responsible for all clinical decisions, diagnoses, and treatments. You must independently verify all AI-generated information before relying on it.</li>
              <li><strong>Manage Staff access</strong> — You are responsible for ensuring that only authorized personnel have access to the Platform and that access levels are appropriate for each role.</li>
              <li><strong>Maintain accurate records</strong> — You are responsible for ensuring the accuracy of patient records and information entered into the Platform.</li>
              <li><strong>Report security incidents</strong> — You must promptly notify us of any suspected or actual security breach involving the Platform or PHI processed through the Service.</li>
            </ul>
          </section>

          <section>
            <h2>7. Patient Use</h2>
            <p>
              Patients access the Service at the direction of a Clinic by scanning a location-specific
              QR code and engaging in an AI-powered conversation about their symptoms. By using the
              Service, patients acknowledge that:
            </p>
            <ul>
              <li>The AI pre-screening is <strong>not medical advice, diagnosis, or treatment</strong></li>
              <li>Their conversation and information will be shared with the treating physician and Clinic staff with appropriate access</li>
              <li>Their data is processed by third-party AI services (which may be located outside Canada)</li>
              <li>They may decline to use the AI pre-screening without it affecting the quality of their care</li>
              <li>They must provide accurate and truthful information during the pre-screening</li>
            </ul>
            <p>
              <strong>Emergency warning:</strong> The Service is not designed for medical emergencies.
              If you are experiencing a medical emergency, call <strong>911</strong> or go to the
              nearest emergency room immediately. Do not use the Service to report emergencies.
            </p>
          </section>

          <section>
            <h2>8. Minors and Substitute Decision-Makers</h2>
            <p>
              Patients of all ages may use the AI pre-screening in a clinical setting. When a patient
              is under the age of 16 or is otherwise incapable of providing consent, the Clinic is
              responsible for obtaining consent from a parent, guardian, or substitute decision-maker
              in accordance with PHIPA Section 20 and the <em>Health Care Consent Act, 1996</em>
              (Ontario).
            </p>
            <p>
              The Clinic must ensure that the substitute decision-maker is present and has authorized
              the patient&rsquo;s use of the AI pre-screening before the session begins. Hilt Health
              does not independently verify the age of patients or the authority of substitute
              decision-makers — this responsibility lies with the Clinic as the Health Information
              Custodian.
            </p>
          </section>

          <section>
            <h2>9. SMS Communications and CASL Compliance</h2>
            <p>
              The Service may send SMS messages to patients when the Clinic has enabled the SMS add-on
              and the patient has provided and verified their phone number. SMS messages fall into two
              categories:
            </p>

            <h3>Transactional Messages (Non-Commercial)</h3>
            <p>
              The following messages are sent as part of delivering the healthcare service and are not
              commercial electronic messages under Canada&rsquo;s <em>Anti-Spam Legislation</em>
              (CASL, S.C. 2010, c. 23):
            </p>
            <ul>
              <li><strong>Visit summary SMS</strong> — a link to the patient&rsquo;s visit summary after their appointment is completed</li>
              <li><strong>Phone verification SMS</strong> — one-time codes to verify phone number ownership</li>
            </ul>
            <p>
              These messages are directly related to the patient&rsquo;s healthcare and are sent at
              the direction of the Clinic (the Health Information Custodian).
            </p>

            <h3>Review Request Messages</h3>
            <p>
              After a visit, patients may receive an SMS inviting them to rate their experience. This
              message may constitute a commercial electronic message under CASL. The patient&rsquo;s
              consent to receive this message is obtained through the consent checkbox during their
              first use of the Service, which expressly includes consent to receive a post-visit
              review request. Each review request SMS includes:
            </p>
            <ul>
              <li>Identification of Hilt Health and the Clinic as the senders</li>
              <li>Contact information for both Hilt Health and the Clinic</li>
              <li>A functional <strong>unsubscribe mechanism</strong> to stop future review requests</li>
            </ul>
            <p>
              Unsubscribe requests are processed within <strong>10 business days</strong> as required
              by CASL s.11. Unsubscribing from review requests does not affect transactional messages
              (visit summaries).
            </p>

            <h3>Marketing and Promotional Messages</h3>
            <p>
              The Clinic may use the Service to send marketing or promotional SMS messages to patients
              who have consented during check in. These messages may include health reminders, seasonal
              campaigns, appointment availability, or other clinic communications. Marketing messages
              are sent at the Clinic&rsquo;s direction using AI assisted or manual patient targeting.
            </p>
            <p>
              Each marketing SMS includes identification of the sending Clinic and a functional
              opt out mechanism. Patients can reply STOP to any marketing message to unsubscribe
              from future promotional communications. Opting out of marketing messages does not affect
              transactional messages (visit summaries or phone verification codes).
            </p>
            <p>
              Marketing SMS constitutes a commercial electronic message under CASL. The patient&rsquo;s
              consent is obtained through the SMS consent checkbox during check in, which expressly
              includes consent to receive promotional messages from the Clinic through the Service.
            </p>
          </section>

          <section>
            <h2>10. Credits, Billing, and Payment</h2>

            <h3>Credits</h3>
            <p>
              The Service operates on a credit-based model. Credits are deducted when an AI pre-screening
              conversation begins (i.e., when the first AI message is sent). No credits are deducted if
              a patient is denied or abandons check-in before the AI conversation starts.
            </p>
            <ul>
              <li><strong>Standard AI</strong> — 1 credit per patient session</li>
              <li><strong>Advanced AI</strong> — 1.5 credits per patient session</li>
              <li><strong>Precision AI</strong> — 2.5 credits per patient session</li>
              <li><strong>Premium AI</strong> — 4 credits per patient session</li>
              <li>AI diagnostic suggestions for doctors are included at no extra credit cost when enabled for a location</li>
              <li>Credits expire at the end of each billing cycle and do not roll over</li>
              <li>Overage credits are available at $1.00 CAD per credit</li>
            </ul>

            <h3>Trial</h3>
            <p>
              New Clinics receive a 30-day free trial with $200 worth of credits (200 credits). No
              credit card is required for the trial. Add-on features (SMS) are included
              free during the trial period to demonstrate value.
            </p>

            <h3>Subscription Plans</h3>
            <p>
              After the trial, Clinics select a subscription plan. Plan details, pricing, and included
              credits are listed on our <Link href="/pricing" className="text-hilt-blue hover:underline">Pricing</Link> page.
              All prices are in Canadian dollars unless otherwise stated.
            </p>

            <h3>Payment</h3>
            <p>
              Payments are processed through Stripe. By subscribing, you authorize us to charge your
              payment method on a recurring monthly basis. You are responsible for keeping your payment
              information current.
            </p>
            <ul>
              <li><strong>Payment failure:</strong> We will attempt up to 3 retries over 7 days. After 7 days unpaid, the Service enters read-only mode (existing data accessible, no new AI conversations). After 30 days unpaid, the account is suspended. The Owner is notified at each stage by email.</li>
              <li><strong>Refunds:</strong> Subscription fees are non-refundable except where required by applicable law. Unused credits are not refundable.</li>
              <li><strong>Taxes:</strong> Fees are exclusive of applicable taxes. You are responsible for all applicable sales taxes, HST, GST, or other government-imposed charges.</li>
            </ul>

            <h3>Add-Ons</h3>
            <p>
              Optional add-on services are billed per location per month:
            </p>
            <ul>
              <li><strong>SMS Add-On</strong> — $49/month per location. Enables phone number collection, visit summary SMS, and review funnel SMS.</li>
            </ul>
          </section>

          <section>
            <h2>11. Intellectual Property</h2>
            <p>
              <strong>Our property:</strong> The Platform, including all software, algorithms, user
              interfaces, designs, trademarks, and documentation, is owned by Hilt Health and protected
              by Canadian and international intellectual property laws. These Terms do not grant you any
              ownership interest in the Platform.
            </p>
            <p>
              <strong>Your data:</strong> The Clinic retains ownership of all patient data, clinical
              records, and information entered into the Platform. We do not claim ownership of your
              data. We process your data solely to provide the Service as described in these Terms and
              our <Link href="/privacy" className="text-hilt-blue hover:underline">Privacy Policy</Link>.
            </p>
            <p>
              <strong>AI-generated content:</strong> Summaries, structured cards, and diagnostic opinions
              generated by the AI are tools to assist clinical workflow. They are not independent medical
              records and should not be treated as such. The Clinic is responsible for reviewing,
              validating, and incorporating AI-generated content into their own clinical records as they
              see fit.
            </p>
            <p>
              <strong>Feedback:</strong> If you provide suggestions, ideas, or feedback about the
              Service, you grant us a non-exclusive, royalty-free, worldwide, perpetual license to use
              and incorporate that feedback into the Service without obligation to you.
            </p>
          </section>

          <section>
            <h2>12. Data Ownership, Portability, and Deletion</h2>
            <p>
              Patient records are keyed by the Clinic&rsquo;s organization, not by individual location.
              A patient&rsquo;s history, medications, allergies, and chronic conditions are accessible
              across all of the Clinic&rsquo;s locations within the Platform.
            </p>
            <ul>
              <li><strong>Data export:</strong> Clinics may request an export of their data at any time by contacting <a href="mailto:support@hilthealth.com" className="text-hilt-blue hover:underline">support@hilthealth.com</a>.</li>
              <li><strong>Post-cancellation retention:</strong> Upon cancellation, data is retained for 90 days to allow retrieval. After 90 days, data is permanently deleted. The Owner may request immediate deletion at any time.</li>
              <li><strong>Legal retention:</strong> Notwithstanding the above, we may retain data as required to comply with legal obligations, including minimum PHI retention periods under PHIPA.</li>
            </ul>
          </section>

          <section>
            <h2>13. Acceptable Use</h2>
            <p>
              You agree not to:
            </p>
            <ul>
              <li>Use the Service for any purpose other than legitimate clinical pre-screening and healthcare operations</li>
              <li>Attempt to reverse engineer, decompile, disassemble, or otherwise derive the source code of the Platform</li>
              <li>Circumvent, disable, or interfere with any security features of the Service</li>
              <li>Share, transfer, or disclose account credentials to unauthorized individuals</li>
              <li>Use the Service to transmit malware, viruses, or other harmful code</li>
              <li>Attempt to gain unauthorized access to any part of the Service, other accounts, or connected systems</li>
              <li>Use the AI pre-screening for non-clinical purposes, including marketing, research (without appropriate ethics approval), or any purpose unrelated to patient intake</li>
              <li>Misrepresent AI-generated content as a formal medical diagnosis to patients</li>
              <li>Resell, sublicense, or redistribute access to the Service without our written consent</li>
              <li>Use the Service in a manner that violates any applicable law or regulation</li>
            </ul>
            <p>
              We reserve the right to suspend or terminate your access if we reasonably believe you have
              violated these Terms.
            </p>
          </section>

          <section>
            <h2>14. Patient Identity and Name Collision</h2>
            <p>
              The Service identifies returning patients by matching first name, last name, and date of
              birth within a Clinic&rsquo;s organization. When two genuinely different individuals share
              the same name and date of birth, the system requires SMS-verified phone numbers to
              distinguish between them.
            </p>
            <p>
              <strong>Liability disclaimer:</strong> Patients who share the same first name, last name,
              and date of birth must not use the same phone number. If two different individuals share
              identical information across all identifying fields (first name, last name, date of birth,
              and phone number), the system cannot distinguish them. We are not liable for any records
              affected in this scenario. The Clinic is responsible for verifying patient identity as
              part of their standard clinical workflow.
            </p>
          </section>

          <section>
            <h2>15. Third-Party Services</h2>
            <p>
              The Service relies on third-party providers, including AI language model providers, cloud
              hosting providers, payment processors, and communication services. We are not responsible
              for the availability, accuracy, or performance of third-party services. Outages or changes
              to third-party services may temporarily affect the Service.
            </p>
            <p>
              Our use of third-party services is governed by our agreements with those providers, which
              include appropriate data protection provisions. For details on data sharing with third
              parties, see our <Link href="/privacy" className="text-hilt-blue hover:underline">Privacy Policy</Link>.
            </p>
          </section>

          <section>
            <h2>16. Disclaimers</h2>
            <p>
              <strong>THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo;
              WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, OR STATUTORY.</strong> To the
              fullest extent permitted by applicable law, we disclaim all warranties, including implied
              warranties of merchantability, fitness for a particular purpose, non-infringement, and
              any warranties arising from course of dealing or usage of trade.
            </p>
            <p>
              Without limiting the foregoing:
            </p>
            <ul>
              <li><strong>No medical warranty:</strong> The AI pre-screening is not a substitute for professional medical judgment. We do not warrant the accuracy, completeness, or reliability of any AI-generated content, including summaries, structured cards, or diagnostic opinions. The treating physician is solely responsible for all clinical decisions.</li>
              <li><strong>No uptime guarantee:</strong> While we strive for high availability, we do not guarantee uninterrupted or error-free operation of the Service. We are not liable for temporary unavailability due to maintenance, updates, or circumstances beyond our reasonable control.</li>
              <li><strong>AI limitations:</strong> AI technology has inherent limitations. The AI may produce inaccurate, incomplete, or misleading information. Clinics and physicians must independently verify all AI-generated content before relying on it for clinical decisions.</li>
            </ul>
          </section>

          <section>
            <h2>17. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by applicable law:
            </p>
            <ul>
              <li><strong>No liability for clinical decisions:</strong> We are not liable for any clinical decisions, diagnoses, treatments, or patient outcomes. The Clinic and its healthcare professionals bear sole responsibility for all medical care provided to patients, whether or not the Service was used in the intake process.</li>
              <li><strong>Cap on liability:</strong> Our total aggregate liability to you for any and all claims arising out of or related to these Terms or the Service shall not exceed the total fees paid by you to Hilt Health during the twelve (12) months immediately preceding the event giving rise to the claim.</li>
              <li><strong>No consequential damages:</strong> In no event shall we be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, revenue, data, goodwill, or business opportunity, regardless of the cause of action or the theory of liability, even if we have been advised of the possibility of such damages.</li>
            </ul>
            <p>
              Some jurisdictions do not allow the exclusion or limitation of certain warranties or
              liabilities. In such jurisdictions, our liability is limited to the greatest extent
              permitted by law. Nothing in these Terms excludes or limits liability that cannot
              lawfully be excluded or limited under applicable Canadian law.
            </p>
          </section>

          <section>
            <h2>18. Indemnification</h2>

            <h3>Your Indemnification of Hilt Health</h3>
            <p>
              You agree to indemnify, defend, and hold harmless Hilt Health, its officers, directors,
              employees, and agents from and against any and all claims, damages, losses, liabilities,
              costs, and expenses (including reasonable legal fees) arising out of or related to:
            </p>
            <ul>
              <li>Your use of the Service in violation of these Terms</li>
              <li>Your failure to obtain required patient consent under PHIPA, PIPEDA, or any other applicable law</li>
              <li>Clinical decisions, diagnoses, or treatments made by your healthcare professionals</li>
              <li>Your failure to comply with applicable healthcare laws and regulations</li>
              <li>Any third-party claim arising from your use of the Service</li>
              <li>Inaccurate or misleading information entered into the Platform by you or your Staff</li>
            </ul>

            <h3>Our Indemnification of You</h3>
            <p>
              Hilt Health agrees to indemnify, defend, and hold harmless the Clinic, its officers,
              directors, employees, and agents from and against any and all claims, damages, losses,
              liabilities, costs, and expenses (including reasonable legal fees) arising out of or
              related to:
            </p>
            <ul>
              <li>A breach of these Terms by Hilt Health</li>
              <li>Hilt Health&rsquo;s gross negligence or wilful misconduct in providing the Service</li>
              <li>A breach of Hilt Health&rsquo;s obligations under PHIPA or PIPEDA in its capacity as an agent or electronic service provider</li>
              <li>Any claim that the Platform infringes the intellectual property rights of a third party (provided that the infringement is not caused by your modifications, data, or use of the Service outside its intended scope)</li>
            </ul>
            <p>
              Our total indemnification obligation under this section is subject to the liability cap
              in Section 17.
            </p>
          </section>

          <section>
            <h2>19. Termination</h2>

            <h3>By You</h3>
            <p>
              The Owner may cancel the subscription at any time through the account settings or by
              contacting <a href="mailto:support@hilthealth.com" className="text-hilt-blue hover:underline">support@hilthealth.com</a>.
              Cancellation takes effect at the end of the current billing cycle. No refunds are issued
              for partial billing periods.
            </p>

            <h3>By Us</h3>
            <p>
              We may suspend or terminate your access to the Service immediately if:
            </p>
            <ul>
              <li>You materially breach these Terms and fail to cure the breach within 14 days of written notice</li>
              <li>You fail to pay fees for more than 30 days after the due date</li>
              <li>We reasonably believe your use of the Service poses a security risk or may cause harm to other users</li>
              <li>We are required to do so by law or regulatory authority</li>
            </ul>

            <h3>Effect of Termination</h3>
            <p>
              Upon termination, your right to use the Service ceases immediately. Data is retained for
              90 days to allow retrieval, after which it is permanently deleted. The Owner may request
              immediate deletion. Sections of these Terms that by their nature should survive
              termination (including Disclaimers, Limitation of Liability, Indemnification, and
              Governing Law) will survive.
            </p>
          </section>

          <section>
            <h2>20. Privacy</h2>
            <p>
              Our collection, use, and disclosure of personal information and PHI is governed by our{" "}
              <Link href="/privacy" className="text-hilt-blue hover:underline">Privacy Policy</Link>, which
              is incorporated into these Terms by reference. By using the Service, you acknowledge that
              you have read and understood our Privacy Policy.
            </p>
          </section>

          <section>
            <h2>21. Modifications to These Terms</h2>
            <p>
              We may update these Terms from time to time. If we make material changes, we will notify
              Clinic Owners by email at least 30 days before the changes take effect and update the
              &ldquo;Last updated&rdquo; date at the top of this page. Continued use of the Service
              after the effective date of any changes constitutes your acceptance of the updated Terms.
              If you do not agree to the updated Terms, you must stop using the Service before they take
              effect.
            </p>
          </section>

          <section>
            <h2>22. Modifications to the Service</h2>
            <p>
              We reserve the right to modify, update, or discontinue any part of the Service at any
              time. We will provide reasonable notice of material changes that affect your use of the
              Service. We are not liable for any modification, suspension, or discontinuation of the
              Service.
            </p>
          </section>

          <section>
            <h2>23. Governing Law and Dispute Resolution</h2>
            <p>
              These Terms are governed by and construed in accordance with the laws of the Province of
              Ontario and the federal laws of Canada applicable therein, without regard to conflict of
              law principles.
            </p>
            <p>
              Any dispute arising out of or relating to these Terms or the Service shall first be
              attempted to be resolved through good-faith negotiation between the parties. If the
              dispute cannot be resolved through negotiation within 30 days, either party may submit
              the dispute to the exclusive jurisdiction of the courts of the Province of Ontario,
              located in Toronto.
            </p>

            <h3>Class Action Waiver</h3>
            <p>
              To the fullest extent permitted by applicable law, you agree that any dispute resolution
              proceedings will be conducted only on an individual basis and not in a class, consolidated,
              or representative action. You waive any right to participate in a class action lawsuit or
              class-wide arbitration against Hilt Health. If you are a resident of Canada, you may opt
              out of this class action waiver by sending written notice to{" "}
              <a href="mailto:legal@hilthealth.com" className="text-hilt-blue hover:underline">legal@hilthealth.com</a>{" "}
              within <strong>30 days</strong> of first accepting these Terms. Your notice must include
              your name, the Clinic name, account email address, and a clear statement that you wish to
              opt out of the class action waiver. If you opt out, all other provisions of these Terms
              remain in full effect.
            </p>
          </section>

          <section>
            <h2>24. General Provisions</h2>
            <ul>
              <li><strong>Entire agreement:</strong> These Terms, together with the Privacy Policy, constitute the entire agreement between you and Hilt Health regarding the Service and supersede all prior agreements and understandings.</li>
              <li><strong>Severability:</strong> If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions shall continue in full force and effect.</li>
              <li><strong>Waiver:</strong> Our failure to enforce any provision of these Terms does not constitute a waiver of that provision or any other provision.</li>
              <li><strong>Assignment:</strong> You may not assign or transfer these Terms without our prior written consent. We may assign these Terms in connection with a merger, acquisition, or sale of all or substantially all of our assets.</li>
              <li><strong>Force majeure:</strong> We are not liable for any failure to perform due to causes beyond our reasonable control, including natural disasters, war, terrorism, pandemics, labour disputes, government actions, or failures of third-party services.</li>
              <li><strong>No agency:</strong> Nothing in these Terms creates a partnership, joint venture, employment, or agency relationship between you and Hilt Health.</li>
              <li><strong>Language:</strong> These Terms are drafted in English. In the event of any conflict between an English version and a translated version, the English version prevails.</li>
            </ul>
          </section>

          <section>
            <h2>25. Contact Us</h2>
            <p>
              If you have questions about these Terms, contact us at:
            </p>
            <p>
              <strong>Hilt Health</strong><br />
              Toronto, Ontario, Canada<br />
              <a href="mailto:legal@hilthealth.com" className="text-hilt-blue hover:underline">legal@hilthealth.com</a>
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
            <Link href="/privacy" className="hover:text-slate transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-slate font-medium transition-colors">
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
