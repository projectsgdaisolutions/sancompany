import React, {
  useEffect,
  useState,
} from "react";
import { readApiJson } from '../services/api';

/* =========================================================
   API
========================================================= */

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "";

/* =========================================================
   DEFAULT SERVICES
   Same serial/order as Services.jsx
========================================================= */

const DEFAULT_SERVICE_LIST = [
  {
    number: "01",
    title: "Wedding",
    subtitle: "Photography & Cinematography",
    description:
      "Comprehensive coverage of your big day, blending timeless portraits with cinematic film to capture every vow, tear, and dance move.",
  },
  {
    number: "02",
    title: "Pre-Wedding",
    subtitle: "Photography",
    description:
      "Celebrate your journey to the altar with a custom pre-wedding shoot. We find the perfect backdrop to tell your unique love story.",
  },
  {
    number: "03",
    title: "Maternity",
    subtitle: "& Pregnancy Shoots",
    description:
      "Capture the glow of motherhood with elegant and intimate maternity portraits that celebrate the beginning of a new life.",
  },
  {
    number: "04",
    title: "Birthday",
    subtitle: "Celebration",
    description:
      "From first birthdays to milestone years, we document the joy, laughter, and candid moments of your special day.",
  },
  {
    number: "05",
    title: "Engagement",
    subtitle: "& Ring Ceremony",
    description:
      "Document the magical moment of commitment. We capture the love, excitement, and details of your engagement event.",
  },
  {
    number: "06",
    title: "Celebration Events",
    subtitle: "& Special Occasions",
    description:
      "From family gatherings to special celebrations, we preserve the emotions and memories that make every event unique.",
  },
  {
    number: "07",
    title: "Candid",
    subtitle: "Photography",
    description:
      "Natural, unposed moments captured with a creative eye so your memories feel authentic and full of emotion.",
  },
  {
    number: "08",
    title: "Event",
    subtitle: "Videography",
    description:
      "Cinematic event coverage that transforms your most important moments into films you can revisit for years.",
  },
];

/* =========================================================
   CLONE HELPER
========================================================= */

const clone = (value) =>
  JSON.parse(JSON.stringify(value));

/* =========================================================
   INPUT FIELD
   Defined outside component so it does not remount
   while typing.
========================================================= */

const InputField = ({
  label,
  value,
  onChange,
  textarea = false,
  readOnly = false,
}) => {
  const [localValue, setLocalValue] = useState(
    value ?? ""
  );

  useEffect(() => {
    setLocalValue(value ?? "");
  }, [value]);

  const handleChange = (event) => {
    if (readOnly) return;

    setLocalValue(event.target.value);
  };

  const handleBlur = () => {
    if (readOnly) return;

    if (localValue !== value) {
      onChange(localValue);
    }
  };

  return (
    <div>
      <label className="mb-2 block text-[10px] uppercase tracking-[0.25em] text-neutral-500">
        {label}
      </label>

      {textarea ? (
        <textarea
          value={localValue}
          onChange={handleChange}
          onBlur={handleBlur}
          readOnly={readOnly}
          rows={5}
          className={`block w-full resize-y rounded-xl border border-[#ddd8cf] px-4 py-4 text-sm text-neutral-800 outline-none transition ${
            readOnly
              ? "cursor-not-allowed bg-[#f3f0ea] text-neutral-400"
              : "bg-[#fcfbf8] focus:border-black"
          }`}
        />
      ) : (
        <input
          type="text"
          value={localValue}
          onChange={handleChange}
          onBlur={handleBlur}
          readOnly={readOnly}
          className={`block w-full rounded-xl border border-[#ddd8cf] px-4 py-4 text-sm text-neutral-800 outline-none transition ${
            readOnly
              ? "cursor-not-allowed bg-[#f3f0ea] text-neutral-400"
              : "bg-[#fcfbf8] focus:border-black"
          }`}
        />
      )}
    </div>
  );
};

/* =========================================================
   SERVICE CARD
========================================================= */

