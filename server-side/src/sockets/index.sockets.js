import  {Server} from "socket.io";

let io;
export const initSocket = (server) => {
  io = new Server(server, {
    cors: { origin: "*" }
  });
    io.on("connection", (socket) => {
    console.log("🟢 A user connected:", socket.id);

    socket.on("disconnect", () => {
      console.log("🔴 A user disconnected:", socket.id);
    });
  });
    return io;
};
