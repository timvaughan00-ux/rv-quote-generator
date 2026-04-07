"use client";

import { PDFViewer } from "@react-pdf/renderer";
import QuotePDF from "./QuotePDF";
import { QuoteData } from "@/lib/types";

export default function PDFPreview({ data }: { data: QuoteData }) {
  return (
    <PDFViewer width="100%" height={800} showToolbar={false}>
      <QuotePDF data={data} />
    </PDFViewer>
  );
}
