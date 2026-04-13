import { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import useSessionTimeout from "../hooks/useSessionTimeout";
import SessionTimeoutModal from "./SessionTimeoutModal";

const WARNING_MS = 60 * 1000;

const TIMEOUT_BY_ROLE = {
  admin:     15 * 60 * 1000,
  caretaker: 10 * 60 * 1000,
  tenant:     5 * 60 * 1000,
};

export default function SessionTimeoutProvider({ children }) {
  const { isAuthenticated, logout, user } = useAuth();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  const inactivityMs = useMemo(
    () => TIMEOUT_BY_ROLE[user?.role] ?? 5 * 60 * 1000,
    [user?.role]
  );

  const handleWarn = useCallback(() => setShowModal(true), []);

  const handleAutoLogout = useCallback(async () => {
    setShowModal(false);
    await logout();
    navigate("/login", { replace: true });
  }, [logout, navigate]);

  const { continueSession } = useSessionTimeout({
    timeoutMs: inactivityMs,
    warningMs: WARNING_MS,
    onWarn: handleWarn,
    onLogout: handleAutoLogout,
    active: isAuthenticated,
  });

  const handleContinue = useCallback(() => {
    setShowModal(false);
    continueSession();
  }, [continueSession]);

  return (
    <>
      {children}
      <SessionTimeoutModal
        isOpen={showModal}
        onContinue={handleContinue}
        onLogout={handleAutoLogout}
      />
    </>
  );
}
