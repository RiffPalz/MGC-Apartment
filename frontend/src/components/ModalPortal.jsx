/* eslint-disable react-hooks/refs */
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

export default function ModalPortal({ children }) {
  const el = useRef(document.createElement("div"));

  useEffect(() => {
    const node = el.current;
    document.body.appendChild(node);
    // blur the app root so the backdrop effect works globally
    document.getElementById("root")?.classList.add("modal-open");
    return () => {
      document.body.removeChild(node);
      document.getElementById("root")?.classList.remove("modal-open");
    };
  }, []);

  return createPortal(children, el.current);
}
