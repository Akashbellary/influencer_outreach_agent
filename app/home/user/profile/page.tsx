"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Plus,
  ChevronDown,
  ChevronRight,
  X,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import Link from "next/link";

interface TodoItem {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  expanded: boolean;
}

interface ChatMessage {
  id: number;
  text: string;
  sender: "user" | "contact";
  timestamp: string;
}

interface ChatData {
  username: string;
  platform: "WhatsApp" | "Instagram" | "TikTok";
  messages: ChatMessage[];
}

const chartData = [
  { name: "Engagements", value: 75, color: "#22c55e" },
  { name: "Responses", value: 60, color: "#3b82f6" },
  { name: "Views", value: 85, color: "#f59e0b" },
  { name: "Credit Left", value: 40, color: "#ef4444" },
];

const chatData: { [key: string]: ChatData } = {
  "@fashionista_jane": {
    username: "@fashionista_jane",
    platform: "Instagram",
    messages: [
      {
        id: 1,
        text: "Hi! I'm interested in your summer campaign",
        sender: "contact",
        timestamp: "10:30 AM",
      },
      {
        id: 2,
        text: "That's great! I'd love to discuss the details with you",
        sender: "user",
        timestamp: "10:32 AM",
      },
      {
        id: 3,
        text: "What kind of content are you looking for?",
        sender: "contact",
        timestamp: "10:35 AM",
      },
      {
        id: 4,
        text: "We're focusing on lifestyle and fashion content for our summer collection",
        sender: "user",
        timestamp: "10:37 AM",
      },
    ],
  },
  "@tech_guru_mike": {
    username: "@tech_guru_mike",
    platform: "TikTok",
    messages: [
      {
        id: 1,
        text: "Thanks for the collaboration opportunity",
        sender: "contact",
        timestamp: "Yesterday",
      },
      {
        id: 2,
        text: "You're welcome! Looking forward to working together",
        sender: "user",
        timestamp: "Yesterday",
      },
      {
        id: 3,
        text: "When do you need the content delivered?",
        sender: "contact",
        timestamp: "Yesterday",
      },
    ],
  },
  "@lifestyle_sarah": {
    username: "@lifestyle_sarah",
    platform: "WhatsApp",
    messages: [
      {
        id: 1,
        text: "Can we discuss the terms?",
        sender: "contact",
        timestamp: "2 days ago",
      },
      {
        id: 2,
        text: "Of course! What specific terms would you like to discuss?",
        sender: "user",
        timestamp: "2 days ago",
      },
      {
        id: 3,
        text: "I'm mainly interested in the payment structure and timeline",
        sender: "contact",
        timestamp: "2 days ago",
      },
    ],
  },
};

