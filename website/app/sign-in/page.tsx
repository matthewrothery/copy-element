import Link from "next/link";
import { SignInForm } from "@/components/SignInForm";
import { GoalTrack } from "@/components/GoalTrack/GoalTrack";
import "./sign-in.css";

export const dynamic = "force-static";

import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata = buildNoIndexMetadata({
  title: "Sign in",
  description: "Sign in to your Element Armory account.",
  path: "/sign-in",
});

export default function SignInPage(): React.ReactElement {
  return (
    <main className="sign-in-page">
      <Link href="/" className="sign-in-page-back" aria-label="Back to home">
        ← Home
      </Link>
      <GoalTrack goal="signup_started" />
      <SignInForm />
    </main>
  );
}
