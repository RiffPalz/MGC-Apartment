import { useEffect } from "react";
import { useSocket } from "../context/SocketContext";

/**
 * Listen to socket event(s) and run a callback.
 * Cleans up listeners on unmount or update.
 */
export function useSocketEvent(events, callback) {
  const socket = useSocket();

  useEffect(() => {
    if (!socket || !callback) return;

    const eventList = Array.isArray(events) ? events : [events];

    eventList.forEach((event) => {
      socket.on(event, callback);
    });

    return () => {
      eventList.forEach((event) => {
        socket.off(event, callback);
      });
    };
  }, [socket, callback, events]);
}