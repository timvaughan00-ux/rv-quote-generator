"use client";

import { useState } from "react";
import { QuoteData, LineItem, calculateGrandTotal } from "@/lib/types";
import { TEMPLATES } from "@/lib/templates";
import dynamic from "next/dynamic";
import Link from "next/link";

const PDFDownloadButton = dynamic(() => import("./PDFDownloadButton"), {
  ssr: false,
  loading: () => (
    <button disabled className="btn btn-disabled">
      Loading PDF engine...
    </button>
  ),
});

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

function todayFormatted(): string {
  const d = new Date();
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const EMPTY_LINE_ITEM: LineItem = {
  id: "",
  name: "",
  numberOfUsers: 1,
  periodMonths: 12,
  standardPrice: 0,
  discountPercent: 0,
};

interface Prefill {
  schoolName: string;
  contactName: string;
  contactEmail: string;
  country: string;
  region: string;
  templateType: "full-suite" | "educator-pro" | "custom";
  numberOfStudents: number;
}

export default function QuoteForm({ prefill }: { prefill?: Prefill }) {
  const templateKey = prefill?.templateType ?? "full-suite";
  const templateItems = TEMPLATES[templateKey].lineItems.map((li) => ({
    ...li,
    id: generateId(),
    numberOfUsers: prefill?.numberOfStudents ?? li.numberOfUsers,
  }));

  const [data, setData] = useState<QuoteData>({
    schoolName: prefill?.schoolName ?? "",
    streetAddress: "",
    postcode: "",
    city: "",
    region: prefill?.region ?? "",
    country: prefill?.country ?? "",
    contactName: prefill?.contactName ?? "",
    contactEmail: prefill?.contactEmail ?? "",
    quoteDate: todayFormatted(),
    preparedBy: "",
    templateType: templateKey,
    lineItems: templateItems,
    additionalDiscountLabel: "",
    additionalDiscountPercent: 0,
  });

  const [showPreview, setShowPreview] = useState(false);

  function update(partial: Partial<QuoteData>) {
    setData((prev) => ({ ...prev, ...partial }));
  }

  function onTemplateChange(type: QuoteData["templateType"]) {
    const template = TEMPLATES[type];
    update({
      templateType: type,
      lineItems: template.lineItems.map((li) => ({
        ...li,
        id: generateId(),
      })),
    });
  }

  function updateLineItem(index: number, partial: Partial<LineItem>) {
    const items = [...data.lineItems];
    items[index] = { ...items[index], ...partial };
    update({ lineItems: items });
  }

  function addLineItem() {
    update({
      lineItems: [
        ...data.lineItems,
        { ...EMPTY_LINE_ITEM, id: generateId() },
      ],
    });
  }

  function removeLineItem(index: number) {
    update({ lineItems: data.lineItems.filter((_, i) => i !== index) });
  }

  const grandTotal = calculateGrandTotal(data);
  const isValid =
    data.schoolName.trim() !== "" &&
    data.contactName.trim() !== "" &&
    data.preparedBy.trim() !== "" &&
    data.lineItems.length > 0;

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            RV Quote Generator
          </h1>
          <p className="text-gray-500 mt-1">
            Generate professional quotes for school partnerships
          </p>
        </div>
        <Link
          href="/pipeline"
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          Sales Pipeline →
        </Link>
      </div>

      <div className="space-y-8">
        {/* Template Selection */}
        <section className="card">
          <h2 className="section-title">Quote Template</h2>
          <div className="grid grid-cols-3 gap-3">
            {Object.entries(TEMPLATES).map(([key, tmpl]) => (
              <button
                key={key}
                onClick={() =>
                  onTemplateChange(key as QuoteData["templateType"])
                }
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  data.templateType === key
                    ? "border-blue-600 bg-blue-50 text-blue-900"
                    : "border-gray-200 hover:border-gray-300 text-gray-700"
                }`}
              >
                <span className="font-semibold text-sm">{tmpl.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* School & Contact Info */}
        <section className="card">
          <h2 className="section-title">School Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">School Name</label>
              <input
                type="text"
                className="input"
                value={data.schoolName}
                onChange={(e) => update({ schoolName: e.target.value })}
                placeholder="e.g. Maynard Holbrook Jackson High School"
              />
            </div>
            <div className="col-span-2">
              <label className="label">Street Address</label>
              <input
                type="text"
                className="input"
                value={data.streetAddress}
                onChange={(e) => update({ streetAddress: e.target.value })}
                placeholder="130 Trinity Avenue Southwest"
              />
            </div>
            <div>
              <label className="label">City</label>
              <input
                type="text"
                className="input"
                value={data.city}
                onChange={(e) => update({ city: e.target.value })}
                placeholder="Atlanta"
              />
            </div>
            <div>
              <label className="label">Postcode</label>
              <input
                type="text"
                className="input"
                value={data.postcode}
                onChange={(e) => update({ postcode: e.target.value })}
                placeholder="30303"
              />
            </div>
            <div>
              <label className="label">Region</label>
              <input
                type="text"
                className="input"
                value={data.region}
                onChange={(e) => update({ region: e.target.value })}
                placeholder="IB Americas"
              />
            </div>
            <div>
              <label className="label">Country</label>
              <input
                type="text"
                className="input"
                value={data.country}
                onChange={(e) => update({ country: e.target.value })}
                placeholder="UNITED STATES"
              />
            </div>
          </div>
        </section>

        <section className="card">
          <h2 className="section-title">Contact Person</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Full Name</label>
              <input
                type="text"
                className="input"
                value={data.contactName}
                onChange={(e) => update({ contactName: e.target.value })}
                placeholder="Yusef King"
              />
            </div>
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                value={data.contactEmail}
                onChange={(e) => update({ contactEmail: e.target.value })}
                placeholder="contact@school.edu"
              />
            </div>
          </div>
        </section>

        {/* Quote Meta */}
        <section className="card">
          <h2 className="section-title">Quote Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Quote Date</label>
              <input
                type="text"
                className="input"
                value={data.quoteDate}
                onChange={(e) => update({ quoteDate: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Prepared By</label>
              <input
                type="text"
                className="input"
                value={data.preparedBy}
                onChange={(e) => update({ preparedBy: e.target.value })}
                placeholder="Lakshay Sachdeva"
              />
            </div>
          </div>
        </section>

        {/* Line Items */}
        <section className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title mb-0">Line Items</h2>
            <button
              onClick={addLineItem}
              className="text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              + Add Line Item
            </button>
          </div>

          <div className="space-y-4">
            {data.lineItems.map((item, i) => (
              <div
                key={item.id}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-gray-400 uppercase">
                    Item {i + 1}
                  </span>
                  {data.lineItems.length > 1 && (
                    <button
                      onClick={() => removeLineItem(i)}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="label">Product Name</label>
                    <input
                      type="text"
                      className="input"
                      value={item.name}
                      onChange={(e) =>
                        updateLineItem(i, { name: e.target.value })
                      }
                      placeholder="Revision Village Gold - Full IBDP Learning Suite"
                    />
                  </div>
                  <div>
                    <label className="label">Number of Users</label>
                    <input
                      type="number"
                      className="input"
                      value={item.numberOfUsers}
                      onChange={(e) =>
                        updateLineItem(i, {
                          numberOfUsers: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="label">Period (months)</label>
                    <input
                      type="number"
                      className="input"
                      value={item.periodMonths}
                      onChange={(e) =>
                        updateLineItem(i, {
                          periodMonths: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="label">Standard Price (per user)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="input"
                      value={item.standardPrice}
                      onChange={(e) =>
                        updateLineItem(i, {
                          standardPrice: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="label">Discount %</label>
                    <input
                      type="number"
                      step="0.01"
                      className="input"
                      value={item.discountPercent}
                      onChange={(e) =>
                        updateLineItem(i, {
                          discountPercent: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Additional Discount */}
        <section className="card">
          <h2 className="section-title">Additional Discount (optional)</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Discount Label</label>
              <input
                type="text"
                className="input"
                value={data.additionalDiscountLabel}
                onChange={(e) =>
                  update({ additionalDiscountLabel: e.target.value })
                }
                placeholder="e.g. Special Discount | School Name | State School"
              />
            </div>
            <div>
              <label className="label">Discount %</label>
              <input
                type="number"
                step="0.1"
                className="input"
                value={data.additionalDiscountPercent}
                onChange={(e) =>
                  update({
                    additionalDiscountPercent: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>
          </div>
        </section>

        {/* Summary & Actions */}
        <section className="card bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Estimated Total</p>
              <p className="text-3xl font-bold text-gray-900">
                US$
                {grandTotal.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="btn btn-secondary"
              >
                {showPreview ? "Hide Preview" : "Preview"}
              </button>
              <PDFDownloadButton data={data} isValid={isValid} />
            </div>
          </div>
        </section>

        {/* PDF Preview */}
        {showPreview && (
          <section className="card p-0 overflow-hidden">
            <PDFPreviewEmbed data={data} />
          </section>
        )}
      </div>
    </div>
  );
}

const PDFPreviewEmbed = dynamic(() => import("./PDFPreview"), {
  ssr: false,
  loading: () => (
    <div className="h-[800px] flex items-center justify-center text-gray-400">
      Loading preview...
    </div>
  ),
});
