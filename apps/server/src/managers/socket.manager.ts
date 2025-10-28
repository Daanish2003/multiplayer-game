import type { Server, Socket } from "socket.io";
import { logger } from "../utils/logger";
import { roomManager } from "./room.manager";
import type {
	HandleCellUpdateCallback,
	HandleRequestHistoryCallback,
	HandleRequestTimeTravelCallback,
} from "@/utils/types";

class SocketManager {
	private static instance: SocketManager;
	private io: Server | null = null;
	private readonly sockets: Map<string, Socket> = new Map();
	private readonly userSocketMap: Map<string, string> = new Map();

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
			const userId = socket.user.userId;
			const oldSocketId = this.userSocketMap.get(userId);
			const oldSocket = oldSocketId ? this.sockets.get(oldSocketId) : undefined;

			if (oldSocket && oldSocket.id !== socket.id) {
				logger.info("Detected reconnection attempt", {
					userId,
					oldSocketId,
					newSocketId: socket.id,
				});
				this.handleReconnection(socket, oldSocket);
				return;
			}

			this.sockets.set(socket.id, socket);
			this.userSocketMap.set(userId, socket.id);

			this.setupSocketEventHandlers(socket);

			socket.emit("connected", {
				message: "Connected successfully",
				name: socket.user.name,
				userId: socket.user.userId,
				socketId: socket.id,
				queueStatus: "waiting",
			});

