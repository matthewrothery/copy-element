import Link from "next/link";
import { SignInForm } from "@/components/SignInForm";
import { GoalTrack } from "@/components/GoalTrack/GoalTrack";
import "./sign-in.css";

export const dynamic = "force-static";

export const metadata = {
  title: "Sign in – Element Armory",
  description: "Sign in to your Element Armory account.",
  robots: { index: false, follow: false },
};

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
