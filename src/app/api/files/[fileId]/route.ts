import { NextRequest } from "next/server";
import { z } from "zod";
import { deleteFile } from "@/modules/files/server/actions";
import { handleApiError } from "@/lib/errors";
import { rateLimit } from "@/lib/security/api-rate-limit";

const deleteFileSchema = z.object({
  fileId: z.string().uuid("Invalid file ID"),
});

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  const rateLimited = await rateLimit(_request, "api");
  if (rateLimited) return rateLimited;

  try {
    const rawParams = await params;
    const parsed = deleteFileSchema.safeParse(rawParams);
    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const result = await deleteFile(parsed.data.fileId);

    if (!result.success) {
      return Response.json({ error: result.error }, { status: 400 });
    }

    return Response.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
