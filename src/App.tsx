import React, { lazy, Suspense, useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";

/* =====================================================
   PUBLIC PAGES
===================================================== */

const Home = lazy(() => import("./pages/Home"));
const About = lazy(() => import("./pages/About"));
const Portfolio = lazy(() => import("./pages/Portfolio"));
const Gallery = lazy(() => import("./pages/Gallery"));
const Films = lazy(() => import("./pages/Films"));
const Blog = lazy(() => import("./pages/Blog"));
const Careers = lazy(() => import("./pages/Careers"));
const Contact = lazy(() => import("./pages/Contact"));

/* =====================================================
   PUBLIC COMPONENTS
===================================================== */

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

/* =====================================================
   ADMIN PAGES
===================================================== */

const AdminLogin = lazy(() => import("./admin/AdminLogin"));
const ForgotPassword = lazy(() => import("./admin/ForgotPassword"));
const ResetPassword = lazy(() => import("./admin/ResetPassword"));
const AdminLayout = lazy(() => import("./admin/AdminLayout"));
const HomePageManagement = lazy(() => import("./admin/HomePageManagement"));
const AboutPageManagement = lazy(() => import("./admin/AboutPageManagement"));
const PortfolioManagement = lazy(() => import("./admin/PortfolioManagement"));
const GalleryManagement = lazy(() => import("./admin/GalleryManagement"));
const FilmManagement = lazy(() => import("./admin/FilmManagement"));
const BlogManagement = lazy(() => import("./admin/BlogManagement"));
const ContactManagement = lazy(() => import("./admin/ContactManagement"));
const CareerManagement = lazy(() => import("./admin/CareerManagement"));
import { apiUrl, readApiJson } from "./services/api";

/* =====================================================
   ADMIN PROTECTED ROUTE
===================================================== */

interface ProtectedAdminProps {
  children: React.ReactNode;
}

function ProtectedAdmin({
  children,
}: ProtectedAdminProps) {
  const navigate = useNavigate();
  const token = localStorage.getItem('adminToken');
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!token) {
      navigate('/admin/login', { replace: true });
      return;
    }
    // Verify token with PHP backend
    fetch(apiUrl('/api/auth/me.php'), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async res => {
        if (res.status === 401) {
          localStorage.removeItem('adminToken');
          navigate('/admin/login', { replace: true });
          return;
        }

        await readApiJson(res, 'Admin session');
        if (res.ok) {
          setChecking(false);
        } else {
          // Other errors: keep token but stop checking to avoid block
          setChecking(false);
        }
      })
      .catch(() => {
        // Network error: preserve token and stop checking
        setChecking(false);
      });
  }, [token, navigate]);

  if (checking) {
    return null; // prevent flicker while verifying
  }

  return children;
}


/* =====================================================
   PUBLIC WEBSITE LAYOUT
===================================================== */

interface PublicLayoutProps {
  children: React.ReactNode;
}

function PublicLayout({
  children,
}: PublicLayoutProps) {
  return (
    <div className="min-h-screen bg-[#f3f0e9]">
      <Navbar />

      {children}

      <Footer />
    </div>
  );
}

function RouteLoading() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading page"
      className="min-h-screen bg-[#f3f0e9] px-6 pt-28"
    >
      <div className="mx-auto max-w-6xl">
        <div className="h-3 w-24 bg-black/10" />
        <div className="mt-5 h-10 max-w-md bg-black/10" />
        <div className="mt-3 h-3 max-w-lg bg-black/10" />
        <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="aspect-[4/5] bg-black/[0.06]" />
          ))}
        </div>
      </div>
    </main>
  );
}

/* =====================================================
   APP
===================================================== */

