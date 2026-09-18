import React, { useEffect, useState } from "react";
import type { CareerContent, CareerField } from "../types";

const API_BASE =
  import.meta.env.VITE_API_URL || "";

const DEFAULT_CAREER: CareerContent = {
  pageTitle: "Career Page",

  introText:
    "Join our team of storytellers. Please fill out the form below and we'll get back to you soon.",

  fields: {
    name: {
      label: "Name",
      placeholder: "Enter your name",
    },

    phone: {
      label: "Phone No.",
      placeholder: "Enter your phone number",
    },

    place: {
      label: "Place",
      placeholder: "Enter your place",
    },

    aadhar: {
      label: "Aadhar Card No.",
      placeholder: "Enter Aadhar card number",
    },

    designation: {
      label: "Designation",
      placeholder: "Select Designation",
    },

    portfolioLink: {
      label: "Link to your Personal Portfolio",
      placeholder: "https://yourportfolio.com",
    },

    resume: {
      label: "Upload Resume (PDF)",
    },
  },

  designationOptions: [
    "Video Editor",
    "Editor",
    "Content Creator",
    "Fieldwork (Cinematographer)",
  ],

  applyButtonText: "Apply",
};

function normalizeCareer(data: Record<string, unknown>): CareerContent {
  const envelope = data as { career?: unknown; content?: { career?: unknown } };
  const source: Partial<CareerContent> = (envelope.career || envelope.content?.career || data || {}) as Partial<CareerContent>;

  return {
    ...DEFAULT_CAREER,
    ...source,

    fields: {
      ...DEFAULT_CAREER.fields,
      ...(source.fields || {}),

      name: {
        ...DEFAULT_CAREER.fields.name,
        ...(source.fields?.name || {}),
      },

      phone: {
        ...DEFAULT_CAREER.fields.phone,
        ...(source.fields?.phone || {}),
      },

      place: {
        ...DEFAULT_CAREER.fields.place,
        ...(source.fields?.place || {}),
      },

      aadhar: {
        ...DEFAULT_CAREER.fields.aadhar,
        ...(source.fields?.aadhar || {}),
      },

      designation: {
        ...DEFAULT_CAREER.fields.designation,
        ...(source.fields?.designation || {}),
      },

      portfolioLink: {
        ...DEFAULT_CAREER.fields.portfolioLink,
        ...(source.fields?.portfolioLink || {}),
      },

      resume: {
        ...DEFAULT_CAREER.fields.resume,
        ...(source.fields?.resume || {}),
      },
    },

    designationOptions: Array.isArray(source.designationOptions)
      ? source.designationOptions
      : DEFAULT_CAREER.designationOptions,
  };
}

