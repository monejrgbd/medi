import { Mail, CalendarClock, ExternalLink } from "lucide-react";

export default function SupportPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Support</h1>
        <p className="text-sm text-slate mt-1">
          Get in touch with the Hilt Health team for help, custom feature requests, or integrations.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <a
          href="mailto:support@hilthealth.com"
          className="group flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-6 transition-all hover:border-hilt-blue hover:shadow-sm"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-hilt-blue">
            <Mail className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-ink">Email Support</h2>
            <p className="text-sm text-slate mt-1">
              For questions, bug reports, or account help. We typically reply within one business day.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-sm font-medium text-hilt-blue">
            support@hilthealth.com
            <ExternalLink className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
        </a>

        <a
          href="https://cal.com/102937474/hilt-health-meeting"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-6 transition-all hover:border-hilt-blue hover:shadow-sm"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-hilt-blue">
            <CalendarClock className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-ink">Book a Meeting</h2>
            <p className="text-sm text-slate mt-1">
              For custom feature requests or integrations. Schedule a call with our team to discuss your needs.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-sm font-medium text-hilt-blue">
            Schedule a call
            <ExternalLink className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
        </a>
      </div>
    </div>
  );
}
