import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Copy,
  ExternalLink,
  FileText,
  Film,
  FolderOpen,
  Image as ImageIcon,
  Images,
  Link2,
  Loader2,
  Share2,
} from "lucide-react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { QuickAccess } from "./quick-access";
import { ExpandablePlainText } from "./expandable-plain-text";
import { htmlToPlainText } from "../lib/html-to-plain-text";

const COMMUNITY_DOCUMENTS_URL =
  "https://ksxqwsihrizusoxorrcn.supabase.co/functions/v1/get_community_documents";

/** Values from API `document_types`; legacy kinds kept until old rows are migrated. */
type ApiResourceKind =
  | "document"
  | "guides_and_rules"
  | "media"
  | "link"
  | "guide"
  | "video"
  | "image";

type ResourceFilter = "all" | "document" | "guides_and_rules" | "media";

const FILTER_KINDS: Record<Exclude<ResourceFilter, "all">, readonly ApiResourceKind[]> = {
  document: ["document"],
  guides_and_rules: ["guides_and_rules", "guide", "link"],
  media: ["media", "video", "image"],
};

function isGuidesAndRulesKind(kind: ApiResourceKind): boolean {
  return kind === "guides_and_rules" || kind === "guide" || kind === "link";
}

function isMediaKind(kind: ApiResourceKind): boolean {
  return kind === "media" || kind === "video" || kind === "image";
}

function isVideoDoc(doc: ApiDocument): boolean {
  if (doc.mime_type?.startsWith("video/")) return true;
  return doc.type.value === "video";
}

function mediaLabel(doc: ApiDocument): string {
  if (isVideoDoc(doc)) return "Video";
  if (doc.mime_type?.startsWith("image/") || doc.type.value === "image") return "Photo";
  return typeConfig[doc.type.value]?.label ?? "Media";
}

/** Primary HTML body from API; falls back to description when absent. */
function guidesRulesHtmlSource(doc: ApiDocument): string | null {
  const fromContent = doc.content?.trim();
  if (fromContent) return doc.content!;
  const fromDesc = doc.description?.trim();
  if (fromDesc) return doc.description!;
  return null;
}

interface ApiDocumentType {
  id: string;
  value: ApiResourceKind;
}

export interface ApiDocument {
  id: string;
  title: string;
  /** Rich HTML body for guides & rules (preferred over description when present). */
  content?: string | null;
  description: string | null;
  link: string | null;
  file_name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  created_at: string;
  updated_at: string;
  uploaded_by: string;
  type: ApiDocumentType;
  signed_url: string | null;
}

