import { useEffect } from "react";
import { useSocket } from "../context/SocketContext";

/* Listen to one or more socket events and run a callback. Cleans up on unmount. */
export function useSocketEvent(events, callback) {
  const socket = useSocket();

  useEffect(() => {
    if (!socket || !callback) return;

    const eventList = Array.isArray(events) ? events : [events];
    eventList.forEach((event) => socket.on(event, callback));

    return () => eventList.forEach((event) => socket.off(event, callback));
  }, [socket, callback, events]);
}
