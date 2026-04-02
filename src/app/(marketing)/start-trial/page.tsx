import { redirect } from "next/navigation";

export const metadata = {
  title: "Start Your Free Trial — Hilt Health",
  description: "Create your Hilt Health account and start your free trial.",
};

export default function StartTrialPage() {
  redirect("/signup");
}
