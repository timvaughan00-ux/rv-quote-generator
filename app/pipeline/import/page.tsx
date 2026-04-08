"use client";

import { useState } from "react";
import { importHubSpotDeals, HubSpotDeal } from "@/lib/hubspot-import";
import { loadDeals, saveDeals } from "@/lib/storage";
import { STAGES } from "@/lib/pipeline";
import hubspotDealsData from "@/lib/hubspot-deals.json";
import Link from "next/link";

export default function ImportPage() {
  const [imported, setImported] = useState(false);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [totalImported, setTotalImported] = useState(0);
  const [mode, setMode] = useState<"replace" | "merge">("replace");

  function handleImport() {
    const hubspotDeals = (hubspotDealsData as unknown as HubSpotDeal[]).map((d) => ({
      ...d,
      id: String(d.id),
    }));
    const newDeals = importHubSpotDeals(hubspotDeals);

    if (mode === "replace") {
      saveDeals(newDeals);
    } else {
      const existing = loadDeals();
      saveDeals([...existing, ...newDeals]);
    }

    // Calculate stats
    const stageCounts: Record<string, number> = {};
    for (const deal of newDeals) {
      stageCounts[deal.stage] = (stageCounts[deal.stage] || 0) + 1;
    }
    setStats(stageCounts);
    setTotalImported(newDeals.length);
    setImported(true);
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <Link
          href="/pipeline"
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          ← Back to Pipeline
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mt-6 mb-2">
          Import HubSpot Deals
        </h1>
        <p className="text-gray-500 mb-8">
          Import {(hubspotDealsData as unknown as HubSpotDeal[]).length} deals from HubSpot
          B2B and B2C pipelines into the sales pipeline dashboard.
        </p>

        {!imported ? (
          <div className="space-y-6">
            <div className="card">
              <h2 className="section-title">Import Preview</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="font-semibold text-blue-900">B2B School Deals</p>
                  <p className="text-blue-700">
                    {(hubspotDealsData as unknown as HubSpotDeal[]).filter(
                      (d) => d.pipeline === "689991596"
                    ).length}{" "}
                    deals
                  </p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <p className="font-semibold text-purple-900">
                    B2C Individual Deals
                  </p>
                  <p className="text-purple-700">
                    {(hubspotDealsData as unknown as HubSpotDeal[]).filter(
                      (d) => d.pipeline === "689993556"
                    ).length}{" "}
                    deals
                  </p>
                </div>
              </div>
            </div>

            <div className="card">
              <h2 className="section-title">Import Mode</h2>
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="mode"
                    checked={mode === "replace"}
                    onChange={() => setMode("replace")}
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Replace all existing deals
                    </p>
                    <p className="text-xs text-gray-500">
                      Clears all current pipeline data and imports fresh from
                      HubSpot
                    </p>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="mode"
                    checked={mode === "merge"}
                    onChange={() => setMode("merge")}
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Add to existing deals
                    </p>
                    <p className="text-xs text-gray-500">
                      Keep current pipeline data and add HubSpot deals on top
                    </p>
                  </div>
                </label>
              </div>
            </div>

            <button onClick={handleImport} className="btn btn-primary w-full">
              Import {(hubspotDealsData as unknown as HubSpotDeal[]).length} Deals
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="card bg-green-50 border-green-200">
              <h2 className="text-lg font-semibold text-green-900 mb-2">
                Import Complete
              </h2>
              <p className="text-green-700">
                Successfully imported {totalImported} deals into the pipeline.
              </p>
            </div>

            <div className="card">
              <h2 className="section-title">Stage Distribution</h2>
              <div className="space-y-2">
                {STAGES.map((stage) => {
                  const count = stats[stage.key] || 0;
                  if (count === 0) return null;
                  return (
                    <div
                      key={stage.key}
                      className="flex items-center justify-between py-2"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: stage.color }}
                        />
                        <span className="text-sm text-gray-700">
                          {stage.label}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <Link href="/pipeline" className="btn btn-primary block text-center">
              View Pipeline →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
