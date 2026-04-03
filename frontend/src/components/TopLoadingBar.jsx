import { useEffect, useRef, useState } from "react";
import api from "../api/config";

/**
 * TopLoadingBar — thin progress bar at the top of the screen.
 * Automatically shows during any axios request via interceptors.
 */
export default function TopLoadingBar() {
  const [active, setActive] = useState(false);
  const countRef = useRef(0);

  useEffect(() => {
    const show = () => {
      countRef.current += 1;
      setActive(true);
    };
    const hide = () => {
      countRef.current = Math.max(0, countRef.current - 1);
      if (countRef.current === 0) setActive(false);
    };

    const reqId = api.interceptors.request.use((config) => { show(); return config; }, (err) => { hide(); return Promise.reject(err); });
    const resId = api.interceptors.response.use((res) => { hide(); return res; }, (err) => { hide(); return Promise.reject(err); });

    return () => {
      api.interceptors.request.eject(reqId);
      api.interceptors.response.eject(resId);
    };
  }, []);

  if (!active) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[99999] h-[3px] bg-slate-100 overflow-hidden">
      <div className="h-full bg-[#db6747] animate-top-bar" />
    </div>
  );
}