const tabsData = {
  Timeline: [
    {
      id: 1,
      type: "post",
      content: "Posted new campaign update",
      time: "2 hours ago",
      user: "John Doe",
    },
    {
      id: 2,
      type: "meeting",
      content: "Meeting with @fashionista_jane scheduled",
      time: "4 hours ago",
      user: "System",
    },
    {
      id: 3,
      type: "update",
      content: "Campaign metrics updated",
      time: "1 day ago",
      user: "Analytics",
    },
  ],
  Notes: [
    {
      id: 1,
      title: "Campaign Strategy",
      content:
        "Focus on summer collection with bright colors and outdoor settings",
      date: "2024-01-15",
    },
    {
      id: 2,
      title: "Influencer Feedback",
      content:
        "Positive response from lifestyle influencers, need to adjust pricing",
      date: "2024-01-14",
    },
    {
      id: 3,
      title: "Market Research",
      content: "Target audience shows high engagement with video content",
      date: "2024-01-13",
    },
  ],
  Events: [
    {
      id: 1,
      title: "Product Launch Event",
      date: "2024-02-15",
      time: "10:00 AM",
      location: "New York",
    },
    {
      id: 2,
      title: "Influencer Meetup",
      date: "2024-02-20",
      time: "2:00 PM",
      location: "Los Angeles",
    },
    {
      id: 3,
      title: "Campaign Review",
      date: "2024-02-25",
      time: "3:00 PM",
      location: "Virtual",
    },
  ],
  Tasks: [
    {
      id: 1,
      title: "Review influencer proposals",
      status: "pending",
      priority: "high",
      dueDate: "2024-01-20",
    },
    {
      id: 2,
      title: "Update campaign budget",
      status: "in-progress",
      priority: "medium",
      dueDate: "2024-01-22",
    },
    {
      id: 3,
      title: "Prepare monthly report",
      status: "completed",
      priority: "low",
      dueDate: "2024-01-18",
    },
  ],
  Deals: [
    {
      id: 1,
      title: "Summer Campaign Deal",
      value: "$5,000",
      status: "negotiating",
      influencer: "@fashionista_jane",
    },
    {
      id: 2,
      title: "Tech Review Partnership",
      value: "$3,500",
      status: "closed",
      influencer: "@tech_guru_mike",
    },
    {
      id: 3,
      title: "Lifestyle Brand Collab",
      value: "$4,200",
      status: "pending",
      influencer: "@lifestyle_sarah",
    },
  ],
  Campaigns: [
    {
      id: 1,
      name: "Summer Collection 2024",
      status: "active",
      budget: "$15,000",
      reach: "250K",
      engagement: "8.5%",
    },
    {
      id: 2,
      name: "Tech Product Launch",
      status: "completed",
      budget: "$12,000",
      reach: "180K",
      engagement: "12.3%",
    },
    {
      id: 3,
      name: "Lifestyle Brand Awareness",
      status: "planning",
      budget: "$8,000",
      reach: "120K",
      engagement: "6.2%",
    },
  ],
  Messages: [
    {
      id: 1,
      sender: "@fashionista_jane",
      message: "Hi! I'm interested in your summer campaign",
      time: "10:30 AM",
      unread: true,
    },
    {
      id: 2,
      sender: "@tech_guru_mike",
      message: "Thanks for the collaboration opportunity",
      time: "Yesterday",
      unread: false,
    },
    {
      id: 3,
      sender: "@lifestyle_sarah",
      message: "Can we discuss the terms?",
      time: "2 days ago",
      unread: true,
    },
  ],
  History: [],
};

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("Timeline");
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [chatMessages, setChatMessages] = useState<{
    [key: string]: ChatMessage[];
  }>(
    Object.fromEntries(
      Object.entries(chatData).map(([key, value]) => [key, value.messages])
    )
  );
  const [history, setHistory] = useState<any[]>([]);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<any>(null);

  // Inline edit states per tab
  const [timelineItems, setTimelineItems] = useState<any[]>([
    ...tabsData.Timeline,
  ]);
  const [editingTimelineId, setEditingTimelineId] = useState<number | null>(
    null
  );
  const [timelineDraft, setTimelineDraft] = useState<{
    content: string;
    user: string;
    time: string;
  }>({ content: "", user: "", time: "" });

  const [notesItems, setNotesItems] = useState<any[]>([...tabsData.Notes]);
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [noteDraft, setNoteDraft] = useState<{
    title: string;
    content: string;
    date: string;
  }>({ title: "", content: "", date: "" });

  // Editable lists for each tab
  const [eventsItems, setEventsItems] = useState<any[]>([...tabsData.Events]);
  const [tasksItems, setTasksItems] = useState<any[]>([...tabsData.Tasks]);
  const [dealsItems, setDealsItems] = useState<any[]>([...tabsData.Deals]);
  const [campaignItems, setCampaignItems] = useState<any[]>([
    ...tabsData.Campaigns,
  ]);
  const [messagesItems, setMessagesItems] = useState<any[]>([
    ...tabsData.Messages,
  ]);

  useEffect(() => {
    const storedHistory = localStorage.getItem("campaignio:history");
    if (storedHistory) {
      setHistory(JSON.parse(storedHistory));
    }
    // Fetch latest from backend and reconcile
    (async () => {
      try {
        const res = await fetch("/api/history");
        const data = await res.json();
        if (res.ok && data?.success && Array.isArray(data.items)) {
          // Merge by id, prefer server
          setHistory((prev) => {
            const map = new Map<string, any>(
              (prev || []).map((h: any) => [h.id, h])
            );
            for (const srv of data.items)
              map.set(srv.id, { ...map.get(srv.id), ...srv });
            const merged = Array.from(map.values()).sort((a, b) =>
              (b.updatedAt || "").localeCompare(a.updatedAt || "")
            );
            try {
              localStorage.setItem(
                "campaignio:history",
                JSON.stringify(merged)
              );
            } catch {}
            return merged;
          });
        }
      } catch {}
    })();
  }, []);

  const [todos, setTodos] = useState<TodoItem[]>([
    {
      id: 1,
      title: "Review campaign proposals",
      description: "Check all pending influencer proposals for summer campaign",
      completed: false,
      expanded: false,
    },
    {
      id: 2,
      title: "Update budget allocation",
      description: "Adjust budget distribution across different campaigns",
      completed: true,
      expanded: false,
    },
    {
      id: 3,
      title: "Schedule team meeting",
      description: "Organize weekly sync with marketing team",
      completed: false,
      expanded: false,
    },
  ]);
  const [newTodoTitle, setNewTodoTitle] = useState("");
  const [showAddTodo, setShowAddTodo] = useState(false);

  const openChat = (sender: string) => {
    setSelectedChat(sender);
  };

  const closeChat = () => {
    setSelectedChat(null);
    setNewMessage("");
  };

  const sendMessage = () => {
    if (newMessage.trim() && selectedChat) {
      const newMsg: ChatMessage = {
        id: Date.now(),
        text: newMessage,
        sender: "user",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setChatMessages((prev) => ({
        ...prev,
        [selectedChat]: [...(prev[selectedChat] || []), newMsg],
      }));
      setNewMessage("");
    }
  };

  const summarizeConversation = () => {
    if (selectedChat && chatMessages[selectedChat]) {
      const messages = chatMessages[selectedChat];
      const summary = `Conversation with ${selectedChat}: ${messages.length} messages exchanged. Key topics discussed include campaign collaboration, content requirements, and partnership terms.`;
      alert(summary); // In a real app, this would be a proper modal or notification
    }
  };

  const addTodo = () => {
    if (newTodoTitle.trim()) {
      const newTodo: TodoItem = {
        id: Date.now(),
        title: newTodoTitle,
        description: "",
        completed: false,
        expanded: false,
      };
      setTodos([...todos, newTodo]);
      setNewTodoTitle("");
      setShowAddTodo(false);
    }
  };

  const toggleTodo = (id: number) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const toggleExpanded = (id: number) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, expanded: !todo.expanded } : todo
      )
    );
  };

  const renderTabContent = (tabName: string) => {
    const data =
      tabName === "Timeline"
        ? timelineItems
        : tabName === "Notes"
        ? notesItems
        : tabName === "Events"
        ? eventsItems
        : tabName === "Tasks"
        ? tasksItems
        : tabName === "Deals"
        ? dealsItems
        : tabName === "Campaigns"
        ? campaignItems
        : tabName === "Messages"
        ? messagesItems
        : [];

    switch (tabName) {
      case "Timeline":
        return (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setTimelineItems((s) => [
                    ...s,
                    {
                      id: Date.now(),
                      type: "update",
                      content: "New timeline item",
                      time: new Date().toLocaleString(),
                      user: "You",
                    },
                  ])
                }
              >
                Add
              </Button>
            </div>
            {timelineItems.map((item: any) => (
              <div
                key={item.id}
                className="flex items-start gap-3 p-3 border-l-2 border-primary/20"
              >
                <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                <div className="flex-1">
                  {editingTimelineId === item.id ? (
                    <div className="space-y-2">
                      <Input
                        placeholder="Content"
                        value={timelineDraft.content}
                        onChange={(e) =>
                          setTimelineDraft({
                            ...timelineDraft,
                            content: e.target.value,
                          })
                        }
                      />
                      <div className="flex gap-2">
                        <Input
                          placeholder="User"
                          value={timelineDraft.user}
                          onChange={(e) =>
                            setTimelineDraft({
                              ...timelineDraft,
                              user: e.target.value,
                            })
                          }
                        />
                        <Input
                          placeholder="Time"
                          value={timelineDraft.time}
                          onChange={(e) =>
                            setTimelineDraft({
                              ...timelineDraft,
                              time: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            setTimelineItems((s) =>
                              s.map((x) =>
                                x.id === item.id
                                  ? { ...x, ...timelineDraft }
                                  : x
                              )
                            );
                            setEditingTimelineId(null);
                          }}
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingTimelineId(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="font-medium">{item.content}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.user} • {item.time}
                      </p>
                    </>
                  )}
                </div>
                {editingTimelineId === item.id ? null : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mr-2"
                    onClick={() => {
                      setEditingTimelineId(item.id);
                      setTimelineDraft({
                        content: item.content || "",
                        user: item.user || "",
                        time: item.time || "",
                      });
                    }}
                  >
                    Edit
                  </Button>
                )}
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() =>
                    setTimelineItems((s) => s.filter((x) => x.id !== item.id))
                  }
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        );

      case "Notes":
        return (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setNotesItems((s) => [
                    ...s,
                    {
                      id: Date.now(),
                      title: "New Note",
                      content: "Details...",
                      date: new Date().toISOString().slice(0, 10),
                    },
                  ])
                }
              >
                Add
              </Button>
            </div>
            {notesItems.map((item: any) => (
              <Card key={item.id} className="p-4">
                {editingNoteId === item.id ? (
                  <div className="space-y-2">
                    <Input
                      placeholder="Title"
                      value={noteDraft.title}
                      onChange={(e) =>
                        setNoteDraft({ ...noteDraft, title: e.target.value })
                      }
                    />
                    <Input
                      placeholder="Content"
                      value={noteDraft.content}
                      onChange={(e) =>
                        setNoteDraft({ ...noteDraft, content: e.target.value })
                      }
                    />
                    <Input
                      placeholder="YYYY-MM-DD"
                      value={noteDraft.date}
                      onChange={(e) =>
                        setNoteDraft({ ...noteDraft, date: e.target.value })
                      }
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          setNotesItems((s) =>
                            s.map((x) =>
                              x.id === item.id ? { ...x, ...noteDraft } : x
                            )
                          );
                          setEditingNoteId(null);
                        }}
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingNoteId(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h4 className="font-semibold mb-2">{item.title}</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      {item.content}
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        {item.date}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingNoteId(item.id);
                            setNoteDraft({
                              title: item.title || "",
                              content: item.content || "",
                              date: item.date || "",
                            });
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() =>
                            setNotesItems((s) =>
                              s.filter((x) => x.id !== item.id)
                            )
                          }
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </Card>
            ))}
          </div>
        );

      case "Events":
        return (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setEventsItems((s) => [
                    ...s,
                    {
                      id: Date.now(),
                      title: "New Event",
                      date: new Date().toISOString().slice(0, 10),
                      time: new Date().toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      }),
                      location: "TBD",
                    },
                  ])
                }
              >
                Add
              </Button>
            </div>
            {data.map((item: any) => (
              <Card key={item.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {item.date} at {item.time}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {item.location}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Scheduled</Badge>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() =>
                        setEventsItems((s) => s.filter((x) => x.id !== item.id))
                      }
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        );

      case "Tasks":
        return (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setTasksItems((s) => [
                    ...s,
                    {
                      id: Date.now(),
                      title: "New Task",
                      status: "pending",
                      priority: "low",
                      dueDate: new Date().toISOString().slice(0, 10),
                    },
                  ])
                }
              >
                Add
              </Button>
            </div>
            {data.map((item: any) => (
              <Card key={item.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      Due: {item.dueDate}
                    </p>
                  </div>
                  <div className="flex gap-2 items-center">
                    <Badge
                      variant={
                        item.priority === "high"
                          ? "destructive"
                          : item.priority === "medium"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {item.priority}
                    </Badge>
                    <Badge
                      variant={
                        item.status === "completed" ? "default" : "outline"
                      }
                    >
                      {item.status}
                    </Badge>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() =>
                        setTasksItems((s) => s.filter((x) => x.id !== item.id))
                      }
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        );

      case "Deals":
        return (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setDealsItems((s) => [
                    ...s,
                    {
                      id: Date.now(),
                      title: "New Deal",
                      value: "$0",
                      status: "pending",
                      influencer: "@user",
                    },
                  ])
                }
              >
                Add
              </Button>
            </div>
            {data.map((item: any) => (
              <Card key={item.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      with {item.influencer}
                    </p>
                    <p className="text-lg font-bold text-primary">
                      {item.value}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        item.status === "closed"
                          ? "default"
                          : item.status === "negotiating"
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {item.status}
                    </Badge>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() =>
                        setDealsItems((s) => s.filter((x) => x.id !== item.id))
                      }
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        );

      case "Campaigns":
        return (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setCampaignItems((s) => [
                    ...s,
                    {
                      id: Date.now(),
                      name: "New Campaign",
                      status: "planning",
                      budget: "$0",
                      reach: "0",
                      engagement: "0%",
                    },
                  ])
                }
              >
                Add
              </Button>
            </div>
            {data.map((item: any) => (
              <Card key={item.id} className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-semibold">{item.name}</h4>
                  <Badge
                    variant={
                      item.status === "active"
                        ? "default"
                        : item.status === "completed"
                        ? "secondary"
                        : "outline"
                    }
                  >
                    {item.status}
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Budget</p>
                    <p className="font-medium">{item.budget}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Reach</p>
                    <p className="font-medium">{item.reach}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Engagement</p>
                    <p className="font-medium">{item.engagement}</p>
                  </div>
                </div>
                <div className="flex justify-end mt-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() =>
                      setCampaignItems((s) => s.filter((x) => x.id !== item.id))
                    }
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        );

      case "Messages":
        return (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setMessagesItems((s) => [
                    ...s,
                    {
                      id: Date.now(),
                      sender: "@new_contact",
                      message: "New message",
                      time: new Date().toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      }),
                      unread: true,
                    },
                  ])
                }
              >
                Add
              </Button>
            </div>
            {data.map((item: any) => (
              <Card
                key={item.id}
                className={`p-4 cursor-pointer hover:bg-accent/50 transition-colors ${
                  item.unread ? "border-primary/50 bg-primary/5" : ""
                }`}
                onClick={() => openChat(item.sender)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={`/abstract-geometric-shapes.png?height=32&width=32&query=${item.sender}`}
                      />
                      <AvatarFallback>
                        {item.sender[1]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{item.sender}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.message}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">{item.time}</p>
                    {item.unread && (
                      <div className="w-2 h-2 bg-primary rounded-full mt-1 ml-auto"></div>
                    )}
                    <div className="flex justify-end mt-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMessagesItems((s) =>
                            s.filter((x) => x.id !== item.id)
                          );
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        );

      case "History":
        if (selectedHistoryItem) {
          return (
            <div>
              <Button
                onClick={() => setSelectedHistoryItem(null)}
                className="mb-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to History
              </Button>
              <h2 className="text-2xl font-bold mb-4">
                Recommended Influencers
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {selectedHistoryItem.influencers.map((influencer: any) => (
                  <Card key={influencer.id} className="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={influencer.profile_picture_url} />
                        <AvatarFallback>
                          {influencer.username[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">@{influencer.username}</p>
                        <p className="text-sm text-muted-foreground">
                          {influencer.followers_count} followers
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          );
        }
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {history.map((item: any) => (
              <Card
                key={item.id}
                className="p-4 hover:bg-accent/50 transition-colors flex flex-col cursor-pointer"
                onClick={() => setSelectedHistoryItem(item)}
              >
                <div className="flex items-start gap-3">
                  <img
                    src={item.image}
                    alt={item.productName}
                    className="h-16 w-16 rounded object-cover flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <h4 className="font-semibold text-sm truncate">
                      {item.productName}
                    </h4>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {item.productDescription}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {item.hashtags.map((tag: string, idx: number) => (
                        <Badge
                          key={idx}
                          variant="secondary"
                          className="text-[10px]"
                        >
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      setHistory((prev) => {
                        const next = prev.filter((h) => h.id !== item.id);
                        try {
                          localStorage.setItem(
                            "campaignio:history",
                            JSON.stringify(next)
                          );
                        } catch {}
                        return next;
                      });
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        );

      default:
        return <div>No content available</div>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 p-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/home">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-xl font-semibold">User Profile</h1>
        </div>
      </header>

      <div className="flex">
        {/* Left Sidebar */}
        <div className="w-80 border-r border-border/50 p-6 space-y-6">
          {/* Profile Section */}
          <div className="text-center space-y-4">
            <Avatar className="h-24 w-24 mx-auto">
              <AvatarImage src="/user-profile-illustration.png" />
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-semibold">John Doe</h2>
              <p className="text-muted-foreground">Campaign Manager</p>
            </div>

            {/* Rating */}
            <div className="flex justify-center items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <div key={star} className="w-4 h-4 text-yellow-400">
                  ★
                </div>
              ))}
              <span className="ml-2 text-sm text-muted-foreground">4.8</span>
            </div>

            {/* Streak */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Current Streak</p>
              <p className="text-2xl font-bold text-primary">15 days</p>
            </div>
          </div>

          {/* Charts Section */}
          <div className="space-y-4">
            <h3 className="font-semibold">Analytics</h3>
            <div className="grid grid-cols-2 gap-4">
              {chartData.map((item, index) => (
                <Card key={index} className="p-3">
                  <div className="text-center space-y-2">
                    <div className="w-16 h-16 mx-auto">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { value: item.value, fill: item.color },
                              { value: 100 - item.value, fill: "#e5e7eb" },
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={20}
                            outerRadius={30}
                            startAngle={90}
                            endAngle={450}
                            dataKey="value"
                          >
                            {[0, 1].map((entry, index) => (
                              <Cell key={`cell-${index}`} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {item.name}
                      </p>
                      <p className="font-semibold">{item.value}%</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Todo List */}
          <Card className="rounded-xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Todo List</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setShowAddTodo(!showAddTodo)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-0">
              {showAddTodo && (
                <div className="mb-4 space-y-2">
                  <Input
                    placeholder="Enter todo title..."
                    value={newTodoTitle}
                    onChange={(e) => setNewTodoTitle(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addTodo()}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={addTodo}>
                      Add
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowAddTodo(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {todos.map((todo, index) => (
                <div key={todo.id}>
                  <div
                    className="flex items-center gap-3 p-3 hover:bg-accent/50 rounded cursor-pointer"
                    onClick={() => toggleExpanded(todo.id)}
                  >
                    <input
                      type="checkbox"
                      checked={todo.completed}
                      onChange={() => toggleTodo(todo.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="rounded"
                    />
                    <div className="flex-1">
                      <p
                        className={`text-sm ${
                          todo.completed
                            ? "line-through text-muted-foreground"
                            : ""
                        }`}
                      >
                        {todo.title}
                      </p>
                    </div>
                    {todo.expanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </div>

                  {todo.expanded && todo.description && (
                    <div className="pl-10 pb-3">
                      <p className="text-xs text-muted-foreground">
                        {todo.description}
                      </p>
                    </div>
                  )}

                  {index < todos.length - 1 && (
                    <div className="border-b border-border/30" />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-8">
              <TabsTrigger value="Timeline">Timeline</TabsTrigger>
              <TabsTrigger value="Notes">Notes</TabsTrigger>
              <TabsTrigger value="Events">Events</TabsTrigger>
              <TabsTrigger value="Tasks">Tasks</TabsTrigger>
              <TabsTrigger value="Deals">Deals</TabsTrigger>
              <TabsTrigger value="Campaigns">Campaigns</TabsTrigger>
              <TabsTrigger value="Messages">Messages</TabsTrigger>
              <TabsTrigger value="History">History</TabsTrigger>
            </TabsList>

            {Object.keys(tabsData).map((tabName) => (
              <TabsContent key={tabName} value={tabName} className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{tabName}</CardTitle>
                  </CardHeader>
                  <CardContent>{renderTabContent(tabName)}</CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>

      {selectedChat && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg shadow-xl w-full max-w-2xl h-[600px] flex flex-col">
            {/* Chat Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={`/abstract-geometric-shapes.png?height=32&width=32&query=${selectedChat}`}
                  />
                  <AvatarFallback>
                    {selectedChat[1]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <h3 className="font-semibold">{selectedChat}</h3>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={summarizeConversation}
                >
                  Summarize
                </Button>
                {chatData[selectedChat]?.platform === "Instagram" ? (
                  <a
                    href={`https://www.instagram.com/${selectedChat.replace(
                      /^@/,
                      ""
                    )}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Badge
                      variant="secondary"
                      className="text-xs cursor-pointer hover:bg-accent"
                    >
                      {chatData[selectedChat]?.platform}
                    </Badge>
                  </a>
                ) : (
                  <Badge variant="secondary" className="text-xs">
                    {chatData[selectedChat]?.platform}
                  </Badge>
                )}
                <Button variant="ghost" size="icon" onClick={closeChat}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {(chatMessages[selectedChat] || []).map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      message.sender === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <p className="text-sm">{message.text}</p>
                    <p
                      className={`text-xs mt-1 ${
                        message.sender === "user"
                          ? "text-primary-foreground/70"
                          : "text-muted-foreground"
                      }`}
                    >
                      {message.timestamp}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                  className="flex-1"
                />
                <Button onClick={sendMessage} size="icon">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
