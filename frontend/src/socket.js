import API_URL from "./config";

let socketPromise;
let socketInstance;

function loadSocketClient() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Socket.IO is only available in the browser."));
  }

  if (window.io) {
    return Promise.resolve(window.io);
  }

  if (!socketPromise) {
    socketPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = API_URL + "/socket.io/socket.io.js";
      script.async = true;
      script.dataset.socketClient = "true";
      script.onload = () => {
        if (window.io) resolve(window.io);
        else reject(new Error("Socket.IO client could not be initialized."));
      };
      script.onerror = () => {
        socketPromise = null;
        reject(new Error("Could not load Socket.IO client from the backend."));
      };
      document.head.appendChild(script);
    });
  }

  return socketPromise;
}

export async function getSocket() {
  if (socketInstance) return socketInstance;

  const io = await loadSocketClient();
  socketInstance = io(API_URL, {
    autoConnect: false,
    withCredentials: true,
    reconnection: true,
    transports: ["websocket", "polling"],
  });

  return socketInstance;
}
