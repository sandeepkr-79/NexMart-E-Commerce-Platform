import { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { io } from "socket.io-client";
import toast from "react-hot-toast";
import { selectCurrentUser } from "../app/authSlice.js";

const socketUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:5000";

export const useSocket = () => {
  const user = useSelector(selectCurrentUser);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    // Connect socket
    socketRef.current = io(socketUrl, {
      transports: ["websocket"],
      autoConnect: true,
    });

    const socket = socketRef.current;

    socket.on("connect", () => {
      console.log("Socket client connected: ", socket.id);
      socket.emit("setup", user);
    });

    // Listen for push notifications
    socket.on("notification", (notice) => {
      console.log("Received socket notification:", notice);

      // Display premium dark-mode toasts
      toast(
        (t) => (
          <div className="flex flex-col gap-1 text-slate-100 font-sans">
            <div className="flex items-center gap-2">
              <span className="badge badge-primary badge-xs"></span>
              <span className="font-semibold text-xs tracking-wider uppercase opacity-75">
                {notice.type.replace("_", " ")}
              </span>
            </div>
            <p className="text-sm font-medium">{notice.message}</p>
            {notice.link && (
              <a
                href={notice.link}
                onClick={() => toast.dismiss(t.id)}
                className="text-xs text-primary underline font-medium mt-1 inline-block"
              >
                View Update →
              </a>
            )}
          </div>
        ),
        {
          duration: 5000,
          style: {
            background: "#1e293b",
            border: "1px solid rgba(139, 92, 246, 0.2)",
            padding: "12px",
            borderRadius: "8px",
          },
        },
      );
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  return socketRef.current;
};

export default useSocket;
