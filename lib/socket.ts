import { io, Socket } from "socket.io-client";

let socketInstance: Socket | null = null;
let currentToken: string | null = null;

export const getSocketBaseUrl = (): string => {
   if (process.env.NEXT_PUBLIC_SOCKET_URL) {
      return process.env.NEXT_PUBLIC_SOCKET_URL;
   }
   const apiUrl =
      process.env.NEXT_PUBLIC_API_URL || "https://vndoctor.onrender.com/api";
   return apiUrl.replace(/\/api\/?$/, "");
};

export const getChatSocket = (token?: string | null): Socket | null => {
   if (typeof window === "undefined") return null;

   const effectiveToken =
      token ||
      (typeof localStorage !== "undefined"
         ? localStorage.getItem("accessToken")
         : null);

   if (!effectiveToken) {
      if (socketInstance) {
         socketInstance.disconnect();
         socketInstance = null;
         currentToken = null;
      }
      return null;
   }

   const cleanToken = effectiveToken.replace(/^Bearer\s+/i, "").trim();

   if (!socketInstance || currentToken !== cleanToken) {
      if (socketInstance) {
         socketInstance.disconnect();
      }

      const socketUrl = `${getSocketBaseUrl()}/chat`;

      socketInstance = io(socketUrl, {
         auth: { token: cleanToken },
         extraHeaders: { authorization: `Bearer ${cleanToken}` },
         transports: ["websocket", "polling"],
         autoConnect: true,
         reconnection: true,
         reconnectionAttempts: Infinity,
         reconnectionDelay: 1000,
         reconnectionDelayMax: 5000,
         timeout: 20000,
      });

      currentToken = cleanToken;
   }

   if (socketInstance && !socketInstance.connected) {
      socketInstance.connect();
   }

   return socketInstance;
};

export const disconnectChatSocket = () => {
   if (socketInstance) {
      socketInstance.disconnect();
      socketInstance = null;
      currentToken = null;
   }
};

