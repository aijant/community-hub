import { useState, useEffect, useRef } from "react";
import { Linkedin, Loader2, Plus, RefreshCw, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
} from "./ui/carousel";
import { supabase, supabaseConfigured } from "../lib/supabase-client";
import { useCommunityProfiles } from "../context/community-profiles-context";
import { useAuthRole } from "../hooks/use-auth-role";

const CAROUSEL_AUTOPLAY_MS = 4500;

function linkedinHref(linkedinUrl: string): string {
  const t = linkedinUrl.trim();
  if (!t) return "";
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t}`;
}

function toastMessageFromPayload(data: unknown): string {
  if (data && typeof data === "object") {
    const o = data as Record<string, unknown>;
    if (typeof o.message === "string" && o.message.trim()) return o.message.trim();
    if (typeof o.error === "string" && o.error.trim()) return o.error.trim();
  }
  return "Profile added.";
}

export function ResidentProfiles() {
  const { rows: profiles, loading: profilesLoading, error: profilesError, reload: loadProfiles } =
    useCommunityProfiles();
  const { user, isClient } = useAuthRole();

  const [addOpen, setAddOpen] = useState(false);
  const [linkedinUrlInput, setLinkedinUrlInput] = useState("");
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const pauseAutoplayRef = useRef(false);

  useEffect(() => {
    if (!carouselApi || profiles.length <= 1) return;

    const tick = () => {
      if (pauseAutoplayRef.current) return;
      carouselApi.scrollNext();
    };

    const id = window.setInterval(tick, CAROUSEL_AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [carouselApi, profiles.length]);

  const handleRefreshProfiles = () => {
    setRefreshing(true);
    void loadProfiles({ silent: true }).finally(() => setRefreshing(false));
  };

  const handleAddProfile = async () => {
    const linkedinUrl = linkedinUrlInput.trim();
    if (!linkedinUrl) {
      toast.error("Enter a LinkedIn URL.");
      return;
    }
    if (!supabaseConfigured) {
      toast.error("Supabase is not configured.");
      return;
    }

    setAddSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("parse-linkedin", {
        body: { linkedinUrl, save_profile: true },
      });

      if (error) {
        toast.error(error.message || "Could not add profile.");
        return;
      }

      toast.success(toastMessageFromPayload(data), {
        description: "Use Refresh when you want to reload the list.",
      });
      setAddOpen(false);
      setLinkedinUrlInput("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not add profile.");
    } finally {
      setAddSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-gray-700" />
          <h2 className="text-lg font-semibold text-gray-900">Resident Profiles</h2>
        </div>
        <div className="flex items-center gap-2">
          {!supabaseConfigured ? (
            <span className="text-xs text-gray-500 max-w-[220px] text-right">
              Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to add profiles.
            </span>
          ) : null}
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="shrink-0 px-2"
            onClick={() => handleRefreshProfiles()}
            disabled={refreshing}
            aria-label="Refresh resident list"
            title="Refresh resident list"
          >
            {refreshing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </Button>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="gap-2"
                disabled={!supabaseConfigured}
                title={
                  !supabaseConfigured
                    ? "Configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local"
                    : undefined
                }
              >
                <Plus className="w-4 h-4" />
                Add Profile
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-left text-base font-semibold text-gray-900">
                  Add Your LinkedIn Profile
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-1">
                <div className="space-y-2">
                  <Label htmlFor="linkedin-url" className="text-sm font-medium text-gray-900">
                    LinkedIn Profile URL
                  </Label>
                  <Input
                    id="linkedin-url"
                    type="text"
                    inputMode="url"
                    autoComplete="url"
                    placeholder="linkedin.com/in/yourprofile"
                    value={linkedinUrlInput}
                    onChange={(e) => setLinkedinUrlInput(e.target.value)}
                    className="border-gray-300"
                  />
                  <p className="text-xs text-gray-500 leading-relaxed">
                    We&apos;ll automatically pull your bio and profile information
                  </p>
                </div>
                <Button
                  type="button"
                  className="w-full h-11 rounded-lg bg-gray-800 text-white hover:bg-gray-900 shadow-sm"
                  onClick={() => void handleAddProfile()}
                  disabled={addSubmitting}
                >
                  {addSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      Adding…
                    </>
                  ) : (
                    <>
                      <Linkedin className="w-4 h-4 text-white" />
                      Add Profile
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {profilesError && (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          <span>{profilesError}</span>
          <Button type="button" variant="outline" size="sm" onClick={() => void loadProfiles()}>
            Retry
          </Button>
        </div>
      )}

      {/* Profiles carousel */}
      {profilesLoading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-sm text-gray-600">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading residents…
        </div>
      ) : profilesError ? null : profiles.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-600">No residents yet.</p>
      ) : (
        <div
          className="relative"
          onPointerEnter={() => {
            pauseAutoplayRef.current = true;
          }}
          onPointerLeave={() => {
            pauseAutoplayRef.current = false;
          }}
        >
          <Carousel
            setApi={setCarouselApi}
            opts={{
              loop: true,
              align: "start",
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-3">
              {profiles.map((profile) => {
                const showClientBadge = Boolean(
                  isClient && user && profile.id === user.id,
                );
                return (
                <CarouselItem
                  key={profile.id}
                  className="pl-3 basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4"
                >
                  <Card className="p-4 shadow-sm hover:shadow-md transition-shadow bg-white border border-gray-200 h-full">
                    <div className="flex flex-col items-center text-center space-y-3">
                      <div className="relative shrink-0">
                        <Avatar className="w-16 h-16">
                          <AvatarImage src={profile.avatar} alt={profile.name} />
                          <AvatarFallback>
                            {profile.name.trim()
                              ? profile.name.split(/\s+/).map((n) => n[0]).join("")
                              : "?"}
                          </AvatarFallback>
                        </Avatar>
                        {showClientBadge ? (
                          <span
                            className="absolute bottom-0 right-0 block h-3.5 w-3.5 rounded-full bg-green-500 ring-2 ring-white"
                            title="Signed in"
                            aria-label="Signed in"
                          />
                        ) : null}
                      </div>

                      <div className="space-y-1 w-full">
                        <h3 className="font-semibold text-gray-900 text-sm">{profile.name}</h3>
                        <p className="text-xs text-gray-600">{profile.title}</p>
                        <p className="text-xs text-gray-500">{profile.room}</p>
                      </div>

                      <p className="text-xs text-gray-700 line-clamp-2">{profile.bio}</p>

                      {profile.linkedinUrl.trim() ? (
                        <a
                          href={linkedinHref(profile.linkedinUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium"
                        >
                          <Linkedin className="w-3.5 h-3.5" />
                          LinkedIn
                        </a>
                      ) : null}
                    </div>
                  </Card>
                </CarouselItem>
                );
              })}
            </CarouselContent>
          </Carousel>
        </div>
      )}
    </div>
  );
}
