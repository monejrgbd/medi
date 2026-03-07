import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import OwnerSignUpForm from "@/components/OwnerSignUpForm";

export const metadata = {
  title: "Sign Up — Hilt Health",
  description: "Create your Hilt Health account and start your free trial.",
};

export default async function SignUpPage() {
  const user = await getUser();
  if (user) redirect("/d/select-role");

  return <OwnerSignUpForm />;
}
