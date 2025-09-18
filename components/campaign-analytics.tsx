"use client"

import { useState, useMemo } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"

type Props = {
  className?: string
}

const lineData = [
  { week: "W1", engagement: 12, ctr: 1.4 },
  { week: "W2", engagement: 18, ctr: 1.9 },
  { week: "W3", engagement: 22, ctr: 2.4 },
  { week: "W4", engagement: 27, ctr: 2.9 },
  { week: "W5", engagement: 30, ctr: 3.1 },
]

const barData = [
  { channel: "Reels", reach: 5400 },
  { channel: "Stories", reach: 3200 },
  { channel: "Posts", reach: 4100 },
  { channel: "Live", reach: 1600 },
]

const pieData = [
  { name: "18-24", value: 28 },
  { name: "25-34", value: 44 },
  { name: "35-44", value: 18 },
  { name: "45+", value: 10 },
]

const areaData = [
  { day: "Mon", ctr: 1.2 },
  { day: "Tue", ctr: 1.6 },
  { day: "Wed", ctr: 2.1 },
  { day: "Thu", ctr: 2.8 },
  { day: "Fri", ctr: 3.0 },
  { day: "Sat", ctr: 2.5 },
  { day: "Sun", ctr: 2.2 },
]

const COLORS = ["#d73e0d", "#10252a", "#737373", "#eab308"]

export default function CampaignAnalytics({ className }: Props) {
  const slides = useMemo(
    () => [
      {
        key: "engagement-trend",
        node: (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="engagement" stroke="#d73e0d" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="ctr" stroke="#16a34a" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        ),
      },
      {
        key: "reach-by-channel",
        node: (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="channel" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip />
              <Bar dataKey="reach" fill="#10252a" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ),
      },
      {
        key: "audience-split",
        node: (
          <ResponsiveContainer width="100%" height="100%">
            <RPieChart>
              <Tooltip />
              <Legend />
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius="70%">
                {pieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
            </RPieChart>
          </ResponsiveContainer>
        ),
      },
      {
        key: "ctr-area",
        node: (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={areaData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="ctrGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#d73e0d" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="#d73e0d" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip />
              <Area type="monotone" dataKey="ctr" stroke="#d73e0d" fill="url(#ctrGradient)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        ),
      },
    ],
    [],
  )

  const [index, setIndex] = useState(0)
  const next = () => setIndex((i) => (i + 1) % slides.length)
  const prev = () => setIndex((i) => (i - 1 + slides.length) % slides.length)

  return (
    <Card className={className}>
      <CardHeader className="relative">
        <div className="flex items-center justify-center">
          <Button aria-label="Previous chart" variant="ghost" size="icon" className="absolute left-2" onClick={prev}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <CardTitle className="text-center">Campaign Analytics</CardTitle>
          <Button aria-label="Next chart" variant="ghost" size="icon" className="absolute right-2" onClick={next}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="h-80">
        <div className="relative h-full overflow-hidden">
          <div
            className="flex h-full w-full transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${index * 100}%)` }}
          >
            {slides.map((slide) => (
              <div key={slide.key} className="min-w-full h-full">
                {slide.node}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}