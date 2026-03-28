import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext.jsx";
import { SocketProvider } from '../context/SocketContext.jsx';
import { getToken, getRole } from "../api/authStorage.js";

import PrivateRoute from "../components/PrivateRoute.jsx";
import Unauthorized from "../components/Unauthorized.jsx";

// Landing Pages
import Home from "../pages/LandingPage/Home.jsx";
import Login from "../pages/LandingPage/Login.jsx";
import ApplyNow from "../pages/LandingPage/ApplyNow.jsx";
import CreateAcc from "../pages/LandingPage/CreateAcc.jsx";
import AdminVerification from "../pages/LandingPage/Verification.jsx";

// Tenant Pages
import TenantLayout from "../layout/TenantLayout.jsx";
import TenantDashboard from "../pages/TenantPage/Dashboard.jsx";
import TenantMaintenance from "../pages/TenantPage/Maintenance.jsx";
import TenantContract from "../pages/TenantPage/Contract.jsx";
import TenantPaymentHistory from "../pages/TenantPage/PaymentHistory.jsx";
import TenantAccountSettings from "../pages/TenantPage/AccountSetting.jsx";
import TenantActivityLogs from "../pages/TenantPage/ActivityLogs.jsx";

// Admin Pages
import AdminLayout from "../layout/AdminLayout.jsx";
import AdminDashboard from "../pages/AdminPage/Dashboard.jsx";
import AdminTenants from "../pages/AdminPage/Tenants.jsx";
import AdminUnits from "../pages/AdminPage/Units.jsx";
import AdminMaintenance from "../pages/AdminPage/Maintenance.jsx";
import AdminAnnouncement from "../pages/AdminPage/Announcement.jsx";
import AdminContract from "../pages/AdminPage/Contract.jsx";
import AdminPayment from "../pages/AdminPage/Payment.jsx";
import AdminApplicationRequest from "../pages/AdminPage/ApplicationRequest.jsx";
import AdminTenantProfile from "../pages/AdminPage/TenantProfile.jsx";
import AdminAccountApproval from "../pages/AdminPage/AccountApproval.jsx";
import AdminSettings from "../pages/AdminPage/Settings.jsx";
import AdminActivityLogs from "../pages/AdminPage/ActivityLogs.jsx";
import AdminProfile from "../pages/AdminPage/Profile.jsx";


// Caretaker Pages
import CaretakerLayout from "../layout/CaretakerLayout.jsx";
import CaretakerDashboard from "../pages/CaretakerPage/Dashboard.jsx";
import CaretakerMaintenance from "../pages/CaretakerPage/Maintenance.jsx";
import CaretakerTenantOverview from "../pages/CaretakerPage/TenantOverview.jsx";
import CaretakerPaymentOverview from "../pages/CaretakerPage/PaymentOverview.jsx";
import CaretakerAnnouncement from "../pages/CaretakerPage/announcement.jsx";
import CaretakerActivityLogs from "../pages/CaretakerPage/ActivityLogs.jsx";
import CaretakerProfile from "../pages/CaretakerPage/Profile.jsx";
import CaretakerSettings from "../pages/CaretakerPage/Settings.jsx";

// Redirect login based on role
const LoginRedirect = () => {
  const token = getToken();
  const role = getRole();
  const isAuthenticated = !!token && !!role;

  if (isAuthenticated) {
    switch (role) {
      case "admin":
        return <Navigate to="/admin/dashboard" replace />;
      case "caretaker":
        return <Navigate to="/caretaker/dashboard" replace />;
      case "tenant":
        return <Navigate to="/tenant/dashboard" replace />;
      default:
        localStorage.clear(); // clear corrupted data
        return <Login />;
    }
  }

  return <Login />;
};

export default function MGCRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        {/* SocketProvider wraps all pages for real-time updates */}
        <SocketProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<LoginRedirect />} />
            <Route path="/applynow" element={<ApplyNow />} />
            <Route path="/createAccount" element={<CreateAcc />} />
            <Route path="/verification" element={<AdminVerification />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Tenant Protected Routes */}
            <Route element={<PrivateRoute allowedRoles={["tenant"]} />}>
              <Route path="/tenant" element={<TenantLayout />}>
                <Route path="dashboard" element={<TenantDashboard />} />
                <Route path="maintenance" element={<TenantMaintenance />} />
                <Route path="contract" element={<TenantContract />} />
                <Route path="payment" element={<TenantPaymentHistory />} />
                <Route path="myAccount" element={<TenantAccountSettings />} />
                <Route path="activityLogs" element={<TenantActivityLogs />} />
              </Route>
            </Route>

            {/* Admin Protected Routes */}
            <Route element={<PrivateRoute allowedRoles={["admin"]} />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard"          element={<AdminDashboard />} />
                <Route path="tenants"            element={<AdminTenants />} />
                <Route path="units"              element={<AdminUnits />} />
                <Route path="maintenance"        element={<AdminMaintenance />} />
                <Route path="announcement"       element={<AdminAnnouncement />} />
                <Route path="contract"           element={<AdminContract />} />
                <Route path="payments"           element={<AdminPayment />} />
                <Route path="applicationrequest" element={<AdminApplicationRequest />} />
                <Route path="approvalpage"       element={<AdminAccountApproval />} />
                <Route path="tenants/:id" element={<AdminTenantProfile />} />
                <Route path="settings"           element={<AdminSettings />} />
                <Route path="activity-logs"      element={<AdminActivityLogs />} />
                <Route path="profile"            element={<AdminProfile />} />
              </Route>
            </Route>

            {/* Caretaker Protected Routes */}
            <Route element={<PrivateRoute allowedRoles={["caretaker"]} />}>
              <Route path="/caretaker" element={<CaretakerLayout />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard"   element={<CaretakerDashboard />} />
                <Route path="maintenance" element={<CaretakerMaintenance />} />
                <Route path="tenants"     element={<CaretakerTenantOverview />} />
                <Route path="payments"       element={<CaretakerPaymentOverview />} />
                <Route path="announcements"  element={<CaretakerAnnouncement />} />
                <Route path="activity-logs"  element={<CaretakerActivityLogs />} />
                <Route path="settings"       element={<CaretakerSettings />} />
                <Route path="profile"        element={<CaretakerProfile />} />
              </Route>
            </Route>
          </Routes>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}