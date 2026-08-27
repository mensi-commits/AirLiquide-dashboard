import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import AdminDashboard from "./pages/dashboards/AdminDashboard";
import LogisticsDashboard from "./pages/dashboards/LogisticsDashboard";
import LaboratoryDashboard from "./pages/dashboards/LaboratoryDashboard";
import ProductionDashboard from "./pages/dashboards/ProductionDashboard";
import DistributionDashboard from "./pages/dashboards/DistributionDashboard";
import SystemCalendar from "./pages/SystemCalendar"; // <-- Added import

// Protected route that checks both authentication AND role
const ProtectedRoute = ({ allowedRoles, children }: { allowedRoles: string[], children: React.ReactNode }) => {
  const token = localStorage.getItem("token");
  const userStr = localStorage.getItem("user");

  if (!token || !userStr) {
    return <Navigate to="/login" replace />;
  }

  const user = JSON.parse(userStr);

  if (!allowedRoles.includes(user.role)) {
    // Redirect to their correct dashboard
    const roleRoutes: Record<string, string> = {
      admin: "/dashboard/admin",
      logistics: "/dashboard/logistics",
      laboratory: "/dashboard/laboratory",
      production: "/dashboard/production",
      distribution: "/dashboard/distribution",
    };
    return <Navigate to={roleRoutes[user.role] || "/login"} replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />

        {/* Role-Specific Dashboards */}
        <Route
          path="/dashboard/admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/logistics"
          element={
            <ProtectedRoute allowedRoles={["admin", "logistics"]}>
              <LogisticsDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/laboratory"
          element={
            <ProtectedRoute allowedRoles={["admin", "laboratory"]}>
              <LaboratoryDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/production"
          element={
            <ProtectedRoute allowedRoles={["admin", "production"]}>
              <ProductionDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/distribution"
          element={
            <ProtectedRoute allowedRoles={["admin", "distribution"]}>
              <DistributionDashboard />
            </ProtectedRoute>
          }
        />

        {/* System Calendar Route (Accessible to all roles for traceability, or change to ["admin"] if restricted) */}
        <Route
          path="/calendar"
          element={
            <ProtectedRoute allowedRoles={["admin", "logistics", "laboratory", "production", "distribution"]}>
              <SystemCalendar />
            </ProtectedRoute>
          }
        />

        {/* Default dashboard redirect based on role */}
        <Route path="/dashboard" element={<DashboardRedirect />} />

        {/* Catch-all */}
        {/* <Route path="*" element={<Navigate to="/" replace />} /> */}
      </Routes>
    </BrowserRouter>
  );
}

// Redirects users to their role-specific dashboard
function DashboardRedirect() {
  const userStr = localStorage.getItem("user");
  if (!userStr) return <Navigate to="/login" replace />;

  const user = JSON.parse(userStr);
  const redirects: Record<string, string> = {
    admin: "/dashboard/admin",
    logistics: "/dashboard/logistics",
    laboratory: "/dashboard/laboratory",
    production: "/dashboard/production",
    distribution: "/dashboard/distribution",
  };

  return <Navigate to={redirects[user.role] || "/login"} replace />;
}

export default App;