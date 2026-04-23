import { useState, useEffect, useMemo, useRef } from "react";
import { Linkedin, Loader2, RefreshCw, Users } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
} from "./ui/carousel";
import { supabaseConfigured } from "../lib/supabase-client";
import { getCommunityProfileIdForUser } from "../lib/community-profiles";
import { useCommunityProfiles } from "../context/community-profiles-context";
import { useAuthRole } from "../hooks/use-auth-role";

const CAROUSEL_AUTOPLAY_MS = 4500;

function linkedinHref(linkedinUrl: string): string {
  const t = linkedinUrl.trim();
  if (!t) return "";
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t}`;
}

export function ResidentProfiles() {
  const { rows: profiles, loading: profilesLoading, error: profilesError, reload: loadProfiles } =
    useCommunityProfiles();
  const { user, isClient } = useAuthRole();

  const myCommunityProfileId = useMemo(
    () => getCommunityProfileIdForUser(user, profiles),
    [user, profiles],
  );

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
              Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to load profiles.
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
                  isClient && user && myCommunityProfileId && profile.id === myCommunityProfileId,
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
