"use client"

import * as React from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const ACK_KEY = "campaignio:disclaimer-ack"
const FORCE_KEY = "campaignio:force-disclaimer"

export function DisclaimerModal() {
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    try {
      const ack = localStorage.getItem(ACK_KEY)
      const force = localStorage.getItem(FORCE_KEY)
      if (!ack || force === "1") {
        setOpen(true)
        if (force === "1") localStorage.removeItem(FORCE_KEY)
      }
    } catch {}
  }, [])

  const acknowledge = () => {
    try {
      localStorage.setItem(ACK_KEY, "1")
      localStorage.removeItem(FORCE_KEY)
    } catch {}
    setOpen(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent className="max-w-xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Disclaimer</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-pretty">
              <p>
                This platform is currently an MVP (Minimum Viable Product). Some features may display dummy data created
                for demonstration purposes, since I currently do not have access to Meta's APIs. Once API access is
                granted, all features will be updated to use live data from Meta as intended.
              </p>
              <div className="rounded-md border border-border/60 bg-muted/40 p-3">
                <p className="font-medium">For Meta Reviewer:</p>
                <p className="mt-1">
                  I am building a startup focused on strengthening the connection between brands and creators. The core
                  idea involves using Meta's APIs to:
                </p>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  - <li>Collect top-performing posts and reels based on specific hashtags.</li>
                  <li>Identify and connect with the owners of these posts/reels.</li>
                </ul>
                <p className="mt-1">
                  These features require Meta's APIs, and the current dummy data is a placeholder until full API access
                  is available.
                </p>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="hidden">Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={acknowledge}>I understand</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}