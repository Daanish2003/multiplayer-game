import type { User } from "@/utils/types";
import { logger } from "@/utils/logger";
import { roomManager } from "./room.manager";
import { socketManager } from "./socket.manager";

export class PlayerManager {
	private readonly players: Map<string, User> = new Map(); // userId -> User
	private readonly roomId: string;

	constructor(roomId: string) {
		this.roomId = roomId;
	}

	addPlayer(user: User): boolean {
		try {
			const existingPlayer = this.players.get(user.userId);

			if (existingPlayer) {
				logger.info("Player already in room, updating socket ID", {
					userId: user.userId,
					oldSocketId: existingPlayer.socketId,
					newSocketId: user.socketId,
					roomId: this.roomId,
				});
				existingPlayer.socketId = user.socketId;
				this.players.set(user.userId, existingPlayer);
			} else {
				this.players.set(user.userId, user);
			}

			const socket = socketManager.getSocketById(user.socketId);
			if (!socket) {
				logger.error("Socket not found when adding player", {
					socketId: user.socketId,
					roomId: this.roomId,
				});
				this.players.delete(user.userId);
				return false;
			}

			socket.join(this.roomId);

			socket.to(this.roomId).emit("player-joined", {
				...user,
				roomId: this.roomId,
				isReconnect: !!existingPlayer,
			});

			logger.info(`Player ${user.name} joined room ${this.roomId}`);
			return true;
		} catch (error) {
			logger.error("Error adding player", {
				error,
				userId: user.userId,
				roomId: this.roomId,
			});
			this.players.delete(user.userId);
			return false;
		}
	}

	removePlayer(userId: string): boolean {
		try {
			const user = this.players.get(userId);

			if (!user) {
				logger.warn("User not found when removing player", {
					userId,
					roomId: this.roomId,
				});
				return false;
			}

			this.players.delete(userId);
			const socket = socketManager.getSocketById(user.socketId);

			if (socket) {
				socket.to(this.roomId).emit("player-left", user);
				if (socket.rooms.has(this.roomId)) {
					logger.info(`User ${socket.id} is in room ${this.roomId}`);
				} else {
					logger.info(`User ${socket.id} is NOT in room ${this.roomId}`);
				}
				socket.leave(this.roomId);
			} else {
				logger.warn("Socket not found when removing player", {
					userId,
					roomId: this.roomId,
				});
			}

			logger.info(`Player ${user.name} left room ${this.roomId}`);

			if (this.getOnlineCount() === 0) {
				roomManager.closeRoom(this.roomId);
				logger.info(`Room ${this.roomId} closed because it was empty`);
			}

			return true;
		} catch (error) {
			logger.error("Error removing player", {
				error,
				userId,
				roomId: this.roomId,
			});
			return false;
		}
	}

	updatePlayerSocketId(userId: string, newSocketId: string): void {
		const player = this.players.get(userId);
		if (player) {
			const oldSocketId = player.socketId;
			player.socketId = newSocketId;
			this.players.set(userId, player);
			logger.info("Updated player socket ID", {
				userId,
				oldSocketId,
				newSocketId,
				roomId: this.roomId,
			});
		}
	}

	getOnlineCount(): number {
		return this.players.size;
	}

	getPlayerList(): User[] {
		return Array.from(this.players.values());
	}

	findPlayerBySocket(socketId: string): User | undefined {
		return Array.from(this.players.values()).find(
			(p) => p.socketId === socketId
		);
	}

	findPlayerByUserId(userId: string): User | undefined {
		return this.players.get(userId);
	}

	hasPlayer(userId: string): boolean {
		return this.players.has(userId);
	}
}