const CareerManagement = () => {
  const [career, setCareer] = useState<CareerContent>(DEFAULT_CAREER);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // =========================================================
  // GET CAREER DATA
  // =========================================================

  const loadCareer = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE}/api/career.php`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
        }
      );

      const text = await response.text();

      let json;

      try {
        json = JSON.parse(text);
      } catch {
        throw new Error(
          `Invalid API response (${response.status}).`
        );
      }

      if (!response.ok || json?.success === false) {
        throw new Error(
          json?.message ||
            `Failed to load Career data (${response.status}).`
        );
      }

      setCareer(normalizeCareer(json));
    } catch (err: unknown) {
      console.error("Career GET error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load Career data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCareer();
  }, []);

  // =========================================================
  // UPDATE BASIC CAREER CONTENT
  // =========================================================

  const updateCareer = (field: keyof CareerContent, value: string) => {
    setCareer((prev) => ({
      ...prev,
      [field]: value,
    }));

    setSuccess("");
  };

  // =========================================================
  // UPDATE FIELD LABEL / PLACEHOLDER
  // =========================================================

  const updateField = (
    fieldName: keyof CareerContent["fields"],
    property: keyof CareerField,
    value: string
  ) => {
    setCareer((prev) => ({
      ...prev,
      fields: {
        ...prev.fields,
        [fieldName]: {
          ...prev.fields[fieldName],
          [property]: value,
        },
      },
    }));

    setSuccess("");
  };

  // =========================================================
  // DESIGNATION - UPDATE
  // =========================================================

  const updateDesignation = (
    index: number,
    value: string
  ) => {
    setCareer((prev) => {
      const options = [
        ...(prev.designationOptions || []),
      ];

      options[index] = value;

      return {
        ...prev,
        designationOptions: options,
      };
    });

    setSuccess("");
  };

  // =========================================================
  // DESIGNATION - ADD
  // =========================================================

  const addDesignation = () => {
    setCareer((prev) => ({
      ...prev,
      designationOptions: [
        ...(prev.designationOptions || []),
        "New Designation",
      ],
    }));

    setSuccess("");
  };

  // =========================================================
  // DESIGNATION - REMOVE
  // =========================================================

  const removeDesignation = (index: number) => {
    setCareer((prev) => ({
      ...prev,

      designationOptions:
        (prev.designationOptions || []).filter(
          (_, i) => i !== index
        ),
    }));

    setSuccess("");
  };

  // =========================================================
  // SAVE CAREER
  // =========================================================

  const saveCareer = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const token =
        localStorage.getItem("adminToken");

      if (!token) {
        throw new Error(
          "Admin authentication token not found. Please login again."
        );
      }

      const response = await fetch(
        `${API_BASE}/api/career.php`,
        {
          method: "PUT",

          credentials: "include",

          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            content: {
              career: career,
            },
          }),
        }
      );

      const text = await response.text();

      let json;

      try {
        json = JSON.parse(text);
      } catch {
        throw new Error(
          `Invalid server response (${response.status}).`
        );
      }

      if (!response.ok || json?.success === false) {
        throw new Error(
          json?.message ||
            `Career save failed (${response.status}).`
        );
      }

      // Read the saved value returned by PHP
      const savedCareer = normalizeCareer(
        json
      );

      setCareer(savedCareer);

      setSuccess(
        "Career changes saved successfully."
      );

      // =====================================================
      // VERIFY WITH FRESH GET
      // =====================================================

      const verifyResponse =
        await fetch(
          `${API_BASE}/api/career.php`,
          {
            method: "GET",
            credentials: "include",
            headers: {
              Accept: "application/json",
            },
          }
        );

      const verifyText =
        await verifyResponse.text();

      let verifyJson;

      try {
        verifyJson =
          JSON.parse(verifyText);
      } catch {
        throw new Error(
          "Career was saved, but verification returned invalid JSON."
        );
      }

      if (
        !verifyResponse.ok ||
        verifyJson?.success === false
      ) {
        throw new Error(
          "Career was saved, but fresh verification failed."
        );
      }

      const verifiedCareer =
        normalizeCareer(
          verifyJson
        );

      setCareer(verifiedCareer);

      setSuccess(
        "Career changes saved and verified successfully."
      );
    } catch (err: unknown) {
      console.error(
        "Career SAVE error:",
        err
      );

      setError(
        err instanceof Error ? err.message : "Failed to save Career changes."
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f3f0e9] p-8 text-[#181715]">
        <div className="mx-auto max-w-[1100px]">
          <p className="text-sm">
            Loading Career Management...
          </p>
        </div>
      </div>
    );
  }

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="min-h-screen bg-[#f3f0e9] text-[#181715]">
      {/* =====================================================
          TOP HEADER
      ====================================================== */}

      <div className="border-b border-[#ddd7cc] bg-white px-8 py-5">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between">
          <div>
            <h1
              className="text-[22px] font-light"
              style={{
                fontFamily:
                  "'Cormorant Garamond', Georgia, serif",
              }}
            >
              Career Management
            </h1>

            <p className="mt-1 text-[11px] text-[#837d74]">
              Manage your photography website
            </p>
          </div>

          <div className="flex items-center gap-4">
            {success && (
              <div className="border border-[#cfc8bc] bg-[#f7f5f0] px-4 py-2 text-[9px] uppercase tracking-[0.15em] text-[#4b463f]">
                {success}
              </div>
            )}

            <button
              type="button"
              onClick={saveCareer}
              disabled={saving}
              className="bg-[#181715] px-6 py-3 text-[9px] uppercase tracking-[0.2em] text-white transition hover:bg-[#9b7740] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : "Save All Career Changes"}
            </button>
          </div>
        </div>
      </div>

      {/* =====================================================
          ERROR
      ====================================================== */}

      {error && (
        <div className="mx-auto mt-5 max-w-[1200px] px-8">
          <div className="border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        </div>
      )}

      {/* =====================================================
          MAIN CONTENT
      ====================================================== */}

      <main className="mx-auto max-w-[1200px] px-8 py-10">
        {/* ===================================================
            SECTION 01 - PAGE CONTENT
        ==================================================== */}

        <section className="mb-8 border border-[#ddd7cc] bg-white">
          <div className="border-b border-[#ddd7cc] px-7 py-6">
            <div className="mb-1 text-[9px] uppercase tracking-[0.3em] text-[#9b7740]">
              Section 01
            </div>

            <h2
              className="text-[28px] font-light"
              style={{
                fontFamily:
                  "'Cormorant Garamond', Georgia, serif",
              }}
            >
              Career Page Content
            </h2>

            <p className="mt-2 max-w-[650px] text-[12px] leading-relaxed text-[#837d74]">
              Manage the heading and introductory
              content displayed on the public Career
              page.
            </p>
          </div>

          <div className="grid gap-6 p-7">
            {/* PAGE TITLE */}

            <div>
              <label className="mb-2 block text-[9px] uppercase tracking-[0.25em] text-[#837d74]">
                Page Title
              </label>

              <input
                type="text"
                value={
                  career.pageTitle || ""
                }
                onChange={(e) =>
                  updateCareer(
                    "pageTitle",
                    e.target.value
                  )
                }
                className="w-full border-b border-[#cfc8bc] bg-transparent px-0 py-3 text-[15px] outline-none focus:border-[#181715]"
              />
            </div>

            {/* INTRO */}

            <div>
              <label className="mb-2 block text-[9px] uppercase tracking-[0.25em] text-[#837d74]">
                Introduction Text
              </label>

              <textarea
                value={
                  career.introText || ""
                }
                onChange={(e) =>
                  updateCareer(
                    "introText",
                    e.target.value
                  )
                }
                rows={4}
                className="w-full resize-none border border-[#ddd7cc] bg-[#faf9f6] px-4 py-3 text-[13px] leading-relaxed outline-none focus:border-[#181715]"
              />
            </div>
          </div>
        </section>

        {/* ===================================================
            SECTION 02 - FORM FIELDS
        ==================================================== */}

        <section className="mb-8 border border-[#ddd7cc] bg-white">
          <div className="border-b border-[#ddd7cc] px-7 py-6">
            <div className="mb-1 text-[9px] uppercase tracking-[0.3em] text-[#9b7740]">
              Section 02
            </div>

            <h2
              className="text-[28px] font-light"
              style={{
                fontFamily:
                  "'Cormorant Garamond', Georgia, serif",
              }}
            >
              Form Fields
            </h2>

            <p className="mt-2 text-[12px] text-[#837d74]">
              Edit the labels and placeholders used
              on the Career application form.
            </p>
          </div>

          <div className="grid gap-5 p-7 md:grid-cols-2">
            {/* NAME */}

            <FieldEditor
              title="Name"
              label={
                career.fields.name?.label
              }
              placeholder={
                career.fields.name
                  ?.placeholder
              }
              onLabelChange={(value) =>
                updateField(
                  "name",
                  "label",
                  value
                )
              }
              onPlaceholderChange={(value) =>
                updateField(
                  "name",
                  "placeholder",
                  value
                )
              }
            />

            {/* PHONE */}

            <FieldEditor
              title="Phone"
              label={
                career.fields.phone?.label
              }
              placeholder={
                career.fields.phone
                  ?.placeholder
              }
              onLabelChange={(value) =>
                updateField(
                  "phone",
                  "label",
                  value
                )
              }
              onPlaceholderChange={(value) =>
                updateField(
                  "phone",
                  "placeholder",
                  value
                )
              }
            />

            {/* PLACE */}

            <FieldEditor
              title="Place"
              label={
                career.fields.place?.label
              }
              placeholder={
                career.fields.place
                  ?.placeholder
              }
              onLabelChange={(value) =>
                updateField(
                  "place",
                  "label",
                  value
                )
              }
              onPlaceholderChange={(value) =>
                updateField(
                  "place",
                  "placeholder",
                  value
                )
              }
            />

            {/* AADHAR */}

            <FieldEditor
              title="Aadhar"
              label={
                career.fields.aadhar?.label
              }
              placeholder={
                career.fields.aadhar
                  ?.placeholder
              }
              onLabelChange={(value) =>
                updateField(
                  "aadhar",
                  "label",
                  value
                )
              }
              onPlaceholderChange={(value) =>
                updateField(
                  "aadhar",
                  "placeholder",
                  value
                )
              }
            />

            {/* DESIGNATION */}

            <FieldEditor
              title="Designation"
              label={
                career.fields.designation
                  ?.label
              }
              placeholder={
                career.fields.designation
                  ?.placeholder
              }
              onLabelChange={(value) =>
                updateField(
                  "designation",
                  "label",
                  value
                )
              }
              onPlaceholderChange={(value) =>
                updateField(
                  "designation",
                  "placeholder",
                  value
                )
              }
            />

            {/* PORTFOLIO */}

            <FieldEditor
              title="Portfolio"
              label={
                career.fields
                  .portfolioLink?.label
              }
              placeholder={
                career.fields
                  .portfolioLink
                  ?.placeholder
              }
              onLabelChange={(value) =>
                updateField(
                  "portfolioLink",
                  "label",
                  value
                )
              }
              onPlaceholderChange={(value) =>
                updateField(
                  "portfolioLink",
                  "placeholder",
                  value
                )
              }
            />

            {/* RESUME */}

            <div className="border border-[#ddd7cc] p-5">
              <div className="mb-4 text-[9px] uppercase tracking-[0.25em] text-[#9b7740]">
                Resume Upload
              </div>

              <label className="mb-2 block text-[8px] uppercase tracking-[0.2em] text-[#837d74]">
                Label
              </label>

              <input
                type="text"
                value={
                  career.fields.resume
                    ?.label || ""
                }
                onChange={(e) =>
                  updateField(
                    "resume",
                    "label",
                    e.target.value
                  )
                }
                className="w-full border-b border-[#cfc8bc] bg-transparent px-0 py-2 text-[13px] outline-none focus:border-[#181715]"
              />
            </div>
          </div>
        </section>

        {/* ===================================================
            SECTION 03 - DESIGNATIONS
        ==================================================== */}

        <section className="mb-8 border border-[#ddd7cc] bg-white">
          {/* HEADER */}

          <div className="flex items-center justify-between border-b border-[#ddd7cc] px-7 py-6">
            <div>
              <div className="mb-1 text-[9px] uppercase tracking-[0.3em] text-[#9b7740]">
                Section 03
              </div>

              <h2
                className="text-[28px] font-light"
                style={{
                  fontFamily:
                    "'Cormorant Garamond', Georgia, serif",
                }}
              >
                Designation Options
              </h2>

              <p className="mt-2 text-[12px] text-[#837d74]">
                Add, edit or remove the designations
                available in the public Career form.
              </p>
            </div>

            <button
              type="button"
              onClick={addDesignation}
              className="bg-[#181715] px-5 py-3 text-[9px] uppercase tracking-[0.2em] text-white transition hover:bg-[#9b7740]"
            >
              + Add
            </button>
          </div>

          {/* DESIGNATION LIST */}

          <div className="p-7">
            {(career.designationOptions || [])
              .length === 0 ? (
              <div className="border border-dashed border-[#cfc8bc] px-5 py-10 text-center text-[12px] text-[#837d74]">
                No designation options added.
                <br />
                Click <strong>+ Add</strong> to create
                one.
              </div>
            ) : (
              <div className="space-y-3">
                {career.designationOptions.map(
                  (
                    designation,
                    index
                  ) => (
                    <div
                      key={`designation-${index}`}
                      className="flex items-center gap-3 border border-[#ddd7cc] bg-[#faf9f6] p-3"
                    >
                      {/* NUMBER */}

                      <div className="flex h-9 w-9 shrink-0 items-center justify-center bg-[#181715] text-[9px] text-white">
                        {String(
                          index + 1
                        ).padStart(2, "0")}
                      </div>

                      {/* INPUT */}

                      <input
                        type="text"
                        value={
                          designation || ""
                        }
                        onChange={(e) =>
                          updateDesignation(
                            index,
                            e.target.value
                          )
                        }
                        placeholder="Enter designation"
                        className="flex-1 border-b border-[#cfc8bc] bg-transparent px-2 py-2 text-[13px] outline-none focus:border-[#181715]"
                      />

                      {/* REMOVE */}

                      <button
                        type="button"
                        onClick={() =>
                          removeDesignation(
                            index
                          )
                        }
                        className="border border-red-200 px-4 py-2 text-[8px] uppercase tracking-[0.15em] text-red-600 transition hover:bg-red-50"
                      >
                        Remove
                      </button>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        </section>

        {/* ===================================================
            SECTION 04 - APPLY BUTTON
        ==================================================== */}

        <section className="mb-10 border border-[#ddd7cc] bg-white">
          <div className="border-b border-[#ddd7cc] px-7 py-6">
            <div className="mb-1 text-[9px] uppercase tracking-[0.3em] text-[#9b7740]">
              Section 04
            </div>

            <h2
              className="text-[28px] font-light"
              style={{
                fontFamily:
                  "'Cormorant Garamond', Georgia, serif",
              }}
            >
              Apply Button
            </h2>
          </div>

          <div className="p-7">
            <label className="mb-2 block text-[9px] uppercase tracking-[0.25em] text-[#837d74]">
              Button Text
            </label>

            <input
              type="text"
              value={
                career.applyButtonText ||
                ""
              }
              onChange={(e) =>
                updateCareer(
                  "applyButtonText",
                  e.target.value
                )
              }
              className="w-full max-w-[500px] border-b border-[#cfc8bc] bg-transparent px-0 py-3 text-[13px] outline-none focus:border-[#181715]"
            />
          </div>
        </section>

        {/* ===================================================
            BOTTOM SAVE
        ==================================================== */}

        <div className="flex justify-end pb-10">
          <button
            type="button"
            onClick={saveCareer}
            disabled={saving}
            className="bg-[#181715] px-8 py-4 text-[9px] uppercase tracking-[0.25em] text-white transition hover:bg-[#9b7740] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving
              ? "Saving..."
              : "Save All Career Changes"}
          </button>
        </div>
      </main>
    </div>
  );
};

// =============================================================
// FIELD EDITOR COMPONENT
// =============================================================

interface FieldEditorProps {
  title: string;
  label: string;
  placeholder?: string;
  onLabelChange: (value: string) => void;
  onPlaceholderChange: (value: string) => void;
}

const FieldEditor = ({
  title,
  label,
  placeholder,
  onLabelChange,
  onPlaceholderChange,
}: FieldEditorProps) => {
  return (
    <div className="border border-[#ddd7cc] p-5">
      <div className="mb-4 text-[9px] uppercase tracking-[0.25em] text-[#9b7740]">
        {title}
      </div>

      {/* LABEL */}

      <label className="mb-2 block text-[8px] uppercase tracking-[0.2em] text-[#837d74]">
        Label
      </label>

      <input
        type="text"
        value={label || ""}
        onChange={(e) =>
          onLabelChange(
            e.target.value
          )
        }
        className="mb-5 w-full border-b border-[#cfc8bc] bg-transparent px-0 py-2 text-[13px] outline-none focus:border-[#181715]"
      />

      {/* PLACEHOLDER */}

      <label className="mb-2 block text-[8px] uppercase tracking-[0.2em] text-[#837d74]">
        Placeholder
      </label>

      <input
        type="text"
        value={placeholder || ""}
        onChange={(e) =>
          onPlaceholderChange(
            e.target.value
          )
        }
        className="w-full border-b border-[#cfc8bc] bg-transparent px-0 py-2 text-[13px] outline-none focus:border-[#181715]"
      />
    </div>
  );
};

export default CareerManagement;