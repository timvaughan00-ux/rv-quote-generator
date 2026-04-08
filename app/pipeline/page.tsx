"use client";

import { useState, useEffect, useCallback } from "react";
import { Deal, STAGES, PipelineStage, createDeal, stageColor, needsAction, daysSince } from "@/lib/pipeline";
import { loadDeals, saveDeal, deleteDeal as removeDeal } from "@/lib/storage";
import { calculateGrandTotal } from "@/lib/types";
import DealModal from "../components/DealModal";
import Link from "next/link";

type ViewMode = "board" | "list";

export default function PipelinePage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("board");
  const [filterStage, setFilterStage] = useState<PipelineStage | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setDeals(loadDeals());
    setLoaded(true);
  }, []);

  const refreshDeals = useCallback(() => {
    setDeals(loadDeals());
  }, []);

  function handleCreateDeal() {
    const deal = createDeal({});
    const updated = saveDeal(deal);
    setDeals(updated);
    setSelectedDeal(deal);
  }

  function handleSaveDeal(deal: Deal) {
    const updated = saveDeal({ ...deal, updatedAt: new Date().toISOString() });
    setDeals(updated);
    setSelectedDeal(deal);
  }

  function handleDeleteDeal(id: string) {
    const updated = removeDeal(id);
    setDeals(updated);
    setSelectedDeal(null);
  }

  function handleCloseModal() {
    setSelectedDeal(null);
    refreshDeals();
  }

  const filteredDeals = deals.filter((d) => {
    if (filterStage !== "all" && d.stage !== filterStage) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        d.schoolName.toLowerCase().includes(q) ||
        d.contactName.toLowerCase().includes(q) ||
        d.contactEmail.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const dealsNeedingAction = deals.filter((d) => needsAction(d) !== null);
  const totalPipelineValue = deals
    .filter((d) => d.stage !== "active")
    .reduce((sum, d) => sum + d.amount, 0);
  const activeValue = deals
    .filter((d) => d.stage === "active")
    .reduce((sum, d) => sum + d.amount, 0);

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-gray-900">RV Sales Pipeline</h1>
              <Link
                href="/"
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Quote Generator →
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex bg-gray-100 rounded-lg p-0.5">
                <button
                  onClick={() => setViewMode("board")}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    viewMode === "board"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Board
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    viewMode === "list"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  List
                </button>
              </div>
              <button onClick={handleCreateDeal} className="btn btn-primary">
                + New Deal
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Metrics Bar */}
      <div className="max-w-[1600px] mx-auto px-6 py-4">
        <div className="grid grid-cols-4 gap-4 mb-4">
          <MetricCard
            label="Pipeline Value"
            value={formatCurrency(totalPipelineValue)}
            sub={`${deals.filter((d) => d.stage !== "active").length} open deals`}
          />
          <MetricCard
            label="Active Customers"
            value={formatCurrency(activeValue)}
            sub={`${deals.filter((d) => d.stage === "active").length} schools`}
          />
          <MetricCard
            label="Needs Action"
            value={String(dealsNeedingAction.length)}
            sub={dealsNeedingAction.length > 0 ? "deals overdue" : "all caught up"}
            alert={dealsNeedingAction.length > 0}
          />
          <MetricCard
            label="Total Deals"
            value={String(deals.length)}
            sub={`${deals.filter((d) => d.stage === "quote_requested" || d.stage === "quote_sent").length} in early stage`}
          />
        </div>

        {/* Action Alerts */}
        {dealsNeedingAction.length > 0 && (
          <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-amber-800 mb-2">
              Action Required ({dealsNeedingAction.length})
            </h3>
            <div className="space-y-1">
              {dealsNeedingAction.slice(0, 5).map((deal) => (
                <button
                  key={deal.id}
                  onClick={() => setSelectedDeal(deal)}
                  className="w-full text-left flex items-center justify-between py-1.5 px-2 rounded hover:bg-amber-100 transition-colors"
                >
                  <span className="text-sm text-amber-900">
                    <span className="font-medium">{deal.schoolName || "Unnamed"}</span>
                    {" — "}
                    {needsAction(deal)}
                  </span>
                  <span className="text-xs text-amber-600">{daysSince(deal.updatedAt)}d ago</span>
                </button>
              ))}
              {dealsNeedingAction.length > 5 && (
                <p className="text-xs text-amber-600 pl-2">
                  +{dealsNeedingAction.length - 5} more
                </p>
              )}
            </div>
          </div>
        )}

        {/* Search & Filter */}
        <div className="flex items-center gap-3 mb-4">
          <input
            type="text"
            placeholder="Search schools, contacts..."
            className="input max-w-xs"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <select
            className="input max-w-[180px]"
            value={filterStage}
            onChange={(e) => setFilterStage(e.target.value as PipelineStage | "all")}
          >
            <option value="all">All Stages</option>
            {STAGES.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* Board or List View */}
        {viewMode === "board" ? (
          <BoardView
            deals={filteredDeals}
            onSelect={setSelectedDeal}
            filterStage={filterStage}
          />
        ) : (
          <ListView deals={filteredDeals} onSelect={setSelectedDeal} />
        )}
      </div>

      {/* Deal Modal */}
      {selectedDeal && (
        <DealModal
          deal={selectedDeal}
          onSave={handleSaveDeal}
          onDelete={handleDeleteDeal}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}

function MetricCard({
  label,
  value,
  sub,
  alert,
}: {
  label: string;
  value: string;
  sub: string;
  alert?: boolean;
}) {
  return (
    <div
      className={`card ${alert ? "border-amber-300 bg-amber-50" : ""}`}
    >
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
        {label}
      </p>
      <p
        className={`text-2xl font-bold mt-1 ${alert ? "text-amber-700" : "text-gray-900"}`}
      >
        {value}
      </p>
      <p className="text-xs text-gray-500 mt-0.5">{sub}</p>
    </div>
  );
}

function BoardView({
  deals,
  onSelect,
  filterStage,
}: {
  deals: Deal[];
  onSelect: (d: Deal) => void;
  filterStage: PipelineStage | "all";
}) {
  const visibleStages =
    filterStage === "all" ? STAGES : STAGES.filter((s) => s.key === filterStage);

  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {visibleStages.map((stage) => {
        const stageDeals = deals.filter((d) => d.stage === stage.key);
        const stageValue = stageDeals.reduce((sum, d) => sum + d.amount, 0);

        return (
          <div
            key={stage.key}
            className="flex-shrink-0 w-[280px]"
          >
            <div className="flex items-center justify-between mb-2 px-1">
              <div className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: stage.color }}
                />
                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  {stage.label}
                </span>
                <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">
                  {stageDeals.length}
                </span>
              </div>
              <span className="text-xs text-gray-400">
                {formatCurrency(stageValue)}
              </span>
            </div>

            <div className="space-y-2">
              {stageDeals.map((deal) => (
                <DealCard key={deal.id} deal={deal} onClick={() => onSelect(deal)} />
              ))}
              {stageDeals.length === 0 && (
                <div className="text-center py-8 text-xs text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                  No deals
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DealCard({ deal, onClick }: { deal: Deal; onClick: () => void }) {
  const action = needsAction(deal);
  const days = daysSince(deal.updatedAt);

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white rounded-lg border border-gray-200 p-3 hover:border-gray-300 hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between mb-1">
        <p className="text-sm font-semibold text-gray-900 leading-tight">
          {deal.schoolName || "Unnamed School"}
        </p>
        {action && (
          <span className="flex-shrink-0 w-2 h-2 rounded-full bg-amber-400 mt-1.5 ml-2" />
        )}
      </div>
      <p className="text-xs text-gray-500 mb-2">{deal.contactName || "No contact"}</p>
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-gray-900">
          {deal.amount > 0 ? formatCurrency(deal.amount) : "—"}
        </span>
        <span className="text-xs text-gray-400">
          {days === 0 ? "today" : `${days}d ago`}
        </span>
      </div>
      {deal.country && (
        <p className="text-xs text-gray-400 mt-1">{deal.country}</p>
      )}
    </button>
  );
}

function ListView({
  deals,
  onSelect,
}: {
  deals: Deal[];
  onSelect: (d: Deal) => void;
}) {
  const sorted = [...deals].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  return (
    <div className="card p-0 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">
              School
            </th>
            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">
              Contact
            </th>
            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">
              Stage
            </th>
            <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">
              Amount
            </th>
            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">
              Last Updated
            </th>
            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">
              Action Needed
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((deal) => {
            const action = needsAction(deal);
            return (
              <tr
                key={deal.id}
                onClick={() => onSelect(deal)}
                className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <td className="px-4 py-3">
                  <p className="text-sm font-medium text-gray-900">
                    {deal.schoolName || "Unnamed"}
                  </p>
                  {deal.country && (
                    <p className="text-xs text-gray-400">{deal.country}</p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <p className="text-sm text-gray-700">{deal.contactName || "—"}</p>
                  <p className="text-xs text-gray-400">{deal.contactEmail}</p>
                </td>
                <td className="px-4 py-3">
                  <span
                    className="inline-block text-xs font-semibold px-2 py-1 rounded-full text-white"
                    style={{ backgroundColor: stageColor(deal.stage) }}
                  >
                    {STAGES.find((s) => s.key === deal.stage)?.label}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="text-sm font-semibold text-gray-900">
                    {deal.amount > 0 ? formatCurrency(deal.amount) : "—"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-gray-500">
                    {daysSince(deal.updatedAt) === 0
                      ? "Today"
                      : `${daysSince(deal.updatedAt)}d ago`}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {action ? (
                    <span className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded">
                      {action}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">—</span>
                  )}
                </td>
              </tr>
            );
          })}
          {sorted.length === 0 && (
            <tr>
              <td colSpan={6} className="text-center py-12 text-gray-400 text-sm">
                No deals yet. Click &quot;+ New Deal&quot; to get started.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function formatCurrency(n: number): string {
  return `US$${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}
