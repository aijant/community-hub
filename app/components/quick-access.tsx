import { FileText } from "lucide-react";
import { Button } from "./ui/button";
import type { ApiDocument } from "./resources";

const ITEMS: { label: string; match: (titleLower: string) => boolean }[] = [
  { label: "Orientation", match: (t) => t.includes("orientation") },
  {
    label: "House Rules",
    match: (t) => t.includes("house rules") || t.includes("house rule"),
  },
  { label: "WiFi Info", match: (t) => t.includes("wifi") || t.includes("wi-fi") },
  { label: "Emergency", match: (t) => t.includes("emergency") },
];

function findDocId(documents: ApiDocument[], match: (titleLower: string) => boolean): string | undefined {
  for (const doc of documents) {
    if (match(doc.title.toLowerCase())) return doc.id;
  }
  return undefined;
}

function scrollToResource(docId: string | undefined) {
  if (docId) {
    const el = document.getElementById(`resource-${docId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
  }
  document.getElementById("resources")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

interface QuickAccessProps {
  documents: ApiDocument[];
}

export function QuickAccess({ documents }: QuickAccessProps) {
  return (
    <div className="mt-6 rounded-xl border border-gray-200 bg-gray-100 px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-sm">
      <div className="flex items-center gap-2 text-sm text-gray-800">
        <FileText className="w-4 h-4 shrink-0 text-gray-600" aria-hidden />
        <span className="font-medium">Quick Access:</span>
      </div>
      <div className="flex flex-wrap gap-2 justify-end">
        {ITEMS.map(({ label, match }) => {
          const docId = findDocId(documents, match);
          const missing = docId === undefined;
          return (
            <Button
              key={label}
              type="button"
              variant="outline"
              size="sm"
              title={missing ? "Not in list — opens Resources" : undefined}
              className="rounded-full text-xs h-8 border-gray-300 bg-white"
              onClick={() => scrollToResource(docId)}
            >
              {label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
