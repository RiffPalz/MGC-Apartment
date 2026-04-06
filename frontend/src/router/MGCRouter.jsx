import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext.jsx";
import { SocketProvider } from "../context/SocketContext.jsx";
import { ConfigProvider } from "../context/ConfigContext.jsx";
import { getToken, getRole } from "../api/authStorage.js";
import { Analytics } from "@vercel/analytics/react";

import PrivateRoute from "../components/PrivateRoute.jsx";
import Unauthorized from "../components/Unauthorized.jsx";
import PageLoader from "../components/PageLoader.jsx";

// Core Layouts
import TenantLayout from "../layout/TenantLayout.jsx";
import AdminLayout from "../layout/AdminLayout.jsx";
import CaretakerLayout from "../layout/CaretakerLayout.jsx";

// Public Pages
const Home = lazy(() => import("../pages/LandingPage/Home.jsx"));
const Login = lazy(() => import("../pages/LandingPage/Login.jsx"));
const ApplyNow = lazy(() => import("../pages/LandingPage/ApplyNow.jsx"));
const CreateAcc = lazy(() => import("../pages/LandingPage/CreateAcc.jsx"));
const AdminVerification = lazy(() => import("../pages/LandingPage/Verification.jsx"));

// Tenant Pages
const TenantDashboard = lazy(() => import("../pages/TenantPage/Dashboard.jsx"));
const TenantMaintenance = lazy(() => import("../pages/TenantPage/Maintenance.jsx"));
const TenantContract = lazy(() => import("../pages/TenantPage/Contract.jsx"));
const TenantPaymentHistory = lazy(() => import("../pages/TenantPage/PaymentHistory.jsx"));
const TenantAccountSettings = lazy(() => import("../pages/TenantPage/AccountSetting.jsx"));
const TenantActivityLogs = lazy(() => import("../pages/TenantPage/ActivityLogs.jsx"));

// Admin Pages
const AdminDashboard = lazy(() => import("../pages/AdminPage/Dashboard.jsx"));
const AdminTenants = lazy(() => import("../pages/AdminPage/Tenants.jsx"));
const AdminUnits = lazy(() => import("../pages/AdminPage/Units.jsx"));
const AdminMaintenance = lazy(() => import("../pages/AdminPage/Maintenance.jsx"));
const AdminAnnouncement = lazy(() => import("../pages/AdminPage/Announcement.jsx"));
const AdminContract = lazy(() => import("../pages/AdminPage/Contract.jsx"));
const AdminPayment = lazy(() => import("../pages/AdminPage/Payment.jsx"));
const AdminApplicationRequest = lazy(() => import("../pages/AdminPage/ApplicationRequest.jsx"));
const AdminTenantProfile = lazy(() => import("../pages/AdminPage/TenantProfile.jsx"));
const AdminAccountApproval = lazy(() => import("../pages/AdminPage/AccountApproval.jsx"));
const AdminSettings = lazy(() => import("../pages/AdminPage/Settings.jsx"));
const AdminActivityLogs = lazy(() => import("../pages/AdminPage/ActivityLogs.jsx"));
const AdminSystemConfig = lazy(() => import("../pages/AdminPage/SystemConfig.jsx"));
const AdminProfile = lazy(() => import("../pages/AdminPage/Profile.jsx"));

// Caretaker Pages
const CaretakerDashboard = lazy(() => import("../pages/CaretakerPage/Dashboard.jsx"));
const CaretakerMaintenance = lazy(() => import("../pages/CaretakerPage/Maintenance.jsx"));
const CaretakerTenantOverview = lazy(() => import("../pages/CaretakerPage/TenantOverview.jsx"));
const CaretakerPaymentOverview = lazy(() => import("../pages/CaretakerPage/PaymentOverview.jsx"));
const CaretakerAnnouncement = lazy(() => import("../pages/CaretakerPage/Announcement.jsx"));
const CaretakerActivityLogs = lazy(() => import("../pages/CaretakerPage/ActivityLogs.jsx"));
const CaretakerProfile = lazy(() => import("../pages/CaretakerPage/Profile.jsx"));
const CaretakerSettings = lazy(() => import("../pages/CaretakerPage/Settings.jsx"));

// Role Redirect
const LoginRedirect = () => {
  const token = getToken();
  const role = getRole();

  if (token && role) {
    switch (role) {
      case "admin": return <Navigate to="/admin/dashboard" replace />;
      case "caretaker": return <Navigate to="/caretaker/dashboard" replace />;
      case "tenant": return <Navigate to="/tenant/dashboard" replace />;
      default:
        localStorage.clear();
    }
  }

  return <Login />;
};

export default function MGCRouter() {
  return (
    <BrowserRouter>
      <ConfigProvider>
      <AuthProvider>
        <SocketProvider>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<LoginRedirect />} />
              <Route path="/applynow" element={<ApplyNow />} />
              <Route path="/createAccount" element={<CreateAcc />} />
              <Route path="/verification" element={<AdminVerification />} />
              <Route path="/unauthorized" element={<Unauthorized />} />

              {/* Tenant */}
              <Route element={<PrivateRoute allowedRoles={["tenant"]} />}>
                <Route path="/tenant" element={<TenantLayout />}>
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<TenantDashboard />} />
                  <Route path="maintenance" element={<TenantMaintenance />} />
                  <Route path="contract" element={<TenantContract />} />
                  <Route path="payment" element={<TenantPaymentHistory />} />
                  <Route path="myAccount" element={<TenantAccountSettings />} />
                  <Route path="activityLogs" element={<TenantActivityLogs />} />
                </Route>
              </Route>

              {/* Admin */}
              <Route element={<PrivateRoute allowedRoles={["admin"]} />}>
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="tenants" element={<AdminTenants />} />
                  <Route path="units" element={<AdminUnits />} />
                  <Route path="maintenance" element={<AdminMaintenance />} />
                  <Route path="announcement" element={<AdminAnnouncement />} />
                  <Route path="contract" element={<AdminContract />} />
                  <Route path="payments" element={<AdminPayment />} />
                  <Route path="applicationrequest" element={<AdminApplicationRequest />} />
                  <Route path="approvalpage" element={<AdminAccountApproval />} />
                  <Route path="tenants/:id" element={<AdminTenantProfile />} />
                  <Route path="settings" element={<AdminSettings />} />
                  <Route path="activity-logs" element={<AdminActivityLogs />} />
                  <Route path="system-config" element={<AdminSystemConfig />} />
                  <Route path="profile" element={<AdminProfile />} />
                </Route>
              </Route>

              {/* Caretaker */}
              <Route element={<PrivateRoute allowedRoles={["caretaker"]} />}>
                <Route path="/caretaker" element={<CaretakerLayout />}>
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<CaretakerDashboard />} />
                  <Route path="maintenance" element={<CaretakerMaintenance />} />
                  <Route path="tenants" element={<CaretakerTenantOverview />} />
                  <Route path="payments" element={<CaretakerPaymentOverview />} />
                  <Route path="announcements" element={<CaretakerAnnouncement />} />
                  <Route path="activity-logs" element={<CaretakerActivityLogs />} />
                  <Route path="settings" element={<CaretakerSettings />} />
                  <Route path="profile" element={<CaretakerProfile />} />
                </Route>
              </Route>
            </Routes>
          </Suspense>
        </SocketProvider>
      </AuthProvider>
      </ConfigProvider>
      <Analytics debug={false} />
    </BrowserRouter>
  );
}