import { NextRequest } from "next/server";
import { resolveDeliveryToken } from "@/modules/delivery/server/actions";
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
    const result = await resolveDeliveryToken(token);

    if (result.status === "invalid") {
      return Response.json(
        { status: "invalid", error: result.error },
        { status: 404 }
      );
    }

    if (result.status === "expired") {
      return Response.json(
        { status: "expired", error: result.error },
        { status: 410 }
      );
    }

    if (result.status === "processing") {
      return Response.json({ status: "processing" });
    }

    if (result.status === "files_unavailable") {
      return Response.json(
        { status: "files_unavailable", error: "Files are no longer available" },
        { status: 410 }
      );
    }

    // Ready
    return Response.json({
      status: "ready",
      product: result.delivery!.product,
      files: result.delivery!.files.map((f) => ({
        id: f.id,
        original_filename: f.original_filename,
        file_size: f.file_size,
        mime_type: f.mime_type,
      })),
      expires_at: result.delivery!.expires_at,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
