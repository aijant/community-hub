import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Plus,
  CheckCircle2,
  Loader2,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Badge } from "./ui/badge";
import { cn } from "./ui/utils";
import { supabaseConfigured } from "../lib/supabase-client";
import {
  type CommunityEventView,
  createCommunityEvent,
  deleteCommunityEvent,
  fetchCommunityEvents,
  joinCommunityEvent,
  leaveCommunityEvent,
  updateCommunityEvent,
} from "../lib/community-events";
import { useCommunityProfiles } from "../context/community-profiles-context";
import { useAuthRole } from "../hooks/use-auth-role";

type EventForm = {
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
};

const emptyForm = (): EventForm => ({
  title: "",
  description: "",
  date: "",
  time: "",
  location: "",
});

function formFromEvent(ev: CommunityEventView): EventForm {
  return {
    title: ev.title,
    description: ev.description,
    date: ev.date,
    time: ev.time,
    location: ev.location,
  };
}

export function EventsCalendar() {
  const { rows, loading: profilesLoading, error: profilesError, reload: reloadProfiles } =
    useCommunityProfiles();
  const { user, loading: authLoading, error: roleError, canModerate } = useAuthRole();

  const profileRows = useMemo(() => rows.map((r) => ({ id: r.id, name: r.name })), [rows]);

  const [events, setEvents] = useState<CommunityEventView[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [newEvent, setNewEvent] = useState<EventForm>(emptyForm);
  const [createSubmitting, setCreateSubmitting] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CommunityEventView | null>(null);
  const [editForm, setEditForm] = useState<EventForm>(emptyForm);
  const [editSubmitting, setEditSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<CommunityEventView | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const [rsvpBusyId, setRsvpBusyId] = useState<string | null>(null);

  const loadEvents = useCallback(async () => {
    if (!supabaseConfigured) return;
    setEventsLoading(true);
    setEventsError(null);
    try {
      const list = await fetchCommunityEvents(profileRows);
      setEvents(list);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not load events.";
      setEventsError(msg);
      setEvents([]);
    } finally {
      setEventsLoading(false);
    }
  }, [profileRows]);

  useEffect(() => {
    if (!supabaseConfigured || profilesLoading) return;
    void loadEvents();
  }, [loadEvents, profilesLoading]);

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

  const upcomingEvent = events.find((event) => new Date(event.date) >= new Date());

  const createDisabled = !supabaseConfigured || authLoading || !user;

  const handleCreateEvent = async () => {
    if (!newEvent.title.trim() || !newEvent.date || !newEvent.time || !user) return;
    setCreateSubmitting(true);
    try {
      await createCommunityEvent({
        title: newEvent.title,
        description: newEvent.description,
        date: newEvent.date,
        time: newEvent.time,
        location: newEvent.location,
        createdByUserId: user.id,
      });
      toast.success("Event created.");
      setNewEvent(emptyForm());
      setCreateOpen(false);
      await loadEvents();
      void reloadProfiles({ silent: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create event.");
    } finally {
      setCreateSubmitting(false);
    }
  };

  const openEdit = (ev: CommunityEventView) => {
    setEditTarget(ev);
    setEditForm(formFromEvent(ev));
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editTarget || !editForm.title.trim() || !editForm.date || !editForm.time) return;
    setEditSubmitting(true);
    try {
      await updateCommunityEvent({
        eventId: editTarget.id,
        title: editForm.title,
        description: editForm.description,
        date: editForm.date,
        time: editForm.time,
        location: editForm.location,
      });
      toast.success("Event updated.");
      setEditOpen(false);
      setEditTarget(null);
      await loadEvents();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update event.");
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteSubmitting(true);
    try {
      await deleteCommunityEvent(deleteTarget.id);
      toast.success("Event deleted.");
      setDeleteTarget(null);
      await loadEvents();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete event.");
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const toggleAttendance = async (eventId: string) => {
    if (!supabaseConfigured || !user) {
      toast.error("Sign in to RSVP.");
      return;
    }
    const ev = events.find((e) => e.id === eventId);
    if (!ev) return;
    const attending = ev.attendeeIds.includes(user.id);
    setRsvpBusyId(eventId);
    try {
      if (attending) {
        await leaveCommunityEvent(eventId);
        toast.success("You left this event.");
      } else {
        await joinCommunityEvent(eventId);
        toast.success("You’re attending.");
      }
      await loadEvents();
      void reloadProfiles({ silent: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update RSVP.");
    } finally {
      setRsvpBusyId(null);
    }
  };

  const canManage = (ev: CommunityEventView) =>
    Boolean(user && (ev.createdByUserId === user.id || canModerate));

  const isAttending = (ev: CommunityEventView) =>
    Boolean(user?.id && ev.attendeeIds.includes(user.id));

  const isFull = (ev: CommunityEventView) =>
    ev.maxAttendees != null && ev.attendeeIds.length >= ev.maxAttendees;

  const eventFormFields = (
    form: EventForm,
    setForm: (f: EventForm) => void,
    idPrefix: string,
  ) => (
    <div className="space-y-4 pt-2">
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-title`}>Event Title</Label>
        <Input
          id={`${idPrefix}-title`}
          placeholder="Movie Night, Potluck..."
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-description`}>Description</Label>
        <Textarea
          id={`${idPrefix}-description`}
          placeholder="What's this event about?"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="min-h-[60px] text-sm"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-date`}>Date</Label>
          <Input
            id={`${idPrefix}-date`}
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-time`}>Time</Label>
          <Input
            id={`${idPrefix}-time`}
            type="time"
            value={form.time}
            onChange={(e) => setForm({ ...form, time: e.target.value })}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-location`}>Location</Label>
        <Input
          id={`${idPrefix}-location`}
          placeholder="Common Area, Kitchen..."
          value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-gray-700" />
          <h2 className="text-lg font-semibold text-gray-900">Events</h2>
        </div>
        <div className="flex items-center gap-2">
          {supabaseConfigured && !eventsLoading ? (
            <Button type="button" variant="ghost" size="sm" className="h-8 text-xs" onClick={() => void loadEvents()}>
              Refresh
            </Button>
          ) : null}
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="gap-2" disabled={createDisabled}>
                <Plus className="w-4 h-4" />
                Create
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Event</DialogTitle>
                <DialogDescription className="sr-only">
                  Enter the event details below.
                </DialogDescription>
              </DialogHeader>
              {eventFormFields(newEvent, setNewEvent, "create")}
              <Button
                type="button"
                onClick={() => void handleCreateEvent()}
                className="w-full mt-2"
                disabled={
                  createSubmitting || !newEvent.title.trim() || !newEvent.date || !newEvent.time || !user
                }
              >
                {createSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Create Event
              </Button>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {!supabaseConfigured ? (
        <p className="text-sm text-gray-600 rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
          Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to load events from the database.
        </p>
      ) : null}

      {supabaseConfigured && !authLoading && !user ? (
        <p className="text-sm text-gray-700 rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
          Sign in to create events and RSVP.
        </p>
      ) : null}

      {roleError && user ? (
        <p className="text-sm text-amber-800 rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
          Could not load your role ({roleError}). Moderation actions may be unavailable.
        </p>
      ) : null}

      {profilesError ? (
        <p className="text-sm text-red-700">Profiles could not load; organizer names may show as “Resident”.</p>
      ) : null}

      {eventsError ? (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          <span>{eventsError}</span>
          <Button type="button" variant="outline" size="sm" onClick={() => void loadEvents()}>
            Retry
          </Button>
        </div>
      ) : null}

      {eventsLoading && events.length === 0 ? (
        <div className="flex items-center justify-center gap-2 py-8 text-sm text-gray-600">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading events…
        </div>
      ) : null}

      {/* Highlighted Next Event */}
      {upcomingEvent && !eventsLoading ? (
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 shadow-sm">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <Badge className="bg-blue-600 text-white">Next Event</Badge>
              {canManage(upcomingEvent) ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openEdit(upcomingEvent)}>
                      <Pencil className="w-3.5 h-3.5 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-600 focus:text-red-600"
                      onClick={() => setDeleteTarget(upcomingEvent)}
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}
            </div>
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
                <span>{upcomingEvent.location || "—"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>
                  {upcomingEvent.organizerName} · {upcomingEvent.attendeeIds.length}
                  {upcomingEvent.maxAttendees != null && `/${upcomingEvent.maxAttendees}`} attending
                </span>
              </div>
            </div>
            <Button
              type="button"
              onClick={() => void toggleAttendance(upcomingEvent.id)}
              variant={isAttending(upcomingEvent) ? "default" : "outline"}
              size="sm"
              className="w-full gap-2"
              disabled={
                !user ||
                rsvpBusyId === upcomingEvent.id ||
                (!isAttending(upcomingEvent) && isFull(upcomingEvent))
              }
            >
              {rsvpBusyId === upcomingEvent.id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isAttending(upcomingEvent) ? (
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
      ) : null}

      {/* All Events List */}
      <Card className="bg-white border border-gray-200 shadow-sm">
        <div className="p-3 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900 text-sm">All Events</h3>
        </div>
        <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
          {events.map((event) => {
            const attending = isAttending(event);
            const full = isFull(event);
            const busy = rsvpBusyId === event.id;

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
                        {event.attendeeIds.length}
                        {event.maxAttendees != null && `/${event.maxAttendees}`}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {canManage(event) ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button type="button" variant="ghost" size="icon" className="h-7 w-7">
                            <MoreVertical className="w-3.5 h-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(event)}>
                            <Pencil className="w-3.5 h-3.5 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600"
                            onClick={() => setDeleteTarget(event)}
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : null}
                    <Button
                      type="button"
                      onClick={() => void toggleAttendance(event.id)}
                      variant={attending ? "default" : "outline"}
                      size="sm"
                      disabled={!user || busy || (!attending && full)}
                      className={cn("shrink-0", attending ? "h-7 px-2" : "h-7 px-2")}
                    >
                      {busy ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : attending ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : (
                        <Plus className="w-3.5 h-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
          {!eventsLoading && !eventsError && events.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500">No events yet. Create one above.</div>
          ) : null}
        </div>
      </Card>

      <Dialog
        open={editOpen}
        onOpenChange={(o) => {
          setEditOpen(o);
          if (!o) setEditTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
            <DialogDescription className="sr-only">
              Enter the event details below.
            </DialogDescription>
          </DialogHeader>
          {eventFormFields(editForm, setEditForm, "edit")}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => void handleSaveEdit()}
              disabled={editSubmitting || !editForm.title.trim() || !editForm.date || !editForm.time}
            >
              {editSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this event?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget ? `“${deleteTarget.title}” will be removed for everyone.` : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteSubmitting}>Cancel</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              onClick={() => void handleConfirmDelete()}
              disabled={deleteSubmitting}
            >
              {deleteSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
