import { Navigate, Outlet } from "react-router-dom";
import { getToken, getRole } from "../api/authStorage";

const PrivateRoute = ({ allowedRoles }) => {
  const token = getToken();
  const role = getRole();

  if (!token) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(role)) return <Navigate to="/unauthorized" replace />;

  return <Outlet />;
};

export default PrivateRoute;
