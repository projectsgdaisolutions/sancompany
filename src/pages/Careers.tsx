import React, { useEffect, useState } from "react";
import type { CareerContent, CareerFormData } from "../types";
import { readApiJson } from "../services/api";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  "";

/* =========================================================
   FALLBACK
========================================================= */

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

/* =========================================================
   COMPONENT
========================================================= */

export default function Careers() {
  const [career, setCareer] = useState<CareerContent>(DEFAULT_CAREER);

  const [formData, setFormData] = useState<CareerFormData>({
    name: "",
    phone: "",
    place: "",
    aadhar: "",
    designation: "",
    portfolioLink: "",
    resume: null,
  });

  /* =======================================================
     LOAD CAREER CONTENT
  ======================================================= */

  useEffect(() => {
    let mounted = true;

    async function loadCareer() {
      try {
        const response = await fetch(
          `${API_BASE}/api/career.php`,
          {
            method: "GET",
          }
        );

        if (!response.ok) {
          return;
        }

        const json = await readApiJson(response, 'Careers');

        const serverCareer: Partial<CareerContent> | null =
          json?.career &&
          typeof json.career === "object" &&
          !Array.isArray(json.career)
            ? (json.career as Partial<CareerContent>)
            : json?.content?.career &&
              typeof json.content.career === "object" &&
              !Array.isArray(json.content.career)
            ? (json.content.career as Partial<CareerContent>)
            : null;

        if (
          mounted &&
          serverCareer
        ) {
          setCareer((prev) => ({
            ...prev,
            ...serverCareer,

            fields: {
              ...prev.fields,
              ...(serverCareer.fields || {}),

              name: {
                ...prev.fields.name,
                ...(serverCareer.fields?.name || {}),
              },

              phone: {
                ...prev.fields.phone,
                ...(serverCareer.fields?.phone || {}),
              },

              place: {
                ...prev.fields.place,
                ...(serverCareer.fields?.place || {}),
              },

              aadhar: {
                ...prev.fields.aadhar,
                ...(serverCareer.fields?.aadhar || {}),
              },

              designation: {
                ...prev.fields.designation,
                ...(serverCareer.fields?.designation || {}),
              },

              portfolioLink: {
                ...prev.fields.portfolioLink,
                ...(serverCareer.fields?.portfolioLink || {}),
              },

              resume: {
                ...prev.fields.resume,
                ...(serverCareer.fields?.resume || {}),
              },
            },

            designationOptions:
              Array.isArray(
                serverCareer.designationOptions
              ) &&
              serverCareer.designationOptions.length
                ? serverCareer.designationOptions
                : prev.designationOptions,
          }));
        }
      } catch (error) {
        console.error(
          "Career content load error:",
          error
        );
        // Keep existing fallback content.
      }
    }

    loadCareer();

    return () => {
      mounted = false;
    };
  }, []);

  /* =======================================================
     FORM
  ======================================================= */

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const {
      name,
      value,
      type,
    } = e.target;
    const files = type === "file" ? (e.target as HTMLInputElement).files : null;

    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "file"
          ? files?.[0] || null
          : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const subject = `Job Application: ${formData.name} for ${formData.designation}`;

    let body = `Name: ${formData.name}\n`;
    body += `Phone No: ${formData.phone}\n`;
    body += `Place: ${formData.place}\n`;
    body += `Aadhar Card No: ${formData.aadhar}\n`;
    body += `Designation: ${formData.designation}\n`;
    body += `Portfolio Link: ${formData.portfolioLink}\n`;
    body += `Resume: ${
      formData.resume
        ? formData.resume.name
        : "No file attached"
    }`;

    const mailtoLink =
      `mailto:sancompany0@gmail.com` +
      `?subject=${encodeURIComponent(subject)}` +
      `&body=${encodeURIComponent(body)}`;

    window.location.href = mailtoLink;

    setFormData({
      name: "",
      phone: "",
      place: "",
      aadhar: "",
      designation: "",
      portfolioLink: "",
      resume: null,
    });

    const resumeInput = document.getElementById("resume") as HTMLInputElement | null;

    if (resumeInput) {
      resumeInput.value = "";
    }
  };

  /* =======================================================
     CLASSES
  ======================================================= */

  const inputClass =
    "w-full border-b border-[#cfc8bc] bg-transparent px-0 py-2 text-[14px] font-light text-[#181715] outline-none placeholder:text-[#837d74]/70 transition-colors duration-300 focus:border-[#181715]";

  const labelClass =
    "mb-2 block text-[9px] uppercase tracking-[0.25em] text-[#3f3a33]";

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div className="min-h-screen bg-[#f3f0e9] pt-28 pb-16 px-6">
      <div className="mx-auto max-w-[800px]">

        {/* PAGE TITLE */}

        <div className="mb-12 text-left">

          <h1
            className="text-[36px] font-light leading-none tracking-[-0.04em] text-[#181715] md:text-[44px]"
            style={{
              fontFamily:
                "'Cormorant Garamond', Georgia, serif",
            }}
          >
            {career.pageTitle}
          </h1>

          <div className="mt-4 h-px w-12 bg-[#cfc8bc]" />

          <p className="mt-4 max-w-md text-[13px] font-light leading-relaxed text-[#4a4540]">
            {career.introText}
          </p>

        </div>

        {/* CAREER FORM */}

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >

          {/* NAME */}

          <div className="group">
            <label
              htmlFor="name"
              className={labelClass}
            >
              {career.fields.name.label}
            </label>

            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder={
                career.fields.name.placeholder
              }
              className={inputClass}
            />
          </div>

          {/* PHONE */}

          <div className="group">
            <label
              htmlFor="phone"
              className={labelClass}
            >
              {career.fields.phone.label}
            </label>

            <input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              required
              placeholder={
                career.fields.phone.placeholder
              }
              className={inputClass}
            />
          </div>

          {/* PLACE */}

          <div className="group">
            <label
              htmlFor="place"
              className={labelClass}
            >
              {career.fields.place.label}
            </label>

            <input
              id="place"
              name="place"
              type="text"
              value={formData.place}
              onChange={handleChange}
              required
              placeholder={
                career.fields.place.placeholder
              }
              className={inputClass}
            />
          </div>

          {/* AADHAR */}

          <div className="group">
            <label
              htmlFor="aadhar"
              className={labelClass}
            >
              {career.fields.aadhar.label}
            </label>

            <input
              id="aadhar"
              name="aadhar"
              type="text"
              value={formData.aadhar}
              onChange={handleChange}
              required
              maxLength={12}
              placeholder={
                career.fields.aadhar.placeholder
              }
              className={inputClass}
            />
          </div>

          {/* DESIGNATION */}

          <div className="group">
            <label
              htmlFor="designation"
              className={labelClass}
            >
              {career.fields.designation.label}
            </label>

            <select
              id="designation"
              name="designation"
              value={formData.designation}
              onChange={handleChange}
              required
              className={`${inputClass} cursor-pointer ${
                !formData.designation
                  ? "text-[#837d74]/70"
                  : "text-[#181715]"
              }`}
            >
              <option
                value=""
                disabled
              >
                {
                  career.fields.designation
                    .placeholder
                }
              </option>

              {career.designationOptions.map(
                (designation, index) => (
                  <option
                    key={`${designation}-${index}`}
                    value={designation}
                    className="text-[#181715]"
                  >
                    {designation}
                  </option>
                )
              )}
            </select>
          </div>

          {/* PORTFOLIO */}

          <div className="group">
            <label
              htmlFor="portfolioLink"
              className={labelClass}
            >
              {
                career.fields.portfolioLink
                  .label
              }
            </label>

            <input
              id="portfolioLink"
              name="portfolioLink"
              type="url"
              value={formData.portfolioLink}
              onChange={handleChange}
              required
              placeholder={
                career.fields.portfolioLink
                  .placeholder
              }
              className={inputClass}
            />
          </div>

          {/* RESUME */}

          <div className="group">
            <label
              htmlFor="resume"
              className={labelClass}
            >
              {career.fields.resume.label}
            </label>

            <input
              id="resume"
              name="resume"
              type="file"
              accept=".pdf"
              onChange={handleChange}
              required
              className="w-full cursor-pointer text-[13px] font-light text-[#181715] outline-none file:mr-4 file:rounded-none file:border file:border-[#cfc8bc] file:bg-transparent file:px-3 file:py-1 file:text-[9px] file:uppercase file:tracking-[0.25em] file:text-[#3f3a33] hover:file:bg-[#181715] hover:file:text-white"
            />
          </div>

          {/* APPLY */}

          <div className="pt-4 text-center">

            <button
              type="submit"
              className="group inline-flex items-center justify-center bg-[#181715] px-10 py-3 text-[9px] uppercase tracking-[0.3em] text-white transition-all duration-300 hover:bg-[#9b7740]"
            >
              {career.applyButtonText}

              <span className="ml-3 text-xs transition-transform duration-300 group-hover:translate-x-1">
                →
              </span>
            </button>

          </div>

        </form>
      </div>
    </div>
  );
}