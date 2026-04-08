"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import QuoteForm from "./components/QuoteForm";
import Link from "next/link";

function QuotePageInner() {
  const params = useSearchParams();

  const prefill = {
    schoolName: params.get("school") ?? "",
    contactName: params.get("contact") ?? "",
    contactEmail: params.get("email") ?? "",
    country: params.get("country") ?? "",
    region: params.get("region") ?? "",
    templateType: (params.get("template") ?? "full-suite") as
      | "full-suite"
      | "educator-pro"
      | "custom",
    numberOfStudents: parseInt(params.get("students") ?? "200") || 200,
  };

  const hasPrefill = params.has("school");

  return (
    <main className="min-h-screen py-8">
      {hasPrefill && (
        <div className="max-w-5xl mx-auto px-6 mb-4">
          <Link
            href="/pipeline"
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Back to Pipeline
          </Link>
        </div>
      )}
      <QuoteForm prefill={hasPrefill ? prefill : undefined} />
    </main>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen py-8">
          <QuoteForm />
        </main>
      }
    >
      <QuotePageInner />
    </Suspense>
  );
}
