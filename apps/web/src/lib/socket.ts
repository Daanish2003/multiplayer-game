"use client";
import { io, type Socket } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents } from "@/types/socket";

export const socket: Socket<ServerToClientEvents, ClientToServerEvents>  = io(process.env.NEXT_PUBLIC_SERVER_URL, {
	transports: ["websocket"],
	reconnection: true,
	reconnectionAttempts: 10,
	reconnectionDelay: 1000,
	reconnectionDelayMax: 5000,
	autoConnect: false,
});