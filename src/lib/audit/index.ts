import { createAdminClient } from "@/lib/supabase/admin";

type AuditEvent =
  | "product_created"
  | "product_archived"
  | "product_deleted"
  | "payment_received"
  | "bachs_account_created"
  | "refund_fee_kept"
  | "refund_fee_returned"
  | "refund_fee_return_failed"
  | "delivery_created"
  | "download_requested"
  | "email_sent"
  | "email_failed"
  | "feedback_submitted";

type EntityType = "product" | "order" | "delivery" | "feedback" | "creator";

export async function logAuditEvent(
  event: AuditEvent,
  entityType: EntityType,
  entityId: string,
  metadata?: Record<string, unknown>
) {
  const supabase = createAdminClient();

  await supabase.from("audit_logs").insert({
    event,
    entity_type: entityType,
    entity_id: entityId,
    metadata: metadata ?? null,
  });
}
