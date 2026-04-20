import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Pin,
  MessageSquare,
  Link2,
  AlertCircle,
  Lightbulb,
  FileText,
  Send,
  MoreVertical,
  Trash2,
  Pencil,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Textarea } from "./ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { cn } from "./ui/utils";
import { supabaseConfigured } from "../lib/supabase-client";
import { getCommunityProfileId } from "../lib/supabase-user-metadata";
import type { PostCategory } from "../lib/community-post-types";
import { DEFAULT_POST_CHANNEL } from "../lib/community-post-types";
import type { BoardPostView } from "../lib/community-posts";
import {
  createCommunityPost,
  deleteCommunityPost,
  editCommunityPost,
  fetchCommunityPostsRaw,
  mapPostsResponse,
} from "../lib/community-posts";
import { useCommunityProfiles } from "../context/community-profiles-context";
import { useAuthRole } from "../hooks/use-auth-role";

const categoryConfig = {
  announcement: { label: "Announcement", icon: AlertCircle, color: "bg-red-100 text-red-700" },
  tip: { label: "Tip", icon: Lightbulb, color: "bg-yellow-100 text-yellow-700" },
  rule: { label: "Rule", icon: FileText, color: "bg-blue-100 text-blue-700" },
  link: { label: "Link", icon: Link2, color: "bg-purple-100 text-purple-700" },
  general: { label: "General", icon: MessageSquare, color: "bg-gray-100 text-gray-700" },
} as const;