function App() {
  useEffect(() => {
    const toggleVideoPlayback = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element) || target.closest('button, a, input, select, textarea')) {
        return;
      }

      let video: HTMLVideoElement | null = target instanceof HTMLVideoElement ? target : null;
      let container: Element | null = target.parentElement;
      while (!video && container) {
        const videos = container.querySelectorAll('video');
        if (videos.length === 1) {
          video = videos[0];
        }
        container = container.parentElement;
      }

      if (!video) {
        return;
      }

      if (video.paused) {
        void video.play().catch(() => undefined);
      } else {
        video.pause();
      }
    };

    document.addEventListener('click', toggleVideoPlayback);
    return () => document.removeEventListener('click', toggleVideoPlayback);
  }, []);

  return (
    <BrowserRouter>
      <Suspense fallback={<RouteLoading />}>
      <Routes>

        {/* =================================================
            PUBLIC WEBSITE
        ================================================= */}

        <Route
          path="/"
          element={
            <PublicLayout>
              <Home />
            </PublicLayout>
          }
        />

        <Route
          path="/about"
          element={
            <PublicLayout>
              <About />
            </PublicLayout>
          }
        />

        <Route
          path="/portfolio"
          element={
            <PublicLayout>
              <Portfolio />
            </PublicLayout>
          }
        />

        {/* GALLERY */}

        <Route
          path="/gallery"
          element={
            <PublicLayout>
              <Gallery />
            </PublicLayout>
          }
        />

        {/* ALBUM DETAIL */}

        <Route
          path="/gallery/:slug"
          element={
            <PublicLayout>
              <Gallery />
            </PublicLayout>
          }
        />

        {/* FILMS */}

        <Route
          path="/films"
          element={
            <PublicLayout>
              <Films />
            </PublicLayout>
          }
        />

        {/* BLOG */}

        <Route
          path="/blog"
          element={
            <PublicLayout>
              <Blog />
            </PublicLayout>
          }
        />

        {/* CAREERS */}

        <Route
          path="/careers"
          element={
            <PublicLayout>
              <Careers />
            </PublicLayout>
          }
        />

        {/* CONTACT */}

        <Route
          path="/contact"
          element={
            <PublicLayout>
              <Contact />
            </PublicLayout>
          }
        />

        {/* =================================================
            ADMIN LOGIN
        ================================================= */}

        <Route
          path="/admin/login"
          element={
            <AdminLogin />
          }
        />

        <Route
          path="/admin/forgot-password"
          element={
            <ForgotPassword />
          }
        />

        <Route
          path="/admin/reset-password"
          element={
            <ResetPassword />
          }
        />

        {/* =================================================
            ADMIN DASHBOARD
        ================================================= */}

        <Route
          path="/admin/dashboard"
          element={
            <Navigate
              to="/admin/home"
              replace
            />
          }
        />

        {/* =================================================
            HOME MANAGEMENT
        ================================================= */}

        <Route
          path="/admin/home"
          element={
            <ProtectedAdmin>
              <AdminLayout>
                <HomePageManagement />
              </AdminLayout>
            </ProtectedAdmin>
          }
        />

        {/* =================================================
            ABOUT MANAGEMENT
        ================================================= */}

        <Route
          path="/admin/about"
          element={
            <ProtectedAdmin>
              <AdminLayout>
                <AboutPageManagement />
              </AdminLayout>
            </ProtectedAdmin>
          }
        />

        {/* =================================================
            PORTFOLIO MANAGEMENT
        ================================================= */}

        <Route
          path="/admin/portfolio"
          element={
            <ProtectedAdmin>
              <AdminLayout>
                <PortfolioManagement />
              </AdminLayout>
            </ProtectedAdmin>
          }
        />

        {/* =================================================
            GALLERY MANAGEMENT
        ================================================= */}

        <Route
          path="/admin/gallery"
          element={
            <ProtectedAdmin>
              <AdminLayout>
                <GalleryManagement />
              </AdminLayout>
            </ProtectedAdmin>
          }
        />

        {/* =================================================
            FILM MANAGEMENT
        ================================================= */}

        <Route
          path="/admin/films"
          element={
            <ProtectedAdmin>
              <AdminLayout>
                <FilmManagement />
              </AdminLayout>
            </ProtectedAdmin>
          }
        />


        {/* =================================================
            BLOG MANAGEMENT
        ================================================= */}

        <Route
          path="/admin/blog"
          element={
            <ProtectedAdmin>
              <AdminLayout>
                <BlogManagement />
              </AdminLayout>
            </ProtectedAdmin>
          }
        />

        {/* =================================================
            CONTACT MANAGEMENT
        ================================================= */}

        <Route
          path="/admin/contact"
          element={
            <ProtectedAdmin>
              <AdminLayout>
                <ContactManagement />
              </AdminLayout>
            </ProtectedAdmin>
          }
        />

        {/* =================================================
            CAREER MANAGEMENT
        ================================================= */}

        <Route
          path="/admin/career"
          element={
            <ProtectedAdmin>
              <AdminLayout>
                <CareerManagement />
              </AdminLayout>
            </ProtectedAdmin>
          }
        />

        {/* =================================================
            ADMIN ROOT
        ================================================= */}

        <Route
          path="/admin"
          element={
            <Navigate
              to="/admin/home"
              replace
            />
          }
        />

        {/* =================================================
            UNKNOWN ROUTES
        ================================================= */}

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />

      </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;