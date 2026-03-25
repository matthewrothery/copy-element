import { Suspense } from "react";
import { ExtensionCallback } from "@/components/ExtensionCallback";
import "@/components/ExtensionCallback/ExtensionCallback.css";

export const dynamic = "force-static";

export const metadata = {
  title: "Connect extension – Element Armory",
  description: "Pass sign-in code to the Element Armory extension.",
  robots: { index: false, follow: false },
};

function CallbackFallback(): React.ReactElement {
  return (
    <div className="extension-callback">
      <h1 className="extension-callback-title">Connect extension</h1>
      <p className="extension-callback-status">Loading…</p>
    </div>
  );
}

export default function ExtensionCallbackPage(): React.ReactElement {
  return (
    <main>
      <Suspense fallback={<CallbackFallback />}>
        <ExtensionCallback />
      </Suspense>
    </main>
  );
}
