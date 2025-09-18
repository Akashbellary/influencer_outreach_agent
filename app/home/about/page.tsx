import Link from "next/link"
import { PublicText } from "@/components/public-text"

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-10 prose prose-invert">
      <h1 className="text-center text-3xl font-semibold tracking-tight">About CampaignIO</h1>
      <section className="mt-6">
        <PublicText src="/content/about.txt" />
      </section>

      <div className="mt-8 flex items-center justify-center gap-4">
        <Link href="/home/about/terms" className="text-sm underline underline-offset-4 hover:text-primary">
          Terms & Conditions
        </Link>
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
          Back to Login
        </Link>
      </div>
    </main>
  )
}