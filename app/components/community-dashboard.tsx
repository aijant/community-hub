import { Pin } from "lucide-react";
import { AuthRoleProvider } from "../context/auth-role-context";
import { CommunityProfilesProvider } from "../context/community-profiles-context";
import { ResidentProfiles } from "./resident-profiles";
import { MessageBoard } from "./message-board";
import { EventsCalendar } from "./events-calendar";
import { Resources } from "./resources";
import { Toaster } from "./ui/sonner";
import { Button } from "./ui/button";
import { getTelegramGroupUrl, getWhatsappGroupUrl } from "../lib/chat-group-urls";
import { TelegramMark, WhatsappMark } from "./icons/chat-group-icons";

const headerChatBtnClass =
  "h-9 rounded-lg border-gray-200 bg-white px-4 text-sm font-bold text-gray-900 shadow-none hover:bg-gray-50";

export function CommunityDashboard() {
  const whatsappUrl = getWhatsappGroupUrl();
  const telegramUrl = getTelegramGroupUrl();

  return (
    <AuthRoleProvider>
    <CommunityProfilesProvider>
    <div className="min-h-screen bg-[#f8f9fa]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-12 py-3.5 sm:py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 shrink-0 bg-gradient-to-br from-purple-600 to-blue-500 rounded-lg flex items-center justify-center shadow-sm">
                <Pin className="w-[18px] h-[18px] text-white stroke-[2.5]" aria-hidden />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-bold text-gray-950 tracking-tight">
                  Community Hub
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                  House Management & Resident Portal
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3 shrink-0">
              <Button variant="outline" size="sm" className={headerChatBtnClass} asChild>
                <a
                  href={whatsappUrl ?? "#"}
                  onClick={(e) => {
                    if (!whatsappUrl) e.preventDefault();
                  }}
                  {...(whatsappUrl
                    ? { target: "_blank" as const, rel: "noopener noreferrer" as const }
                    : { title: "Set VITE_WHATSAPP_GROUP_URL in .env.local (restart dev server)." })}
                >
                  <WhatsappMark className="h-4 w-4 shrink-0 text-gray-900" />
                  WhatsApp Group
                </a>
              </Button>
              <Button variant="outline" size="sm" className={headerChatBtnClass} asChild>
                <a
                  href={telegramUrl ?? "#"}
                  onClick={(e) => {
                    if (!telegramUrl) e.preventDefault();
                  }}
                  {...(telegramUrl
                    ? { target: "_blank" as const, rel: "noopener noreferrer" as const }
                    : { title: "Set VITE_TELEGRAM_GROUP_URL in .env.local (restart dev server)." })}
                >
                  <TelegramMark className="h-4 w-4 shrink-0 text-gray-900" />
                  Telegram Group
                </a>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-12 py-8">
        <div className="space-y-8">
          {/* Message Board + Events */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <section id="board" className="lg:col-span-2">
              <MessageBoard />
            </section>
            <section id="events">
              <EventsCalendar />
            </section>
          </div>

          {/* Resources (+ Quick Access inside component) */}
          <section id="resources">
            <Resources />
          </section>

          {/* Resident Profiles */}
          <section id="profiles">
            <ResidentProfiles />
          </section>
        </div>
      </main>
      <Toaster />
    </div>
    </CommunityProfilesProvider>
    </AuthRoleProvider>
  );
}