const ServiceCard = ({
  service,
  index,
  onUpdate,
}) => {
  const serial = String(index + 1).padStart(2, "0");

  return (
    <section className="overflow-hidden rounded-2xl bg-white shadow-sm">

      {/* =================================================
          CARD HEADER
      ================================================= */}

      <div className="border-b border-neutral-100 px-7 py-6">

        <div className="flex items-center gap-5">

          <span className="font-serif text-5xl font-light leading-none text-[#a18764]">
            {serial}
          </span>

          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-[#a18764]">
              SERVICE {serial}
            </p>

            <h3 className="mt-2 text-2xl font-light text-neutral-900">
              {service.title || "Untitled Service"}
            </h3>
          </div>

        </div>

      </div>

      {/* =================================================
          CARD CONTENT
      ================================================= */}

      <div className="p-7">

        <div className="grid gap-6 md:grid-cols-2">

          {/* NUMBER */}

          <InputField
            label="Service Number"
            value={serial}
            readOnly
            onChange={() => {}}
          />

          {/* TITLE */}

          <InputField
            label="Service Title"
            value={service.title}
            onChange={(value) =>
              onUpdate(
                index,
                "title",
                value
              )
            }
          />

          {/* SUBTITLE */}

          <InputField
            label="Subtitle"
            value={service.subtitle}
            onChange={(value) =>
              onUpdate(
                index,
                "subtitle",
                value
              )
            }
          />

          {/* DESCRIPTION */}

          <div className="md:col-span-2">

            <InputField
              label="Service Description"
              textarea
              value={service.description}
              onChange={(value) =>
                onUpdate(
                  index,
                  "description",
                  value
                )
              }
            />

          </div>

        </div>

      </div>
    </section>
  );
};

/* =========================================================
   SERVICE MANAGEMENT
========================================================= */

const ContentManagement = () => {

  const [services, setServices] = useState(
    clone(DEFAULT_SERVICE_LIST)
  );

  const [existingContent, setExistingContent] =
    useState({});

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [saveMessage, setSaveMessage] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  /* =====================================================
     FETCH CONTENT
  ===================================================== */

  const fetchContent = async () => {
    try {

      setLoading(true);
      setErrorMessage("");
      setSaveMessage("");

      const response = await fetch(
        `${API_BASE_URL}/api/content.php`
      );

      const data = await readApiJson(response, 'Content');

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Failed to load website content"
        );
      }

      const rawContent =
        data.content || {};

      const rawServices =
        rawContent.services || {};

      /*
        Backend compatibility:
        1. services.serviceList
        2. root serviceList
        3. default services
      */

      const storedServices =
        Array.isArray(
          rawServices.serviceList
        ) &&
        rawServices.serviceList.length > 0
          ? rawServices.serviceList
          : Array.isArray(
                rawContent.serviceList
              ) &&
              rawContent.serviceList.length > 0
            ? rawContent.serviceList
            : DEFAULT_SERVICE_LIST;

      /*
        Always keep exactly 8 services
        in the same serial order.
      */

      const normalizedServices =
        DEFAULT_SERVICE_LIST.map(
          (defaultService, index) => {

            const stored =
              storedServices[index] || {};

            return {
              number: String(
                index + 1
              ).padStart(2, "0"),

              title:
                stored.title ??
                defaultService.title,

              subtitle:
                stored.subtitle ??
                defaultService.subtitle,

              description:
                stored.description ??
                defaultService.description,
            };
          }
        );

      setServices(
        clone(normalizedServices)
      );

      /*
        Keep complete existing content
        so other website content is not deleted
        when services are saved.
      */

      setExistingContent(
        clone(rawContent)
      );

    } catch (error) {

      console.error(
        "Service management fetch error:",
        error
      );

      setErrorMessage(
        error.message ||
          "Failed to load service content"
      );

    } finally {

      setLoading(false);

    }
  };

  useEffect(() => {
    fetchContent();
  }, []);

  /* =====================================================
     UPDATE SERVICE
  ===================================================== */

  const updateService = (
    index,
    field,
    value
  ) => {

    setServices((previous) => {

      const next =
        clone(previous);

      if (!next[index]) {
        return previous;
      }

      next[index][field] = value;

      /*
        Number always stays serial-wise.
      */

      next[index].number =
        String(index + 1).padStart(
          2,
          "0"
        );

      return next;
    });
  };

  /* =====================================================
     SAVE SERVICES
  ===================================================== */

  const handleSave = async () => {

    if (saving) return;

    try {

      setSaving(true);
      setSaveMessage("");
      setErrorMessage("");

      /*
        Make sure services remain exactly
        01 → 08 before saving.
      */

      const normalizedServices =
        DEFAULT_SERVICE_LIST.map(
          (defaultService, index) => {

            const current =
              services[index] ||
              {};

            return {
              number: String(
                index + 1
              ).padStart(2, "0"),

              title:
                current.title ??
                defaultService.title,

              subtitle:
                current.subtitle ??
                defaultService.subtitle,

              description:
                current.description ??
                defaultService.description,
            };
          }
        );

      /*
        Preserve all existing website content.
        Only services are updated.
      */

      const contentToSave = {
        ...existingContent,

        services: {
          ...(existingContent.services ||
            {}),

          serviceList:
            normalizedServices,
        },

        /*
          Keep root serviceList as well
          for backend compatibility.
        */

        serviceList:
          normalizedServices,
      };

      const response = await fetch(
        `${API_BASE_URL}/api/content.php`,
        {
          method: "PUT",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            content:
              contentToSave,
          }),
        }
      );

      const data =
        await readApiJson(response, 'Content');

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Failed to save services"
        );
      }

      /*
        Update local state from
        backend response if available.
      */

      if (data.content) {

        const savedContent =
          data.content || {};

        const savedServices =
          savedContent.services || {};

        const savedList =
          Array.isArray(
            savedServices.serviceList
          ) &&
          savedServices.serviceList.length > 0
            ? savedServices.serviceList
            : normalizedServices;

        const normalizedSaved =
          DEFAULT_SERVICE_LIST.map(
            (
              defaultService,
              index
            ) => {

              const saved =
                savedList[index] ||
                {};

              return {
                number: String(
                  index + 1
                ).padStart(2, "0"),

                title:
                  saved.title ??
                  defaultService.title,

                subtitle:
                  saved.subtitle ??
                  defaultService.subtitle,

                description:
                  saved.description ??
                  defaultService.description,
              };
            }
          );

        setServices(
          clone(normalizedSaved)
        );

        setExistingContent(
          clone(savedContent)
        );
      } else {

        setServices(
          clone(normalizedServices)
        );

        setExistingContent(
          clone(contentToSave)
        );
      }

      setSaveMessage(
        "Services updated successfully."
      );

      window.setTimeout(() => {
        setSaveMessage("");
      }, 4000);

    } catch (error) {

      console.error(
        "Service save error:",
        error
      );

      setErrorMessage(
        error.message ||
          "Failed to save services"
      );

    } finally {

      setSaving(false);

    }
  };

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {

    return (
      <div className="min-h-screen bg-[#f6f2ea] p-10">

        <div className="mx-auto max-w-[1200px]">

          <p className="text-sm text-neutral-500">
            Loading services...
          </p>

        </div>

      </div>
    );
  }

  /* =====================================================
     MAIN
  ===================================================== */

  return (
    <div className="min-h-screen bg-[#f6f2ea]">

      {/* =================================================
          PAGE HEADER
      ================================================= */}

      <div className="border-b border-neutral-200 bg-[#fbfaf7] px-8 py-7">

        <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-8">

          <div>

            <p className="text-[10px] uppercase tracking-[0.35em] text-[#a18764]">
              SERVICES
            </p>

            <h1 className="mt-3 text-5xl font-light text-neutral-900">
              Service Management
            </h1>

            <p className="mt-3 text-sm text-neutral-500">
              Manage all services displayed on
              your SAN Photography Services page.
            </p>

          </div>

          {/* =================================================
              SAVE BUTTON
          ================================================= */}

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className={`shrink-0 rounded-xl px-8 py-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition ${
              saving
                ? "cursor-not-allowed bg-neutral-500"
                : "bg-black hover:bg-neutral-800"
            }`}
          >
            {saving
              ? "SAVING..."
              : "SAVE CHANGES"}
          </button>

        </div>

      </div>

      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      <div className="mx-auto max-w-[1200px] px-8 py-10">

        {/* =================================================
            SUCCESS
        ================================================= */}

        {saveMessage && (
          <div className="mb-8 flex items-center justify-between rounded-xl border border-green-200 bg-green-50 px-5 py-4 text-sm text-green-700">

            <span>
              ✓ {saveMessage}
            </span>

            <button
              type="button"
              onClick={() =>
                setSaveMessage("")
              }
              className="text-green-700"
            >
              ×
            </button>

          </div>
        )}

        {/* =================================================
            ERROR
        ================================================= */}

        {errorMessage && (
          <div className="mb-8 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">

            <span>
              {errorMessage}
            </span>

            <button
              type="button"
              onClick={() =>
                setErrorMessage("")
              }
              className="text-red-700"
            >
              ×
            </button>

          </div>
        )}

        {/* =================================================
            SERVICES INTRO
        ================================================= */}

        <div className="mb-10">

          <p className="mb-4 text-[10px] uppercase tracking-[0.35em] text-[#a18764]">
            WEBSITE SERVICES
          </p>

          <h2 className="text-4xl font-light text-neutral-900">
            Services Content
          </h2>

          <p className="mt-3 max-w-3xl text-sm leading-7 text-neutral-500">
            Edit the service title, subtitle and
            description displayed on the Services page.
            The service order, images, icons, animations
            and layout remain unchanged.
          </p>

        </div>

        {/* =================================================
            SERVICE LIST
            01 → 08
        ================================================= */}

        <div className="space-y-8">

          {services.map(
            (service, index) => (
              <ServiceCard
                key={`service-${index}`}
                service={service}
                index={index}
                onUpdate={
                  updateService
                }
              />
            )
          )}

        </div>

        {/* =================================================
            BOTTOM SAVE
        ================================================= */}

        <div className="mt-10 flex justify-end">

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className={`rounded-xl px-8 py-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition ${
              saving
                ? "cursor-not-allowed bg-neutral-500"
                : "bg-black hover:bg-neutral-800"
            }`}
          >
            {saving
              ? "SAVING..."
              : "SAVE SERVICES"}
          </button>

        </div>

      </div>

    </div>
  );
};

export default ContentManagement;