"use client"

import { useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ChevronDown, Copy, Home, Bell, Instagram, Twitter, Youtube, ArrowLeft } from "lucide-react"

// Simple donut chart for two metrics
function Donut({ percent, color }: { percent: number; color: string }) {
  const radius = 30
  const circumference = 2 * Math.PI * radius
  const dash = (Math.max(0, Math.min(99, percent)) / 100) * circumference
  return (
    <svg viewBox="0 0 80 80" className="w-20 h-20 -rotate-90">
      <circle
        cx="40"
        cy="40"
        r={radius}
        stroke="currentColor"
        strokeWidth="8"
        className="text-muted-foreground/20 fill-none"
      />
      <circle
        cx="40"
        cy="40"
        r={radius}
        stroke={color}
        strokeWidth="8"
        strokeDasharray={`${dash} ${circumference}`}
        strokeLinecap="round"
        className="fill-none"
      />
    </svg>
  )
}

export default function ProfilePage() {
  const params = useParams<{ username: string }>()
  const username = decodeURIComponent(params.username || "creator")
  const router = useRouter()

  // Deterministic selection helpers
  const hashUsername = (u: string) => {
    let h = 0
    for (let i = 0; i < u.length; i++) h = (h * 31 + u.charCodeAt(i)) >>> 0
    return h
  }

  // Image pools (bundled in public/images)
  const coverImages = useMemo(
    () => [
      "/images/original-f387bc46dd36fee2d91c22ac39413b7f.webp",
      "/images/original-0209bdde1569f4e6f5195f7fda13c708.webp",
      "/images/original-9530542d0ad7d39fe8eeaf4f69c90bd9.webp",
      "/images/original-d193d2cdd3087e02c22e4910cb78718d.webp",
    ],
    [],
  )

  const postPool = useMemo(
    () => [
      "/images/original-9530542d0ad7d39fe8eeaf4f69c90bd9.webp",
      "/images/original-0209bdde1569f4e6f5195f7fda13c708.webp",
      "/images/original-d193d2cdd3087e02c22e4910cb78718d.webp",
      "/images/original-f387bc46dd36fee2d91c22ac39413b7f.webp",
    ],
    [],
  )

  // Match avatar from cached influencers list so it stays identical to Home list
  const matchedInfluencer = useMemo(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem("campaignio:influencers-cache") : null
      if (!raw) return undefined
      const parsed = JSON.parse(raw) as { influencers?: Array<{ username?: string; profile_picture_url?: string }> }
      const handle = username.replace(/^@/, "")
      return parsed?.influencers?.find((i) => (i.username || "").toLowerCase() === handle.toLowerCase())
    } catch {
      return undefined
    }
  }, [username])

  const deterministicIndex = useMemo(() => hashUsername(username), [username])

  const bannerSrc = useMemo(
    () => coverImages[deterministicIndex % coverImages.length] || "/abstract-profile-cover.png",
    [coverImages, deterministicIndex],
  )

  const avatarSrc = useMemo(() => {
    const fromList = matchedInfluencer?.profile_picture_url
    return (fromList && `${fromList}`) || "/creator-avatar.png"
  }, [matchedInfluencer])

  const postImages = useMemo(() => {
    return [0, 1, 2].map((offset) => {
      const src = postPool[(deterministicIndex + offset) % postPool.length]
      return src || "/post-media.png"
    })
  }, [postPool, deterministicIndex])

  const creatorAvatars = useMemo(() => {
    // small avatars for "similar creators" (visuals only)
    return [0, 1, 2].map(
      (i) => postPool[(deterministicIndex + i + 1) % postPool.length] || "/creator-avatar.png",
    )
  }, [postPool, deterministicIndex])

  // Random realistic stats, all strictly < 100
  const stats = useMemo(() => {
    const authenticity = Math.floor(Math.random() * 30) + 65 // 65-94
    const productMatch = Math.floor(Math.random() * 50) + 30 // 30-79
    const positive = Math.floor(Math.random() * 40) + 50 // 50-89
    const negative = Math.floor(Math.random() * 20) + 1 // 1-20
    const controversial = Math.floor(Math.random() * 35) + 1 // 1-35
    return { authenticity, productMatch, positive, negative, controversial }
  }, [username])

  const [copied, setCopied] = useState(false)
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {}
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top App Bar */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/home")} aria-label="Back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => router.push("/home")} aria-label="Home">
            <Home className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Notifications">
            <Bell className="h-5 w-5" />
          </Button>
          <div className="ml-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2">
                  Options <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => router.push("/home")}>Dashboard</DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.location.reload()}>Refresh</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <div className="relative">
        <img src={bannerSrc || "/placeholder.svg"} alt="Profile Banner" className="w-full h-56 md:h-64 object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <div className="max-w-6xl mx-auto px-4">
          <div className="relative -mt-10 md:-mt-12 flex items-end gap-4">
            <Avatar className="h-20 w-20 ring-4 ring-background">
              {/* Use randomized avatar instead of repeated placeholder */}
              <AvatarImage src={avatarSrc || "/placeholder.svg"} alt={`${username} avatar`} />
              <AvatarFallback>{username[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="pb-2 flex-1">
              <h1 className="text-2xl md:text-3xl font-semibold">@{username}</h1>
              <p className="text-sm text-muted-foreground">Joined April 2022</p>
            </div>
            <div className="flex items-center gap-2 pb-2">
              <Button className="rounded-full">Follow</Button>
              <Button variant="outline" className="rounded-full bg-transparent">
                Message
              </Button>
              <a href={`https://www.instagram.com/${username}/`} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="rounded-full bg-transparent">
                  Social Media
                </Button>
              </a>
            </div>
          </div>

          {/* Socials + Copy link pill */}
          <div className="mt-3 mb-6 flex flex-wrap items-center gap-2">
            <Button variant="secondary" size="sm" className="rounded-full gap-2" onClick={copyLink}>
              <Copy className="h-4 w-4" /> {copied ? "Copied!" : "Copy profile link"}
            </Button>
            <div className="flex items-center gap-2 ml-2">
              <a
                href="#"
                aria-label="Instagram"
                className="inline-flex p-2 rounded-md bg-background/60 hover:bg-accent"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a href="#" aria-label="Twitter" className="inline-flex p-2 rounded-md bg-background/60 hover:bg-accent">
                <Twitter className="h-4 w-4" />
              </a>
              <a href="#" aria-label="YouTube" className="inline-flex p-2 rounded-md bg-background/60 hover:bg-accent">
                <Youtube className="h-4 w-4" />
              </a>
            </div>
            <p className="text-sm text-muted-foreground ml-auto hidden md:block">
              Looking for creators to collaborate. Love sharing product stories.
            </p>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-3 gap-6 pb-12">
        {/* Left Content */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg md:text-xl font-semibold">Recent {username}&apos;s Latest Posts</h2>
          {/* Tabs + Filters (static visuals) */}
          <div className="flex items-center gap-3 text-sm">
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" className="rounded-full">
                Feed
              </Button>
              <Button size="sm" variant="ghost" className="rounded-full">
                Favourites
              </Button>
              <Button size="sm" variant="ghost" className="rounded-full">
                Tagged
              </Button>
            </div>
            <div className="ml-auto flex gap-2">
              <Button size="sm" variant="outline" className="rounded-full bg-transparent">
                All
              </Button>
              <Button size="sm" variant="outline" className="rounded-full bg-transparent">
                Newest
              </Button>
            </div>
          </div>

          {/* Post Card */}
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    {/* Use the same randomized avatar for post author */}
                    <AvatarImage src={avatarSrc || "/placeholder.svg"} alt={`${username} avatar`} />
                    <AvatarFallback>{username[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">@{username}</p>
                    <p className="text-xs text-muted-foreground">2h ago • 1,459 views</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="aspect-video w-full rounded-md bg-muted overflow-hidden">
                  {/* Use randomized media image per post */}
                  <img
                    src={postImages[i - 1] || "/placeholder.svg?height=720&width=1280&query=post%20media"}
                    alt={`Post ${i} by ${username}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="pt-3">
                  <p className="font-medium">This is a title and it goes here like this, fun</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {["beauty", "skincare", "review"].map((t) => (
                      <Badge key={t} variant="outline" className="text-xs">
                        #{t}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Right Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Competitive Overview → Authenticity / product match */}
              <div className="grid grid-cols-3 gap-3 items-center">
                <div className="col-span-1">
                  <div className="rounded-lg border border-border/60 p-3 text-center">
                    <p className="text-xs text-muted-foreground">Tier</p>
                    <p className="font-semibold">Creator</p>
                  </div>
                </div>
                <div className="col-span-1 flex flex-col items-center">
                  <Donut percent={stats.authenticity} color="#60a5fa" />
                  <p className="text-xs mt-1 text-muted-foreground">Authenticity</p>
                  <p className="text-sm font-semibold">{stats.authenticity}%</p>
                </div>
                <div className="col-span-1 flex flex-col items-center">
                  <Donut percent={stats.productMatch} color="#22c55e" />
                  <p className="text-xs mt-1 text-muted-foreground">product match</p>
                  <p className="text-sm font-semibold">{stats.productMatch}%</p>
                </div>
              </div>

              {/* Top Agent → post responces */}
              <div className="rounded-lg border border-border/60 p-3">
                <p className="text-sm font-semibold mb-3">post responces</p>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    {/* Use randomized avatar here too */}
                    <AvatarImage src={avatarSrc || "/placeholder.svg"} alt={`${username} avatar`} />
                    <AvatarFallback>{username[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="grid grid-cols-3 gap-4 flex-1">
                    <div>
                      <p className="text-xs text-muted-foreground">followers possitive responce</p>
                      <p className="font-semibold">{stats.positive}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">followers negative responce</p>
                      <p className="font-semibold">{stats.negative}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Controvercial rating</p>
                      <p className="font-semibold">{stats.controversial}%</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Leaderboard → similar creators */}
              <div className="rounded-lg border border-border/60 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">similar creators</p>
                  <Button size="sm" variant="outline" className="rounded-full bg-transparent">
                    Category
                  </Button>
                </div>
                <div className="mt-3 space-y-3">
                  {[
                    { n: "simmycool", f: 8566 },
                    { n: "narcjacobs", f: 8500 },
                    { n: "arunamakeup", f: 7921 },
                  ].map((r, i) => (
                    <div key={r.n} className="flex items-center gap-3">
                      <div className="w-6 text-xs text-muted-foreground">{i + 1}</div>
                      <Avatar className="h-7 w-7">
                        {/* Rotate through randomized small avatars for similar creators */}
                        <AvatarImage src={creatorAvatars[i] || "/placeholder.svg"} alt={`${r.n} avatar`} />
                        <AvatarFallback>{r.n[0].toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm">@{r.n}</p>
                      </div>
                      <div className="text-xs text-muted-foreground">{r.f.toLocaleString()} followers</div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}