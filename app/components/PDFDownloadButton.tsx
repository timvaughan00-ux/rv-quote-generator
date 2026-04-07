"use client";

import { pdf } from "@react-pdf/renderer";
import QuotePDF from "./QuotePDF";
import { QuoteData } from "@/lib/types";

interface Props {
  data: QuoteData;
  isValid: boolean;
}

export default function PDFDownloadButton({ data, isValid }: Props) {
  async function handleDownload() {
    const blob = await pdf(<QuotePDF data={data} />).toBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const safeName = data.schoolName.replace(/[^a-zA-Z0-9 ]/g, "").trim() || "Quote";
    a.download = `${safeName} - Quote.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      onClick={handleDownload}
      disabled={!isValid}
      className={`btn ${isValid ? "btn-primary" : "btn-disabled"}`}
    >
      Download PDF
    </button>
  );
}
