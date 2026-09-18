import {
  ArrowRight,
  Mail,
  Phone,
  MapPin,
  MessageCircle,
} from 'lucide-react'

import {
  FaInstagram,
  FaYoutube,
} from 'react-icons/fa'
import { readApiJson } from '../services/api'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import type { ContactFormData } from '../types'

const API_BASE_URL = import.meta.env.VITE_API_URL || ''

/* =========================================================
   DESIGN TOKENS & FONTS
========================================================= */

const ease = [0.22, 1, 0.36, 1] as const
const FONT_DISPLAY = "'Fraunces', 'Iowan Old Style', Georgia, serif"

function useGoogleFonts() {
  useEffect(() => {
    const id = 'san-contact-vogue-fonts'
    if (document.getElementById(id)) return
    const link = document.createElement('link')
    link.id = id
    link.rel = 'stylesheet'
    link.href =
      'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;0,9..144,700;1,9..144,300;1,9..144,400&family=Manrope:wght@300;400;500;600;700;800&display=swap'
    document.head.appendChild(link)
  }, [])
}

/* =========================================================
   DEFAULT CONTACT DATA (Source of Truth)
========================================================= */

const DEFAULT_CONTACT = {
  // 01 FORM
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

  // 02 STUDIO & LOCATION
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

  // 03 INTRO
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
}

/* =========================================================
   CONTACT PAGE
========================================================= */