			logger.info("User connected", {
				name: socket.user.name,
				userId,
				socketId: socket.id,
			});
		} catch (error) {
			logger.error("Error handling socket connection", {
				error,
				name: socket.user.name,
				socketId: socket.id,
			});
			socket.emit("error", { message: "Failed to connect" });
			socket.disconnect(true);
		}
	}

	private handleReconnection(newSocket: Socket, oldSocket: Socket): void {
		const userId = newSocket.user.userId;

		try {
			logger.info("Handling reconnection", {
				userId,
				oldSocketId: oldSocket.id,
				newSocketId: newSocket.id,
			});

			const room = roomManager.findRoomByUser(userId);

			this.sockets.delete(oldSocket.id);
			this.sockets.set(newSocket.id, newSocket);
			this.userSocketMap.set(userId, newSocket.id);

			if (room) {
				room.playerManager.updatePlayerSocketId(userId, newSocket.id);
				newSocket.join(room.id);

				logger.info("User rejoined previous room", {
					roomId: room.id,
					userId,
					newSocketId: newSocket.id,
				});

				const remaining = room.gameManager.getRemainingCooldown(userId);
				if (remaining > 0) {
					newSocket.emit("restriction-active", {
						message: "You're still on cooldown.",
						remaining,
					});
					logger.info("Restriction active for reconnected user", {
						userId,
						roomId: room.id,
						remaining,
					});
				}

				const io = socketManager.getIO();
				if (io) {
					io.to(room.id).emit("player-reconnected", {
						userId,
						name: newSocket.user.name,
					});
				}
			} else {
				logger.warn("Reconnection attempted but room not found for user", {
					userId,
				});
			}

			oldSocket.removeAllListeners();
			oldSocket.disconnect(true);

			this.setupSocketEventHandlers(newSocket);

			newSocket.emit("reconnected", {
				message: "Reconnected successfully",
				userId,
				socketId: newSocket.id,
			});
		} catch (error) {
			logger.error("Error handling reconnection", { error, userId });
			newSocket.emit("error", { message: "Failed to reconnect" });
		}
	}

	private setupSocketEventHandlers(socket: Socket): void {
		socket.on("join-room", (data) => this.handleJoinRoom(socket, data));
		socket.on("leave-room", (data) => this.handleLeaveRoom(socket, data));
		socket.on("submit-block", (data) => this.handleSubmitBlock(socket, data));
		socket.on("get-history", (data) => this.handleRequestHistory(socket, data));
		socket.on("request-time-travel", (data) =>
			this.handleRequestTimeTravel(socket, data)
		);
		socket.on("disconnect", (reason) => this.handleDisconnect(socket, reason));
	}

	private handleJoinRoom(socket: Socket, data: { roomId: string }) {
		try {
			const { roomId } = data;

			const existingRoom = roomManager.findRoomByUser(socket.user.userId);
			if (existingRoom) {
				if (existingRoom.id === roomId) {
					logger.info("User already in the requested room", {
						userId: socket.user.userId,
						socketId: socket.id,
						roomId,
					});

					const gameState = existingRoom.gameManager.getCurrentState();
					const players = existingRoom.playerManager.getPlayerList();

					socket.emit("room-state", {
						roomId,
						gameState,
						players,
					});
					return;
				}

				logger.warn("User attempting to join room while in another room", {
					userId: socket.user.userId,
					socketId: socket.id,
					currentRoom: existingRoom.id,
					requestedRoom: roomId,
				});

				existingRoom.playerManager.removePlayer(socket.user.userId);
			}

			roomManager.joinRoom(roomId, {
				userId: socket.user.userId,
				name: socket.user.name,
				socketId: socket.id,
			});

			const room = roomManager.findRoomById(roomId);
			if (room) {
				const gameState = room.gameManager.getCurrentState();
				const players = room.playerManager.getPlayerList();

				socket.emit("room-state", {
					roomId,
					gameState,
					players,
				});
			}

			logger.info("User joined room", {
				name: socket.user.name,
				userId: socket.user.userId,
				socketId: socket.id,
				roomId,
			});
		} catch (error) {
			logger.error("Error joining room", {
				error,
				socketId: socket.id,
				userId: socket.user.userId,
				roomId: data.roomId,
			});
			socket.emit("error", {
				message: "Failed to join room",
				code: "JOIN_ROOM_ERROR",
			});
		}
	}

	private handleLeaveRoom(socket: Socket, data: { roomId: string }) {
		try {
			const { roomId } = data;
			const room = roomManager.findRoomById(roomId);

			if (room) {
				room.playerManager.removePlayer(socket.user.userId);

				logger.info("User left room", {
					name: socket.user.name,
					userId: socket.user.userId,
					socketId: socket.id,
					roomId,
				});

				socket.emit("left-room", { message: "Left room successfully" });
			} else {
				logger.warn("Attempted to leave non-existent room", {
					socketId: socket.id,
					userId: socket.user.userId,
					roomId,
				});
			}
		} catch (error) {
			logger.error("Error handling leave-room event", {
				error,
				socketId: socket.id,
				userId: socket.user.userId,
				roomId: data.roomId,
			});
			socket.emit("error", {
				message: "Failed to leave room",
				code: "LEAVE_ROOM_ERROR",
			});
		}
	}

	private handleDisconnect(socket: Socket, reason: string) {
		try {
			const userId = socket.user.userId;
			const userName = socket.user.name;
			const room = roomManager.findRoomByUser(userId);

			logger.info("User disconnected", {
				name: userName,
				userId,
				socketId: socket.id,
				reason,
			});

			if (!room) {
				logger.warn("Room not found during disconnect", {
					socketId: socket.id,
					userId,
					reason,
				});
				this.userSocketMap.delete(userId);
				this.sockets.delete(socket.id);
				return;
			}

			const GRACE_PERIOD_MS = 5000;

			const disconnectTimer = setTimeout(() => {
				const currentSocketId = this.userSocketMap.get(userId);

				if (currentSocketId === socket.id) {
					logger.info("User not reconnected — removing from room", {
						userId,
						socketId: socket.id,
						roomId: room.id,
					});

					room.playerManager.removePlayer(userId);
					this.userSocketMap.delete(userId);
					this.sockets.delete(socket.id);

					const io = socketManager.getIO();
					if (io) {
						io.to(room.id).emit("player-left", {
							userId,
							name: userName,
						});
					}
				} else {
					logger.info("User reconnected — keeping in room", {
						userId,
						oldSocketId: socket.id,
						newSocketId: currentSocketId,
						roomId: room.id,
					});
				}
			}, GRACE_PERIOD_MS);

			socket.data.disconnectTimer = disconnectTimer;
		} catch (error) {
			logger.error("Error handling disconnect", {
				error,
				socketId: socket.id,
				userId: socket.user?.userId,
				reason,
			});
		}
	}

	private handleSubmitBlock(socket: Socket, data: HandleCellUpdateCallback) {
		try {
			const room = roomManager.findRoomById(data.roomId);

			if (!room) {
				socket.emit("error", {
					message: "Room not found",
					code: "ROOM_NOT_FOUND",
				});
				return;
			}

			if (!room.playerManager.hasPlayer(socket.user.userId)) {
				socket.emit("error", {
					message: "You are not in this room",
					code: "NOT_IN_ROOM",
				});
				return;
			}

			room.gameManager.submitCell(
				data.x,
				data.y,
				data.char,
				socket.user.userId
			);
		} catch (error) {
			logger.error("Error submitting block", {
				error,
				socketId: socket.id,
				userId: socket.user.userId,
				roomId: data.roomId,
			});
			socket.emit("error", {
				message: "Failed to submit block",
				code: "SUBMIT_BLOCK_ERROR",
			});
		}
	}

	private handleRequestHistory(
		socket: Socket,
		data: HandleRequestHistoryCallback
	) {
		try {
			const room = roomManager.findRoomById(data.roomId);

			if (!room) {
				socket.emit("error", {
					message: "Room not found",
					code: "ROOM_NOT_FOUND",
				});
				return;
			}

			const history = room.gameManager.getHistory();
			socket.emit("history", history);
		} catch (error) {
			logger.error("Error requesting history", {
				error,
				socketId: socket.id,
				userId: socket.user.userId,
				roomId: data.roomId,
			});
			socket.emit("error", {
				message: "Failed to get history",
				code: "GET_HISTORY_ERROR",
			});
		}
	}

	private handleRequestTimeTravel(
		socket: Socket,
		data: HandleRequestTimeTravelCallback
	) {
		try {
			const room = roomManager.findRoomById(data.roomId);

			if (!room) {
				socket.emit("error", {
					message: "Room not found",
					code: "ROOM_NOT_FOUND",
				});
				return;
			}

			room.gameManager.requestTimeTravel(data.timestamp);
		} catch (error) {
			logger.error("Error requesting time travel", {
				error,
				socketId: socket.id,
				userId: socket.user.userId,
				roomId: data.roomId,
			});
			socket.emit("error", {
				message: "Failed to time travel",
				code: "TIME_TRAVEL_ERROR",
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

	getSocketByUserId(userId: string): Socket | null {
		const socketId = this.userSocketMap.get(userId);
		if (!socketId) {
			logger.warn("No socket found for user", { userId });
			return null;
		}
		return this.getSocketById(socketId);
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