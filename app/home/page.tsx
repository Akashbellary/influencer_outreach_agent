"use client";

import type React from "react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Bell, Sun, Moon, User, ChevronDown, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useTheme } from "next-themes";
import { NotificationSidebar } from "@/components/notification-sidebar"; // Import NotificationSidebar
import CampaignAnalytics from "@/components/campaign-analytics";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface InfluencerData {
  id: string;
  username: string;
  name: string;
  followers_count: number;
  media_count: number;
  biography: string;
  profile_picture_url: string;
  website?: string;
  engagement_rate: number;
  tags: string[];
  is_verified: boolean;
}

const contractsData = [
  {
    id: 1,
    image: "/fashion-influencer.png",
    username: "@fashionista_jane",
    status: "promotion pending",
    type: "pending",
  },
  {
    id: 2,
    image: "/tech-reviewer.png",
    username: "@tech_guru_mike",
    status: "promotion posted",
    type: "posted",
  },
  {
    id: 3,
    image: "/lifestyle-blogger.png",
    username: "@lifestyle_sarah",
    status: "contract ended",
    type: "ended",
  },
  {
    id: 4,
    image: "/fitness-influencer.png",
    username: "@fit_alex",
    status: "promotion pending",
    type: "pending",
  },
  {
    id: 5,
    image: "/food-blogger.png",
    username: "@foodie_emma",
    status: "promotion posted",
    type: "posted",
  },
];

const INFLUENCERS_LS_KEY = "campaignio:influencers-cache";
const CURRENT_JOB_LS_KEY = "campaignio:discovery-job";
const CURRENT_HASHTAG_LS_KEY = "campaignio:current-hashtag";
const HISTORY_LS_KEY = "campaignio:history";
const CURRENT_HISTORY_ID_LS_KEY = "campaignio:current-history-id";
const DISCLAIMER_LS_KEY = "campaignio:disclaimer-ack";
const AUTH_LS_KEY = "campaignio:auth";
const USER_DATA_LS_KEY = "campaignio:user-data";

