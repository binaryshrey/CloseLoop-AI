import { withAuth } from "@workos-inc/authkit-nextjs";
import { redirect } from "next/navigation";
import OnboardClient from "./onboard-client";

export default async function OnboardPage() {
  const { user } = await withAuth();

  if (!user) {
    redirect("/sign-in");
  }

  return <OnboardClient user={user} />;
}