function Contact() {
  useGoogleFonts()

  const [contactData, setContactData] = useState(DEFAULT_CONTACT)

  /* =======================================================
     FETCH DYNAMIC CONTACT CONTENT FROM API
  ======================================================= */

  useEffect(() => {
    let isMounted = true
    const fetchContent = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/contact.php`)
        const data = await readApiJson(response, 'Contact')

        const remote = data.contact || data.data || data.content?.contact
        if (isMounted && data.success && remote) {
          setContactData({
            formEyebrow: remote.formEyebrow ?? DEFAULT_CONTACT.formEyebrow,
            formHeadingNormal: remote.formHeadingNormal ?? DEFAULT_CONTACT.formHeadingNormal,
            formHeadingItalic: remote.formHeadingItalic ?? DEFAULT_CONTACT.formHeadingItalic,
            formNameLabel: remote.formNameLabel ?? DEFAULT_CONTACT.formNameLabel,
            formNamePlaceholder: remote.formNamePlaceholder ?? DEFAULT_CONTACT.formNamePlaceholder,
            formEmailLabel: remote.formEmailLabel ?? DEFAULT_CONTACT.formEmailLabel,
            formEmailPlaceholder: remote.formEmailPlaceholder ?? DEFAULT_CONTACT.formEmailPlaceholder,
            formPhoneLabel: remote.formPhoneLabel ?? DEFAULT_CONTACT.formPhoneLabel,
            formPhonePlaceholder: remote.formPhonePlaceholder ?? DEFAULT_CONTACT.formPhonePlaceholder,
            formServiceLabel: remote.formServiceLabel ?? DEFAULT_CONTACT.formServiceLabel,
            formServicePlaceholder: remote.formServicePlaceholder ?? DEFAULT_CONTACT.formServicePlaceholder,
            formServiceOptions: Array.isArray(remote.formServiceOptions)
              ? remote.formServiceOptions
              : DEFAULT_CONTACT.formServiceOptions,
            formOtherServiceLabel: remote.formOtherServiceLabel ?? DEFAULT_CONTACT.formOtherServiceLabel,
            formOtherServicePlaceholder: remote.formOtherServicePlaceholder ?? DEFAULT_CONTACT.formOtherServicePlaceholder,
            formStartDateLabel: remote.formStartDateLabel ?? DEFAULT_CONTACT.formStartDateLabel,
            formEndDateLabel: remote.formEndDateLabel ?? DEFAULT_CONTACT.formEndDateLabel,
            formLocationLabel: remote.formLocationLabel ?? DEFAULT_CONTACT.formLocationLabel,
            formLocationPlaceholder: remote.formLocationPlaceholder ?? DEFAULT_CONTACT.formLocationPlaceholder,
            formMessageLabel: remote.formMessageLabel ?? DEFAULT_CONTACT.formMessageLabel,
            formMessagePlaceholder: remote.formMessagePlaceholder ?? DEFAULT_CONTACT.formMessagePlaceholder,
            formButtonText: remote.formButtonText ?? DEFAULT_CONTACT.formButtonText,

            studioEyebrow: remote.studioEyebrow ?? DEFAULT_CONTACT.studioEyebrow,
            studioHeadingNormal: remote.studioHeadingNormal ?? DEFAULT_CONTACT.studioHeadingNormal,
            studioHeadingItalic: remote.studioHeadingItalic ?? DEFAULT_CONTACT.studioHeadingItalic,
            studioDescription: remote.studioDescription ?? DEFAULT_CONTACT.studioDescription,
            studioName: remote.studioName || DEFAULT_CONTACT.studioName,
            address: remote.address || DEFAULT_CONTACT.address,
            phone: remote.phone || DEFAULT_CONTACT.phone,
            email: remote.email || DEFAULT_CONTACT.email,
            whatsapp: remote.whatsapp || DEFAULT_CONTACT.whatsapp,
            instagramLabel: remote.instagramLabel ?? DEFAULT_CONTACT.instagramLabel,
            instagramUrl: remote.instagramUrl ?? DEFAULT_CONTACT.instagramUrl,
            youtubeLabel: remote.youtubeLabel ?? DEFAULT_CONTACT.youtubeLabel,
            youtubeUrl: remote.youtubeUrl ?? DEFAULT_CONTACT.youtubeUrl,
            workingHours: remote.workingHours ?? DEFAULT_CONTACT.workingHours,
            googleMapsUrl: remote.googleMapsUrl ?? DEFAULT_CONTACT.googleMapsUrl,

            introEyebrow: remote.introEyebrow ?? DEFAULT_CONTACT.introEyebrow,
            introHeadingLine1: remote.introHeadingLine1 ?? DEFAULT_CONTACT.introHeadingLine1,
            introHeadingLine2: remote.introHeadingLine2 ?? DEFAULT_CONTACT.introHeadingLine2,
            introHeadingItalic: remote.introHeadingItalic ?? DEFAULT_CONTACT.introHeadingItalic,
            introSubheading: remote.introSubheading ?? DEFAULT_CONTACT.introSubheading,
            introDescription: remote.introDescription ?? DEFAULT_CONTACT.introDescription,
            introEmailLabel: remote.introEmailLabel ?? DEFAULT_CONTACT.introEmailLabel,
            introCallLabel: remote.introCallLabel ?? DEFAULT_CONTACT.introCallLabel,
            introWhatsAppLabel: remote.introWhatsAppLabel ?? DEFAULT_CONTACT.introWhatsAppLabel,
          })
        }
      } catch (error) {
        console.error('Failed to fetch contact content:', error)
      }
    }

    fetchContent()
    return () => {
      isMounted = false
    }
  }, [])

  /* =======================================================
     FORM DATA
  ======================================================= */

  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    phone: '',
    service: '',
    otherService: '',
    startDate: '',
    endDate: '',
    location: '',
    message: '',
  })

  /* =======================================================
     DESTRUCTURED CONTENT
  ======================================================= */

  const {
    formEyebrow,
    formHeadingNormal,
    formHeadingItalic,
    formNameLabel,
    formNamePlaceholder,
    formEmailLabel,
    formEmailPlaceholder,
    formPhoneLabel,
    formPhonePlaceholder,
    formServiceLabel,
    formServicePlaceholder,
    formServiceOptions,
    formOtherServiceLabel,
    formOtherServicePlaceholder,
    formStartDateLabel,
    formEndDateLabel,
    formLocationLabel,
    formLocationPlaceholder,
    formMessageLabel,
    formMessagePlaceholder,
    formButtonText,

    studioEyebrow,
    studioHeadingNormal,
    studioHeadingItalic,
    studioDescription,
    studioName,
    address,
    phone,
    email,
    whatsapp,
    instagramLabel,
    instagramUrl,
    youtubeLabel,
    youtubeUrl,
    workingHours,
    googleMapsUrl,

    introEyebrow,
    introHeadingLine1,
    introHeadingLine2,
    introHeadingItalic,
    introSubheading,
    introDescription,
    introEmailLabel,
    introCallLabel,
    introWhatsAppLabel,
  } = contactData

  /* =======================================================
     URLS
  ======================================================= */

  const mapUrl =
    googleMapsUrl ||
    'https://www.google.com/maps?q=Nagpur%2C%20Maharashtra%2C%20India&output=embed'

  const phoneUrl = `tel:+91${phone}`
  const emailUrl = `mailto:${email}`
  // Normalize WhatsApp number: strip non-digits, ensure 91 prefix for 10-digit Indian numbers
  const rawWhatsapp = (whatsapp || phone || '9359338557').replace(/\D/g, '')
  const normalizedWhatsapp = rawWhatsapp.length === 10 ? `91${rawWhatsapp}` : rawWhatsapp
  const whatsappUrl = normalizedWhatsapp ? `https://wa.me/${normalizedWhatsapp}` : '#'

  /* =======================================================
     INPUT CHANGE & SUBMIT
  ======================================================= */

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // Validate required fields
    if (!formData.name?.trim()) {
      alert('Please enter your name.')
      return
    }
    if (!formData.email?.trim() && !formData.phone?.trim()) {
      alert('Please provide your phone number or email address.')
      return
    }

    // Combine service if 'Other' is selected
    const finalService = formData.service === 'Other' ? formData.otherService : formData.service

    const messageLines = [
      'Hello SAN Photography,',
      '',
      'I would like to make an enquiry.',
      '',
      `Name: ${formData.name.trim()}`,
      formData.phone?.trim() ? `Phone: ${formData.phone.trim()}` : null,
      formData.email?.trim() ? `Email: ${formData.email.trim()}` : null,
      finalService ? `Service: ${finalService}` : null,
      formData.startDate ? `Start Date: ${formData.startDate}` : null,
      formData.endDate ? `End Date: ${formData.endDate}` : null,
      formData.location?.trim() ? `Location: ${formData.location.trim()}` : null,
      '',
      formData.message?.trim() ? `Message:\n${formData.message.trim()}` : null,
      '',
      'Thank you.'
    ].filter(line => line !== null).join('\n')

    const enquiryUrl = `https://wa.me/${normalizedWhatsapp}?text=${encodeURIComponent(messageLines)}`

    window.open(enquiryUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    // Changed background to a very light off-white (#F9F7F2)
    <main className="min-h-screen bg-[#F9F7F2] text-[#171717]" style={{ fontFamily: FONT_DISPLAY }}>

      {/* =====================================================
          01 FORM + LOCATION (Increased top padding slightly)
      ===================================================== */}
      <section id="contact-form" className="border-t border-black/10">
        {/* Increased pt slightly to push 1 tab down from navbar */}
        <div className="mx-auto max-w-6xl px-4 pt-28 pb-8 sm:px-6 sm:pt-32 sm:pb-10 lg:px-8 lg:pt-36 lg:pb-12">
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">

            {/* FORM */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.9, ease }}
            >
              <p className="text-[9px] uppercase tracking-[0.4em] text-[#171717]">{formEyebrow}</p>
              <h2 className="mt-2 text-xl font-light tracking-[-0.04em] sm:text-2xl text-[#171717]">
                {formHeadingNormal} <span className="italic">{formHeadingItalic}</span>
              </h2>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">

                {/* NAME + EMAIL */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="name" className="mb-1.5 block text-[9px] uppercase tracking-[0.3em] text-[#171717]">{formNameLabel}</label>
                    <input
                      id="name" name="name" type="text" required
                      value={formData.name} onChange={handleChange}
                      placeholder={formNamePlaceholder}
                      className="w-full border-b border-black/20 bg-transparent py-1.5 text-sm outline-none placeholder:text-[#171717]/40 focus:border-[#171717]"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="mb-1.5 block text-[9px] uppercase tracking-[0.3em] text-[#171717]">{formEmailLabel}</label>
                    <input
                      id="email" name="email" type="email" required
                      value={formData.email} onChange={handleChange}
                      placeholder={formEmailPlaceholder}
                      className="w-full border-b border-black/20 bg-transparent py-1.5 text-sm outline-none placeholder:text-[#171717]/40 focus:border-[#171717]"
                    />
                  </div>
                </div>

                {/* PHONE + SERVICE */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="phone" className="mb-1.5 block text-[9px] uppercase tracking-[0.3em] text-[#171717]">{formPhoneLabel}</label>
                    <input
                      id="phone" name="phone" type="tel"
                      value={formData.phone} onChange={handleChange}
                      placeholder={formPhonePlaceholder}
                      className="w-full border-b border-black/20 bg-transparent py-1.5 text-sm outline-none placeholder:text-[#171717]/40 focus:border-[#171717]"
                    />
                  </div>
                  <div>
                    <label htmlFor="service" className="mb-1.5 block text-[9px] uppercase tracking-[0.3em] text-[#171717]">{formServiceLabel}</label>
                    <select
                      id="service" name="service" required
                      value={formData.service} onChange={handleChange}
                      className="w-full border-b border-black/20 bg-transparent py-1.5 text-sm outline-none focus:border-[#171717]"
                    >
                      <option value="">{formServicePlaceholder}</option>
                      {formServiceOptions?.map((opt, i) => (
                        <option key={i} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* CONDITIONAL OTHER SERVICE INPUT */}
                {formData.service === 'Other' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ duration: 0.3, ease }}
                  >
                    <label htmlFor="otherService" className="mb-1.5 block text-[9px] uppercase tracking-[0.3em] text-[#171717]">
                      {formOtherServiceLabel}
                    </label>
                    <input
                      id="otherService"
                      name="otherService"
                      type="text"
                      required={formData.service === 'Other'}
                      value={formData.otherService}
                      onChange={handleChange}
                      placeholder={formOtherServicePlaceholder}
                      className="w-full border-b border-black/20 bg-transparent py-1.5 text-sm outline-none placeholder:text-[#171717]/40 focus:border-[#171717]"
                    />
                  </motion.div>
                )}

                {/* START DATE + END DATE */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="startDate" className="mb-1.5 block text-[9px] uppercase tracking-[0.3em] text-[#171717]">{formStartDateLabel}</label>
                    <input
                      id="startDate" name="startDate" type="date"
                      value={formData.startDate} onChange={handleChange}
                      className="w-full border-b border-black/20 bg-transparent py-1.5 text-sm outline-none focus:border-[#171717]"
                    />
                  </div>
                  <div>
                    <label htmlFor="endDate" className="mb-1.5 block text-[9px] uppercase tracking-[0.3em] text-[#171717]">{formEndDateLabel}</label>
                    <input
                      id="endDate" name="endDate" type="date"
                      value={formData.endDate} onChange={handleChange}
                      className="w-full border-b border-black/20 bg-transparent py-1.5 text-sm outline-none focus:border-[#171717]"
                    />
                  </div>
                </div>

                {/* LOCATION */}
                <div>
                  <label htmlFor="location" className="mb-1.5 block text-[9px] uppercase tracking-[0.3em] text-[#171717]">{formLocationLabel}</label>
                  <input
                    id="location" name="location" type="text"
                    value={formData.location} onChange={handleChange}
                    placeholder={formLocationPlaceholder}
                    className="w-full border-b border-black/20 bg-transparent py-1.5 text-sm outline-none placeholder:text-[#171717]/40 focus:border-[#171717]"
                  />
                </div>

                {/* MESSAGE */}
                <div>
                  <label htmlFor="message" className="mb-1.5 block text-[9px] uppercase tracking-[0.3em] text-[#171717]">{formMessageLabel}</label>
                  <textarea
                    id="message" name="message" rows={3}
                    value={formData.message} onChange={handleChange}
                    placeholder={formMessagePlaceholder}
                    className="w-full resize-none border-b border-black/20 bg-transparent py-1.5 text-sm leading-5 outline-none placeholder:text-[#171717]/40 focus:border-[#171717]"
                  />
                </div>

                {/* SUBMIT */}
                <button
                  type="submit"
                  className="group inline-flex items-center gap-3 bg-[#171717] px-6 py-2.5 text-[9px] font-semibold uppercase tracking-[0.3em] text-white transition-all duration-300 hover:bg-[#171717]/80"
                >
                  {formButtonText}
                  <ArrowRight size={13} className="transition-transform duration-300 group-hover:translate-x-1" />
                </button>
              </form>
            </motion.div>

            {/* LOCATION / STUDIO */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.9, ease }}
            >
              <p className="text-[9px] uppercase tracking-[0.4em] text-[#171717]">{studioEyebrow}</p>
              <h3 className="mt-2 text-xl font-light tracking-[-0.04em] sm:text-2xl text-[#171717]">
                {studioHeadingNormal} <span className="italic">{studioHeadingItalic}</span>
              </h3>

              <p className="mt-3 max-w-sm text-xs leading-5 text-[#171717] sm:text-sm sm:leading-6">
                {studioDescription}
              </p>

              {/* GOOGLE MAP */}
              <div className="mt-5 overflow-hidden border border-black/10">
                <iframe
                  title="SAN Photography Location"
                  src={mapUrl}
                  className="h-[160px] w-full border-0 grayscale sm:h-[200px]"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>

              {/* CONTACT DETAILS */}
              <div className="mt-5 space-y-3">

                <div className="flex items-start gap-2.5 text-[#171717]">
                  <MapPin size={15} strokeWidth={1.2} className="mt-0.5" />
                  <div>
                    <p className="text-xs sm:text-sm">{studioName}</p>
                    <p className="mt-0.5 text-xs text-[#171717] sm:text-sm">
                      {address}
                    </p>
                  </div>
                </div>

                <a href={emailUrl} className="flex items-center gap-2.5 text-xs text-[#171717] transition-colors hover:text-[#171717]/70 sm:text-sm">
                  <Mail size={15} strokeWidth={1.2} />
                  {email}
                </a>

                <a href={phoneUrl} className="flex items-center gap-2.5 text-xs text-[#171717] transition-colors hover:text-[#171717]/70 sm:text-sm">
                  <Phone size={15} strokeWidth={1.2} />
                  +91 {phone}
                </a>

                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 text-xs text-[#171717] transition-colors hover:text-[#171717]/70 sm:text-sm">
                  <MessageCircle size={15} strokeWidth={1.2} /> WhatsApp
                </a>

                {instagramUrl && (
                  <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 text-xs text-[#171717] transition-colors hover:text-[#171717]/70 sm:text-sm">
                    <FaInstagram size={15} /> {instagramLabel || '@ni3cinema'}
                  </a>
                )}

                {youtubeUrl && (
                  <a href={youtubeUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 text-xs text-[#171717] transition-colors hover:text-[#171717]/70 sm:text-sm">
                    <FaYoutube size={15} /> {youtubeLabel || 'NI3 Cinema'}
                  </a>
                )}

                {workingHours && (
                  <div className="pt-1 text-xs text-[#171717] sm:text-sm">
                    {workingHours}
                  </div>
                )}
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* =====================================================
          02 INTRO SECTION (Extremely Compact)
      ===================================================== */}
      <section className="border-t border-black/10">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
          <div className="grid gap-6 lg:grid-cols-[0.7fr_1.3fr] lg:gap-10">

            {/* LEFT */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.9, ease }}
            >
              <p className="text-[9px] uppercase tracking-[0.4em] text-[#171717]">
                {introEyebrow}
              </p>
              <div className="my-3 h-px w-10 bg-[#171717]/40" />
              <h2 className="text-[clamp(1.5rem,3.5vw,2.5rem)] font-light leading-[0.95] tracking-[-0.05em] text-[#171717]">
                {introHeadingLine1} <span className="block">{introHeadingLine2}</span>
                <span className="block italic text-[#171717]">{introHeadingItalic}</span>
              </h2>
            </motion.div>

            {/* RIGHT */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.9, delay: 0.1, ease }}
            >
              <p className="max-w-2xl text-base font-light leading-6 text-[#171717] sm:text-lg sm:leading-7">
                {introSubheading}
              </p>
              <p className="mt-3 max-w-xl text-xs leading-5 text-[#171717] sm:text-sm sm:leading-6">
                {introDescription}
              </p>

              {/* CONTACT LINKS */}
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
                <a href={emailUrl} className="flex items-center gap-2 text-xs text-[#171717] transition-colors hover:text-[#171717]/70 sm:text-sm">
                  <Mail size={15} strokeWidth={1.2} /> {introEmailLabel}
                </a>
                <a href={phoneUrl} className="flex items-center gap-2 text-xs text-[#171717] transition-colors hover:text-[#171717]/70 sm:text-sm">
                  <Phone size={15} strokeWidth={1.2} /> {introCallLabel}
                </a>
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-[#171717] transition-colors hover:text-[#171717]/70 sm:text-sm">
                  <MessageCircle size={15} strokeWidth={1.2} /> {introWhatsAppLabel}
                </a>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

    </main>
  )
}

export default Contact  