"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface Notification {
  id: number
  image: string
  username: string
  message: string
  viewed: boolean
  time: string
}

const notifications: Notification[] = [
  {
    id: 1,
    image: "/fashion-influencer.png",
    username: "@fashionista_jane",
    message: "Negotiated price for summer campaign",
    viewed: false,
    time: "2h ago",
  },
  {
    id: 2,
    image: "/tech-reviewer.png",
    username: "@tech_guru_mike",
    message: "Interested to promote your brand",
    viewed: false,
    time: "4h ago",
  },
  {
    id: 3,
    image: "/lifestyle-blogger.png",
    username: "@lifestyle_sarah",
    message: "Campaign completed successfully",
    viewed: true,
    time: "1d ago",
  },
  {
    id: 4,
    image: "/fitness-influencer.png",
    username: "@fit_alex",
    message: "Ready to start collaboration",
    viewed: false,
    time: "2d ago",
  },
  {
    id: 5,
    image: "/food-blogger.png",
    username: "@foodie_emma",
    message: "Requesting content approval",
    viewed: true,
    time: "3d ago",
  },
]

interface NotificationSidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function NotificationSidebar({ isOpen, onClose }: NotificationSidebarProps) {
  const [notificationList, setNotificationList] = useState(notifications)

  const handleNotificationClick = (id: number) => {
    setNotificationList((prev) =>
      prev.map((notification) => (notification.id === id ? { ...notification, viewed: true } : notification)),
    )
  }

  const unviewedCount = notificationList.filter((n) => !n.viewed).length

  return (
    <>
      {/* Overlay */}
      {isOpen && <div className="fixed inset-0 bg-black/20 z-30 lg:hidden" onClick={onClose} />}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed left-0 top-0 h-full bg-background/95 backdrop-blur-sm border-r border-border/50 z-40 transition-all duration-300 ease-in-out",
          isOpen ? "w-80 lg:w-96" : "w-0 overflow-hidden",
        )}
      >
        <div className="p-4 border-b border-border/50">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              Notifications{" "}
              {unviewedCount > 0 && (
                <span className="ml-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                  {unviewedCount}
                </span>
              )}
            </h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="overflow-y-auto h-full pb-20">
          {notificationList.map((notification) => (
            <div
              key={notification.id}
              className={cn(
                "p-4 border-b border-border/30 cursor-pointer hover:bg-accent/50 transition-colors",
                !notification.viewed && "bg-accent/20",
              )}
              onClick={() => handleNotificationClick(notification.id)}
            >
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10 flex-shrink-0">
                  <AvatarImage src={notification.image || "/placeholder.svg"} alt={notification.username} />
                  <AvatarFallback>{notification.username[1]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      "font-medium text-sm",
                      notification.viewed ? "text-muted-foreground" : "text-foreground",
                    )}
                  >
                    {notification.username}
                  </p>
                  <p className={cn("text-sm mt-1", notification.viewed ? "text-muted-foreground" : "text-foreground")}>
                    {notification.message}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">{notification.time}</p>
                </div>
                {!notification.viewed && <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2" />}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
