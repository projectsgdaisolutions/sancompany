import React, { useState, useEffect } from 'react'
import { ArrowUp } from 'lucide-react'
import { FaInstagram, FaFacebookF, FaLinkedinIn, FaYoutube } from 'react-icons/fa'
import { readApiJson } from '../services/api'

/* =========================================================
   API (Make sure this matches your main app's API URL)
========================================================= */
const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  ''

// Changed font to match the rest of the site
const FONT_DISPLAY = "'Fraunces', 'Iowan Old Style', Georgia, serif"

// Same body font used for the "Kind Words" style eyebrows across the site
const FONT_BODY = "'Manrope', Arial, sans-serif"

/* =========================================================
   FOOTER COMPONENT
========================================================= */

function Footer() {
  const [socialMedia, setSocialMedia] = useState({
    instagram: '',
    youtube: '',
    facebook: '',
    linkedin: '',
    twitter: '',
  })

  useEffect(() => {
    const fetchSocialMedia = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/content.php`)
        const data = await readApiJson(response, 'Footer content')
        if (data.success && data.content && data.content.contact) {
          const contact = data.content.contact
          setSocialMedia({
            instagram: contact.instagram || contact.socialMedia?.instagram || '',
            youtube: contact.youtube || contact.socialMedia?.youtube || '',
            facebook: contact.facebook || contact.socialMedia?.facebook || '',
            linkedin: contact.linkedin || contact.socialMedia?.linkedin || '',
            twitter: contact.twitter || contact.socialMedia?.twitter || '',
          })
        }
      } catch (error) {
        console.error('Failed to fetch social media:', error)
      }
    }
    fetchSocialMedia()
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    // Mobile-first padding and background
    <footer className="border-t border-black/10 bg-[#E5E1D8] px-4 py-8 text-[#171717] sm:px-6 sm:py-10 md:px-10 lg:px-16 lg:py-12">
      <div className="mx-auto max-w-7xl">
        {/* Top Section: Mobile First (Column) -> Desktop (Row) */}
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row md:gap-8">
          
          {/* Brand Section */}
          <div className="text-center md:text-left">
            <h3
              className="text-xs font-medium uppercase tracking-[0.35em] sm:text-sm md:text-base"
              style={{ fontFamily: FONT_BODY }}
            >
              SAN & Ni3Cinema
            </h3>
            <p className="mt-1 text-[10px] text-[#69635B] sm:text-xs">
              Your Moments. Our Passion. Memories Forever.
            </p>
          </div>

          {/* Social Icons */}
          <div className="flex items-center gap-4 text-[#3C3530] sm:gap-6">
            {socialMedia.instagram && (
              <a
                href={socialMedia.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="transition hover:text-black"
              >
                <FaInstagram size={16} />
              </a>
            )}
            {socialMedia.facebook && (
              <a
                href={socialMedia.facebook}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="transition hover:text-black"
              >
                <FaFacebookF size={16} />
              </a>
            )}
            {socialMedia.linkedin && (
              <a
                href={socialMedia.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="transition hover:text-black"
              >
                <FaLinkedinIn size={16} />
              </a>
            )}
            {socialMedia.youtube && (
              <a
                href={socialMedia.youtube}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                className="transition hover:text-black"
              >
                <FaYoutube size={16} />
              </a>
            )}
          </div>

          {/* Back to Top Button */}
          <button
            type="button"
            onClick={scrollToTop}
            className="flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.25em] text-[#69635B] transition hover:text-black sm:text-[10px]"
          >
            Back to Top <ArrowUp size={14} />
          </button>
        </div>

        {/* Bottom Section: Copyright and Developer Credit */}
        <div className="mt-6 flex flex-col items-center justify-between gap-3 border-t border-black/5 pt-5 sm:mt-8 sm:flex-row sm:gap-4 sm:pt-6">
          <div className="text-center text-[9px] text-[#69635B] sm:text-left sm:text-[10px]">
            © {new Date().getFullYear()} SAN Photography · Ni3 Cinema. All rights reserved.
          </div>
          
          {/* Aesthetic Small Developer Link */}
          <a 
            href="https://gdaisolutions.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-[8px] uppercase tracking-[0.3em] text-[#9b7740] transition-colors duration-300 hover:text-[#171717] sm:text-[9px]"
          >
            Developed by GD AI Solutions
          </a>
        </div>
      </div>
    </footer>
  )
}

export default Footer