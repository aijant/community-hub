import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Copy,
  ExternalLink,
  FileText,
  Film,
  FolderOpen,
  Link2,
  Loader2,
} from "lucide-react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { QuickAccess } from "./quick-access";

const COMMUNITY_DOCUMENTS_URL =
  "https://ksxqwsihrizusoxorrcn.supabase.co/functions/v1/get_community_documents";

type ResourceKind = "document" | "link" | "guide" | "video";

interface ApiDocumentType {
  id: string;
  value: ResourceKind;
}

export interface ApiDocument {
  id: string;
  title: string;
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
  ResourceKind,
  { icon: typeof FileText; color: string; label: string }
> = {
  document: { icon: FileText, color: "bg-blue-100 text-blue-700", label: "Document" },
  link: { icon: Link2, color: "bg-fuchsia-100 text-fuchsia-800", label: "Link" },
  guide: { icon: BookOpen, color: "bg-green-100 text-green-700", label: "Guide" },
  video: { icon: Film, color: "bg-rose-100 text-rose-700", label: "Video" },
};

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

export function Resources() {
  const [documents, setDocuments] = useState<ApiDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ResourceKind | "all">("all");
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
    const s = new Set<ResourceKind>();
    for (const d of documents) s.add(d.type.value);
    return s;
  }, [documents]);

  const filtered = useMemo(() => {
    if (filter === "all") return documents;
    return documents.filter((d) => d.type.value === filter);
  }, [documents, filter]);

  const handleOpen = (doc: ApiDocument) => {
    setDownloadError(null);

    // Link-type: open the URL directly
    if (doc.type.value === "link" && doc.link?.trim()) {
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

  const filterButtons: { key: ResourceKind | "all"; label: string }[] = [
    { key: "all", label: "All" },
    { key: "document", label: "Documents" },
    { key: "link", label: "Links" },
    { key: "guide", label: "Guides" },
    { key: "video", label: "Videos" },
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
              } ${key !== "all" && !kindsOnServer.has(key as ResourceKind) ? "opacity-40" : ""}`}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {filtered.map((doc) => {
            const kind = doc.type.value;
            const config = typeConfig[kind] ?? typeConfig.document;
            const Icon = config.icon;
            const isLink = kind === "link" && !!doc.link?.trim();
            const hasFile = kind !== "link" && !!doc.file_path?.trim();
            const canOpen = isLink || !!doc.signed_url;
            const sizeLabel = formatBytes(doc.file_size);

            return (
              <Card
                key={doc.id}
                id={`resource-${doc.id}`}
                className={`scroll-mt-24 p-4 shadow-sm hover:shadow-md transition-shadow bg-white border border-gray-200 group ${
                  canOpen ? "cursor-pointer" : "opacity-60"
                }`}
                onClick={() => handleOpen(doc)}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-gray-700" />
                    </div>
                    {canOpen ? (
                      <ExternalLink className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    ) : hasFile ? (
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

                  <div className="space-y-1.5">
                    <h3 className="font-semibold text-gray-900 text-sm leading-tight">{doc.title}</h3>
                    {doc.description ? (
                      <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">{doc.description}</p>
                    ) : null}
                    {doc.file_name && kind !== "link" ? (
                      <p className="text-xs text-gray-500 truncate" title={doc.file_name}>
                        {doc.file_name}
                        {sizeLabel ? ` · ${sizeLabel}` : ""}
                      </p>
                    ) : null}
                    {copiedId === doc.id ? (
                      <p className="text-xs text-green-700">Copied to clipboard</p>
                    ) : null}
                  </div>

                  <Badge variant="secondary" className={`gap-1 text-xs ${config.color}`}>
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