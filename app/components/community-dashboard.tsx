import { Pin } from "lucide-react";
import { ResidentProfiles } from "./resident-profiles";
import { MessageBoard } from "./message-board";
import { EventsCalendar } from "./events-calendar";
import { Resources } from "./resources";

export function CommunityDashboard() {
  return (
    <div className="min-h-screen bg-[#f7f6f3]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-[1400px] mx-auto px-8 py-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Pin className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Community Hub</h1>
              <p className="text-xs text-gray-600">House Management & Resident Portal</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1400px] mx-auto px-8 py-8">
        <div className="space-y-8">
          {/* Resident Profiles Section */}
          <section id="profiles">
            <ResidentProfiles />
          </section>

          {/* Two Column Layout for Message Board and Events */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Message Board - Takes 2 columns */}
            <section id="board" className="lg:col-span-2">
              <MessageBoard />
            </section>

            {/* Events Calendar - Takes 1 column */}
            <section id="events">
              <EventsCalendar />
            </section>
          </div>

          {/* Resources Section */}
          <section id="resources">
            <Resources />
          </section>
        </div>
      </main>
    </div>
  );
}
