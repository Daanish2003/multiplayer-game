import type { Server, Socket } from "socket.io";
import { logger } from "../utils/logger";
import { roomManager } from "./room.manager";
import type { HandleCellUpdateCallback, HandleRequestHistoryCallback, HandleRequestTimeTravelCallback } from "@/utils/types";

class SocketManager {
	private static instance: SocketManager;
	private io: Server | null = null;
	private readonly sockets: Map<string, Socket> = new Map();

	private constructor() {}

	static getInstance(): SocketManager {
		if (!SocketManager.instance) {
			SocketManager.instance = new SocketManager();
		}
		return SocketManager.instance;
	}

	initialize(io: Server): void {
		this.io = io;
		this.setupMiddleware();
		this.setupConnectionHandler();
	}

	private setupMiddleware(): void {
		this.io?.use(this.authMiddleware.bind(this));
	}

	private authMiddleware(socket: Socket, next: (err?: Error) => void) {
		const userData = this.extractToken(socket);

		if (!userData) {
			return next(new Error("No user data provided"));
		}

		socket.user = {
			name: userData.name,
			socketId: socket.id,
			userId: userData.userId,
		};
		next();
	}

	private extractToken(
		socket: Socket
	): { name: string; userId: string } | null {
		const aTok = socket.handshake.auth.token;
		if (aTok) {
			return this.normalizeToken(aTok);
		}
		return null;
	}

	private normalizeToken(
		token: string | string[]
	): { name: string; userId: string } | null {
		const tokenValue = Array.isArray(token) ? token[0] : token;
		if (typeof tokenValue === "string") {
			try {
				const parsed = JSON.parse(tokenValue.trim());
				const { name, userId } = parsed;

				if (typeof name === "string" && typeof userId === "string") {
					return { name, userId };
				}
				return null;
			} catch {
				return null;
			}
		}
		return null;
	}

	private setupConnectionHandler(): void {
		this.io?.on("connection", this.handleConnection.bind(this));
	}

	private handleConnection(socket: Socket) {
		try {
			this.sockets.set(socket.id, socket)
			this.setupSocketEventHandlers(socket);

			socket.emit("connected", {
				message: "Connected successfully",
				name: socket.user.name,
				queueStatus: "waiting",
			});
		} catch (error) {
			logger.error("Error handling socket connection", {
				error,
				name: socket.user.name,
				socketId: socket.id,
			});
			socket.emit("error", { message: "Failed to join queue" });
			socket.disconnect(true);
		}
	}

	private setupSocketEventHandlers(socket: Socket): void {
		socket.on("join-room", (data) => this.handleJoinRoom(socket, data));
		socket.on("leave-room", (data) => this.handleLeaveRoom(socket, data))
		socket.on("submit-block", (data) => this.handleSubmitBlock(socket, data));
		socket.on("get-history", (data) => this.handleRequestHistory(socket, data));
		socket.on("request-time-travel", (data) => this.handleRequestTimeTravel(socket, data));
		socket.on("disconnect", (reason) => this.handleDisconnect(socket, reason));
	}

	private handleJoinRoom(socket: Socket, data: { roomId: string }) {
		try {
			roomManager.joinRoom(data.roomId, {
				userId: socket.user.userId,
				name: socket.user.name,
				socketId: socket.id
			});
		} catch (error) {
			logger.error("Error joining room", {
				error,
				socketId: socket.id,
				roomId: data.roomId,
			});
			socket.emit("error", { 
				message: "Failed to join room",
				code: "JOIN_ROOM_ERROR"
			});
		}
	}

	private handleLeaveRoom(socket: Socket, data: { roomId: string }) {
		try {
			const { roomId } = data;
			const room = roomManager.findRoomById(roomId);
			
			room?.playerManager.removePlayer(socket.id, room.id);
			socket.leave(roomId);

			logger.info("User left room", {
				name: socket.user.name,
				socketId: socket.id,
				roomId,
			});

			socket.emit("left-room", { message: "Left room successfully" });
		} catch (error) {
			logger.error("Error handling leave-room event", {
				error,
				socketId: socket.id,
				roomId: data.roomId,
			});
			socket.emit("error", { 
				message: "Failed to leave room",
				code: "LEAVE_ROOM_ERROR"
			});
		}
	}

	private handleDisconnect(socket: Socket, reason: string) {
		try {
			logger.info("User disconnected from WebRTC", {
				name: socket.user.name,
				socketId: socket.id,
				reason,
			});
			
			const room = roomManager.findRoomByUser(socket.id);

			if (room) {
				room.playerManager.removePlayer(socket.id, room.id);
			} else {
				logger.warn("Room not found during disconnect", {
					socketId: socket.id,
					reason,
				});
			}
		} catch (error) {
			logger.error("Error handling disconnect", {
				error,
				socketId: socket.id,
				reason,
			});
		}
	}

	private handleSubmitBlock(socket: Socket, data: HandleCellUpdateCallback) {
		try {
			const room = roomManager.findRoomById(data.roomId);
			room?.gameManager.submitCell(data.x, data.y, data.char, socket.id);
		} catch (error) {
			logger.error("Error submitting block", {
				error,
				socketId: socket.id,
				roomId: data.roomId,
			});
			socket.emit("error", { 
				message: "Failed to submit block",
				code: "SUBMIT_BLOCK_ERROR"
			});
		}
	}

	private handleRequestHistory(
		socket: Socket,
		data: HandleRequestHistoryCallback
	) {
		try {
			const room = roomManager.findRoomById(data.roomId);
			const history = room?.gameManager.getHistory();

			socket.emit("history", history);
		} catch (error) {
			logger.error("Error requesting history", {
				error,
				socketId: socket.id,
				roomId: data.roomId,
			});
			socket.emit("error", { 
				message: "Failed to get history",
				code: "GET_HISTORY_ERROR"
			});
		}
	}

	private handleRequestTimeTravel(socket: Socket, data: HandleRequestTimeTravelCallback) {
		try {
			const room = roomManager.findRoomById(data.roomId);
			room?.gameManager.requestTimeTravel(data.timestamp);
		} catch (error) {
			logger.error("Error requesting time travel", {
				error,
				socketId: socket.id,
				roomId: data.roomId,
			});
			socket.emit("error", { 
				message: "Failed to time travel",
				code: "TIME_TRAVEL_ERROR"
			});
		}
	}

	getSocketById(socketId: string): Socket | null {
		const socket = this.sockets.get(socketId);

		if (!socket) {
			logger.warn("Socket not found", { socketId });
			return null;
		}

		return socket;
	}

	getIO() {
		if (!this.io) {
			logger.error("Socket.io not initialized");
			return null;
		}
		return this.io;
	}
}

export const socketManager = SocketManager.getInstance();