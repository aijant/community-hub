export type PostCategory = "announcement" | "tip" | "rule" | "link" | "general";

/** UUIDs from backend post types. */
export const POST_TYPE_IDS: Record<PostCategory, string> = {
  announcement: "0afa7d32-38bf-4fee-8b9e-6c2ab0d7ed9c",
  general: "4274df38-f4af-4f1d-a740-b9d6a72e1891",
  link: "41f4d908-4433-449b-b1c3-ce75ddb613b5",
  rule: "12716f1c-a762-40f5-9f5a-0025f84ce867",
  tip: "d7eafea6-8d67-4f92-bfe3-b2d6cce1b92b",
};

const TYPE_ID_TO_CATEGORY = new Map<string, PostCategory>(
  (Object.entries(POST_TYPE_IDS) as [PostCategory, string][]).map(([cat, id]) => [id.toLowerCase(), cat]),
);

export function categoryFromTypeId(typeId: string | null | undefined): PostCategory {
  if (!typeId?.trim()) return "general";
  return TYPE_ID_TO_CATEGORY.get(typeId.trim().toLowerCase()) ?? "general";
}

const TYPE_VALUE_SLUGS = new Set<string>([
  "announcement",
  "general",
  "link",
  "rule",
  "tip",
]);

/** When API returns nested `type: { value: "general" }` without a separate id. */
export function categoryFromTypeValue(value: string | null | undefined): PostCategory {
  if (!value?.trim()) return "general";
  const k = value.trim().toLowerCase();
  if (TYPE_VALUE_SLUGS.has(k)) return k as PostCategory;
  return "general";
}

export const DEFAULT_POST_CHANNEL = "WhatsApp";
