import React, { useCallback, useEffect, useMemo, useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// DEFAULT CONTACT DATA — exact values from Contact.jsx (Source of Truth)
const DEFAULT_CONTACT = {
  // 01 HERO
  heroEyebrow: "Let's create something timeless",
  heroHeading: 'Your story',
  heroItalicHeading: 'deserves to be felt.',
  heroDescription:
    "Tell us about your wedding, pre-wedding session, celebration or creative project. We'd love to hear what you're planning.",
  heroButtonText: 'Start a Conversation',
  heroButtonHref: '#contact-form',

  // 02 INTRO
  introEyebrow: 'Get In Touch',
  introHeadingLine1: "Let's talk",
  introHeadingLine2: 'about',
  introHeadingItalic: 'your story.',
  introSubheading: 'Every beautiful photograph begins with a simple conversation.',
  introDescription:
    "Whether you're planning a wedding, pre-wedding shoot, maternity session, birthday celebration or family portrait, we'd love to know what you're imagining.",
  introEmailLabel: 'Email',
  introCallLabel: 'Call',
  introWhatsAppLabel: 'WhatsApp',

  // 03 FORM
  formEyebrow: 'Enquiry',
  formHeadingNormal: 'Tell us about',
  formHeadingItalic: 'your plans.',
  formNameLabel: 'Name *',
  formNamePlaceholder: 'Your name',
  formEmailLabel: 'Email *',
  formEmailPlaceholder: 'you@example.com',
  formPhoneLabel: 'Phone',
  formPhonePlaceholder: '+91',
  formServiceLabel: 'Service *',
  formServicePlaceholder: 'Select service',
  formServiceOptions: [
    'Wedding & Cinematography',
    'Pre-Wedding',
    'Engagement',
    'Other',
  ],
  formOtherServiceLabel: 'Please specify *',
  formOtherServicePlaceholder: 'Type your service here',
  formStartDateLabel: 'Start Date',
  formEndDateLabel: 'End Date',
  formLocationLabel: 'Location',
  formLocationPlaceholder: 'City / Venue',
  formMessageLabel: 'Tell us about it',
  formMessagePlaceholder: 'Tell us about your wedding, vision, location...',
  formButtonText: 'Send Enquiry',

  // 04 STUDIO & LOCATION
  studioEyebrow: 'Studio',
  studioHeadingNormal: 'Find us',
  studioHeadingItalic: 'here.',
  studioDescription:
    'SAN Photography is available for weddings, pre-weddings, maternity, birthdays, kids, family portraits and special celebrations.',
  studioName: 'SAN Photography',
  address: 'Nagpur, Maharashtra, India',
  phone: '9359338557',
  email: 'sancompany0@gmail.com',
  whatsapp: '9359338557',
  instagramLabel: '@ni3cinema',
  instagramUrl: 'https://instagram.com/ni3cinema',
  youtubeLabel: 'NI3 Cinema',
  youtubeUrl: 'https://youtube.com',
  workingHours: '',
  googleMapsUrl: '',

  // 05 FINAL CTA
  ctaEyebrow: 'SAN Photography',
  ctaHeadingNormal: 'Your next chapter',
  ctaHeadingItalic: 'starts here.',
  ctaButtonText: 'Begin Your Enquiry',
  ctaButtonHref: '#contact-form',
};

type ContactContent = typeof DEFAULT_CONTACT;

const deepClone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

function mergeContact(saved: Partial<ContactContent> = {}): ContactContent {
  if (!saved || typeof saved !== 'object') return deepClone(DEFAULT_CONTACT);
  const base = deepClone(DEFAULT_CONTACT);
  return {
    ...base,
    heroEyebrow: saved.heroEyebrow ?? base.heroEyebrow,
    heroHeading: saved.heroHeading ?? base.heroHeading,
    heroItalicHeading: saved.heroItalicHeading ?? base.heroItalicHeading,
    heroDescription: saved.heroDescription ?? base.heroDescription,
    heroButtonText: saved.heroButtonText ?? base.heroButtonText,
    heroButtonHref: saved.heroButtonHref ?? base.heroButtonHref,

    introEyebrow: saved.introEyebrow ?? base.introEyebrow,
    introHeadingLine1: saved.introHeadingLine1 ?? base.introHeadingLine1,
    introHeadingLine2: saved.introHeadingLine2 ?? base.introHeadingLine2,
    introHeadingItalic: saved.introHeadingItalic ?? base.introHeadingItalic,
    introSubheading: saved.introSubheading ?? base.introSubheading,
    introDescription: saved.introDescription ?? base.introDescription,
    introEmailLabel: saved.introEmailLabel ?? base.introEmailLabel,
    introCallLabel: saved.introCallLabel ?? base.introCallLabel,
    introWhatsAppLabel: saved.introWhatsAppLabel ?? base.introWhatsAppLabel,

    formEyebrow: saved.formEyebrow ?? base.formEyebrow,
    formHeadingNormal: saved.formHeadingNormal ?? base.formHeadingNormal,
    formHeadingItalic: saved.formHeadingItalic ?? base.formHeadingItalic,
    formNameLabel: saved.formNameLabel ?? base.formNameLabel,
    formNamePlaceholder: saved.formNamePlaceholder ?? base.formNamePlaceholder,
    formEmailLabel: saved.formEmailLabel ?? base.formEmailLabel,
    formEmailPlaceholder: saved.formEmailPlaceholder ?? base.formEmailPlaceholder,
    formPhoneLabel: saved.formPhoneLabel ?? base.formPhoneLabel,
    formPhonePlaceholder: saved.formPhonePlaceholder ?? base.formPhonePlaceholder,
    formServiceLabel: saved.formServiceLabel ?? base.formServiceLabel,
    formServicePlaceholder: saved.formServicePlaceholder ?? base.formServicePlaceholder,
    formServiceOptions:
      Array.isArray(saved.formServiceOptions) && saved.formServiceOptions.length > 0
        ? saved.formServiceOptions
        : base.formServiceOptions,
    formOtherServiceLabel: saved.formOtherServiceLabel ?? base.formOtherServiceLabel,
    formOtherServicePlaceholder: saved.formOtherServicePlaceholder ?? base.formOtherServicePlaceholder,
    formStartDateLabel: saved.formStartDateLabel ?? base.formStartDateLabel,
    formEndDateLabel: saved.formEndDateLabel ?? base.formEndDateLabel,
    formLocationLabel: saved.formLocationLabel ?? base.formLocationLabel,
    formLocationPlaceholder: saved.formLocationPlaceholder ?? base.formLocationPlaceholder,
    formMessageLabel: saved.formMessageLabel ?? base.formMessageLabel,
    formMessagePlaceholder: saved.formMessagePlaceholder ?? base.formMessagePlaceholder,
    formButtonText: saved.formButtonText ?? base.formButtonText,

    studioEyebrow: saved.studioEyebrow ?? base.studioEyebrow,
    studioHeadingNormal: saved.studioHeadingNormal ?? base.studioHeadingNormal,
    studioHeadingItalic: saved.studioHeadingItalic ?? base.studioHeadingItalic,
    studioDescription: saved.studioDescription ?? base.studioDescription,
    studioName: saved.studioName || base.studioName,
    address: saved.address || base.address,
    phone: saved.phone || base.phone,
    email: saved.email || base.email,
    whatsapp: saved.whatsapp || base.whatsapp,
    instagramLabel: saved.instagramLabel ?? base.instagramLabel,
    instagramUrl: saved.instagramUrl ?? base.instagramUrl,
    youtubeLabel: saved.youtubeLabel ?? base.youtubeLabel,
    youtubeUrl: saved.youtubeUrl ?? base.youtubeUrl,
    workingHours: saved.workingHours ?? base.workingHours,
    googleMapsUrl: saved.googleMapsUrl ?? base.googleMapsUrl,

    ctaEyebrow: saved.ctaEyebrow ?? base.ctaEyebrow,
    ctaHeadingNormal: saved.ctaHeadingNormal ?? base.ctaHeadingNormal,
    ctaHeadingItalic: saved.ctaHeadingItalic ?? base.ctaHeadingItalic,
    ctaButtonText: saved.ctaButtonText ?? base.ctaButtonText,
    ctaButtonHref: saved.ctaButtonHref ?? base.ctaButtonHref,
  };
}

// FORM FIELD COMPONENT
function Field({ label, value, onChange, textarea = false, placeholder = '', rows = 4 }: { label: string; value: string; onChange: (value: string) => void; textarea?: boolean; placeholder?: string; rows?: number }) {
  return (
    <div className="w-full">
      <label className="mb-2 block text-[9px] font-semibold uppercase tracking-[0.3em] text-[#927344]">
        {label}
      </label>
      {textarea ? (
        <textarea
          rows={rows}
          value={value ?? ''}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="w-full resize-y rounded-xl border border-neutral-200 bg-[#fbfaf7] px-4 py-3.5 text-sm leading-6 text-neutral-800 outline-none transition placeholder:text-neutral-400 focus:border-black focus:ring-1 focus:ring-black"
        />
      ) : (
        <input
          type="text"
          value={value ?? ''}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border border-neutral-200 bg-[#fbfaf7] px-4 py-3.5 text-sm leading-6 text-neutral-800 outline-none transition placeholder:text-neutral-400 focus:border-black focus:ring-1 focus:ring-black"
        />
      )}
    </div>
  );
}

// SECTION CARD CONTAINER
function SectionCard({ number, title, description, children }: { number: number; title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="mb-6 overflow-hidden rounded-2xl border border-black/[0.07] bg-white shadow-[0_8px_30px_rgba(0,0,0,0.025)] sm:mb-8">
      <div className="border-b border-black/[0.07] bg-[#fbfaf7] px-5 py-5 sm:px-8 sm:py-6">
        <div className="flex items-start gap-3.5 sm:gap-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black text-[10px] font-medium text-white">
            {String(number).padStart(2, '0')}
          </div>
          <div className="min-w-0">
            <p className="text-[9px] uppercase tracking-[0.35em] text-[#a18764]">
              SECTION {String(number).padStart(2, '0')}
            </p>
            <h2 className="mt-1 text-2xl font-light tracking-[-0.03em] text-neutral-900 sm:text-3xl">
              {title}
            </h2>
            {description && (
              <p className="mt-2 max-w-3xl text-xs leading-5 text-neutral-500 sm:text-sm sm:leading-6">
                {description}
              </p>
            )}
          </div>
        </div>
      </div>
      <div className="p-5 sm:p-8">{children}</div>
    </section>
  );
}

const ContactManagement = () => {
  const [contact, setContact] = useState<ContactContent>(deepClone(DEFAULT_CONTACT));
  const [original, setOriginal] = useState<ContactContent>(deepClone(DEFAULT_CONTACT));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [errMsg, setErrMsg] = useState('');

  // Drag & drop state for formServiceOptions
  const [draggedOptionIndex, setDraggedOptionIndex] = useState<number | null>(null);
  const [dragOverOptionIndex, setDragOverOptionIndex] = useState<number | null>(null);

  const hasChanges = useMemo(
    () => JSON.stringify(contact) !== JSON.stringify(original),
    [contact, original]
  );

  const fetchContact = useCallback(async () => {
    try {
      setLoading(true);
      setErrMsg('');
      setSaveMsg('');
      const res = await fetch(`${API_BASE_URL}/api/contact.php`);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Fetch failed.');
      const contactData = data.contact || data.data || data.content?.contact;
      const merged = mergeContact(contactData);
      setContact(merged);
      setOriginal(deepClone(merged));
    } catch (err) {
      console.error(err);
      setErrMsg(err instanceof Error ? err.message : 'Failed to load Contact content.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContact();
  }, [fetchContact]);

  const set = (field: keyof ContactContent, value: string | string[]) => {
    setContact((prev) => ({ ...prev, [field]: value }));
    setSaveMsg('');
  };

  // Service Option array helpers
  const setOptionValue = (index: number, value: string) => {
    setContact((prev) => {
      const opts = [...prev.formServiceOptions];
      opts[index] = value;
      return { ...prev, formServiceOptions: opts };
    });
    setSaveMsg('');
  };

  const addOption = () => {
    setContact((prev) => ({
      ...prev,
      formServiceOptions: [...prev.formServiceOptions, 'New Service Option'],
    }));
  };

  const removeOption = (index: number) => {
    setContact((prev) => ({
      ...prev,
      formServiceOptions: prev.formServiceOptions.filter((_, i) => i !== index),
    }));
  };

  const moveOption = (index: number, dir: number) => {
    setContact((prev) => {
      const opts = [...prev.formServiceOptions];
      const to = index + dir;
      if (to < 0 || to >= opts.length) return prev;
      [opts[index], opts[to]] = [opts[to], opts[index]];
      return { ...prev, formServiceOptions: opts };
    });
  };

  const handleOptionDrop = (targetIndex: number | null) => {
    if (draggedOptionIndex === null || draggedOptionIndex === targetIndex || targetIndex === null) {
      setDraggedOptionIndex(null);
      setDragOverOptionIndex(null);
      return;
    }
    setContact((prev) => {
      const opts = [...prev.formServiceOptions];
      const [moved] = opts.splice(draggedOptionIndex, 1);
      opts.splice(targetIndex, 0, moved);
      return { ...prev, formServiceOptions: opts };
    });
    setDraggedOptionIndex(null);
    setDragOverOptionIndex(null);
  };

  const handleSave = async () => {
    if (!hasChanges) {
      setSaveMsg('No changes to save.');
      return;
    }
    try {
      setSaving(true);
      setSaveMsg('');
      setErrMsg('');

      const token = localStorage.getItem('adminToken');
      if (!token) {
        throw new Error('Admin session not found. Please login again.');
      }

      const res = await fetch(`${API_BASE_URL}/api/contact.php`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: { contact } }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Save failed.');
      const saved = mergeContact(data.contact || data.data || data.content?.contact || contact);
      setContact(saved);
      setOriginal(deepClone(saved));
      setSaveMsg('Contact page saved successfully.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: unknown) {
      console.error(err);
      setErrMsg(err instanceof Error ? err.message : 'Failed to save Contact content.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (!hasChanges) return;
    if (!window.confirm('Discard all unsaved changes?')) return;
    setContact(deepClone(original));
    setSaveMsg('');
    setErrMsg('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] bg-[#f6f2ea] p-5 sm:p-8">
        <div className="mx-auto max-w-[1200px]">
          <div className="animate-pulse space-y-4">
            <div className="h-3 w-24 rounded bg-neutral-200" />
            <div className="h-10 w-72 rounded bg-neutral-200" />
            <div className="h-4 w-96 max-w-full rounded bg-neutral-200" />
            <div className="mt-10 h-80 rounded-2xl bg-neutral-200" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f2ea] pb-28">
      {/* PAGE HEADER */}
      <div className="border-b border-neutral-200 bg-[#fbfaf7]">
        <div className="mx-auto max-w-[1200px] px-5 py-7 sm:px-8 sm:py-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[9px] font-medium uppercase tracking-[0.4em] text-[#a18764]">
                CONTACT PAGE
              </p>
              <h1 className="mt-2 text-4xl font-light tracking-[-0.05em] text-neutral-900 sm:text-5xl lg:text-6xl">
                Contact Page Management
              </h1>
              <p className="mt-3 max-w-2xl text-xs leading-5 text-neutral-500 sm:text-sm sm:leading-6">
                Manage every editable section of the Contact page in the exact serial order it appears on the website.
              </p>
            </div>
            <div className="flex w-full gap-3 sm:w-auto">
              {hasChanges && (
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={saving}
                  className="flex-1 rounded-xl border border-neutral-300 bg-white px-5 py-3.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-neutral-700 transition hover:bg-neutral-100 disabled:opacity-50 sm:flex-none"
                >
                  Reset
                </button>
              )}
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !hasChanges}
                className={`flex-1 rounded-xl px-6 py-3.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-white transition sm:flex-none ${
                  saving || !hasChanges
                    ? 'cursor-not-allowed bg-neutral-400'
                    : 'bg-black hover:bg-neutral-800'
                }`}
              >
                {saving ? 'Saving...' : hasChanges ? 'Save Changes' : 'Saved'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <main className="mx-auto max-w-[1200px] px-5 py-7 sm:px-8 sm:py-10">
        {saveMsg && (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3.5 text-xs leading-5 text-green-700 sm:mb-8 sm:px-5">
            ✓ {saveMsg}
          </div>
        )}
        {errMsg && (
          <div className="mb-6 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-xs leading-5 text-red-700 sm:mb-8 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <span>{errMsg}</span>
            <button
              type="button"
              onClick={fetchContact}
              className="self-start rounded-lg bg-white px-3 py-2 text-[9px] font-semibold uppercase tracking-[0.2em] text-red-600 sm:self-auto"
            >
              Retry
            </button>
          </div>
        )}

        {/* SECTION 01 - HERO */}
        <SectionCard
          number={1}
          title="Hero Section"
          description="The top hero banner of the Contact page with eyebrow, main heading, italic emphasis, description, and primary CTA button."
        >
          <div className="space-y-6">
            <Field
              label="Eyebrow Text"
              value={contact.heroEyebrow}
              onChange={(v) => set('heroEyebrow', v)}
              placeholder="Let's create something timeless"
            />
            <div className="grid gap-5 md:grid-cols-2">
              <Field
                label="Main Heading (Normal)"
                value={contact.heroHeading}
                onChange={(v) => set('heroHeading', v)}
                placeholder="Your story"
              />
              <Field
                label="Heading Line 2 (Italic)"
                value={contact.heroItalicHeading}
                onChange={(v) => set('heroItalicHeading', v)}
                placeholder="deserves to be felt."
              />
            </div>
            <Field
              label="Description Paragraph"
              value={contact.heroDescription}
              onChange={(v) => set('heroDescription', v)}
              textarea
              rows={3}
              placeholder="Tell us about your wedding, pre-wedding session..."
            />
            <div className="grid gap-5 md:grid-cols-2">
              <Field
                label="Button Text"
                value={contact.heroButtonText}
                onChange={(v) => set('heroButtonText', v)}
                placeholder="Start a Conversation"
              />
              <Field
                label="Button Link / Target Anchor"
                value={contact.heroButtonHref}
                onChange={(v) => set('heroButtonHref', v)}
                placeholder="#contact-form"
              />
            </div>

            {/* LIVE PREVIEW */}
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-6 text-center">
              <p className="text-[9px] uppercase tracking-[0.45em] text-[#171717]">
                {contact.heroEyebrow}
              </p>
              <h3 className="mt-4 text-3xl sm:text-4xl font-light leading-tight tracking-[-0.04em] text-[#171717]">
                {contact.heroHeading} <span className="block italic">{contact.heroItalicHeading}</span>
              </h3>
              <p className="mx-auto mt-4 max-w-xl text-xs sm:text-sm leading-6 text-[#171717]">
                {contact.heroDescription}
              </p>
              <div className="mt-6 inline-block bg-[#171717] px-6 py-3 text-[9px] font-semibold uppercase tracking-[0.3em] text-white">
                {contact.heroButtonText}
              </div>
            </div>
          </div>
        </SectionCard>

        {/* SECTION 02 - INTRO */}
        <SectionCard
          number={2}
          title="Intro Section"
          description="The two-column narrative section with section title, large typography, explanatory description, and direct contact action links."
        >
          <div className="space-y-6">
            <Field
              label="Eyebrow Text"
              value={contact.introEyebrow}
              onChange={(v) => set('introEyebrow', v)}
              placeholder="Get In Touch"
            />
            <div className="grid gap-5 md:grid-cols-3">
              <Field
                label="Heading Line 1"
                value={contact.introHeadingLine1}
                onChange={(v) => set('introHeadingLine1', v)}
                placeholder="Let's talk"
              />
              <Field
                label="Heading Line 2"
                value={contact.introHeadingLine2}
                onChange={(v) => set('introHeadingLine2', v)}
                placeholder="about"
              />
              <Field
                label="Heading Line 3 (Italic)"
                value={contact.introHeadingItalic}
                onChange={(v) => set('introHeadingItalic', v)}
                placeholder="your story."
              />
            </div>
            <Field
              label="Subheading / Lead Text"
              value={contact.introSubheading}
              onChange={(v) => set('introSubheading', v)}
              placeholder="Every beautiful photograph begins with a simple conversation."
            />
            <Field
              label="Detailed Description"
              value={contact.introDescription}
              onChange={(v) => set('introDescription', v)}
              textarea
              rows={4}
              placeholder="Whether you're planning a wedding, pre-wedding shoot..."
            />
            <div className="grid gap-5 sm:grid-cols-3">
              <Field
                label="Email Link Label"
                value={contact.introEmailLabel}
                onChange={(v) => set('introEmailLabel', v)}
                placeholder="Email"
              />
              <Field
                label="Call Link Label"
                value={contact.introCallLabel}
                onChange={(v) => set('introCallLabel', v)}
                placeholder="Call"
              />
              <Field
                label="WhatsApp Link Label"
                value={contact.introWhatsAppLabel}
                onChange={(v) => set('introWhatsAppLabel', v)}
                placeholder="WhatsApp"
              />
            </div>
          </div>
        </SectionCard>

        {/* SECTION 03 - FORM & ENQUIRY */}
        <SectionCard
          number={3}
          title="Enquiry Form Settings"
          description="Manage all form headers, input field labels, placeholders, and repeatable service options."
        >
          <div className="space-y-6">
            <Field
              label="Form Eyebrow"
              value={contact.formEyebrow}
              onChange={(v) => set('formEyebrow', v)}
              placeholder="Enquiry"
            />
            <div className="grid gap-5 md:grid-cols-2">
              <Field
                label="Form Heading (Normal)"
                value={contact.formHeadingNormal}
                onChange={(v) => set('formHeadingNormal', v)}
                placeholder="Tell us about"
              />
              <Field
                label="Form Heading (Italic)"
                value={contact.formHeadingItalic}
                onChange={(v) => set('formHeadingItalic', v)}
                placeholder="your plans."
              />
            </div>

            <div className="border-t border-neutral-200 pt-6">
              <h3 className="mb-4 text-sm font-semibold text-neutral-900">Form Field Labels & Placeholders</h3>
              <div className="grid gap-5 md:grid-cols-2">
                <Field
                  label="Name Field Label"
                  value={contact.formNameLabel}
                  onChange={(v) => set('formNameLabel', v)}
                  placeholder="Name *"
                />
                <Field
                  label="Name Placeholder"
                  value={contact.formNamePlaceholder}
                  onChange={(v) => set('formNamePlaceholder', v)}
                  placeholder="Your name"
                />
                <Field
                  label="Email Field Label"
                  value={contact.formEmailLabel}
                  onChange={(v) => set('formEmailLabel', v)}
                  placeholder="Email *"
                />
                <Field
                  label="Email Placeholder"
                  value={contact.formEmailPlaceholder}
                  onChange={(v) => set('formEmailPlaceholder', v)}
                  placeholder="you@example.com"
                />
                <Field
                  label="Phone Field Label"
                  value={contact.formPhoneLabel}
                  onChange={(v) => set('formPhoneLabel', v)}
                  placeholder="Phone"
                />
                <Field
                  label="Phone Placeholder"
                  value={contact.formPhonePlaceholder}
                  onChange={(v) => set('formPhonePlaceholder', v)}
                  placeholder="+91"
                />
                <Field
                  label="Service Dropdown Label"
                  value={contact.formServiceLabel}
                  onChange={(v) => set('formServiceLabel', v)}
                  placeholder="Service *"
                />
                <Field
                  label="Service Default Option"
                  value={contact.formServicePlaceholder}
                  onChange={(v) => set('formServicePlaceholder', v)}
                  placeholder="Select service"
                />
              </div>
            </div>

            {/* REPEATABLE SERVICE OPTIONS */}
            <div className="rounded-2xl border border-neutral-200 bg-[#fbfaf7] p-5 sm:p-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#927344]">
                    Service Dropdown Options ({contact.formServiceOptions?.length || 0})
                  </h4>
                  <p className="mt-1 text-xs text-neutral-500">
                    Drag and drop to reorder. Options will dynamically populate the Contact form service dropdown.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addOption}
                  className="rounded-xl bg-black px-4 py-2 text-[9px] font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-neutral-800"
                >
                  + Add Service Option
                </button>
              </div>

              <div className="space-y-3">
                {contact.formServiceOptions?.map((opt, idx) => {
                  const isDragging = draggedOptionIndex === idx;
                  const isOver = dragOverOptionIndex === idx;
                  return (
                    <div
                      key={idx}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', String(idx));
                        setDraggedOptionIndex(idx);
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        if (dragOverOptionIndex !== idx) setDragOverOptionIndex(idx);
                      }}
                      onDragLeave={() => {
                        if (dragOverOptionIndex === idx) setDragOverOptionIndex(null);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        handleOptionDrop(idx);
                      }}
                      onDragEnd={() => {
                        setDraggedOptionIndex(null);
                        setDragOverOptionIndex(null);
                      }}
                      className={`flex cursor-grab items-center gap-3 rounded-xl border bg-white p-3 shadow-sm transition active:cursor-grabbing ${
                        isDragging
                          ? 'opacity-40 ring-2 ring-black'
                          : isOver
                          ? 'border-black bg-neutral-100 ring-2 ring-black'
                          : 'border-neutral-200'
                      }`}
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-[10px] font-mono text-neutral-600">
                        {idx + 1}
                      </span>
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => setOptionValue(idx, e.target.value)}
                        className="min-w-0 flex-1 rounded-lg border border-neutral-200 bg-[#fbfaf7] px-3 py-2 text-sm text-neutral-800 outline-none focus:border-black"
                      />
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => moveOption(idx, -1)}
                          disabled={idx === 0}
                          className="rounded-lg border border-neutral-200 px-2 py-1 text-[9px] font-semibold uppercase text-neutral-600 hover:bg-neutral-100 disabled:opacity-40"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => moveOption(idx, 1)}
                          disabled={idx === (contact.formServiceOptions?.length || 1) - 1}
                          className="rounded-lg border border-neutral-200 px-2 py-1 text-[9px] font-semibold uppercase text-neutral-600 hover:bg-neutral-100 disabled:opacity-40"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={() => removeOption(idx)}
                          className="rounded-lg px-2.5 py-1 text-[9px] font-semibold uppercase text-red-500 hover:bg-red-50"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <Field
                label="Custom 'Other' Service Label"
                value={contact.formOtherServiceLabel}
                onChange={(v) => set('formOtherServiceLabel', v)}
                placeholder="Please specify *"
              />
              <Field
                label="Custom 'Other' Service Placeholder"
                value={contact.formOtherServicePlaceholder}
                onChange={(v) => set('formOtherServicePlaceholder', v)}
                placeholder="Type your service here"
              />
              <Field
                label="Start Date Label"
                value={contact.formStartDateLabel}
                onChange={(v) => set('formStartDateLabel', v)}
                placeholder="Start Date"
              />
              <Field
                label="End Date Label"
                value={contact.formEndDateLabel}
                onChange={(v) => set('formEndDateLabel', v)}
                placeholder="End Date"
              />
              <Field
                label="Location Field Label"
                value={contact.formLocationLabel}
                onChange={(v) => set('formLocationLabel', v)}
                placeholder="Location"
              />
              <Field
                label="Location Placeholder"
                value={contact.formLocationPlaceholder}
                onChange={(v) => set('formLocationPlaceholder', v)}
                placeholder="City / Venue"
              />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <Field
                label="Message Field Label"
                value={contact.formMessageLabel}
                onChange={(v) => set('formMessageLabel', v)}
                placeholder="Tell us about it"
              />
              <Field
                label="Message Placeholder"
                value={contact.formMessagePlaceholder}
                onChange={(v) => set('formMessagePlaceholder', v)}
                placeholder="Tell us about your wedding, vision, location..."
              />
            </div>

            <Field
              label="Form Submit Button Text"
              value={contact.formButtonText}
              onChange={(v) => set('formButtonText', v)}
              placeholder="Send Enquiry"
            />
          </div>
        </SectionCard>

        {/* SECTION 04 - STUDIO & LOCATION */}
        <SectionCard
          number={4}
          title="Studio & Location Details"
          description="Studio headings, full address, direct phone/email/WhatsApp links, social channels, and interactive Google Maps embed."
        >
          <div className="space-y-6">
            <Field
              label="Studio Eyebrow"
              value={contact.studioEyebrow}
              onChange={(v) => set('studioEyebrow', v)}
              placeholder="Studio"
            />
            <div className="grid gap-5 md:grid-cols-2">
              <Field
                label="Heading Normal"
                value={contact.studioHeadingNormal}
                onChange={(v) => set('studioHeadingNormal', v)}
                placeholder="Find us"
              />
              <Field
                label="Heading Italic"
                value={contact.studioHeadingItalic}
                onChange={(v) => set('studioHeadingItalic', v)}
                placeholder="here."
              />
            </div>
            <Field
              label="Studio Description"
              value={contact.studioDescription}
              onChange={(v) => set('studioDescription', v)}
              textarea
              rows={3}
              placeholder="SAN Photography is available for weddings..."
            />

            <div className="border-t border-neutral-200 pt-6">
              <h3 className="mb-4 text-sm font-semibold text-neutral-900">Direct Contact Information</h3>
              <div className="grid gap-5 md:grid-cols-2">
                <Field
                  label="Studio Brand Name"
                  value={contact.studioName}
                  onChange={(v) => set('studioName', v)}
                  placeholder="SAN Photography"
                />
                <Field
                  label="Address"
                  value={contact.address}
                  onChange={(v) => set('address', v)}
                  placeholder="Nagpur, Maharashtra, India"
                />
                <Field
                  label="Phone Number"
                  value={contact.phone}
                  onChange={(v) => set('phone', v)}
                  placeholder="9359338557"
                />
                <Field
                  label="Email Address"
                  value={contact.email}
                  onChange={(v) => set('email', v)}
                  placeholder="sancompany0@gmail.com"
                />
                <Field
                  label="WhatsApp Number"
                  value={contact.whatsapp}
                  onChange={(v) => set('whatsapp', v)}
                  placeholder="9359338557"
                />
                <Field
                  label="Working Hours / Schedule"
                  value={contact.workingHours}
                  onChange={(v) => set('workingHours', v)}
                  placeholder="Mon - Sat: 10:00 AM - 8:00 PM"
                />
              </div>
            </div>

            <div className="border-t border-neutral-200 pt-6">
              <h3 className="mb-4 text-sm font-semibold text-neutral-900">Social Media Channels</h3>
              <div className="grid gap-5 md:grid-cols-2">
                <Field
                  label="Instagram Label"
                  value={contact.instagramLabel}
                  onChange={(v) => set('instagramLabel', v)}
                  placeholder="@ni3cinema"
                />
                <Field
                  label="Instagram URL"
                  value={contact.instagramUrl}
                  onChange={(v) => set('instagramUrl', v)}
                  placeholder="https://instagram.com/ni3cinema"
                />
                <Field
                  label="YouTube Label"
                  value={contact.youtubeLabel}
                  onChange={(v) => set('youtubeLabel', v)}
                  placeholder="NI3 Cinema"
                />
                <Field
                  label="YouTube URL"
                  value={contact.youtubeUrl}
                  onChange={(v) => set('youtubeUrl', v)}
                  placeholder="https://youtube.com"
                />
              </div>
            </div>

            <div className="border-t border-neutral-200 pt-6">
              <Field
                label="Google Maps Embed URL (iframe src)"
                value={contact.googleMapsUrl}
                onChange={(v) => set('googleMapsUrl', v)}
                placeholder="https://www.google.com/maps?q=Nagpur%2C%20Maharashtra%2C%20India&output=embed"
              />
              {contact.googleMapsUrl && (
                <div className="mt-4 overflow-hidden rounded-xl border border-neutral-200">
                  <iframe
                    title="Map Preview"
                    src={contact.googleMapsUrl}
                    className="h-48 w-full border-0 grayscale"
                    loading="lazy"
                  />
                </div>
              )}
            </div>
          </div>
        </SectionCard>

        {/* SECTION 05 - FINAL CTA */}
        <SectionCard
          number={5}
          title="Final CTA Section"
          description="The bottom closing call-to-action banner of the Contact page."
        >
          <div className="space-y-6">
            <Field
              label="Eyebrow"
              value={contact.ctaEyebrow}
              onChange={(v) => set('ctaEyebrow', v)}
              placeholder="SAN Photography"
            />
            <div className="grid gap-5 md:grid-cols-2">
              <Field
                label="Heading Normal"
                value={contact.ctaHeadingNormal}
                onChange={(v) => set('ctaHeadingNormal', v)}
                placeholder="Your next chapter"
              />
              <Field
                label="Heading Italic"
                value={contact.ctaHeadingItalic}
                onChange={(v) => set('ctaHeadingItalic', v)}
                placeholder="starts here."
              />
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              <Field
                label="CTA Link Text"
                value={contact.ctaButtonText}
                onChange={(v) => set('ctaButtonText', v)}
                placeholder="Begin Your Enquiry"
              />
              <Field
                label="CTA Link Anchor / href"
                value={contact.ctaButtonHref}
                onChange={(v) => set('ctaButtonHref', v)}
                placeholder="#contact-form"
              />
            </div>

            {/* PREVIEW */}
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-6 text-center">
              <p className="text-[9px] uppercase tracking-[0.4em] text-[#171717]">
                {contact.ctaEyebrow}
              </p>
              <h3 className="mt-4 text-3xl font-light tracking-[-0.035em] text-[#171717]">
                {contact.ctaHeadingNormal} <span className="block italic">{contact.ctaHeadingItalic}</span>
              </h3>
              <div className="mt-6 inline-block border-b border-[#171717] pb-1 text-[9px] uppercase tracking-[0.3em] text-[#171717]">
                {contact.ctaButtonText} →
              </div>
            </div>
          </div>
        </SectionCard>

        {/* STICKY SAVE BUTTON */}
        <div className="sticky bottom-4 z-30 flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className={`rounded-xl px-8 py-4 text-[9px] font-semibold uppercase tracking-[0.2em] text-white shadow-2xl transition ${
              saving || !hasChanges
                ? 'cursor-not-allowed bg-neutral-400'
                : 'bg-black hover:bg-neutral-800'
            }`}
          >
            {saving ? 'Saving Changes...' : 'Save All Contact Changes'}
          </button>
        </div>
      </main>
    </div>
  );
};

export default ContactManagement;
