import { NextRequest } from "next/server";
import { submitFeedback } from "@/modules/feedback/server/actions";
import { submitFeedbackSchema } from "@/modules/feedback/validations";
import { handleApiError } from "@/lib/errors";
import { rateLimit } from "@/lib/security/api-rate-limit";

export async function POST(request: NextRequest) {
  const rateLimited = await rateLimit(request, "api");
  if (rateLimited) return rateLimited;

  try {
    const body = await request.json();

    const parsed = submitFeedbackSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const result = await submitFeedback(parsed.data);

    if (!result.success) {
      return Response.json({ error: result.error }, { status: 400 });
    }

    return Response.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
