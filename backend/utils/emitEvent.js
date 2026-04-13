export const emitEvent = (req, event, payload = {}) => {
  const io = req.app.get("io");
  if (!io) {
    console.warn("Socket.IO not initialized");
    return;
  }
  io.emit(event, payload);
};
