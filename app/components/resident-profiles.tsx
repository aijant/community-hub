import { useState, useEffect, useCallback, useRef } from "react";
import { Linkedin, Loader2, Users } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
} from "./ui/carousel";

const CAROUSEL_AUTOPLAY_MS = 4500;

const COMMUNITY_PROFILES_URL =
  "https://ksxqwsihrizusoxorrcn.supabase.co/functions/v1/get_community_profiles";

interface Profile {
  id: string;
  name: string;
  linkedinUrl: string;
  bio: string;
  title: string;
  avatar: string;
  room: string;
}

interface ApiProfile {
  id: string;
  name: string;
  position: string;
  description: string | null;
  room: string;
  linkedin_url: string;
  avatar_url: string;
}

interface CommunityProfilesResponse {
  profiles: ApiProfile[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

function mapApiProfileToProfile(api: ApiProfile): Profile {
  return {
    id: api.id,
    name: api.name,
    linkedinUrl: api.linkedin_url,
    bio: api.description ?? "",
    title: api.position,
    avatar: api.avatar_url,
    room: api.room.startsWith("Room ") ? api.room : `Room ${api.room}`,
  };
}

function linkedinHref(linkedinUrl: string): string {
  const t = linkedinUrl.trim();
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t}`;
}

export function ResidentProfiles() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [profilesLoading, setProfilesLoading] = useState(true);
  const [profilesError, setProfilesError] = useState<string | null>(null);

  const loadProfiles = useCallback(async () => {
    setProfilesLoading(true);
    setProfilesError(null);
    try {
      const res = await fetch(COMMUNITY_PROFILES_URL);
      if (!res.ok) {
        throw new Error(`Failed to load profiles (${res.status})`);
      }
      const data: CommunityProfilesResponse = await res.json();
      setProfiles(data.profiles.map(mapApiProfileToProfile));
    } catch (e) {
      setProfilesError(e instanceof Error ? e.message : "Could not load resident profiles.");
      setProfiles([]);
    } finally {
      setProfilesLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfiles();
  }, [loadProfiles]);

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

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Users className="w-5 h-5 text-gray-700" />
        <h2 className="text-lg font-semibold text-gray-900">Resident Profiles</h2>
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
              {profiles.map((profile) => (
                <CarouselItem
                  key={profile.id}
                  className="pl-3 basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4"
                >
                  <Card className="p-4 hover:shadow-md transition-shadow bg-white border border-gray-200 h-full">
                    <div className="flex flex-col items-center text-center space-y-3">
                      <Avatar className="w-16 h-16">
                        <AvatarImage src={profile.avatar} alt={profile.name} />
                        <AvatarFallback>
                          {profile.name.split(" ").map((n) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>

                      <div className="space-y-1 w-full">
                        <h3 className="font-semibold text-gray-900 text-sm">{profile.name}</h3>
                        <p className="text-xs text-gray-600">{profile.title}</p>
                        <p className="text-xs text-gray-500">{profile.room}</p>
                      </div>

                      <p className="text-xs text-gray-700 line-clamp-2">{profile.bio}</p>

                      <a
                        href={linkedinHref(profile.linkedinUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium"
                      >
                        <Linkedin className="w-3.5 h-3.5" />
                        LinkedIn
                      </a>
                    </div>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>
      )}
    </div>
  );
}
