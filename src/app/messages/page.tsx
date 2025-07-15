"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";

interface Message {
  id: string;
  listing_id: string;
  seller_email: string;
  buyer_email: string;
  message: string;
  created_at: string;
  read?: boolean;
}
export default function Messages() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (!user || !user.email) {
      setMessages([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(
      `${
        process.env.NEXT_PUBLIC_BASE_PATH || ""
      }/api/messages?user_email=${encodeURIComponent(user.email)}`
    )
      .then((res) => (res.ok ? res.json() : []))
      .then((data: Message[]) => {
        setMessages(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setMessages([]);
        setLoading(false);
      });
  }, [user]);

  const conversations: [string, Message[]][] = (() => {
    if (!user || !user.email) return [];
    const map = new Map<string, Message[]>();
    for (const msg of messages) {
      const other =
        msg.buyer_email === user.email ? msg.seller_email : msg.buyer_email;
      if (!map.has(other)) map.set(other, []);
      map.get(other)!.push(msg);
    }
    return Array.from(map.entries());
  })();

  // const filteredConversations = conversations
  //   .filter(([other, msgs]) => {
  //     if (!user || !user.email) return false;
  //     if (filter === "buyers") {
  //       return msgs.some((m: Message) => m.buyer_email === user.email);
  //     }
  //     if (filter === "sellers") {
  //       return msgs.some((m: Message) => m.seller_email === user.email);
  //     }
  //     return true;
  //   })
  //   .filter(([other, msgs]) => {
  //     if (!search) return true;
  //     return (
  //       other.toLowerCase().includes(search.toLowerCase()) ||
  //       msgs.some((m: Message) =>
  //         m.message.toLowerCase().includes(search.toLowerCase())
  //       )
  //     );
  //   });

  const filteredConversations = conversations
  .filter(([, msgs]) => {  // Use underscore or remove 'other' since it's not used
    if (!user || !user.email) return false;
    if (filter === "buyers") {
      return msgs.some((m: Message) => m.buyer_email === user.email);
    }
    if (filter === "sellers") {
      return msgs.some((m: Message) => m.seller_email === user.email);
    }
    return true;
  })
  .filter(([other, msgs]) => {  // 'other' is used here for search
    if (!search) return true;
    return (
      other.toLowerCase().includes(search.toLowerCase()) ||
      msgs.some((m: Message) =>
        m.message.toLowerCase().includes(search.toLowerCase())
      )
    );
  });

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Messages</h1>
        <p className="text-gray-600">
          {user
            ? `View all conversations from your listings (${
                filteredConversations.length
              } conversation${filteredConversations.length === 1 ? "" : "s"})`
            : "Sign in to view your messages."}
        </p>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search messages, listings, or participants..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            disabled={!user}
          />
        </div>
        <Select value={filter} onValueChange={setFilter} disabled={!user}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All participants</SelectItem>
            <SelectItem value="buyers">Buyers only</SelectItem>
            <SelectItem value="sellers">Sellers only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Messages Container */}
      <div className="border border-gray-200 rounded-lg bg-white min-h-[400px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center animate-pulse">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Mail className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Loading messages...
            </h3>
          </div>
        ) : !user ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Mail className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Sign in to view your messages
            </h3>
            <p className="text-gray-600 max-w-md">
              You must be signed in to see your sent and received messages.
            </p>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Mail className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No messages yet
            </h3>
            <p className="text-gray-600 max-w-md">
              Messages from interested buyers will appear here when they contact
              you about your listings.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {filteredConversations.map(([other, msgs]) => {
              const lastMsg = msgs[msgs.length - 1];
              return (
                <li
                  key={other}
                  className="p-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 hover:bg-gray-50 transition"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{other}</span>
                      <span className="text-xs text-gray-500">
                        {lastMsg.created_at
                          ? new Date(lastMsg.created_at).toLocaleString()
                          : ""}
                      </span>
                    </div>
                    <div className="text-gray-700 truncate max-w-full">
                      {lastMsg.message}
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <span className="inline-block bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                      {msgs.filter(
                        (m) => !m.read && m.seller_email === user.email
                      ).length > 0
                        ? "New"
                        : ""}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
