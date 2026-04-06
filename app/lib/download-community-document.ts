import { COMMUNITY_DOCUMENTS_BUCKET, supabase } from "./supabase-client";

/** Signed URL lifetime in seconds (must match product expectations). */
const SIGNED_URL_EXPIRES_SEC = 60;

export async function downloadCommunityDocument(filePath: string, fileName: string): Promise<void> {
  const { data, error } = await supabase.storage
    .from(COMMUNITY_DOCUMENTS_BUCKET)
    .createSignedUrl(filePath, SIGNED_URL_EXPIRES_SEC);

  if (error || !data?.signedUrl) {
    throw new Error(error?.message ?? "Could not create download link.");
  }

  const link = document.createElement("a");
  link.href = data.signedUrl;
  link.download = fileName;
  link.click();
}
