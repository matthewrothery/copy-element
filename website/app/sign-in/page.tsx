import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Section } from "@/components/Section";
import { SignInForm } from "@/components/SignInForm";

export const dynamic = "force-static";

export const metadata = {
  title: "Sign in – Element Armory",
  description: "Sign in to your Element Armory account.",
  robots: { index: false, follow: false },
};

export default function SignInPage(): React.ReactElement {
  return (
    <>
      <Header />
      <main>
        <Section center style={{ paddingTop: "var(--space-6)", gap: "var(--space-5)" }}>
          <SignInForm />
        </Section>
        <Footer />
      </main>
    </>
  );
}
