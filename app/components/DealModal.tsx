"use client";

import { useState } from "react";
import {
  Deal,
  STAGES,
  PipelineStage,
  stageLabel,
  stageColor,
  ActivityEntry,
  needsAction,
} from "@/lib/pipeline";
import { getEmailTemplates, getAvailableActions, EmailTemplate } from "@/lib/email-templates";

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

export default function DealModal({
  deal: initialDeal,
  onSave,
  onDelete,
  onClose,
}: {
  deal: Deal;
  onSave: (deal: Deal) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  const [deal, setDeal] = useState<Deal>({ ...initialDeal });
  const [activeTab, setActiveTab] = useState<"details" | "emails" | "activity">("details");
  const [showEmailComposer, setShowEmailComposer] = useState(false);
  const [emailDraft, setEmailDraft] = useState<EmailTemplate | null>(null);
  const [newNote, setNewNote] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  function update(partial: Partial<Deal>) {
    setDeal((prev) => {
      const updated = { ...prev, ...partial };
      onSave(updated);
      return updated;
    });
  }

  function addActivityEntry(
    extra: Partial<Deal>,
    entry: Omit<ActivityEntry, "id" | "timestamp">
  ) {
    const newEntry: ActivityEntry = {
      id: generateId(),
      timestamp: new Date().toISOString(),
      ...entry,
    };
    setDeal((prev) => {
      const updated = {
        ...prev,
        ...extra,
        activity: [newEntry, ...prev.activity],
      };
      onSave(updated);
      return updated;
    });
  }

  function advanceStage(nextStage: PipelineStage) {
    addActivityEntry(
      { stage: nextStage, updatedAt: new Date().toISOString() },
      {
        type: "stage_change",
        description: `Stage changed: ${stageLabel(deal.stage)} → ${stageLabel(nextStage)}`,
      }
    );
  }

  function addNote() {
    if (!newNote.trim()) return;
    addActivityEntry({}, { type: "note", description: newNote.trim() });
    setNewNote("");
  }

  function markEmailSent(template: EmailTemplate) {
    addActivityEntry(
      { updatedAt: new Date().toISOString() },
      { type: "email_sent", description: `Email sent: "${template.subject}"` }
    );
    setShowEmailComposer(false);
    setEmailDraft(null);
  }

  const emailTemplates = getEmailTemplates(deal);
  const stageActions = getAvailableActions(deal.stage);
  const action = needsAction(deal);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 pb-8">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[calc(100vh-64px)] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-200">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-full text-white"
                style={{ backgroundColor: stageColor(deal.stage) }}
              >
                {stageLabel(deal.stage)}
              </span>
              {action && (
                <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                  {action}
                </span>
              )}
            </div>
            <input
              type="text"
              value={deal.schoolName}
              onChange={(e) => update({ schoolName: e.target.value })}
              placeholder="School Name"
              className="text-xl font-bold text-gray-900 bg-transparent border-none outline-none w-full placeholder:text-gray-300"
            />
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none ml-4"
          >
            ×
          </button>
        </div>

        {/* Stage Actions Bar */}
        {stageActions.length > 0 && (
          <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
            {stageActions.map((sa) => (
              <button
                key={sa.nextStage}
                onClick={() => advanceStage(sa.nextStage)}
                className="btn btn-primary text-xs py-1.5 px-4"
              >
                {sa.label} →
              </button>
            ))}
            {emailTemplates.length > 0 && (
              <button
                onClick={() => {
                  setEmailDraft(emailTemplates[0]);
                  setShowEmailComposer(true);
                  setActiveTab("emails");
                }}
                className="btn btn-secondary text-xs py-1.5 px-4"
              >
                Draft Email
              </button>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-6">
          {(["details", "emails", "activity"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab === "details" ? "Details" : tab === "emails" ? "Emails" : "Activity"}
              {tab === "activity" && (
                <span className="ml-1.5 text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
                  {deal.activity.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "details" && (
            <DetailsTab deal={deal} onUpdate={update} />
          )}
          {activeTab === "emails" && (
            <EmailsTab
              deal={deal}
              templates={emailTemplates}
              showComposer={showEmailComposer}
              draft={emailDraft}
              onSelectTemplate={(t) => {
                setEmailDraft(t);
                setShowEmailComposer(true);
              }}
              onSend={markEmailSent}
              onDraftChange={setEmailDraft}
              onCancel={() => {
                setShowEmailComposer(false);
                setEmailDraft(null);
              }}
            />
          )}
          {activeTab === "activity" && (
            <ActivityTab
              activity={deal.activity}
              newNote={newNote}
              onNoteChange={setNewNote}
              onAddNote={addNote}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div>
            {showDeleteConfirm ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-red-600">Delete this deal?</span>
                <button
                  onClick={() => onDelete(deal.id)}
                  className="text-xs font-semibold text-red-600 hover:text-red-800 px-2 py-1 rounded bg-red-50"
                >
                  Yes, delete
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="text-xs text-gray-400 hover:text-red-500 transition-colors"
              >
                Delete deal
              </button>
            )}
          </div>
          <div className="text-xs text-gray-400">
            Created {new Date(deal.createdAt).toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailsTab({
  deal,
  onUpdate,
}: {
  deal: Deal;
  onUpdate: (partial: Partial<Deal>) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Deal Value */}
      <div>
        <label className="label">Deal Value (USD)</label>
        <input
          type="number"
          step="0.01"
          className="input max-w-xs text-lg font-bold"
          value={deal.amount}
          onChange={(e) => onUpdate({ amount: parseFloat(e.target.value) || 0 })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Contact Name</label>
          <input
            type="text"
            className="input"
            value={deal.contactName}
            onChange={(e) => onUpdate({ contactName: e.target.value })}
            placeholder="Teacher name"
          />
        </div>
        <div>
          <label className="label">Contact Email</label>
          <input
            type="email"
            className="input"
            value={deal.contactEmail}
            onChange={(e) => onUpdate({ contactEmail: e.target.value })}
            placeholder="teacher@school.edu"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Number of Students</label>
          <input
            type="number"
            className="input"
            value={deal.numberOfStudents}
            onChange={(e) =>
              onUpdate({ numberOfStudents: parseInt(e.target.value) || 0 })
            }
          />
        </div>
        <div>
          <label className="label">Template</label>
          <select
            className="input"
            value={deal.templateType}
            onChange={(e) =>
              onUpdate({
                templateType: e.target.value as Deal["templateType"],
              })
            }
          >
            <option value="full-suite">Full Learning Suite</option>
            <option value="educator-pro">EducatorPro Only</option>
            <option value="custom">Custom</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Country</label>
          <input
            type="text"
            className="input"
            value={deal.country}
            onChange={(e) => onUpdate({ country: e.target.value })}
            placeholder="e.g. United States"
          />
        </div>
        <div>
          <label className="label">Region</label>
          <input
            type="text"
            className="input"
            value={deal.region}
            onChange={(e) => onUpdate({ region: e.target.value })}
            placeholder="e.g. IB Americas"
          />
        </div>
      </div>

      {/* Stage Selector */}
      <div>
        <label className="label">Stage</label>
        <div className="flex flex-wrap gap-2">
          {STAGES.map((s) => (
            <button
              key={s.key}
              onClick={() => onUpdate({ stage: s.key })}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${
                deal.stage === s.key
                  ? "text-white shadow-sm"
                  : "text-gray-500 bg-gray-100 hover:bg-gray-200"
              }`}
              style={
                deal.stage === s.key
                  ? { backgroundColor: s.color }
                  : undefined
              }
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="label">Notes</label>
        <textarea
          className="input min-h-[100px] resize-y"
          value={deal.notes}
          onChange={(e) => onUpdate({ notes: e.target.value })}
          placeholder="Any additional notes about this deal..."
        />
      </div>

      {/* Link to Quote Generator */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm font-medium text-blue-900 mb-1">Generate Quote</p>
        <p className="text-xs text-blue-700 mb-3">
          Open the quote generator pre-filled with this deal&apos;s information.
        </p>
        <a
          href={`/?school=${encodeURIComponent(deal.schoolName)}&contact=${encodeURIComponent(deal.contactName)}&email=${encodeURIComponent(deal.contactEmail)}&country=${encodeURIComponent(deal.country)}&region=${encodeURIComponent(deal.region)}&template=${deal.templateType}&students=${deal.numberOfStudents}`}
          className="btn btn-primary inline-block text-xs"
        >
          Open Quote Generator →
        </a>
      </div>
    </div>
  );
}

function EmailsTab({
  deal,
  templates,
  showComposer,
  draft,
  onSelectTemplate,
  onSend,
  onDraftChange,
  onCancel,
}: {
  deal: Deal;
  templates: EmailTemplate[];
  showComposer: boolean;
  draft: EmailTemplate | null;
  onSelectTemplate: (t: EmailTemplate) => void;
  onSend: (t: EmailTemplate) => void;
  onDraftChange: (t: EmailTemplate) => void;
  onCancel: () => void;
}) {
  if (showComposer && draft) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Compose Email</h3>
          <button onClick={onCancel} className="text-xs text-gray-500 hover:text-gray-700">
            Cancel
          </button>
        </div>

        <div>
          <label className="label">To</label>
          <input
            type="text"
            className="input bg-gray-50"
            value={`${deal.contactName} <${deal.contactEmail}>`}
            readOnly
          />
        </div>

        <div>
          <label className="label">Subject</label>
          <input
            type="text"
            className="input"
            value={draft.subject}
            onChange={(e) => onDraftChange({ ...draft, subject: e.target.value })}
          />
        </div>

        <div>
          <label className="label">Body</label>
          <textarea
            className="input min-h-[300px] resize-y font-mono text-sm"
            value={draft.body}
            onChange={(e) => onDraftChange({ ...draft, body: e.target.value })}
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const mailto = `mailto:${deal.contactEmail}?subject=${encodeURIComponent(draft.subject)}&body=${encodeURIComponent(draft.body)}`;
              window.open(mailto, "_blank");
              onSend(draft);
            }}
            className="btn btn-primary text-xs"
          >
            Open in Email Client & Mark Sent
          </button>
          <button
            onClick={() => {
              navigator.clipboard.writeText(draft.body);
            }}
            className="btn btn-secondary text-xs"
          >
            Copy Body
          </button>
          <button
            onClick={() => onSend(draft)}
            className="btn btn-secondary text-xs"
          >
            Mark as Sent
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600 mb-4">
        Email templates based on the current stage ({stageLabel(deal.stage)}):
      </p>

      {templates.length === 0 ? (
        <div className="text-center py-8 text-sm text-gray-400">
          No email templates for this stage.
        </div>
      ) : (
        templates.map((template, i) => (
          <button
            key={i}
            onClick={() => onSelectTemplate(template)}
            className="w-full text-left bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-semibold text-gray-900">
                {template.actionLabel}
              </span>
              <span className="text-xs text-blue-600 font-medium">Compose →</span>
            </div>
            <p className="text-xs text-gray-500">Subject: {template.subject}</p>
            <p className="text-xs text-gray-400 mt-1 line-clamp-2">
              {template.body.substring(0, 120)}...
            </p>
          </button>
        ))
      )}

      {/* Sent emails from activity */}
      {deal.activity.filter((a) => a.type === "email_sent").length > 0 && (
        <div className="mt-6">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Email History
          </h4>
          {deal.activity
            .filter((a) => a.type === "email_sent")
            .map((a) => (
              <div
                key={a.id}
                className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0"
              >
                <span className="text-green-500 text-xs">✓</span>
                <div>
                  <p className="text-sm text-gray-700">{a.description}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(a.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

function ActivityTab({
  activity,
  newNote,
  onNoteChange,
  onAddNote,
}: {
  activity: ActivityEntry[];
  newNote: string;
  onNoteChange: (v: string) => void;
  onAddNote: () => void;
}) {
  return (
    <div>
      {/* Add note */}
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          className="input flex-1"
          value={newNote}
          onChange={(e) => onNoteChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onAddNote()}
          placeholder="Add a note..."
        />
        <button onClick={onAddNote} className="btn btn-secondary text-xs">
          Add
        </button>
      </div>

      {/* Timeline */}
      <div className="space-y-0">
        {activity.map((entry) => (
          <div key={entry.id} className="flex gap-3 py-3 border-b border-gray-100 last:border-0">
            <div className="flex-shrink-0 mt-0.5">
              <ActivityIcon type={entry.type} />
            </div>
            <div>
              <p className="text-sm text-gray-700">{entry.description}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {new Date(entry.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
        ))}
        {activity.length === 0 && (
          <p className="text-center py-8 text-sm text-gray-400">No activity yet.</p>
        )}
      </div>
    </div>
  );
}

function ActivityIcon({ type }: { type: ActivityEntry["type"] }) {
  const base = "w-6 h-6 rounded-full flex items-center justify-center text-xs";
  switch (type) {
    case "stage_change":
      return <span className={`${base} bg-blue-100 text-blue-600`}>→</span>;
    case "note":
      return <span className={`${base} bg-gray-100 text-gray-500`}>✎</span>;
    case "email_sent":
      return <span className={`${base} bg-green-100 text-green-600`}>✉</span>;
    case "quote_created":
      return <span className={`${base} bg-purple-100 text-purple-600`}>Q</span>;
    case "invoice_created":
      return <span className={`${base} bg-amber-100 text-amber-600`}>$</span>;
    default:
      return <span className={`${base} bg-gray-100 text-gray-500`}>•</span>;
  }
}
