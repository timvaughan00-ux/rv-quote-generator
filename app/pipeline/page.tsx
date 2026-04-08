"use client";

import { useState, useEffect, useCallback } from "react";
import { Deal, STAGES, PipelineStage, createDeal, stageColor, needsAction, daysSince } from "@/lib/pipeline";
import { loadDeals, saveDeal, deleteDeal as removeDeal } from "@/lib/storage";
import { calculateGrandTotal } from "@/lib/types";
import DealModal from "../components/DealModal";
import Link from "next/link";

type ViewMode = "board" | "list" | "schools";

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
  const openDeals = deals.filter((d) => d.stage !== "active");
  const activeDeals = deals.filter((d) => d.stage === "active");
  const totalPipelineValue = openDeals.reduce((sum, d) => sum + d.amount, 0);
  const activeValue = activeDeals.reduce((sum, d) => sum + d.amount, 0);

  // Enhanced metrics
  const avgDealValue =
    deals.length > 0
      ? deals.reduce((sum, d) => sum + d.amount, 0) / deals.length
      : 0;
  const avgDaysInPipeline =
    openDeals.length > 0
      ? Math.round(
          openDeals.reduce((sum, d) => sum + daysSince(d.createdAt), 0) /
            openDeals.length
        )
      : 0;
  const conversionRate =
    deals.length > 0
      ? Math.round((activeDeals.length / deals.length) * 100)
      : 0;
  const b2bDeals = deals.filter((d) => d.region === "B2B School");
  const b2cDeals = deals.filter((d) => d.region === "B2C Individual");
  const stageCounts = STAGES.map((s) => ({
    ...s,
    count: deals.filter((d) => d.stage === s.key).length,
    value: deals
      .filter((d) => d.stage === s.key)
      .reduce((sum, d) => sum + d.amount, 0),
  }));
  const maxStageCount = Math.max(...stageCounts.map((s) => s.count), 1);

  // School grouping
  const schoolMap = new Map<string, Deal[]>();
  for (const deal of deals) {
    const key = normalizeSchoolName(deal.schoolName);
    if (!key) continue;
    const arr = schoolMap.get(key) || [];
    arr.push(deal);
    schoolMap.set(key, arr);
  }
  const schools = Array.from(schoolMap.entries())
    .map(([name, schoolDeals]) => ({
      name,
      deals: schoolDeals,
      totalValue: schoolDeals.reduce((s, d) => s + d.amount, 0),
      dealCount: schoolDeals.length,
      contacts: [...new Set(schoolDeals.map((d) => d.contactName).filter(Boolean))],
      latestStage: schoolDeals.reduce((best, d) => {
        const idx = STAGES.findIndex((s) => s.key === d.stage);
        const bestIdx = STAGES.findIndex((s) => s.key === best);
        return idx > bestIdx ? d.stage : best;
      }, schoolDeals[0].stage as PipelineStage),
      lastUpdated: schoolDeals.reduce(
        (latest, d) =>
          new Date(d.updatedAt) > new Date(latest) ? d.updatedAt : latest,
        schoolDeals[0].updatedAt
      ),
      totalStudents: schoolDeals.reduce((s, d) => s + d.numberOfStudents, 0),
    }))
    .sort((a, b) => b.totalValue - a.totalValue);
  const multiDealSchools = schools.filter((s) => s.dealCount > 1);

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
                {(["board", "list", "schools"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      viewMode === mode
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {mode === "schools" ? `Schools (${schools.length})` : mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </button>
                ))}
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
        {/* Top-line KPIs */}
        <div className="grid grid-cols-6 gap-3 mb-4">
          <MetricCard
            label="Pipeline Value"
            value={formatCurrency(totalPipelineValue)}
            sub={`${openDeals.length} open deals`}
          />
          <MetricCard
            label="Active Revenue"
            value={formatCurrency(activeValue)}
            sub={`${activeDeals.length} customers`}
          />
          <MetricCard
            label="Avg Deal Value"
            value={formatCurrency(avgDealValue)}
            sub={`across ${deals.length} deals`}
          />
          <MetricCard
            label="Avg Time in Pipeline"
            value={`${avgDaysInPipeline}d`}
            sub="open deals"
          />
          <MetricCard
            label="Conversion Rate"
            value={`${conversionRate}%`}
            sub={`${activeDeals.length} of ${deals.length} closed`}
          />
          <MetricCard
            label="Needs Action"
            value={String(dealsNeedingAction.length)}
            sub={dealsNeedingAction.length > 0 ? "deals overdue" : "all caught up"}
            alert={dealsNeedingAction.length > 0}
          />
        </div>

        {/* Stage Funnel + Breakdown */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          {/* Stage Funnel */}
          <div className="card col-span-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Pipeline Funnel
            </h3>
            <div className="space-y-2">
              {stageCounts.map((stage) => (
                <div key={stage.key} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-28 truncate">
                    {stage.label}
                  </span>
                  <div className="flex-1 h-7 bg-gray-100 rounded-md overflow-hidden relative">
                    <div
                      className="h-full rounded-md transition-all flex items-center px-2"
                      style={{
                        width: `${Math.max((stage.count / maxStageCount) * 100, 2)}%`,
                        backgroundColor: stage.color,
                      }}
                    >
                      {stage.count > 0 && (
                        <span className="text-xs font-semibold text-white drop-shadow-sm">
                          {stage.count}
                        </span>
                      )}
                    </div>
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                      {formatCurrency(stage.value)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* B2B / B2C Split + Schools Summary */}
          <div className="space-y-4">
            <div className="card">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Pipeline Mix
              </h3>
              <div className="flex gap-3 mb-3">
                <div className="flex-1 bg-blue-50 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-blue-900">{b2bDeals.length}</p>
                  <p className="text-xs text-blue-600">B2B School</p>
                  <p className="text-xs text-blue-400 mt-0.5">
                    {formatCurrency(b2bDeals.reduce((s, d) => s + d.amount, 0))}
                  </p>
                </div>
                <div className="flex-1 bg-purple-50 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-purple-900">{b2cDeals.length}</p>
                  <p className="text-xs text-purple-600">B2C Individual</p>
                  <p className="text-xs text-purple-400 mt-0.5">
                    {formatCurrency(b2cDeals.reduce((s, d) => s + d.amount, 0))}
                  </p>
                </div>
              </div>
              {/* Mini bar */}
              <div className="h-2 rounded-full bg-gray-100 overflow-hidden flex">
                <div
                  className="bg-blue-500 h-full"
                  style={{
                    width: `${deals.length > 0 ? (b2bDeals.length / deals.length) * 100 : 0}%`,
                  }}
                />
                <div
                  className="bg-purple-500 h-full"
                  style={{
                    width: `${deals.length > 0 ? (b2cDeals.length / deals.length) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
            <div className="card">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Schools
              </h3>
              <p className="text-2xl font-bold text-gray-900">{schools.length}</p>
              <p className="text-xs text-gray-500">
                unique schools &middot; {multiDealSchools.length} with multiple deals
              </p>
            </div>
          </div>
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

        {/* Board, List, or Schools View */}
        {viewMode === "board" ? (
          <BoardView
            deals={filteredDeals}
            onSelect={setSelectedDeal}
            filterStage={filterStage}
          />
        ) : viewMode === "list" ? (
          <ListView deals={filteredDeals} onSelect={setSelectedDeal} />
        ) : (
          <SchoolsView schools={schools} onSelectDeal={setSelectedDeal} />
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

function normalizeSchoolName(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, " ")
    .replace(/ - New Deal$/i, "")
    .replace(/^my school is not listed\s*/i, "")
    .trim();
}

interface SchoolGroup {
  name: string;
  deals: Deal[];
  totalValue: number;
  dealCount: number;
  contacts: string[];
  latestStage: PipelineStage;
  lastUpdated: string;
  totalStudents: number;
}

function SchoolsView({
  schools,
  onSelectDeal,
}: {
  schools: SchoolGroup[];
  onSelectDeal: (d: Deal) => void;
}) {
  const [expandedSchool, setExpandedSchool] = useState<string | null>(null);

  return (
    <div className="card p-0 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">
              School
            </th>
            <th className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">
              Deals
            </th>
            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">
              Contacts
            </th>
            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">
              Latest Stage
            </th>
            <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">
              Total Value
            </th>
            <th className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">
              Students
            </th>
            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">
              Last Active
            </th>
          </tr>
        </thead>
        <tbody>
          {schools.map((school) => {
            const isExpanded = expandedSchool === school.name;
            return (
              <SchoolRow
                key={school.name}
                school={school}
                isExpanded={isExpanded}
                onToggle={() =>
                  setExpandedSchool(isExpanded ? null : school.name)
                }
                onSelectDeal={onSelectDeal}
              />
            );
          })}
          {schools.length === 0 && (
            <tr>
              <td
                colSpan={7}
                className="text-center py-12 text-gray-400 text-sm"
              >
                No schools found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function SchoolRow({
  school,
  isExpanded,
  onToggle,
  onSelectDeal,
}: {
  school: SchoolGroup;
  isExpanded: boolean;
  onToggle: () => void;
  onSelectDeal: (d: Deal) => void;
}) {
  return (
    <>
      <tr
        onClick={onToggle}
        className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
      >
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <span
              className={`text-xs text-gray-400 transition-transform ${isExpanded ? "rotate-90" : ""}`}
            >
              ▸
            </span>
            <p className="text-sm font-semibold text-gray-900">
              {school.name || "Unknown School"}
            </p>
          </div>
        </td>
        <td className="px-4 py-3 text-center">
          <span
            className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
              school.dealCount > 1
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            {school.dealCount}
          </span>
        </td>
        <td className="px-4 py-3">
          <p className="text-xs text-gray-600 truncate max-w-[200px]">
            {school.contacts.length > 0
              ? school.contacts.slice(0, 2).join(", ") +
                (school.contacts.length > 2
                  ? ` +${school.contacts.length - 2}`
                  : "")
              : "—"}
          </p>
        </td>
        <td className="px-4 py-3">
          <span
            className="inline-block text-xs font-semibold px-2 py-1 rounded-full text-white"
            style={{ backgroundColor: stageColor(school.latestStage) }}
          >
            {STAGES.find((s) => s.key === school.latestStage)?.label}
          </span>
        </td>
        <td className="px-4 py-3 text-right">
          <span className="text-sm font-bold text-gray-900">
            {formatCurrency(school.totalValue)}
          </span>
        </td>
        <td className="px-4 py-3 text-center">
          <span className="text-sm text-gray-600">
            {school.totalStudents > 0 ? school.totalStudents.toLocaleString() : "—"}
          </span>
        </td>
        <td className="px-4 py-3">
          <span className="text-xs text-gray-500">
            {daysSince(school.lastUpdated) === 0
              ? "Today"
              : `${daysSince(school.lastUpdated)}d ago`}
          </span>
        </td>
      </tr>
      {isExpanded &&
        school.deals.map((deal) => (
          <tr
            key={deal.id}
            onClick={() => onSelectDeal(deal)}
            className="bg-blue-50/30 border-b border-gray-100 hover:bg-blue-50 cursor-pointer transition-colors"
          >
            <td className="px-4 py-2 pl-10">
              <p className="text-xs text-gray-600">
                {deal.contactName || deal.schoolName}
              </p>
            </td>
            <td className="px-4 py-2" />
            <td className="px-4 py-2">
              <p className="text-xs text-gray-500">{deal.contactEmail || "—"}</p>
            </td>
            <td className="px-4 py-2">
              <span
                className="inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-full text-white"
                style={{ backgroundColor: stageColor(deal.stage) }}
              >
                {STAGES.find((s) => s.key === deal.stage)?.label}
              </span>
            </td>
            <td className="px-4 py-2 text-right">
              <span className="text-xs font-medium text-gray-700">
                {deal.amount > 0 ? formatCurrency(deal.amount) : "—"}
              </span>
            </td>
            <td className="px-4 py-2 text-center">
              <span className="text-xs text-gray-400">
                {deal.numberOfStudents > 0 ? deal.numberOfStudents : "—"}
              </span>
            </td>
            <td className="px-4 py-2">
              <span className="text-xs text-gray-400">
                {daysSince(deal.updatedAt) === 0
                  ? "Today"
                  : `${daysSince(deal.updatedAt)}d ago`}
              </span>
            </td>
          </tr>
        ))}
    </>
  );
}

function formatCurrency(n: number): string {
  return `US$${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}
