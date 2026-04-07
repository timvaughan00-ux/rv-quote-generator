"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import {
  QuoteData,
  calculateLineItemTotal,
  calculateSubtotal,
  calculateTotalDiscount,
  calculateAdditionalDiscount,
  calculateGrandTotal,
} from "@/lib/types";

const NAVY = "#0F3064";
const DARK_TEXT = "#141414";
const LIGHT_TEXT = "#555555";
const BORDER_COLOR = "#D0D5DD";
const HIGHLIGHT_BG = "#F5F7FA";

Font.register({
  family: "Helvetica",
  fonts: [
    { src: "Helvetica" },
    { src: "Helvetica-Bold", fontWeight: "bold" },
    { src: "Helvetica-Oblique", fontStyle: "italic" },
  ],
});

const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: DARK_TEXT,
    paddingBottom: 40,
  },

  // ── Cover header ──
  headerBlock: {
    backgroundColor: NAVY,
    paddingTop: 40,
    paddingBottom: 40,
    paddingHorizontal: 50,
    color: "#FFFFFF",
  },
  brandName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  quoteTitle: {
    fontSize: 14,
    color: "#FFFFFF",
    opacity: 0.85,
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  headerLabel: {
    fontSize: 8,
    color: "#FFFFFF",
    opacity: 0.7,
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  headerValue: {
    fontSize: 10,
    color: "#FFFFFF",
    lineHeight: 1.5,
  },
  dividerLine: {
    width: 30,
    height: 2,
    backgroundColor: "#FFFFFF",
    marginTop: 6,
    marginBottom: 6,
  },

  // ── Body ──
  body: {
    paddingHorizontal: 50,
    paddingTop: 30,
  },
  greeting: {
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 10,
  },
  paragraph: {
    fontSize: 9.5,
    lineHeight: 1.6,
    color: LIGHT_TEXT,
    marginBottom: 10,
  },
  regards: {
    fontSize: 10,
    marginTop: 10,
    marginBottom: 2,
  },
  signOff: {
    fontSize: 10,
    fontWeight: "bold",
  },

  // ── Table ──
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: NAVY,
    marginBottom: 14,
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: NAVY,
    color: "#FFFFFF",
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  tableHeaderCell: {
    fontSize: 7.5,
    fontWeight: "bold",
    color: "#FFFFFF",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR,
    paddingVertical: 10,
    paddingHorizontal: 8,
    minHeight: 50,
  },
  tableRowAlt: {
    backgroundColor: HIGHLIGHT_BG,
  },
  tableCell: {
    fontSize: 9,
    color: DARK_TEXT,
  },
  tableCellSub: {
    fontSize: 7.5,
    color: LIGHT_TEXT,
    marginTop: 2,
  },

  // Column widths
  colName: { width: "28%" },
  colUsers: { width: "10%", textAlign: "center" },
  colPeriod: { width: "12%", textAlign: "center" },
  colPrice: { width: "14%", textAlign: "right" },
  colDiscount: { width: "14%", textAlign: "center" },
  colTotal: { width: "22%", textAlign: "right" },

  // ── Summary ──
  summaryBlock: {
    marginTop: 16,
    borderTopWidth: 2,
    borderTopColor: NAVY,
    paddingTop: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  summaryLabel: {
    fontSize: 10,
    color: LIGHT_TEXT,
  },
  summaryLabelSub: {
    fontSize: 8,
    color: LIGHT_TEXT,
    fontStyle: "italic",
  },
  summaryValue: {
    fontSize: 10,
    fontWeight: "bold",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: NAVY,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  totalValue: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#FFFFFF",
  },

  // ── Included section ──
  includedTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: NAVY,
    marginBottom: 8,
    marginTop: 20,
  },
  includedSubtitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: DARK_TEXT,
    marginTop: 10,
    marginBottom: 4,
  },
  bulletItem: {
    fontSize: 9,
    color: LIGHT_TEXT,
    marginLeft: 12,
    marginBottom: 2,
    lineHeight: 1.5,
  },
  termsText: {
    fontSize: 8,
    color: LIGHT_TEXT,
    marginTop: 20,
    lineHeight: 1.5,
    fontStyle: "italic",
  },

  // ── Signature ──
  signatureBlock: {
    marginTop: 40,
    paddingHorizontal: 50,
  },
  signatureTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: NAVY,
    marginBottom: 30,
  },
  signatureRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  signatureField: {
    width: "45%",
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: DARK_TEXT,
    marginBottom: 6,
    height: 40,
  },
  signatureLabel: {
    fontSize: 9,
    color: LIGHT_TEXT,
  },

  // Footer
  footer: {
    position: "absolute",
    bottom: 20,
    left: 50,
    right: 50,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7,
    color: LIGHT_TEXT,
  },
});

