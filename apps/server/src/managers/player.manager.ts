import type { User } from "@/utils/types";
import { logger } from "@/utils/logger";
import { roomManager } from "./room.manager";
import { socketManager } from "./socket.manager";

export class PlayerManager {
	private readonly players: Map<string, User> = new Map();
	private readonly roomId: string;

	constructor(roomId: string) {
		this.roomId = roomId;
	}

	addPlayer(user: User, roomId: string): boolean {
		try {
			this.players.set(user.socketId, user);
			const socket = socketManager.getSocketById(user.socketId);

			if (!socket) {
				logger.error("Socket not found when adding player", {
					socketId: user.socketId,
					roomId,
				});
				this.players.delete(user.socketId);
				return false;
			}

			socket.join(roomId);
			socket.emit("player-joined", user);

			logger.info(`Player ${user.name} joined room ${roomId}`);

			this.broadcastToRoom();
			return true;
		} catch (error) {
			logger.error("Error adding player", {
				error,
				userId: user.userId,
				roomId,
			});
			this.players.delete(user.socketId);
			return false;
		}
	}

	removePlayer(socketId: string, roomId: string): boolean {
		try {
			const user = this.players.get(socketId);

			if (!user) {
				logger.warn("User not found when removing player", {
					socketId,
					roomId,
				});
				return false;
			}

			this.players.delete(socketId);
			const socket = socketManager.getSocketById(socketId);

			if (socket) {
				socket.leave(roomId);
				socket.emit("player-left", user);
			} else {
				logger.warn("Socket not found when removing player", {
					socketId,
					roomId,
				});
			}

			logger.info(`Player ${user.name} left room ${roomId}`);
			this.broadcastToRoom();

			const onlineCount = this.getOnlineCount();

			if (onlineCount === 0) {
				roomManager.closeRoom(roomId);
				logger.info(`Room ${roomId} closed because it was empty`);
			}

			return true;
		} catch (error) {
			logger.error("Error removing player", { error, socketId, roomId });
			return false;
		}
	}

	getOnlineCount() {
		return this.players.size;
	}

	getPlayerList() {
		return Array.from(this.players.values());
	}

	findPlayerBySocket(playerId: string): User | undefined {
		return this.players.get(playerId);
	}

	hasPlayer(socketId: string): boolean {
		return this.findPlayerBySocket(socketId) !== undefined;
	}

	private broadcastToRoom() {
		try {
			const io = socketManager.getIO();

			if (!io) {
				logger.error("Socket.io not available for broadcast", {
					roomId: this.roomId,
				});
				return;
			}

			const count = this.getOnlineCount();
			const players = this.getPlayerList();
			io.to(this.roomId).emit("room-update", { count, players });
		} catch (error) {
			logger.error("Error broadcasting to room", {
				error,
				roomId: this.roomId,
			});
		}
	}
}