export default function HomePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [productImage, setProductImage] = useState<string | null>(null);
  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [hashtagInput, setHashtagInput] = useState("");
  const [showFindInfluencers, setShowFindInfluencers] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [discoveryJobId, setDiscoveryJobId] = useState<string | null>(null);
  const [showInfluencers, setShowInfluencers] = useState(false);
  const [influencersData, setInfluencersData] = useState<InfluencerData[]>([]);
  const [fallbackPermalinks, setFallbackPermalinks] = useState<string[]>([]); // New state for fallback permalinks
  const [isGeneratingHashtags, setIsGeneratingHashtags] = useState(false);
  const [webScrapingEnabled, setWebScrapingEnabled] = useState(false); // Default to DISABLED for Meta compliance
  const router = useRouter();
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentHashtag, setCurrentHashtag] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    try {
      const authed =
        typeof window !== "undefined"
          ? localStorage.getItem(AUTH_LS_KEY) === "1"
          : false;
      if (!authed) {
        router.replace("/");
        return;
      }

      // Get user data from localStorage
      const userDataRaw =
        typeof window !== "undefined"
          ? localStorage.getItem(USER_DATA_LS_KEY)
          : null;
      if (userDataRaw) {
        const userData = JSON.parse(userDataRaw);
        setCurrentUser(userData);
      }

      // Load web scraping setting
      loadWebScrapingSetting();
    } catch {
      router.replace("/");
    }
  }, [mounted, router]);

  const loadWebScrapingSetting = () => {
    try {
      const saved = localStorage.getItem('campaignio:web-scraping-enabled');
      if (saved !== null) {
        setWebScrapingEnabled(saved === 'true');
      }
    } catch (error) {
      console.error("Error loading web scraping setting:", error);
    }
  };

  const toggleWebScraping = () => {
    const newValue = !webScrapingEnabled;
    setWebScrapingEnabled(newValue);
    
    // Save to localStorage for persistence
    try {
      localStorage.setItem('campaignio:web-scraping-enabled', newValue.toString());
    } catch (e) {
      console.error('Failed to save web scraping setting:', e);
    }
    
    console.log(`Web scraping ${newValue ? 'enabled' : 'disabled'}`);
  };

  useEffect(() => {
    if (!mounted) return;
    try {
      const ack =
        typeof window !== "undefined"
          ? localStorage.getItem(DISCLAIMER_LS_KEY)
          : null;
      const force =
        typeof window !== "undefined"
          ? localStorage.getItem("campaignio:force-disclaimer")
          : null;
      if (!ack || force === "1") {
        setShowDisclaimer(true);
        // clear the force flag so it doesn't re-open next time
        localStorage.removeItem("campaignio:force-disclaimer");
      }
    } catch {}
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    try {
      const storedJob = localStorage.getItem(CURRENT_JOB_LS_KEY);
      const storedHashtag = localStorage.getItem(CURRENT_HASHTAG_LS_KEY);
      setDiscoveryJobId(storedJob || null);
      setCurrentHashtag(storedHashtag || null);

      const raw = localStorage.getItem(INFLUENCERS_LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as {
          hashtag?: string;
          influencers?: InfluencerData[];
        };
        if (
          parsed?.hashtag &&
          storedHashtag &&
          parsed.hashtag === storedHashtag &&
          parsed.influencers &&
          Array.isArray(parsed.influencers) &&
          parsed.influencers.length > 0
        ) {
          setInfluencersData(parsed.influencers);
          setShowInfluencers(true);
        }
      }
    } catch (e) {}
  }, [mounted]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setProductImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleHashtagInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.includes(",")) {
      const newTag = value.replace(",", "").trim();
      if (newTag && !hashtags.includes(newTag)) {
        setHashtags([...hashtags, newTag]);
      }
      setHashtagInput("");
    } else {
      setHashtagInput(value);
    }
  };

  const removeHashtag = (tagToRemove: string) => {
    setHashtags(hashtags.filter((tag) => tag !== tagToRemove));
  };

  const generateHashtags = async () => {
    setIsGeneratingHashtags(true);

    // Simulate a brief loading state
    setTimeout(() => {
      setIsGeneratingHashtags(false);
      setShowFindInfluencers(true);
    }, 500);
  };

  const findInfluencers = async () => {
    setIsLoading(true);

    try {
      const effectiveHashtag = hashtags[0]
        ? hashtags[0].replace("#", "")
        : (productName || "product").toLowerCase().replace(/\s+/g, "");
      setCurrentHashtag(effectiveHashtag);
      try {
        localStorage.setItem(CURRENT_HASHTAG_LS_KEY, effectiveHashtag);
        localStorage.setItem(
          INFLUENCERS_LS_KEY,
          JSON.stringify({ hashtag: effectiveHashtag, influencers: [] })
        );
        // Create a new history entry for this search in DB (write-through)
        let backendHistoryId: string | null = null;
        try {
          const createRes = await fetch("/api/history", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              productName: productName.trim(),
              productDescription: productDescription.trim(),
              hashtags: hashtags.slice(),
              image: (productImage as string) || "/placeholder.svg",
              userId: currentUser?.id || null,
              influencers: [],
            }),
          });
          const created = await createRes.json();
          if (createRes.ok && created?.success && created?.id) {
            backendHistoryId = created.id as string;
          }
        } catch {}
        // Create/seed local history entry (cache)
        const historyId = backendHistoryId || Date.now().toString();
        const entry = {
          id: historyId,
          createdAt: new Date().toISOString(),
          productName: productName.trim(),
          productDescription: productDescription.trim(),
          hashtags: hashtags.slice(),
          image: (productImage as string) || "/placeholder.svg",
          influencers: [] as any[],
        };
        const rawHist = localStorage.getItem(HISTORY_LS_KEY);
        const hist = rawHist ? (JSON.parse(rawHist) as any[]) : [];
        hist.unshift(entry);
        localStorage.setItem(HISTORY_LS_KEY, JSON.stringify(hist));
        localStorage.setItem(CURRENT_HISTORY_ID_LS_KEY, historyId);
      } catch {}
      setInfluencersData([]);
      setFallbackPermalinks([]);
      setShowInfluencers(true);

      console.log("[v0] Calling /api/discover-influencers with:", {
        hashtags: hashtags,
        productName: productName.trim(),
        productDescription: productDescription.trim(),
      });

      const response = await fetch("/api/discover-influencers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          hashtags: hashtags,
          productName: productName.trim(),
          productDescription: productDescription.trim(),
          web_scraping_enabled: webScrapingEnabled,
        }),
      });

      console.log("[v0] Response status:", response.status);
      const data = await response.json();
      console.log("[v0] Response data:", data);

      if (data.success) {
        if (data.jobId) {
          setDiscoveryJobId(data.jobId as string);
          try {
            localStorage.setItem(CURRENT_JOB_LS_KEY, data.jobId as string);
          } catch {}
        }
        // Handle regular influencers data
        if (data.influencers && data.influencers.length > 0) {
          const processedInfluencers = data.influencers.map(
            (influencer: InfluencerData) => ({
              ...influencer,
              engagement_rate: Math.floor(Math.random() * 95) + 1, // Random between 1-95%
            })
          );

          setInfluencersData(processedInfluencers);
          setFallbackPermalinks([]); // Clear fallback permalinks
          setShowInfluencers(true);

          try {
            const hashtag =
              localStorage.getItem(CURRENT_HASHTAG_LS_KEY) || effectiveHashtag;
            localStorage.setItem(
              INFLUENCERS_LS_KEY,
              JSON.stringify({ hashtag, influencers: processedInfluencers })
            );
            // Update current history entry with initial influencers
            try {
              const hid = localStorage.getItem(CURRENT_HISTORY_ID_LS_KEY);
              const rawHist = localStorage.getItem(HISTORY_LS_KEY);
              const hist = rawHist ? (JSON.parse(rawHist) as any[]) : [];
              const idx = hist.findIndex((h: any) => h.id === hid);
              if (idx >= 0) {
                const existingMap = new Map<string, any>(
                  (hist[idx].influencers || []).map((i: any) => [i.username, i])
                );
                for (const i of processedInfluencers)
                  if (!existingMap.has(i.username))
                    existingMap.set(i.username, i);
                hist[idx].influencers = Array.from(existingMap.values());
                localStorage.setItem(HISTORY_LS_KEY, JSON.stringify(hist));
              }
            } catch {}
          } catch (e) {
            // console.log("[v0] Failed to persist influencers cache:", (e as Error).message)
          }

          console.log(
            `[v0] Found ${processedInfluencers.length} real influencers from Instagram API`
          );
        }
        // Handle fallback permalinks when no influencer data is available
        else if (
          data.fallbackPermalinks &&
          data.fallbackPermalinks.length > 0
        ) {
          setInfluencersData([]); // Clear influencers data
          setFallbackPermalinks(data.fallbackPermalinks);
          setShowInfluencers(true);

          // When web scraping is disabled, save permalinks to history
          if (!webScrapingEnabled) {
            try {
              const hid = localStorage.getItem(CURRENT_HISTORY_ID_LS_KEY);
              const rawHist = localStorage.getItem(HISTORY_LS_KEY);
              const hist = rawHist ? (JSON.parse(rawHist) as any[]) : [];
              const idx = hist.findIndex((h: any) => h.id === hid);
              if (idx >= 0) {
                hist[idx].permalinks = data.fallbackPermalinks;
                localStorage.setItem(HISTORY_LS_KEY, JSON.stringify(hist));
              }
            } catch {}
          }

          console.log(
            `[v0] Showing ${data.fallbackPermalinks.length} fallback permalinks`
          );
        }
        // Handle case where both are empty: don't alert, show section and keep polling
        else {
          setInfluencersData([]);
          setFallbackPermalinks([]);
          setShowInfluencers(true);
        }
      } else {
        console.error("[v0] Failed to discover influencers:", data.error);
        alert(data.error || "Failed to find influencers. Please try again.");
      }
    } catch (error) {
      console.error("[v0] Error discovering influencers:", error);
      alert("Error finding influencers. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Poll async discovery status to append new influencers as they arrive
  useEffect(() => {
    if (!discoveryJobId) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/discovery-status?jobId=${encodeURIComponent(discoveryJobId)}`
        );
        const status = await res.json();
        if (!status || !status.success) return;
        const userData = Array.isArray(status.user_data)
          ? status.user_data
          : [];
        const permalinks = Array.isArray(status.permalinks)
          ? status.permalinks
          : [];
        
        // Handle permalinks updates (when web scraping is disabled)
        if (!webScrapingEnabled && permalinks.length > 0) {
          setFallbackPermalinks((prev) => {
            const existing = new Set(prev);
            const newPermalinks = permalinks.filter((p: string) => !existing.has(p));
            if (newPermalinks.length === 0) return prev;
            const updated = [...prev, ...newPermalinks];
            
            // Save to history
            try {
              const hid = localStorage.getItem(CURRENT_HISTORY_ID_LS_KEY);
              const rawHist = localStorage.getItem(HISTORY_LS_KEY);
              const hist = rawHist ? (JSON.parse(rawHist) as any[]) : [];
              const idx = hist.findIndex((h: any) => h.id === hid);
              if (idx >= 0) {
                hist[idx].permalinks = updated;
                localStorage.setItem(HISTORY_LS_KEY, JSON.stringify(hist));
              }
            } catch {}
            
            return updated;
          });
        }
        
        if (userData.length > 0) {
          const mapped = userData.map((user: any) => ({
            id: user.id,
            username: user.username,
            name: user.name || user.username,
            followers_count: user.followers_count || 0,
            media_count: user.media_count || 0,
            biography: user.biography || "",
            profile_picture_url: user.profile_picture_url || "",
            website: user.website || "",
            engagement_rate: Math.floor(Math.random() * 95) + 1,
            tags: ["Lifestyle"],
            is_verified: false,
          })) as InfluencerData[];
          // Merge without duplicates by username
          setInfluencersData((prev) => {
            const existing = new Set(prev.map((p) => p.username));
            const toAdd = mapped.filter((m) => !existing.has(m.username));
            if (toAdd.length === 0) return prev;
            const merged = [...prev, ...toAdd];
            try {
              const hashtag =
                localStorage.getItem(CURRENT_HASHTAG_LS_KEY) || "";
              const priorRaw = localStorage.getItem(INFLUENCERS_LS_KEY);
              const prior = priorRaw
                ? (JSON.parse(priorRaw) as {
                    hashtag?: string;
                    influencers?: InfluencerData[];
                  })
                : { hashtag, influencers: [] };
              const existingMap = new Map<string, InfluencerData>(
                (prior.influencers || []).map((i) => [i.username, i])
              );
              for (const i of toAdd)
                if (!existingMap.has(i.username))
                  existingMap.set(i.username, i);
              localStorage.setItem(
                INFLUENCERS_LS_KEY,
                JSON.stringify({
                  hashtag,
                  influencers: Array.from(existingMap.values()),
                })
              );
              // Also update current history entry with appended influencers
              try {
                const hid = localStorage.getItem(CURRENT_HISTORY_ID_LS_KEY);
                const rawHist = localStorage.getItem(HISTORY_LS_KEY);
                const hist = rawHist ? (JSON.parse(rawHist) as any[]) : [];
                const idx = hist.findIndex((h: any) => h.id === hid);
                if (idx >= 0) {
                  const map2 = new Map<string, any>(
                    (hist[idx].influencers || []).map((i: any) => [
                      i.username,
                      i,
                    ])
                  );
                  for (const i of toAdd)
                    if (!map2.has(i.username)) map2.set(i.username, i);
                  hist[idx].influencers = Array.from(map2.values());
                  localStorage.setItem(HISTORY_LS_KEY, JSON.stringify(hist));
                }
                // Best-effort append in backend
                if (hid && toAdd.length > 0) {
                  fetch("/api/history/influencers", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: hid, influencers: toAdd }),
                  }).catch(() => {});
                }
              } catch {}
            } catch {}
            return merged;
          });
          setShowInfluencers(true);
        }
        if (status.status === "completed" || status.status === "failed") {
          clearInterval(interval);
          try {
            localStorage.removeItem(CURRENT_JOB_LS_KEY);
          } catch {}
        }
      } catch {}
    }, 2500);
    return () => clearInterval(interval);
  }, [discoveryJobId]);

  const getPieChartColor = (engagement: number) => {
    if (engagement < 50) return "text-red-500";
    if (engagement < 80) return "text-yellow-500";
    return "text-green-500";
  };

  const PieChart = ({ percentage }: { percentage: number }) => {
    const circumference = 2 * Math.PI * 20;
    const strokeDasharray = `${
      (percentage / 100) * circumference
    } ${circumference}`;
    const color =
      percentage < 50 ? "#ef4444" : percentage < 80 ? "#eab308" : "#22c55e";

    return (
      <div className="relative w-12 h-12">
        <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 44 44">
          <circle
            cx="22"
            cy="22"
            r="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-muted-foreground/20"
          />
          <circle
            cx="22"
            cy="22"
            r="20"
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeDasharray={strokeDasharray}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-xs font-bold ${getPieChartColor(percentage)}`}>
            {percentage}%
          </span>
        </div>
      </div>
    );
  };

  const formatFollowerCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const acknowledgeDisclaimer = () => {
    try {
      localStorage.setItem(DISCLAIMER_LS_KEY, "1");
    } catch {}
    setShowDisclaimer(false);
  };

  const handleLogout = async () => {
    try {
      // Call backend logout endpoint
      await fetch(
        `${
          process.env.NODE_ENV === "production"
            ? "http://localhost:8000/logout"
            : "http://127.0.0.1:8000/logout"
        }`,
        {
          method: "POST",
          credentials: "include",
        }
      );
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      try {
        localStorage.removeItem(AUTH_LS_KEY);
        localStorage.removeItem(INFLUENCERS_LS_KEY);
        localStorage.removeItem(DISCLAIMER_LS_KEY);
        localStorage.removeItem(USER_DATA_LS_KEY);
      } catch {}
      router.replace("/");
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Header */}
      <header className="relative z-20 bg-background/80 backdrop-blur-sm border-b border-border/50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="relative"
            >
              <Bell className="h-5 w-5" />
              <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                3
              </Badge>
            </Button>
            <h1 className="text-xl font-bold">CampaignIO</h1>
          </div>

          {/* Navigation Buttons */}
          <nav className="hidden md:flex items-center gap-6">
            <Button
              variant="ghost"
              className="text-foreground hover:text-primary"
            >
              Services
            </Button>
            <Button
              asChild
              variant="ghost"
              className="text-foreground hover:text-primary"
            >
              <Link href="/home/about">About</Link>
            </Button>
            <Button
              variant="ghost"
              className="text-foreground hover:text-primary"
            >
              Prices
            </Button>
            <Button
              variant="ghost"
              className="text-foreground hover:text-primary"
            >
              Contact
            </Button>

            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 text-foreground hover:text-primary"
                >
                  <User className="h-4 w-4" />
                  {currentUser?.name || currentUser?.email || "User"}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => router.push("/home/user/profile")}
                >
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer text-red-600 hover:text-red-700"
                >
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>
        </div>
      </header>

      <div className="flex relative z-10">
        {/* Notification Sidebar */}
        <NotificationSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
            {/* Left Section */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h2 className="text-4xl font-bold mb-2">
                  Welcome {currentUser?.name || "User"},
                </h2>
                <p className="text-xl text-muted-foreground">
                  It's a great day
                </p>
              </div>

              {/* Contracts and Promotions Container */}
              <Card className="h-96">
                <CardHeader>
                  <CardTitle>Contracts and Promotions</CardTitle>
                  <hr className="border-border" />
                </CardHeader>
                <CardContent className="overflow-y-auto">
                  <div className="space-y-4">
                    {contractsData.map((contract) => (
                      <div
                        key={contract.id}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors"
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={
                              contract.image ||
                              "/placeholder.svg?height=40&width=40&query=creator%20avatar"
                            }
                            alt={contract.username}
                          />
                          <AvatarFallback>
                            {contract.username[1]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium">{contract.username}</p>
                          <p className="text-sm text-muted-foreground">
                            {contract.status}
                          </p>
                        </div>
                        <Badge
                          variant={
                            contract.type === "pending"
                              ? "secondary"
                              : contract.type === "posted"
                              ? "default"
                              : "outline"
                          }
                        >
                          {contract.type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Section */}
            <div className="space-y-6">
              <CampaignAnalytics className="h-96" />
            </div>
          </div>

          {/* Product Details Section */}
          <div className="w-full py-16 space-y-8 relative z-30 bg-card border-2 border-primary/20 rounded-2xl shadow-xl mt-16">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-foreground">
                Share your product details
              </h2>
              <p className="text-muted-foreground mt-2">
                Upload your product and find the perfect influencers
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-8">
              {/* Product Image Upload */}
              <div className="space-y-4">
                <Label
                  htmlFor="product-image"
                  className="text-lg font-semibold text-foreground"
                >
                  Product Image
                </Label>
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors bg-background/50 backdrop-blur-sm">
                  {productImage ? (
                    <div className="relative">
                      <img
                        src={productImage || "/placeholder.svg"}
                        alt="Product"
                        className="max-w-full h-48 object-cover rounded-lg mx-auto"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => setProductImage(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                      <p className="text-muted-foreground">
                        Click here to upload an image
                      </p>
                      <input
                        id="product-image"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <Button
                        variant="outline"
                        onClick={() =>
                          document.getElementById("product-image")?.click()
                        }
                      >
                        Choose File
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Product Details Form */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label
                    htmlFor="product-name"
                    className="text-lg font-semibold text-foreground"
                  >
                    Product
                  </Label>
                  <Input
                    id="product-name"
                    placeholder="Enter product name"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    className="text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="product-description"
                    className="text-lg font-semibold text-foreground"
                  >
                    Product Description
                  </Label>
                  <Textarea
                    id="product-description"
                    placeholder="Describe your product..."
                    value={productDescription}
                    onChange={(e) => setProductDescription(e.target.value)}
                    className="min-h-32 text-base"
                  />
                </div>

                <div className="space-y-4">
                  <Button
                    onClick={generateHashtags}
                    className="w-full"
                    disabled={
                      isGeneratingHashtags ||
                      (!productName.trim() && !productDescription.trim())
                    }
                  >
                    {isGeneratingHashtags
                      ? "Generating Hashtags..."
                      : "Generate Hashtags"}
                  </Button>

                  <div className="space-y-2">
                    <Label
                      htmlFor="hashtags"
                      className="text-lg font-semibold text-foreground"
                    >
                      Hashtags
                    </Label>
                    <Input
                      id="hashtags"
                      placeholder="Type hashtags separated by commas..."
                      value={hashtagInput}
                      onChange={handleHashtagInput}
                      className="text-base"
                    />

                    {hashtags.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        There are no hashtags available
                      </p>
                    )}

                    {hashtags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {hashtags.map((tag, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="flex items-center gap-1"
                          >
                            #{tag}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                              onClick={() => removeHashtag(tag)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {showFindInfluencers && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
                        <div>
                          <Label className="text-sm font-medium">Web Scraping</Label>
                          <p className="text-xs text-muted-foreground">
                            {webScrapingEnabled 
                              ? "Extract usernames from Instagram posts" 
                              : "Show permalinks only (Meta API compliant)"}
                          </p>
                        </div>
                        <Button
                          variant={webScrapingEnabled ? "default" : "outline"}
                          size="sm"
                          onClick={toggleWebScraping}
                        >
                          {webScrapingEnabled ? "Enabled" : "Disabled"}
                        </Button>
                      </div>
                      <Button
                        onClick={findInfluencers}
                        className="w-full"
                        disabled={isLoading}
                      >
                        {isLoading
                          ? "Finding Influencers..."
                          : "Find Influencers"}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {isLoading && (
            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
                <p className="text-lg font-semibold">
                  Finding the best influencers for your product...
                </p>
                <p className="text-sm text-muted-foreground">
                  Using real Instagram API data
                </p>
              </div>
            </div>
          )}

          {showInfluencers && (
            <div className="mt-8 w-full max-w-full overflow-hidden">
              <Card className="w-full">
                <CardHeader>
                  <CardTitle className="text-2xl">
                    Recommended Influencers
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {webScrapingEnabled
                      ? influencersData.length > 0
                        ? `Found ${influencersData.length} real influencers from Instagram`
                        : discoveryJobId
                        ? "Searching recommendations…"
                        : ""
                      : fallbackPermalinks.length > 0
                      ? `Showing ${fallbackPermalinks.length} Instagram posts (Web scraping disabled - Meta API compliant mode)`
                      : discoveryJobId
                      ? "Finding Instagram posts…"
                      : ""}
                  </p>
                </CardHeader>
                <CardContent className="max-w-full overflow-hidden">
                  {influencersData.length > 0 ? (
                    // Display regular influencers
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full">
                      {influencersData.map((influencer) => (
                        <Card
                          key={influencer.id}
                          onClick={() =>
                            router.push(
                              `/profile/${encodeURIComponent(
                                influencer.username
                              )}`
                            )
                          }
                          role="button"
                          tabIndex={0}
                          aria-label={`Open ${influencer.username} profile`}
                          className="p-4 hover:shadow-lg transition-shadow w-full min-w-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          <div className="flex items-start justify-between mb-3 gap-2">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <Avatar className="h-10 w-10 flex-shrink-0">
                                <AvatarImage
                                  src={
                                    influencer.profile_picture_url ||
                                    "/placeholder.svg?height=40&width=40&query=influencer%20avatar" ||
                                    "/placeholder.svg" ||
                                    "/placeholder.svg" ||
                                    "/placeholder.svg" ||
                                    "/placeholder.svg"
                                  }
                                  alt={influencer.username}
                                />
                                <AvatarFallback>
                                  {influencer.username[0]?.toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold text-sm truncate">
                                  @{influencer.username}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {formatFollowerCount(
                                    influencer.followers_count
                                  )}{" "}
                                  followers
                                </p>
                                {influencer.is_verified && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs mt-1"
                                  >
                                    Verified
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex-shrink-0">
                              <PieChart
                                percentage={influencer.engagement_rate}
                              />
                            </div>
                          </div>
                          <div className="space-y-2 min-w-0">
                            <p className="text-xs text-muted-foreground line-clamp-2 break-words">
                              {influencer.name}
                            </p>
                            <div className="flex flex-wrap gap-1 max-w-full">
                              {influencer.tags.slice(0, 3).map((tag, index) => (
                                <Badge
                                  key={index}
                                  variant="outline"
                                  className="text-xs truncate max-w-full"
                                >
                                  {tag.length > 10
                                    ? `${tag.substring(0, 10)}...`
                                    : tag}
                                </Badge>
                              ))}
                              {influencer.tags.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{influencer.tags.length - 3}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : fallbackPermalinks.length > 0 ? (
                    // Display fallback permalinks
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground mb-4">
                        {webScrapingEnabled
                          ? "Due to temporary Instagram API limitations, we're showing direct links to popular posts. Click on any link below to view the post and potentially connect with the creator."
                          : "Web scraping is disabled (Meta API compliant mode). Showing direct links to Instagram posts. Click any link to view the post and connect with the creator."}
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {fallbackPermalinks.map((permalink, index) => (
                          <a
                            key={index}
                            href={permalink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block p-3 border rounded-lg hover:bg-accent transition-colors group"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium truncate group-hover:underline">
                                Post {index + 1}
                              </span>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 text-muted-foreground"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                />
                              </svg>
                            </div>
                            <p className="text-xs text-muted-foreground truncate mt-1">
                              {permalink}
                            </p>
                          </a>
                        ))}
                      </div>
                    </div>
                  ) : (
                    // No data yet, likely still searching
                    <div className="p-6 text-sm text-muted-foreground">
                      Searching recommendations…
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>

      <AlertDialog
        open={showDisclaimer}
        onOpenChange={(open) => setShowDisclaimer(open)}
      >
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Disclaimer</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4 text-left">
                <p>
                  This platform is currently an MVP (Minimum Viable Product).
                  Some features may display dummy data created for demonstration
                  purposes, since I currently do not have access to Meta's APIs.
                  Once API access is granted, all features will be updated to
                  use live data from Meta as intended.
                </p>
                <div>
                  <p className="font-medium mb-2">For Meta Reviewer:</p>
                  <p className="mb-2">
                    I am building a startup focused on strengthening the
                    connection between brands and creators. The core idea
                    involves using Meta's APIs to:
                  </p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>
                      Collect top-performing posts and reels based on specific
                      hashtags.
                    </li>
                    <li>
                      Identify and connect with the owners of these posts/reels.
                    </li>
                  </ul>
                  <p className="mt-2">
                    These features require Meta's APIs, and the current dummy
                    data is a placeholder until full API access is available.
                  </p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button onClick={acknowledgeDisclaimer}>I understand</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
