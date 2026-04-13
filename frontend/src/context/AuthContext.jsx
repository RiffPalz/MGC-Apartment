import { createContext, useContext, useState } from "react";
import { login as apiLogin, logout as apiLogout } from "../api/authService";
import { getUser, getToken, clearAuth, setAuth } from "../api/authStorage";

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const token = getToken();
    const storedUser = getUser();
    return token && storedUser ? storedUser : null;
  });

  const [isAuth, setIsAuth] = useState(() => !!(getToken() && getUser()));
  const [loading] = useState(false);

  const login = async (credentials) => {
    const response = await apiLogin(credentials);
    const freshUser = response?.user || response?.data?.user || getUser();

    if (freshUser) {
      setUser(freshUser);
      setIsAuth(true);
      const freshToken = response?.token || response?.data?.token || getToken();
      if (freshToken) setAuth(freshToken, freshUser, freshUser.role);
    }

    return response;
  };

  const logout = async () => {
    try {
      await apiLogout();
    } catch (e) {
      console.error(e);
    } finally {
      clearAuth();
      setUser(null);
      setIsAuth(false);
    }
  };

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
