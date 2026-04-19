import { Pin } from "lucide-react";
import { AuthRoleProvider } from "../context/auth-role-context";
import { CommunityProfilesProvider } from "../context/community-profiles-context";
import { ResidentProfiles } from "./resident-profiles";
import { MessageBoard } from "./message-board";
import { EventsCalendar } from "./events-calendar";
import { Resources } from "./resources";
import { Toaster } from "./ui/sonner";
import { DashboardUserStrip } from "./dashboard-user-strip";
import { CommunityChatLinkButtons } from "./community-chat-link-buttons";

export function CommunityDashboard() {
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
            <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3 shrink-0 sm:flex-1 sm:min-w-0">
              <DashboardUserStrip />
              <CommunityChatLinkButtons />
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
