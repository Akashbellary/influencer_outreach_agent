"use client"

import Link from "next/link"
import { PublicText } from "@/components/public-text"

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-10 prose prose-invert">
      <h1 className="text-center text-3xl font-semibold tracking-tight">Terms & Conditions</h1>
      <p className="text-sm text-muted-foreground text-center mt-2">
        These Terms apply to your use of CampaignIO. By using the platform, you agree to these Terms.
      </p>

      <section className="mt-6">
        <PublicText src="/content/terms.txt" />
      </section>

      <section className="mt-8 rounded-lg border bg-card p-5">
        <h2 className="text-lg font-semibold">Contact</h2>
        <p className="mt-2 text-sm">
          For questions about these Terms, contact:{" "}
          <a className="underline" href="mailto:akashbellaryramesh123@gmail.com">
            akashbellaryramesh123@gmail.com
          </a>
        </p>
      </section>

      <div className="mt-8 flex items-center justify-center gap-4">
        <Link href="/home/about" className="text-sm text-muted-foreground hover:text-foreground">
          Back to About
        </Link>
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
          Back to Login
        </Link>
      </div>
    </main>
  )
}