export function MessageBoard() {
  const { rows, loading: profilesLoading, error: profilesError, reload: reloadProfiles } =
    useCommunityProfiles();

  const { user, loading: authLoading, error: roleError, canPin, canModerate } = useAuthRole();

  const profileLookup = useMemo(
    () => rows.map((r) => ({ id: r.id, name: r.name, avatar: r.avatar })),
    [rows],
  );

  const profileLookupRef = useRef(profileLookup);
  profileLookupRef.current = profileLookup;

  const postsPayloadRef = useRef<unknown>(null);

  const profileEnrichmentKey = useMemo(
    () => rows.map((r) => `${r.id}\t${r.name}\t${r.avatar}`).join("\n"),
    [rows],
  );

  const myCommunityProfileId = useMemo(() => getCommunityProfileId(user), [user]);

  const [posts, setPosts] = useState<BoardPostView[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsError, setPostsError] = useState<string | null>(null);

  const [newPost, setNewPost] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<PostCategory>("general");
  const [submitting, setSubmitting] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editPost, setEditPost] = useState<BoardPostView | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editCategory, setEditCategory] = useState<PostCategory>("general");
  const [editSaving, setEditSaving] = useState(false);

  const loadPosts = useCallback(async () => {
    if (!supabaseConfigured) return;
    setPostsLoading(true);
    setPostsError(null);
    try {
      const data = await fetchCommunityPostsRaw();
      postsPayloadRef.current = data;
      setPosts(mapPostsResponse(data, profileLookupRef.current));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not load posts.";
      setPostsError(msg);
      postsPayloadRef.current = null;
      setPosts([]);
    } finally {
      setPostsLoading(false);
    }
  }, [supabaseConfigured]);

  useEffect(() => {
    if (!supabaseConfigured || profilesLoading) return;
    void loadPosts();
  }, [loadPosts, profilesLoading, supabaseConfigured]);

  useEffect(() => {
    if (profilesLoading) return;
    const raw = postsPayloadRef.current;
    if (raw == null) return;
    setPosts(mapPostsResponse(raw, profileLookupRef.current));
  }, [profileEnrichmentKey, profilesLoading]);

  const pinnedPosts = posts.filter((post) => post.isPinned);
  const regularPosts = posts.filter((post) => !post.isPinned);

  const openEdit = (post: BoardPostView) => {
    setEditPost(post);
    setEditContent(post.content);
    setEditCategory(post.category);
    setEditOpen(true);
  };

  const handleAddPost = async () => {
    if (!newPost.trim() || !myCommunityProfileId || !supabaseConfigured || !user) return;
    setSubmitting(true);
    try {
      await createCommunityPost({
        content: newPost.trim(),
        category: selectedCategory,
        authorId: myCommunityProfileId,
        channel: DEFAULT_POST_CHANNEL,
        isPinned: false,
      });
      toast.success("Post published.");
      setNewPost("");
      setSelectedCategory("general");
      await loadPosts();
      void reloadProfiles({ silent: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create post.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!supabaseConfigured) return;
    try {
      await deleteCommunityPost(postId);
      toast.success("Post deleted.");
      await loadPosts();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete post.");
    }
  };

  const handleTogglePin = async (post: BoardPostView) => {
    if (!canPin || !supabaseConfigured) return;
    try {
      await editCommunityPost({
        postId: post.id,
        content: post.content,
        category: post.category,
        channel: post.channel || DEFAULT_POST_CHANNEL,
        isPinned: !post.isPinned,
      });
      toast.success(post.isPinned ? "Unpinned." : "Pinned.");
      await loadPosts();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update pin.");
    }
  };

  const handleSaveEdit = async () => {
    if (!editPost || !editContent.trim() || !supabaseConfigured) return;
    setEditSaving(true);
    try {
      await editCommunityPost({
        postId: editPost.id,
        content: editContent.trim(),
        category: editCategory,
        channel: editPost.channel || DEFAULT_POST_CHANNEL,
        isPinned: editPost.isPinned,
      });
      toast.success("Post updated.");
      setEditOpen(false);
      setEditPost(null);
      await loadPosts();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save post.");
    } finally {
      setEditSaving(false);
    }
  };

  const renderPost = (post: BoardPostView, compact = false) => {
    const config = categoryConfig[post.category];
    const Icon = config.icon;
    const isOwnerByAuth = Boolean(
      user?.id && post.createdByUserId && post.createdByUserId === user.id,
    );
    const showPin = canPin;
    const showEditDelete = canModerate || isOwnerByAuth;
    const showMenu = showPin || showEditDelete;

    const whatsappIntegration = post.channel.trim().toLowerCase() === "whatsapp";

    return (
      <div
        key={post.id}
        className={cn(
          "p-3 hover:bg-gray-50 rounded-lg transition-colors border-b border-gray-100 last:border-0",
          compact && "p-2",
        )}
      >
        <div className="flex items-start gap-2">
          <Avatar className={cn("w-8 h-8", compact && "w-6 h-6")}>
            <AvatarImage src={post.avatar} alt={post.authorName} />
            <AvatarFallback className="text-xs">
              {post.authorName.trim() ? post.authorName[0] : "?"}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={cn("font-medium text-gray-900", compact && "text-sm")}>
                  {post.authorName}
                </span>
                <Badge variant="secondary" className={cn("gap-1 text-xs h-5", config.color)}>
                  <Icon className="w-3 h-3" />
                  {config.label}
                </Badge>
                {whatsappIntegration && (
                  <Badge variant="outline" className="text-xs h-5 gap-1">
                    <MessageSquare className="w-2.5 h-2.5" />
                    WhatsApp
                  </Badge>
                )}
              </div>

              {showMenu ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <MoreVertical className="w-3.5 h-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {showPin ? (
                      <DropdownMenuItem onClick={() => void handleTogglePin(post)}>
                        <Pin className="w-4 h-4 mr-2" />
                        {post.isPinned ? "Unpin" : "Pin"}
                      </DropdownMenuItem>
                    ) : null}
                    {showEditDelete ? (
                      <DropdownMenuItem onClick={() => openEdit(post)}>
                        <Pencil className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                    ) : null}
                    {showEditDelete ? (
                      <DropdownMenuItem
                        onClick={() => void handleDeletePost(post.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    ) : null}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}
            </div>

            <p className={cn("text-sm text-gray-700 mt-1", compact && "text-xs")}>{post.content}</p>

            <p className="text-xs text-gray-500 mt-1">
              {post.timestamp.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>
      </div>
    );
  };

  const composerDisabled =
    !supabaseConfigured || authLoading || !user || !myCommunityProfileId;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-gray-700" />
        <h2 className="text-lg font-semibold text-gray-900">Message Board</h2>
      </div>

      {!supabaseConfigured ? (
        <p className="text-sm text-gray-600 rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
          Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to load and publish posts.
        </p>
      ) : null}

      {supabaseConfigured && !authLoading && !user ? (
        <p className="text-sm text-gray-700 rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
          Sign in to create posts.
        </p>
      ) : null}

      {roleError && user ? (
        <p className="text-sm text-amber-800 rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
          Could not load your role ({roleError}). Pin and moderation actions may be unavailable.
        </p>
      ) : null}

      {profilesError ? (
        <p className="text-sm text-red-700">
          Profiles could not load. You can still post if you have added your profile via{" "}
          <span className="font-medium">Add my profile</span> (LinkedIn).
        </p>
      ) : null}

      {supabaseConfigured && user && !authLoading && !myCommunityProfileId ? (
        <p className="text-sm text-gray-700 rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
          Add your community profile with <span className="font-medium">Add my profile</span> to post on
          the board.
        </p>
      ) : null}

      {/* Create Post */}
      <Card className="p-4 bg-white border border-gray-200 shadow-sm">
        <div className="space-y-3">
          <Textarea
            placeholder="Share something with your housemates..."
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            className="min-h-[80px] resize-none text-sm"
            disabled={composerDisabled}
          />
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex gap-1.5 flex-wrap">
              {(Object.keys(categoryConfig) as PostCategory[]).map((category) => {
                const config = categoryConfig[category];
                const Icon = config.icon;
                return (
                  <Button
                    key={category}
                    type="button"
                    variant={selectedCategory === category ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                    className="gap-1.5 h-8 text-xs"
                    disabled={composerDisabled}
                  >
                    <Icon className="w-3 h-3" />
                    {config.label}
                  </Button>
                );
              })}
            </div>
            <Button
              type="button"
              onClick={() => void handleAddPost()}
              disabled={composerDisabled || !newPost.trim() || submitting}
              size="sm"
              className="gap-2"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              Post
            </Button>
          </div>
        </div>
      </Card>

      {postsError ? (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          <span>{postsError}</span>
          <Button type="button" variant="outline" size="sm" onClick={() => void loadPosts()}>
            Retry
          </Button>
        </div>
      ) : null}

      {postsLoading && posts.length === 0 ? (
        <div className="flex items-center justify-center gap-2 py-8 text-sm text-gray-600">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading posts…
        </div>
      ) : null}

      {/* Pinned Posts */}
      {pinnedPosts.length > 0 && (
        <Card className="bg-sky-50 border border-sky-100 shadow-sm">
          <div className="p-3 border-b border-sky-100 bg-sky-100/80">
            <div className="flex items-center gap-2">
              <Pin className="w-4 h-4 text-sky-800" />
              <h3 className="font-semibold text-sky-950 text-sm">Pinned</h3>
            </div>
          </div>
          <div className="divide-y divide-sky-100">
            {pinnedPosts.map((post) => renderPost(post, true))}
          </div>
        </Card>
      )}

      {/* Recent Posts */}
      <Card className="bg-white border border-gray-200 shadow-sm">
        <div className="p-3 border-b border-gray-200 flex items-center justify-between gap-2">
          <h3 className="font-semibold text-gray-900 text-sm">Recent</h3>
          {supabaseConfigured && !postsLoading ? (
            <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={() => void loadPosts()}>
              Refresh
            </Button>
          ) : null}
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {regularPosts.length > 0 ? (
            <div>{regularPosts.map((post) => renderPost(post))}</div>
          ) : !postsLoading && !postsError ? (
            <div className="p-8 text-center text-sm text-gray-500">
              No posts yet. Be the first to share something!
            </div>
          ) : null}
        </div>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit post</DialogTitle>
            <DialogDescription className="sr-only">
              Update the post text and category.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="min-h-[100px] text-sm"
            />
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(categoryConfig) as PostCategory[]).map((category) => {
                const config = categoryConfig[category];
                const Icon = config.icon;
                return (
                  <Button
                    key={category}
                    type="button"
                    variant={editCategory === category ? "default" : "outline"}
                    size="sm"
                    className="gap-1 h-8 text-xs"
                    onClick={() => setEditCategory(category)}
                  >
                    <Icon className="w-3 h-3" />
                    {config.label}
                  </Button>
                );
              })}
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void handleSaveEdit()} disabled={editSaving || !editContent.trim()}>
              {editSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
