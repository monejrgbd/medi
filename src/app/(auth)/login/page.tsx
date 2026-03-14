import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import LoginForm from "@/components/LoginForm";

export const metadata = {
  title: "Log In — Hilt Health",
  description: "Log in to your Hilt Health dashboard.",
};

export default async function LoginPage() {
  const user = await getUser();
  if (user) redirect("/d/select-role");

  return <LoginForm />;
}
