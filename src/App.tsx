import React, { useEffect } from "react";
import { HashRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { StoreProvider, useStore } from "./lib/store";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { Button, EmptyState, ToastHost } from "./components/ui";

import Home from "./pages/Home";
import HowItWorks from "./pages/HowItWorks";
import Services from "./pages/Services";
import Help from "./pages/Help";
import { ForgotPage, LoginPage, ResetPage, SignupPage } from "./pages/AuthPages";
import Dashboard from "./pages/Dashboard";
import Submit from "./pages/Submit";
import RequestDetails from "./pages/RequestDetails";
import Payment from "./pages/Payment";
import Completed from "./pages/Completed";
import Notifications from "./pages/Notifications";
import { AdminLayout, AdminOverview, AdminRequests } from "./pages/admin/AdminIndex";
import { AdminPayments } from "./pages/admin/AdminPayments";
import AdminRequest from "./pages/admin/AdminRequest";

/* ---------------- route guards (auth boundaries for a future backend) ---------------- */

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user } = useStore();
  const loc = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  return <>{children}</>;
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user } = useStore();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin") return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

/* ---------------- scroll handling (top on nav, anchor on #hash) ---------------- */

function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.replace("#", ""));
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
    }
    window.scrollTo({ top: 0 });
  }, [pathname, hash]);
  return null;
}

function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-5 pt-20">
      <EmptyState
        icon="search"
        title="This page has not been archived."
        body="The address you followed does not exist. Let's get you back to the reading room."
        action={<Button to="/" icon="arrowL">Back to Home</Button>}
      />
    </div>
  );
}

function Shell() {
  return (
    <div className="flex min-h-screen flex-col">
      <ScrollManager />
      <Navbar />
      <div className="flex-1">
        <Routes>
          {/* public */}
          <Route path="/" element={<Home />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/services" element={<Services />} />
          <Route path="/help" element={<Help />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPage />} />
          <Route path="/reset-password" element={<ResetPage />} />

          {/* user */}
          <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
          <Route path="/submit" element={<RequireAuth><Submit /></RequireAuth>} />
          <Route path="/requests/:id" element={<RequireAuth><RequestDetails /></RequireAuth>} />
          <Route path="/requests/:id/payment" element={<RequireAuth><Payment /></RequireAuth>} />
          <Route path="/requests/:id/completed" element={<RequireAuth><Completed /></RequireAuth>} />
          <Route path="/notifications" element={<RequireAuth><Notifications /></RequireAuth>} />

          {/* admin */}
          <Route path="/admin" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
            <Route index element={<AdminOverview />} />
            <Route path="requests" element={<AdminRequests />} />
            <Route path="requests/:id" element={<AdminRequest />} />
            <Route path="payments" element={<AdminPayments />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
      <Footer />
      <ToastHost />
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <HashRouter>
        <Shell />
      </HashRouter>
    </StoreProvider>
  );
}
