import { redirect } from "next/navigation";
import { auth } from "@/auth";
import LoginForm from "./LoginForm";

// Checked on the server so an already signed-in visitor never sees the login
// UI flash before being sent on.
export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/chat");

  return <LoginForm />;
}
