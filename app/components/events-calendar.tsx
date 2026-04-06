import { useState } from "react";
import { Calendar, Clock, MapPin, Users, Plus, CheckCircle2 } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Badge } from "./ui/badge";
import { cn } from "./ui/utils";

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  organizer: string;
  attendees: string[];
  maxAttendees?: number;
}

export function EventsCalendar() {
  const [events, setEvents] = useState<Event[]>([
    {
      id: "1",
      title: "House Meeting",
      description: "Monthly meeting to discuss maintenance and events.",
      date: "2026-04-06",
      time: "18:00",
      location: "Common Area",
      organizer: "Sarah Chen",
      attendees: ["Sarah Chen", "Marcus Williams", "Priya Patel"],
    },
    {
      id: "2",
      title: "Board Game Night",
      description: "Bring your favorite games!",
      date: "2026-04-10",
      time: "19:00",
      location: "Living Room",
      organizer: "Marcus Williams",
      attendees: ["Marcus Williams", "Priya Patel"],
      maxAttendees: 8,
    },
    {
      id: "3",
      title: "Weekend Brunch",
      description: "Potluck style. Bring a dish!",
      date: "2026-04-13",
      time: "11:00",
      location: "Kitchen",
      organizer: "Priya Patel",
      attendees: ["Priya Patel", "Sarah Chen"],
      maxAttendees: 12,
    },
  ]);

  const [isOpen, setIsOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    location: "",
  });

  const handleCreateEvent = () => {
    if (!newEvent.title || !newEvent.date || !newEvent.time) return;

    const event: Event = {
      id: Date.now().toString(),
      ...newEvent,
      organizer: "You",
      attendees: ["You"],
    };

    setEvents([...events, event].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    setNewEvent({ title: "", description: "", date: "", time: "", location: "" });
    setIsOpen(false);
  };

  const toggleAttendance = (eventId: string) => {
    setEvents(
      events.map((event) => {
        if (event.id !== eventId) return event;
        const isAttending = event.attendees.includes("You");
        return {
          ...event,
          attendees: isAttending
            ? event.attendees.filter((a) => a !== "You")
            : [...event.attendees, "You"],
        };
      })
    );
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  // Get next upcoming event for highlight
  const upcomingEvent = events.find((event) => new Date(event.date) >= new Date());

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-gray-700" />
          <h2 className="text-lg font-semibold text-gray-900">Events</h2>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="gap-2">
              <Plus className="w-4 h-4" />
              Create
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Event</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="title">Event Title</Label>
                <Input
                  id="title"
                  placeholder="Movie Night, Potluck..."
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="What's this event about?"
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  className="min-h-[60px] text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Time</Label>
                  <Input
                    id="time"
                    type="time"
                    value={newEvent.time}
                    onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="Common Area, Kitchen..."
                  value={newEvent.location}
                  onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                />
              </div>
              <Button onClick={handleCreateEvent} className="w-full">
                Create Event
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Highlighted Next Event */}
      {upcomingEvent && (
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200">
          <div className="space-y-3">
            <Badge className="bg-blue-600 text-white">Next Event</Badge>
            <div>
              <h3 className="font-semibold text-gray-900">{upcomingEvent.title}</h3>
              <p className="text-sm text-gray-700 mt-1">{upcomingEvent.description}</p>
            </div>
            <div className="space-y-1.5 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>
                  {formatDate(upcomingEvent.date)} at {upcomingEvent.time}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>{upcomingEvent.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>
                  {upcomingEvent.attendees.length}
                  {upcomingEvent.maxAttendees && `/${upcomingEvent.maxAttendees}`} attending
                </span>
              </div>
            </div>
            <Button
              onClick={() => toggleAttendance(upcomingEvent.id)}
              variant={upcomingEvent.attendees.includes("You") ? "default" : "outline"}
              size="sm"
              className="w-full gap-2"
            >
              {upcomingEvent.attendees.includes("You") ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Attending
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  RSVP
                </>
              )}
            </Button>
          </div>
        </Card>
      )}

      {/* All Events List */}
      <Card className="bg-white border border-gray-200">
        <div className="p-3 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900 text-sm">All Events</h3>
        </div>
        <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
          {events.map((event) => {
            const isAttending = event.attendees.includes("You");
            const isFull = event.maxAttendees && event.attendees.length >= event.maxAttendees;

            return (
              <div key={event.id} className="p-3 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 space-y-1 min-w-0">
                    <h4 className="font-medium text-gray-900 text-sm">{event.title}</h4>
                    <p className="text-xs text-gray-600">{event.description}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>{formatDate(event.date)}</span>
                      <span>{event.time}</span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {event.attendees.length}
                      </span>
                    </div>
                  </div>
                  <Button
                    onClick={() => toggleAttendance(event.id)}
                    variant={isAttending ? "default" : "outline"}
                    size="sm"
                    disabled={!isAttending && isFull}
                    className={cn("shrink-0", isAttending ? "h-7 px-2" : "h-7 px-2")}
                  >
                    {isAttending ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <Plus className="w-3.5 h-3.5" />
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
