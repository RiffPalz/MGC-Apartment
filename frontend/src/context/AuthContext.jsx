import { createContext, useContext, useState, useEffect } from "react";
import { login as apiLogin, logout as apiLogout } from "../api/authService";
import { getUser, getToken, clearAuth, setAuth } from "../api/authStorage";

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

export const AuthProvider = ({ children }) => {
  // Initialize synchronously from localStorage — no refresh needed
  const [user, setUser] = useState(() => {
    const token = getToken();
    const storedUser = getUser();
    return token && storedUser ? storedUser : null;
  });
  const [isAuth, setIsAuth] = useState(() => {
    return !!(getToken() && getUser());
  });
  const [loading] = useState(false);

  const login = async (credentials) => {
    const response = await apiLogin(credentials);
    const storedUser = getUser();
    if (storedUser) {
      setUser(storedUser);
      setIsAuth(true);
    }
    return response;
  };

  const logout = async () => {
    try { await apiLogout(); } catch (e) { console.error(e); } finally {
      clearAuth();
      setUser(null);
      setIsAuth(false);
    }
  };

  // Called after profile update so header refreshes immediately
  const updateUser = (updatedFields) => {
    setUser((prev) => {
      const next = { ...prev, ...updatedFields };
      setAuth(getToken(), next, next.role);
      return next;
    });
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: isAuth, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};