import type { CellUpdate } from "@/utils/types";
import { socketManager } from "./socket.manager";
import { logger } from "@/utils/logger";

const THOUSAND = 1000;

export class GameManager {
	private readonly size = 10;
	private readonly grid: string[][] = Array.from({ length: 10 }, () =>
		new Array(10).fill("")
	);
	private readonly history: CellUpdate[] = [];
	private readonly cooldowns: Map<string, number> = new Map();
	private readonly COOLDOWN_SECONDS = 60 * THOUSAND;
	private readonly roomId: string;

	constructor(roomId: string) {
		this.roomId = roomId;
	}

	// biome-ignore lint/suspicious/noExplicitAny: <>
	private broadcast(event: string, payload: any): boolean {
		try {
			const io = socketManager.getIO();

			if (!io) {
				logger.error("Socket.io not available for broadcast", {
					roomId: this.roomId,
					event,
				});
				return false;
			}

			io.to(this.roomId).emit(event, payload);
			return true;
		} catch (error) {
			logger.error("Error broadcasting event", {
				error,
				roomId: this.roomId,
				event,
			});
			return false;
		}
	}

	// biome-ignore lint/suspicious/noExplicitAny: <>
	private emitToPlayer(playerId: string, event: string, payload: any): boolean {
		try {
			const io = socketManager.getIO();

			if (!io) {
				logger.error("Socket.io not available for player emit", {
					playerId,
					event,
				});
				return false;
			}

			io.to(playerId).emit(event, payload);
			return true;
		} catch (error) {
			logger.error("Error emitting to player", {
				error,
				playerId,
				event,
			});
			return false;
		}
	}

	private isValidCell(x: number, y: number): boolean {
		return (
			x >= 0 &&
			y >= 0 &&
			x < this.size &&
			y < this.size &&
			this.grid[x] !== undefined
		);
	}

	private remainingCooldown(playerId: string): number {
		const lastTime = this.cooldowns.get(playerId);
		if (!lastTime) {
			return 0;
		}

		const elapsed = Date.now() - lastTime;
		return Math.max(0, this.COOLDOWN_SECONDS - elapsed);
	}

	private isInCooldown(playerId: string): boolean {
		const lastTime = this.cooldowns.get(playerId);
		if (!lastTime) {
			return false;
		}
		return Date.now() - lastTime < this.COOLDOWN_SECONDS;
	}

	submitCell(x: number, y: number, char: string, playerId: string): boolean {
		try {
			if (!this.isValidCell(x, y)) {
				logger.warn("Invalid cell coordinates", {
					x,
					y,
					playerId,
					roomId: this.roomId,
				});
				this.emitToPlayer(playerId, "error", {
					message: "Invalid cell coordinates",
					code: "INVALID_CELL",
				});
				return false;
			}

			if (this.isInCooldown(playerId)) {
				this.emitToPlayer(playerId, "restriction-active", {
					message: "You're still on cooldown.",
					remaining: this.remainingCooldown(playerId),
				});
				return false;
			}

			// biome-ignore lint/style/noNonNullAssertion: <>
			this.grid[x]![y] = char;

			const update: CellUpdate = {
				x,
				y,
				char,
				playerId,
				timestamp: Date.now(),
			};

			this.history.push(update);
			this.cooldowns.set(playerId, Date.now());

			this.broadcast("cell-submitted", update);

			this.emitToPlayer(playerId, "restriction-active", {
				message: "You're now on cooldown for 60 seconds.",
				remaining: this.COOLDOWN_SECONDS,
			});

			setTimeout(() => {
				this.emitToPlayer(playerId, "restriction-disabled", {
					message: "Cooldown finished! You can play again.",
				});
			}, this.COOLDOWN_SECONDS);

			logger.info("Cell submitted successfully", {
				x,
				y,
				playerId,
				roomId: this.roomId,
			});

			return true;
		} catch (error) {
			logger.error("Error submitting cell", {
				error,
				x,
				y,
				playerId,
				roomId: this.roomId,
			});
			this.emitToPlayer(playerId, "error", {
				message: "Failed to submit cell",
				code: "SUBMIT_CELL_ERROR",
			});
			return false;
		}
	}

	requestTimeTravel(timestamp: number): boolean {
		try {
			const restoredGrid = Array.from({ length: this.size }, () =>
				new Array(this.size).fill("")
			);

			for (const update of this.history) {
				if (update.timestamp <= timestamp) {
					// biome-ignore lint/style/noNonNullAssertion: <>
					restoredGrid[update.x]![update.y] = update.char;
				}
			}

			for (let i = 0; i < this.size; i++) {
				for (let j = 0; j < this.size; j++) {
					// biome-ignore lint/style/noNonNullAssertion: <>
					this.grid[i]![j] = restoredGrid[i]![j];
				}
			}

			const success = this.broadcast("time-travel-update", {
				grid: this.grid,
				timestamp,
			});

			if (success) {
				logger.info("Time travel completed", {
					timestamp,
					roomId: this.roomId,
				});
			}

			return success;
		} catch (error) {
			logger.error("Error during time travel", {
				error,
				timestamp,
				roomId: this.roomId,
			});
			this.broadcast("error", {
				message: "Failed to time travel",
				code: "TIME_TRAVEL_ERROR",
			});
			return false;
		}
	}

	getGrid(): string[][] {
		return this.grid;
	}

	getHistory(): CellUpdate[] {
		return this.history;
	}

	getRemainingCooldown(playerId: string): number {
		return this.remainingCooldown(playerId);
	}
}