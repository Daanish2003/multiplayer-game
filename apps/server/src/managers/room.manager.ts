import { Room } from "@/module/room";
import type { User } from "@/utils/types";
import { logger } from "@/utils/logger";

export class RoomManager {
	private static instance: RoomManager;
	private readonly rooms: Map<string, Room> = new Map();

	static getInstance() {
		if (!RoomManager.instance) {
			RoomManager.instance = new RoomManager();
		}
		return RoomManager.instance;
	}

	createRoom() {
		const roomId = `room-${Date.now()}`;
		const room = new Room(roomId);
		this.rooms.set(roomId, room);
		return room;
	}

	joinRoom(roomId: string, user: User): boolean {
		const room = this.rooms.get(roomId);
		if (!room) {
			logger.error("Room not found for join", { roomId, userId: user.userId });
			return false;
		}

		try {
			room.playerManager.addPlayer(user);
			return true;
		} catch (error) {
			logger.error("Error adding player to room", {
				error,
				roomId,
				userId: user.userId,
			});
			return false;
		}
	}

	closeRoom(roomId: string) {
		this.rooms.delete(roomId);
		logger.info("Room closed", { roomId });
	}

	findAvailableRoom(): Room | null {
		for (const room of this.rooms.values()) {
			if (!room.isFull()) {
				return room;
			}
		}
		return null;
	}

	findRoomByUser(userId: string): Room | null {
		for (const room of this.rooms.values()) {
			if (room.playerManager.hasPlayer(userId)) {
				return room;
			}
		}
		return null;
	}

	findRoomById(roomId: string): Room | null {
		const room = this.rooms.get(roomId);
		if (!room) {
			logger.warn("Room not found", { roomId });
			return null;
		}
		return room;
	}
}

export const roomManager = RoomManager.getInstance();