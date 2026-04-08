import { Deal, PipelineStage } from "./pipeline";

export interface EmailTemplate {
  subject: string;
  body: string;
  actionLabel: string;
}

function firstName(name: string): string {
  return name.split(" ")[0] || name;
}

function formatAmount(amount: number): string {
  return `US$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function getEmailTemplates(deal: Deal): EmailTemplate[] {
  const contact = firstName(deal.contactName);
  const templates: EmailTemplate[] = [];

  switch (deal.stage) {
    case "quote_requested":
      templates.push({
        actionLabel: "Send Quote Ready Email",
        subject: `Your Revision Village Quote for ${deal.schoolName}`,
        body: `Hi ${contact},

Thank you for your interest in Revision Village for ${deal.schoolName}.

I've prepared a quote for your review — please find it attached. The quote covers ${deal.numberOfStudents} student licenses with full access to our IBDP Learning Suite.

If you have any questions about the quote or would like to discuss the options, I'd be happy to schedule a call at your convenience.

Best regards,
Revision Village Team`,
      });
      break;

    case "quote_sent":
      templates.push(
        {
          actionLabel: "Send Follow-Up (Friendly)",
          subject: `Following up — Revision Village Quote for ${deal.schoolName}`,
          body: `Hi ${contact},

I wanted to check in regarding the Revision Village quote I sent over for ${deal.schoolName}.

I understand these decisions take time, and I'm happy to answer any questions you might have, or adjust the quote if needed.

Would it be helpful to schedule a brief call to walk through the options?

Best regards,
Revision Village Team`,
        },
        {
          actionLabel: "Send Follow-Up (Expiry Reminder)",
          subject: `Your Revision Village Quote — Expiring Soon`,
          body: `Hi ${contact},

Just a quick note to let you know that the quote I sent for ${deal.schoolName} (${formatAmount(deal.amount)}) will be expiring soon.

If you'd like to proceed or need any adjustments, please let me know and I'll be happy to help.

Best regards,
Revision Village Team`,
        }
      );
      break;

    case "invoice_issued":
      templates.push(
        {
          actionLabel: "Send Payment Reminder (Gentle)",
          subject: `Invoice Reminder — Revision Village for ${deal.schoolName}`,
          body: `Hi ${contact},

I hope this message finds you well. I wanted to follow up on the invoice sent for ${deal.schoolName}'s Revision Village subscription (${formatAmount(deal.amount)}).

If the payment is already being processed, please disregard this message. Otherwise, please let me know if you need any assistance or if there are any questions about the invoice.

Best regards,
Revision Village Team`,
        },
        {
          actionLabel: "Send Payment Reminder (Urgent)",
          subject: `Action Required: Outstanding Invoice — Revision Village`,
          body: `Hi ${contact},

I'm writing to follow up on the outstanding invoice for ${deal.schoolName}'s Revision Village subscription (${formatAmount(deal.amount)}).

To ensure uninterrupted access for your students and teachers, we'd appreciate if the payment could be processed at your earliest convenience.

If there are any issues with the invoice or payment process, I'm here to help resolve them.

Best regards,
Revision Village Team`,
        }
      );
      break;

    case "payment_received":
      templates.push({
        actionLabel: "Send Account Setup Instructions",
        subject: `Welcome to Revision Village — Account Setup for ${deal.schoolName}`,
        body: `Hi ${contact},

Great news! We've received the payment for ${deal.schoolName}'s Revision Village subscription. Thank you!

Here's what happens next:

1. We'll set up your school's administrator account within 24 hours
2. You'll receive login credentials and an onboarding guide
3. We'll schedule a brief onboarding session to get your teachers started

In the meantime, could you please confirm:
- How many teacher accounts you'd like set up?
- The email addresses for your administrator contacts?

We're excited to get your school started with Revision Village!

Best regards,
Revision Village Team`,
      });
      break;

    case "account_setup":
      templates.push({
        actionLabel: "Send Welcome & Onboarding",
        subject: `Your Revision Village Account is Ready — ${deal.schoolName}`,
        body: `Hi ${contact},

Your Revision Village account for ${deal.schoolName} is now live! 🎉

Here's everything you need to get started:

📋 For Administrators:
- Log in at revisionvillage.com/school-admin
- Add and manage teacher/student accounts
- View usage analytics and reports

📚 For Teachers (EducatorPro):
- Access the full question bank and resources
- Create and assign assessments
- Track student progress and performance

🎓 For Students:
- Students can sign up with their school email
- Full Gold access to all IBDP subjects
- AI-powered feedback with Newton

I'd love to schedule a 15-minute onboarding call to walk your team through the platform. Would any time this week work?

Best regards,
Revision Village Team`,
      });
      break;

    case "active":
      templates.push({
        actionLabel: "Send Check-In",
        subject: `How's Revision Village going at ${deal.schoolName}?`,
        body: `Hi ${contact},

I wanted to check in and see how things are going with Revision Village at ${deal.schoolName}.

Is there anything we can help with? Whether it's additional training for teachers, adding more student licenses, or anything else — we're here to support you.

Best regards,
Revision Village Team`,
      });
      break;
  }

  return templates;
}

export function getAvailableActions(stage: PipelineStage): { label: string; nextStage: PipelineStage }[] {
  switch (stage) {
    case "quote_requested":
      return [{ label: "Mark Quote Sent", nextStage: "quote_sent" }];
    case "quote_sent":
      return [{ label: "Mark Invoice Issued", nextStage: "invoice_issued" }];
    case "invoice_issued":
      return [{ label: "Mark Payment Received", nextStage: "payment_received" }];
    case "payment_received":
      return [{ label: "Begin Account Setup", nextStage: "account_setup" }];
    case "account_setup":
      return [{ label: "Mark Active", nextStage: "active" }];
    case "active":
      return [];
  }
}
