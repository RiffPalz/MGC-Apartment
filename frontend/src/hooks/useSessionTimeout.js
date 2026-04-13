import { useEffect, useRef, useCallback } from "react";

const INACTIVITY_EVENTS = ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "click"];

const useSessionTimeout = ({ timeoutMs = 5 * 60 * 1000, warningMs = 60 * 1000, onWarn, onLogout, active = false }) => {
  const inactivityTimer = useRef(null);
  const logoutTimer = useRef(null);

  const clearTimers = useCallback(() => {
    clearTimeout(inactivityTimer.current);
    clearTimeout(logoutTimer.current);
  }, []);

  const startLogoutCountdown = useCallback(() => {
    clearTimeout(logoutTimer.current);
    logoutTimer.current = setTimeout(() => onLogout?.(), warningMs);
  }, [warningMs, onLogout]);

  const resetTimer = useCallback(() => {
    clearTimers();
    inactivityTimer.current = setTimeout(() => {
      onWarn?.();
      startLogoutCountdown();
    }, timeoutMs);
  }, [timeoutMs, clearTimers, onWarn, startLogoutCountdown]);

  const continueSession = useCallback(() => {
    clearTimers();
    resetTimer();
  }, [clearTimers, resetTimer]);

  useEffect(() => {
    if (!active) {
      clearTimers();
      return;
    }

    resetTimer();

    INACTIVITY_EVENTS.forEach((evt) => window.addEventListener(evt, resetTimer, { passive: true }));

    return () => {
      clearTimers();
      INACTIVITY_EVENTS.forEach((evt) => window.removeEventListener(evt, resetTimer));
    };
  }, [active, resetTimer, clearTimers]);

  return { continueSession };
};

export default useSessionTimeout;
