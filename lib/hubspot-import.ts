import { Deal, PipelineStage, createDeal } from "./pipeline";

// HubSpot stage code → our pipeline stage mapping
const B2B_STAGE_MAP: Record<string, PipelineStage> = {
  "1009776417": "quote_requested",   // New B2B deal, prob 0.20
  "1009776422": "quote_sent",        // Quote sent, open
  "1009776421": "active",            // Closed won, prob 1.0
};

const B2C_STAGE_MAP: Record<string, PipelineStage> = {
  "1009885613": "quote_requested",   // New lead, prob 0.01
  "1009885614": "quote_sent",        // In progress, prob 0.60
  "1134571158": "invoice_issued",    // Follow-up / pending, prob 0.60
  "1009885615": "payment_received",  // Closed won variant
  "1009885616": "payment_received",  // Closed won variant
  "1009885617": "active",            // Closed won, prob 1.0
  "1009885618": "active",            // Closed lost — we still track them
};

export const B2B_PIPELINE = "689991596";
export const B2C_PIPELINE = "689993556";

export interface HubSpotDeal {
  id: string;
  dealname: string;
  dealstage: string;
  pipeline: string;
  amount: string | null;
  closedate: string | null;
  createdate: string;
  hs_lastmodifieddate: string;
}

function parseDealName(dealname: string): { contactName: string; schoolName: string } {
  // Patterns:
  // "Name -SchoolName" or "Name - SchoolName" or "SchoolName - New Deal" or just "Name"
  const newDealMatch = dealname.match(/^(.+?)\s*-\s*New Deal$/i);
  if (newDealMatch) {
    const part = newDealMatch[1].trim();
    // Could be a school name or contact name
    if (part.includes("School") || part.includes("College") || part.includes("Academy") || part.includes("International")) {
      return { contactName: "", schoolName: part };
    }
    return { contactName: part, schoolName: "" };
  }

  const dashMatch = dealname.match(/^(.+?)\s*-\s*(.+)$/);
  if (dashMatch) {
    const left = dashMatch[1].trim();
    const right = dashMatch[2].trim();
    if (right && right !== "" && !right.startsWith("my school")) {
      return { contactName: left, schoolName: right };
    }
    return { contactName: left, schoolName: "" };
  }

  return { contactName: dealname.trim(), schoolName: "" };
}

export function importHubSpotDeals(hubspotDeals: HubSpotDeal[]): Deal[] {
  return hubspotDeals.map((hs) => {
    const isB2B = hs.pipeline === B2B_PIPELINE;
    const stageMap = isB2B ? B2B_STAGE_MAP : B2C_STAGE_MAP;
    const stage = stageMap[hs.dealstage] || "quote_requested";
    const { contactName, schoolName } = parseDealName(hs.dealname);

    return createDeal({
      schoolName: schoolName || contactName,
      contactName,
      contactEmail: "",
      stage,
      amount: parseFloat(hs.amount || "0") || 0,
      createdAt: hs.createdate,
      updatedAt: hs.hs_lastmodifieddate,
      templateType: isB2B ? "full-suite" : "educator-pro",
      numberOfStudents: isB2B ? 200 : 1,
      country: "",
      region: isB2B ? "B2B School" : "B2C Individual",
      notes: `HubSpot Deal #${hs.id} | Pipeline: ${isB2B ? "B2B" : "B2C"} | Stage code: ${hs.dealstage}`,
      activity: [
        {
          id: Math.random().toString(36).substring(2, 11),
          timestamp: hs.createdate,
          type: "stage_change",
          description: `Imported from HubSpot — ${isB2B ? "B2B" : "B2C"} pipeline`,
        },
      ],
    });
  });
}
