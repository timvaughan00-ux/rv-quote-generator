import { QuoteData } from "./types";

export type PipelineStage =
  | "quote_requested"
  | "quote_sent"
  | "invoice_issued"
  | "payment_received"
  | "account_setup"
  | "active";

export const STAGES: { key: PipelineStage; label: string; color: string }[] = [
  { key: "quote_requested", label: "Quote Requested", color: "#6366f1" },
  { key: "quote_sent", label: "Quote Sent", color: "#3b82f6" },
  { key: "invoice_issued", label: "Invoice Issued", color: "#f59e0b" },
  { key: "payment_received", label: "Payment Received", color: "#10b981" },
  { key: "account_setup", label: "Account Setup", color: "#8b5cf6" },
  { key: "active", label: "Active", color: "#059669" },
];

export interface ActivityEntry {
  id: string;
  timestamp: string;
  type: "stage_change" | "note" | "email_sent" | "quote_created" | "invoice_created";
  description: string;
}

export interface Deal {
  id: string;
  schoolName: string;
  contactName: string;
  contactEmail: string;
  stage: PipelineStage;
  amount: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
  followUpDate: string | null;
  notes: string;
  activity: ActivityEntry[];
  quoteData: QuoteData | null;
  templateType: "full-suite" | "educator-pro" | "custom";
  numberOfStudents: number;
  country: string;
  region: string;
}

export function createDeal(partial: Partial<Deal>): Deal {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    schoolName: "",
    contactName: "",
    contactEmail: "",
    stage: "quote_requested",
    amount: 0,
    currency: "USD",
    createdAt: now,
    updatedAt: now,
    followUpDate: null,
    notes: "",
    activity: [
      {
        id: generateId(),
        timestamp: now,
        type: "stage_change",
        description: "Deal created — Quote Requested",
      },
    ],
    quoteData: null,
    templateType: "full-suite",
    numberOfStudents: 200,
    country: "",
    region: "",
    ...partial,
  };
}

export function stageLabel(stage: PipelineStage): string {
  return STAGES.find((s) => s.key === stage)?.label ?? stage;
}

export function stageColor(stage: PipelineStage): string {
  return STAGES.find((s) => s.key === stage)?.color ?? "#6b7280";
}

export function daysSince(dateStr: string): number {
  const then = new Date(dateStr).getTime();
  const now = Date.now();
  return Math.floor((now - then) / (1000 * 60 * 60 * 24));
}

export function needsAction(deal: Deal): string | null {
  const days = daysSince(deal.updatedAt);

  switch (deal.stage) {
    case "quote_requested":
      if (days >= 1) return "Quote not yet sent — prepare and send quote";
      break;
    case "quote_sent":
      if (days >= 3) return `No response in ${days} days — send follow-up`;
      break;
    case "invoice_issued":
      if (days >= 7) return `Invoice unpaid for ${days} days — send reminder`;
      break;
    case "payment_received":
      if (days >= 1) return "Payment received — set up account";
      break;
    case "account_setup":
      if (days >= 2) return "Account setup pending — complete onboarding";
      break;
  }
  return null;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}