function fmt(n: number): string {
  return `US$${n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function fmtPercent(n: number): string {
  return `${n.toFixed(2)}%`;
}

// Get first name from full name
function firstName(name: string): string {
  return name.split(" ")[0];
}

export default function QuotePDF({ data }: { data: QuoteData }) {
  const subtotal = calculateSubtotal(data.lineItems);
  const totalDiscount = calculateTotalDiscount(data.lineItems);
  const additionalDiscount = calculateAdditionalDiscount(
    subtotal,
    data.additionalDiscountPercent
  );
  const grandTotal = calculateGrandTotal(data);

  const templateLabel =
    data.templateType === "full-suite"
      ? "Full Learning Suite Quote"
      : data.templateType === "educator-pro"
        ? "EducatorPro Quote"
        : "Custom Quote";

  return (
    <Document>
      {/* ─── PAGE 1: Cover + Letter ─── */}
      <Page size="A4" style={s.page}>
        <View style={s.headerBlock}>
          <Text style={s.brandName}>Revision Village</Text>
          <Text style={s.quoteTitle}>{templateLabel}</Text>

          <View style={s.headerRow}>
            <View>
              <Text style={s.headerLabel}>Issued</Text>
              <Text style={s.headerValue}>{data.quoteDate}</Text>
            </View>
            <View>
              <Text style={s.headerLabel}>Prepared for</Text>
              <Text style={s.headerValue}>{data.schoolName}</Text>
              <Text style={s.headerValue}>{data.streetAddress}</Text>
              <Text style={s.headerValue}>
                {data.postcode} {data.city}
              </Text>
              <Text style={s.headerValue}>
                {data.region} {data.country}
              </Text>
              <View style={s.dividerLine} />
              <Text style={s.headerValue}>{data.contactName}</Text>
              <Text style={s.headerValue}>{data.contactEmail}</Text>
            </View>
          </View>
        </View>

        <View style={s.body}>
          <Text style={s.greeting}>Hi {firstName(data.contactName)},</Text>

          <Text style={s.paragraph}>
            Thank you for the opportunity to prepare this quote for{" "}
            {data.schoolName}.
          </Text>

          <Text style={s.paragraph}>
            Our mission is simple: to help every IB student reach their full
            potential — while giving teachers the tools to teach with greater
            ease and impact.
          </Text>

          <Text style={s.paragraph}>
            Revision Village delivers a complete learning solution. Students gain
            access to all their subjects within our library of 30+ IBDP courses,
            which feature an extensive library of IB exam-style questions,
            thousands of fully worked video solutions, scaffolded resources, and
            much more — all developed by IB educators who bring years of
            examination and classroom experience. Combined with our proprietary
            AI, Newton, students receive personalised grading and feedback that
            mirrors the insight of a one-to-one tutor.
          </Text>

          <Text style={s.paragraph}>
            For teachers, we have designed Revision Village to be a true
            classroom partner. Educators can assign materials, track student
            progress, and rely on high-quality content to free up time for what
            matters most: teaching and mentoring.
          </Text>

          <Text style={s.paragraph}>
            The attached quote provides the discounted annual price for complete
            access to the Revision Village Learning Suite, and details on access
            to EducatorPro for teachers.
          </Text>

          <Text style={s.paragraph}>
            To proceed, simply scroll to the end of this document to review and
            sign digitally.
          </Text>

          <Text style={s.paragraph}>
            Please feel free to reach out with any questions. We look forward to
            partnering with you.
          </Text>

          <Text style={s.regards}>Regards,</Text>
          <Text style={s.signOff}>{data.preparedBy}</Text>
        </View>

        <View style={s.footer}>
          <Text>Revision Village</Text>
          <Text>Page 1 of 4</Text>
        </View>
      </Page>

      {/* ─── PAGE 2: Subscription Table ─── */}
      <Page size="A4" style={s.page}>
        <View style={s.body}>
          <Text style={s.sectionTitle}>Subscription Overview</Text>

          {/* Table header */}
          <View style={s.tableHeader}>
            <View style={s.colName}>
              <Text style={s.tableHeaderCell}>Programs &amp; Resources</Text>
            </View>
            <View style={s.colUsers}>
              <Text style={s.tableHeaderCell}>Number{"\n"}of users</Text>
            </View>
            <View style={s.colPeriod}>
              <Text style={s.tableHeaderCell}>Period{"\n"}(months)</Text>
            </View>
            <View style={s.colPrice}>
              <Text style={s.tableHeaderCell}>Standard{"\n"}Price</Text>
            </View>
            <View style={s.colDiscount}>
              <Text style={s.tableHeaderCell}>Discount</Text>
            </View>
            <View style={s.colTotal}>
              <Text style={s.tableHeaderCell}>Total{"\n"}Licence Price</Text>
            </View>
          </View>

          {/* Table rows */}
          {data.lineItems.map((item, i) => (
            <View
              key={item.id}
              style={[s.tableRow, i % 2 === 1 ? s.tableRowAlt : {}]}
            >
              <View style={s.colName}>
                <Text style={s.tableCell}>{item.name}</Text>
                <Text style={s.tableCellSub}>
                  for {item.periodMonths / 12} year
                  {item.periodMonths > 12 ? "s" : ""}
                </Text>
              </View>
              <View style={s.colUsers}>
                <Text style={s.tableCell}>{item.numberOfUsers}</Text>
              </View>
              <View style={s.colPeriod}>
                <Text style={s.tableCell}>{item.periodMonths}</Text>
              </View>
              <View style={s.colPrice}>
                <Text style={s.tableCell}>${item.standardPrice.toFixed(2)}</Text>
              </View>
              <View style={s.colDiscount}>
                <Text style={s.tableCell}>
                  {fmtPercent(item.discountPercent)}
                </Text>
                <Text style={s.tableCellSub}>
                  after {fmtPercent(item.discountPercent)} discount
                </Text>
              </View>
              <View style={s.colTotal}>
                <Text style={s.tableCell}>
                  {fmt(calculateLineItemTotal(item))}
                </Text>
              </View>
            </View>
          ))}

          {/* Summary */}
          <View style={s.summaryBlock}>
            <View style={s.summaryRow}>
              <View>
                <Text style={s.summaryLabel}>One-time subtotal</Text>
                <Text style={s.summaryLabelSub}>
                  after {fmt(totalDiscount)} discount
                </Text>
              </View>
              <Text style={s.summaryValue}>{fmt(subtotal)}</Text>
            </View>

            {data.additionalDiscountPercent > 0 && (
              <View style={s.summaryRow}>
                <View>
                  <Text style={s.summaryLabel}>
                    {data.additionalDiscountLabel}
                  </Text>
                  <Text style={s.summaryLabelSub}>
                    {data.additionalDiscountPercent.toFixed(1)}% discount
                  </Text>
                </View>
                <Text style={[s.summaryValue, { color: "#D32F2F" }]}>
                  -{fmt(additionalDiscount)}
                </Text>
              </View>
            )}

            <View style={s.totalRow}>
              <Text style={s.totalLabel}>Total</Text>
              <Text style={s.totalValue}>{fmt(grandTotal)}</Text>
            </View>
          </View>
        </View>

        <View style={s.footer}>
          <Text>Revision Village</Text>
          <Text>Page 2 of 4</Text>
        </View>
      </Page>

      {/* ─── PAGE 3: What's Included ─── */}
      <Page size="A4" style={s.page}>
        <View style={s.body}>
          <Text style={s.includedTitle}>
            What&apos;s Included in the Revision Village Learning Suite?
          </Text>
          <Text style={s.paragraph}>
            Students receive full Gold-access to all of their subjects within
            our library of 30+ IBDP courses. These cover:
          </Text>

          <Text style={s.includedSubtitle}>Sciences &amp; Maths</Text>
          <Text style={s.bulletItem}>
            {"\u2022"} Maths AA &amp; AI (SL &amp; HL)
          </Text>
          <Text style={s.bulletItem}>
            {"\u2022"} Biology, Chemistry, Physics (SL &amp; HL)
          </Text>
          <Text style={s.bulletItem}>
            {"\u2022"} Environmental Systems &amp; Societies (SL &amp; HL)
          </Text>

          <Text style={s.includedSubtitle}>
            Humanities &amp; Social Sciences
          </Text>
          <Text style={s.bulletItem}>
            {"\u2022"} Psychology (SL &amp; HL)
          </Text>
          <Text style={s.bulletItem}>
            {"\u2022"} Business Management (SL &amp; HL)
          </Text>
          <Text style={s.bulletItem}>
            {"\u2022"} Economics (SL &amp; HL)
          </Text>
          <Text style={s.bulletItem}>{"\u2022"} History (SL &amp; HL)</Text>

          <Text style={s.includedSubtitle}>Languages</Text>
          <Text style={s.bulletItem}>
            {"\u2022"} English (LangLit SL &amp; HL, Lit SL &amp; HL)
          </Text>
          <Text style={s.bulletItem}>
            {"\u2022"} Language B: French, Spanish, English
          </Text>

          <Text style={s.includedSubtitle}>EducatorPro (for Teachers)</Text>
          <Text style={s.bulletItem}>{"\u2022"} Full subject access</Text>
          <Text style={s.bulletItem}>
            {"\u2022"} Formative assessment + workflows
          </Text>
          <Text style={s.bulletItem}>
            {"\u2022"} Data insights + reporting
          </Text>
          <Text style={s.bulletItem}>
            {"\u2022"} Proprietary bank of teacher-only exam-style questions
            (Maths &amp; Sciences)
          </Text>

          <Text style={s.includedSubtitle}>Administrator Accounts</Text>
          <Text style={s.paragraph}>
            You are welcome to nominate key contacts to add, edit, and manage
            teacher and student access across your school.
          </Text>

          <Text style={s.termsText}>
            Your acceptance of this quote confirms agreement with our Terms &amp;
            Conditions and Privacy Policy.
          </Text>
        </View>

        <View style={s.footer}>
          <Text>Revision Village</Text>
          <Text>Page 3 of 4</Text>
        </View>
      </Page>

      {/* ─── PAGE 4: Signature ─── */}
      <Page size="A4" style={s.page}>
        <View style={s.signatureBlock}>
          <Text style={s.signatureTitle}>Signature</Text>

          <View style={s.signatureRow}>
            <View style={s.signatureField}>
              <View style={s.signatureLine} />
              <Text style={s.signatureLabel}>Signature</Text>
            </View>
            <View style={s.signatureField}>
              <View style={s.signatureLine} />
              <Text style={s.signatureLabel}>Date</Text>
            </View>
          </View>

          <View style={{ width: "45%" }}>
            <View style={s.signatureLine} />
            <Text style={s.signatureLabel}>Printed name</Text>
          </View>
        </View>

        <View style={s.footer}>
          <Text>Revision Village</Text>
          <Text>Page 4 of 4</Text>
        </View>
      </Page>
    </Document>
  );
}
