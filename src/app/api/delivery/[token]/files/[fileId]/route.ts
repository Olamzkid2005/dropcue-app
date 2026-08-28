import { NextRequest } from "next/server";
import { generateFileDownloadUrl } from "@/modules/delivery/server/actions";
import { handleApiError } from "@/lib/errors";
import { rateLimit } from "@/lib/security/api-rate-limit";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string; fileId: string }> }
) {
  const rateLimited = rateLimit(request, "download");
  if (rateLimited) return rateLimited;

  try {
    const { token, fileId } = await params;
    const result = await generateFileDownloadUrl(token, fileId);

    if (!result.download_url) {
      return Response.json(
        { error: result.error },
        { status: result.error === "Access denied" ? 403 : 404 }
      );
    }

    // Redirect to signed URL for direct download
    return Response.redirect(result.download_url);
  } catch (error) {
    return handleApiError(error);
  }
}
