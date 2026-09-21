import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";

/* =====================================================
   PUBLIC PAGES
===================================================== */

import Home from "./pages/Home";
import About from "./pages/About";
import Portfolio from "./pages/Portfolio";
import Gallery from "./pages/Gallery";
import Films from "./pages/Films";
import Blog from "./pages/Blog";
import Careers from "./pages/Careers";
import Contact from "./pages/Contact";
import AlbumDetail from "./pages/AlbumDetail";

/* =====================================================
   PUBLIC COMPONENTS
===================================================== */

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

/* =====================================================
   ADMIN PAGES
===================================================== */

import AdminLogin from "./admin/AdminLogin";
import ForgotPassword from "./admin/ForgotPassword";
import ResetPassword from "./admin/ResetPassword";
import AdminLayout from "./admin/AdminLayout";
import Dashboard from "./admin/Dashboard";
import HomePageManagement from "./admin/HomePageManagement";
import AboutPageManagement from "./admin/AboutPageManagement";
import PortfolioManagement from "./admin/PortfolioManagement";
import GalleryManagement from "./admin/GalleryManagement";
import FilmManagement from "./admin/FilmManagement";

import BlogManagement from "./admin/BlogManagement";
import ContactManagement from "./admin/ContactManagement";
import CareerManagement from "./admin/CareerManagement";
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

/* =====================================================
   APP
===================================================== */

function App() {
  return (
    <BrowserRouter>
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
              <AlbumDetail />
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
    </BrowserRouter>
  );
}

export default App;