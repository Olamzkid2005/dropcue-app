export type FeedbackCategory =
  | "broken"
  | "confusing"
  | "feature_request"
  | "general";

export interface Feedback {
  id: string;
  user_id: string | null;
  email: string | null;
  category: FeedbackCategory;
  message: string;
  page_url: string;
  product_id: string | null;
  order_id: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface SubmitFeedbackInput {
  category: FeedbackCategory;
  message: string;
  email?: string;
  page_url: string;
  product_id?: string;
  order_id?: string;
}

export const FEEDBACK_CATEGORIES: { value: FeedbackCategory; label: string; icon: string }[] = [
  { value: "broken", label: "Something is broken", icon: "bug_report" },
  { value: "confusing", label: "Something is confusing", icon: "help_outline" },
  { value: "feature_request", label: "Feature request", icon: "lightbulb" },
  { value: "general", label: "Just give feedback", icon: "feedback" },
];
