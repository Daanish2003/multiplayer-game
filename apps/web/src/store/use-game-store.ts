import type { CellUpdate, TimeTravelOutputPayload, User } from "@/types/socket";
import { create } from "zustand";
import { combine } from "zustand/middleware";

export const useGameStore = create(
	combine(
		{
			grid: Array.from({ length: 10 }, () => new Array(10).fill("")),
			players: [] as User[],
			onlineCount: 0,
			playerId: null as string | null,
			hasSubmitted: false,
			messages: [] as string[],
		},
		(set) => ({
			updateCell: (update: CellUpdate) =>
				set((state) => {
					const nextGrid = [...state.grid];
					nextGrid[update.x][update.y] = update.char;
					return { grid: nextGrid };
				}),

			setRoomState: (count: number, players: User[]) =>
				set({ onlineCount: count, players }),

			setPlayerId: (id: string) => set({ playerId: id }),

			setHasSubmitted: (flag: boolean) => set({ hasSubmitted: flag }),

			addMessage: (msg: string) =>
				set((state) => ({ messages: [...state.messages, msg] })),

			timeTravel: (payload: TimeTravelOutputPayload) =>
				set(() => ({
					grid: payload.grid,
				})),
		})
	)
);
