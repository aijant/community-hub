import { useState } from "react";
import { Pin, MessageSquare, Link2, AlertCircle, Lightbulb, FileText, Send, MoreVertical, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Textarea } from "./ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { cn } from "./ui/utils";

type PostCategory = "announcement" | "tip" | "rule" | "link" | "general";

interface Post {
  id: string;
  author: string;
  avatar: string;
  content: string;
  category: PostCategory;
  timestamp: Date;
  isPinned: boolean;
  whatsappIntegration?: boolean;
}

const categoryConfig = {
  announcement: { label: "Announcement", icon: AlertCircle, color: "bg-red-100 text-red-700" },
  tip: { label: "Tip", icon: Lightbulb, color: "bg-yellow-100 text-yellow-700" },
  rule: { label: "Rule", icon: FileText, color: "bg-blue-100 text-blue-700" },
  link: { label: "Link", icon: Link2, color: "bg-purple-100 text-purple-700" },
  general: { label: "General", icon: MessageSquare, color: "bg-gray-100 text-gray-700" },
};

export function MessageBoard() {
  const [posts, setPosts] = useState<Post[]>([
    {
      id: "1",
      author: "Sarah Chen",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop",
      content: "🏠 House Meeting this Sunday at 6 PM in the common area. Important updates to discuss!",
      category: "announcement",
      timestamp: new Date(2026, 3, 2, 14, 30),
      isPinned: true,
      whatsappIntegration: true,
    },
    {
      id: "2",
      author: "Marcus Williams",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
      content: "💡 Label your food in the fridge with your name and date. Keeps things organized!",
      category: "tip",
      timestamp: new Date(2026, 3, 1, 10, 15),
      isPinned: true,
    },
    {
      id: "3",
      author: "Priya Patel",
      avatar: "https://images.unsplash.com/photo-1534751516642-a1af1ef26a56?w=400&h=400&fit=crop",
      content: "📋 Quiet hours: 10 PM - 8 AM on weekdays. Please be mindful of noise levels.",
      category: "rule",
      timestamp: new Date(2026, 3, 1, 9, 0),
      isPinned: true,
    },
    {
      id: "4",
      author: "Sarah Chen",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop",
      content: "Anyone want to start a weekly board game night? Thinking Thursdays at 7 PM?",
      category: "general",
      timestamp: new Date(2026, 3, 4, 11, 20),
      isPinned: false,
      whatsappIntegration: true,
    },
  ]);

  const [newPost, setNewPost] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<PostCategory>("general");

  const pinnedPosts = posts.filter((post) => post.isPinned);
  const regularPosts = posts.filter((post) => !post.isPinned);

  const handleAddPost = () => {
    if (!newPost.trim()) return;

    const post: Post = {
      id: Date.now().toString(),
      author: "You",
      avatar: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400&h=400&fit=crop",
      content: newPost,
      category: selectedCategory,
      timestamp: new Date(),
      isPinned: false,
    };

    setPosts([post, ...posts]);
    setNewPost("");
    setSelectedCategory("general");
  };

  const togglePin = (id: string) => {
    setPosts(posts.map((post) => (post.id === id ? { ...post, isPinned: !post.isPinned } : post)));
  };

  const deletePost = (id: string) => {
    setPosts(posts.filter((post) => post.id !== id));
  };

  const renderPost = (post: Post, compact = false) => {
    const config = categoryConfig[post.category];
    const Icon = config.icon;

    return (
      <div key={post.id} className={cn("p-3 hover:bg-gray-50 rounded-lg transition-colors border-b border-gray-100 last:border-0", compact && "p-2")}>
        <div className="flex items-start gap-2">
          <Avatar className={cn("w-8 h-8", compact && "w-6 h-6")}>
            <AvatarImage src={post.avatar} alt={post.author} />
            <AvatarFallback className="text-xs">{post.author[0]}</AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={cn("font-medium text-gray-900", compact && "text-sm")}>{post.author}</span>
                <Badge variant="secondary" className={cn("gap-1 text-xs h-5", config.color)}>
                  <Icon className="w-3 h-3" />
                  {config.label}
                </Badge>
                {post.whatsappIntegration && (
                  <Badge variant="outline" className="text-xs h-5 gap-1">
                    <MessageSquare className="w-2.5 h-2.5" />
                    WhatsApp
                  </Badge>
                )}
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <MoreVertical className="w-3.5 h-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => togglePin(post.id)}>
                    <Pin className="w-4 h-4 mr-2" />
                    {post.isPinned ? "Unpin" : "Pin"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => deletePost(post.id)} className="text-red-600">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-gray-700" />
        <h2 className="text-lg font-semibold text-gray-900">Message Board</h2>
      </div>

      {/* Create Post */}
      <Card className="p-4 bg-white border border-gray-200">
        <div className="space-y-3">
          <Textarea
            placeholder="Share something with your housemates..."
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            className="min-h-[80px] resize-none text-sm"
          />
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex gap-1.5 flex-wrap">
              {(Object.keys(categoryConfig) as PostCategory[]).map((category) => {
                const config = categoryConfig[category];
                const Icon = config.icon;
                return (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                    className="gap-1.5 h-8 text-xs"
                  >
                    <Icon className="w-3 h-3" />
                    {config.label}
                  </Button>
                );
              })}
            </div>
            <Button onClick={handleAddPost} disabled={!newPost.trim()} size="sm" className="gap-2">
              <Send className="w-3.5 h-3.5" />
              Post
            </Button>
          </div>
        </div>
      </Card>

      {/* Pinned Posts */}
      {pinnedPosts.length > 0 && (
        <Card className="bg-blue-50 border border-blue-200">
          <div className="p-3 border-b border-blue-200 bg-blue-100">
            <div className="flex items-center gap-2">
              <Pin className="w-4 h-4 text-blue-700" />
              <h3 className="font-semibold text-blue-900 text-sm">Pinned</h3>
            </div>
          </div>
          <div className="divide-y divide-blue-100">
            {pinnedPosts.map((post) => renderPost(post, true))}
          </div>
        </Card>
      )}

      {/* Recent Posts */}
      <Card className="bg-white border border-gray-200">
        <div className="p-3 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900 text-sm">Recent</h3>
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {regularPosts.length > 0 ? (
            <div>{regularPosts.map((post) => renderPost(post))}</div>
          ) : (
            <div className="p-8 text-center text-sm text-gray-500">
              No posts yet. Be the first to share something!
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
