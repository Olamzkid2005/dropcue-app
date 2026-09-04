import { NextRequest } from "next/server";
import { generateAllDownloadUrls } from "@/modules/delivery/server/actions";
import { handleApiError } from "@/lib/errors";
import { rateLimit } from "@/lib/security/api-rate-limit";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const rateLimited = await rateLimit(request, "download");
  if (rateLimited) return rateLimited;

  try {
    const { token } = await params;
    const result = await generateAllDownloadUrls(token);

    if (!result.urls) {
      return Response.json(
        { error: result.error },
        { status: 404 }
      );
    }

    return Response.json({ urls: result.urls });
  } catch (error) {
    return handleApiError(error);
  }
}