interface CommunityDocumentsResponse {
  documents: ApiDocument[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

const typeConfig: Record<
  ApiResourceKind,
  { icon: typeof FileText; color: string; label: string }
> = {
  document: { icon: FileText, color: "bg-blue-100 text-blue-700", label: "Document" },
  guides_and_rules: { icon: BookOpen, color: "bg-green-100 text-green-700", label: "Guides & Rules" },
  media: { icon: Images, color: "bg-rose-100 text-rose-700", label: "Media" },
  link: { icon: Link2, color: "bg-fuchsia-100 text-fuchsia-800", label: "Link" },
  guide: { icon: BookOpen, color: "bg-green-100 text-green-700", label: "Guide" },
  video: { icon: Film, color: "bg-rose-100 text-rose-700", label: "Video" },
  image: { icon: ImageIcon, color: "bg-violet-100 text-violet-800", label: "Image" },
};

function filterHasServerContent(filterKey: ResourceFilter, kinds: Set<ApiResourceKind>): boolean {
  if (filterKey === "all") return true;
  return FILTER_KINDS[filterKey].some((k) => kinds.has(k));
}

function normalizeLink(href: string): string {
  const t = href.trim();
  if (!t) return t;
  return /^https?:\/\//i.test(t) ? t : `https://${t}`;
}

function formatBytes(n: number | null): string | null {
  if (n == null || n <= 0) return null;
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

interface MediaItemCardProps {
  doc: ApiDocument;
  copiedId: string | null;
  onOpen: (doc: ApiDocument) => void;
  onShare: (doc: ApiDocument) => void;
}

function MediaItemCard({ doc, copiedId, onOpen, onShare }: MediaItemCardProps) {
  const isVideo = isVideoDoc(doc);
  const label = mediaLabel(doc);
  const sizeLabel = formatBytes(doc.file_size);
  const canOpen = !!doc.signed_url?.trim();
  const PreviewIcon = isVideo ? Film : ImageIcon;

  return (
    <Card
      id={`resource-${doc.id}`}
      className={`scroll-mt-24 min-h-[220px] h-full p-4 shadow-sm hover:shadow-md transition-shadow bg-white border border-gray-200 group flex flex-col gap-3 ${
        canOpen ? "cursor-pointer" : "opacity-60"
      }`}
      onClick={canOpen ? () => onOpen(doc) : undefined}
    >
      <div className="relative h-24 shrink-0 overflow-hidden rounded-lg bg-gray-100">
        {canOpen && !isVideo ? (
          <img
            src={doc.signed_url!}
            alt={doc.title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : canOpen && isVideo ? (
          <video
            src={doc.signed_url!}
            className="h-full w-full object-cover"
            preload="metadata"
            muted
            playsInline
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <PreviewIcon className="h-8 w-8 text-gray-400" />
          </div>
        )}
        {isVideo && canOpen ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/20">
            <div className="rounded-full bg-black/50 p-1.5">
              <Film className="h-4 w-4 text-white" />
            </div>
          </div>
        ) : null}
        {canOpen ? (
          <button
            type="button"
            className="absolute right-1 top-1 rounded p-1 text-gray-400 opacity-0 transition-opacity hover:bg-gray-100 hover:text-gray-700 group-hover:opacity-100"
            title="Share"
            onClick={(e) => {
              e.stopPropagation();
              void onShare(doc);
            }}
          >
            <Share2 className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-1.5">
        <h3 className="font-semibold text-sm text-gray-900 leading-tight">{doc.title}</h3>
        {doc.description?.trim() ? (
          <p className="text-xs text-gray-600 line-clamp-2">{doc.description}</p>
        ) : null}
        {doc.file_name ? (
          <p className="text-xs text-gray-500 truncate" title={doc.file_name}>
            {doc.file_name}
            {sizeLabel ? ` · ${sizeLabel}` : ""}
          </p>
        ) : null}
        {copiedId === doc.id ? (
          <p className="text-xs text-green-700">Link copied to clipboard</p>
        ) : null}
      </div>

      <Badge variant="secondary" className="shrink-0 gap-1 text-xs bg-rose-100 text-rose-700">
        {label}
      </Badge>
    </Card>
  );
}

export function Resources() {
  const [documents, setDocuments] = useState<ApiDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ResourceFilter>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(COMMUNITY_DOCUMENTS_URL);
      if (!res.ok) throw new Error(`Failed to load resources (${res.status})`);
      const data: CommunityDocumentsResponse = await res.json();
      setDocuments(data.documents ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load resources.");
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDocuments();
  }, [loadDocuments]);

  const kindsOnServer = useMemo(() => {
    const s = new Set<ApiResourceKind>();
    for (const d of documents) s.add(d.type.value);
    return s;
  }, [documents]);

  const filtered = useMemo(() => {
    if (filter === "all") return documents;
    if (filter === "media") return documents.filter((d) => isMediaKind(d.type.value));
    const allowed = FILTER_KINDS[filter];
    return documents.filter((d) => allowed.includes(d.type.value));
  }, [documents, filter]);

  const handleOpen = (doc: ApiDocument) => {
    setDownloadError(null);

    // External URL (e.g. guides/rules links): open directly
    if (doc.link?.trim()) {
      window.open(normalizeLink(doc.link), "_blank", "noopener,noreferrer");
      return;
    }

    // File-type: use the server-issued signed URL — no client-side signing needed
    if (doc.signed_url) {
      window.open(doc.signed_url, "_blank", "noopener,noreferrer");
      return;
    }

    // signed_url is null → file was deleted from storage
    setDownloadError(`"${doc.title}" is no longer available. Please contact an administrator.`);
  };

  const copyFileName = async (doc: ApiDocument) => {
    const text = doc.file_name || doc.title;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(doc.id);
      window.setTimeout(() => setCopiedId((id) => (id === doc.id ? null : id)), 2000);
    } catch {
      setCopiedId(null);
    }
  };

  const shareMedia = async (doc: ApiDocument) => {
    const url = doc.signed_url?.trim();
    if (!url) {
      setDownloadError(`"${doc.title}" is no longer available to share.`);
      return;
    }

    setDownloadError(null);

    if (typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: doc.title,
          text: doc.description?.trim() || doc.title,
          url,
        });
        return;
      } catch (e) {
        if (e instanceof Error && e.name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(doc.id);
      window.setTimeout(() => setCopiedId((id) => (id === doc.id ? null : id)), 2000);
    } catch {
      setCopiedId(null);
    }
  };

  const filterButtons: { key: ResourceFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "document", label: "Documents" },
    { key: "guides_and_rules", label: "Guides & Rules" },
    { key: "media", label: "Media" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <FolderOpen className="w-5 h-5 text-gray-700" />
          <h2 className="text-lg font-semibold text-gray-900">Resources</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {filterButtons.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`text-xs px-3 py-1.5 rounded-md border transition-colors ${
                filter === key
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
              } ${key !== "all" && !filterHasServerContent(key, kindsOnServer) ? "opacity-40" : ""}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {downloadError && (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          <span>{downloadError}</span>
          <Button type="button" variant="outline" size="sm" onClick={() => setDownloadError(null)}>
            Dismiss
          </Button>
        </div>
      )}

      {error && (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          <span>{error}</span>
          <Button type="button" variant="outline" size="sm" onClick={() => void loadDocuments()}>
            Retry
          </Button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-sm text-gray-600">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading resources…
        </div>
      ) : error ? null : filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-600">
          {documents.length === 0 ? "No resources yet." : "No items in this category."}
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-stretch">
          {filtered.map((doc) => {
            const kind = doc.type.value;

            if (isMediaKind(kind)) {
              return (
                <MediaItemCard
                  key={doc.id}
                  doc={doc}
                  copiedId={copiedId}
                  onOpen={handleOpen}
                  onShare={shareMedia}
                />
              );
            }

            const config = typeConfig[kind] ?? typeConfig.document;
            const Icon = config.icon;
            const isLink = !!doc.link?.trim();
            const hasFile = !!doc.file_path?.trim() && !isLink;
            const openFromFile = !!doc.signed_url && !isGuidesAndRulesKind(kind);
            const canOpen = isLink || openFromFile;
            const storageFileMissing = hasFile && !doc.signed_url && !isLink;
            const sizeLabel = formatBytes(doc.file_size);
            const guidesHtml =
              isGuidesAndRulesKind(kind) ? guidesRulesHtmlSource(doc) : null;
            const expandableText =
              guidesHtml != null ? htmlToPlainText(guidesHtml) || null : null;
            const cardMuted = storageFileMissing && expandableText == null;

            return (
              <Card
                key={doc.id}
                id={`resource-${doc.id}`}
                className={`scroll-mt-24 min-h-[220px] p-4 shadow-sm hover:shadow-md transition-shadow bg-white border border-gray-200 group ${
                  canOpen ? "cursor-pointer" : ""
                } ${cardMuted ? "opacity-60" : ""}`}
                onClick={canOpen ? () => handleOpen(doc) : undefined}
              >
                <div className="flex flex-1 flex-col min-h-0 gap-3 w-full">
                  <div className="flex shrink-0 items-start justify-between gap-2">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-gray-700" />
                    </div>
                    {canOpen ? (
                      <ExternalLink className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    ) : storageFileMissing ? (
                      <button
                        type="button"
                        className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                        title="Copy file name"
                        onClick={(e) => {
                          e.stopPropagation();
                          void copyFileName(doc);
                        }}
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    ) : null}
                  </div>

                  <div className="flex flex-1 flex-col gap-1.5 min-h-0">
                    <h3 className="font-semibold text-gray-900 text-sm leading-tight">{doc.title}</h3>
                    {expandableText != null ? (
                      <ExpandablePlainText text={expandableText} />
                    ) : doc.description?.trim() && !isGuidesAndRulesKind(kind) ? (
                      <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">{doc.description}</p>
                    ) : null}
                    {doc.file_name && !doc.link?.trim() ? (
                      <p className="text-xs text-gray-500 truncate" title={doc.file_name}>
                        {doc.file_name}
                        {sizeLabel ? ` · ${sizeLabel}` : ""}
                      </p>
                    ) : null}
                    {copiedId === doc.id ? (
                      <p className="text-xs text-green-700">Copied to clipboard</p>
                    ) : null}
                  </div>

                  <Badge variant="secondary" className={`shrink-0 gap-1 text-xs ${config.color}`}>
                    {config.label}
                  </Badge>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {!loading ? <QuickAccess documents={documents} /> : null}
    </div>
  );
}