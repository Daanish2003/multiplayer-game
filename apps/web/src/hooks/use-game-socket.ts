"use client";

import { useCallback, useEffect } from "react";
import { socket } from "@/lib/socket";
import { useGameStore } from "@/store/use-game-store";
import type {
	RequestTimeTravel,
	SubmitBlock,
	RoomStatePayload,
} from "@/types/socket";
import { clearUserInfo, getUserInfo } from "@/helpers/fetch";
import { useRouter } from "next/navigation";

export function useGameSocket(roomId: string) {
	const router = useRouter();

	const {
		updateCell,
		setRoomState,
		addPlayer,
		removePlayer,
		setHasSubmitted,
		addMessage,
		timeTravel,
		setCooldownTime,
		resetGame,
	} = useGameStore();

	useEffect(() => {
		if (!roomId) {
			return;
		}

		const handleConnect = () => {
			socket.emit("join-room", { roomId });
		};

		if (!socket.connected) {
			const { userId, name } = getUserInfo();
			if (!name) {
				throw new Error("Name not found");
			}
			socket.auth = { token: JSON.stringify({ userId, name }) };
			socket.once("connect", handleConnect);
			socket.connect();
		}

		socket.on("room-state", (data: RoomStatePayload) => {
			setRoomState(data.players.length, data.players, data.gameState.history);
			timeTravel({
				grid: data.gameState.grid,
				timestamp: data.gameState.timestamp,
			});
			addMessage(
				`Room synchronized at ${new Date(data.gameState.timestamp).toLocaleTimeString()}`
			);
		});

		socket.on("cell-submitted", (update) => {
			updateCell(update);
		});

		socket.on("restriction-active", (data) => {
			addMessage(data.message);
			setHasSubmitted(true);
			if (data.remaining) {
				setCooldownTime(data.remaining);
			}
		});

		socket.on("restriction-disabled", (data) => {
			addMessage(data.message);
			setHasSubmitted(false);
		});

		socket.on("left-room", () => {
			resetGame();
			clearUserInfo()
			router.push("/");
		});

		socket.on("player-joined", (player) => {
			addPlayer(player);
			addMessage(`${player.name} joined the game.`);
		});

		socket.on("player-left", (player) => {
			removePlayer(player.userId);
			addMessage(`${player.name} left the game.`);
		});

		socket.on("left-room", (data) => {
			addMessage(data.message);
			socket.disconnect();
			router.push("/");
		});

		socket.on("time-travel-update", (data) => {
			timeTravel(data);
		});

		socket.on("error", (data) => {
			console.error(data);
			addMessage(`Error: ${data.message}`);
		});

		return () => {
			socket.off("connect", handleConnect);
			socket.off("room-update");
			socket.off("room-state");
			socket.off("cell-submitted");
			socket.off("restriction-active");
			socket.off("restriction-disabled");
			socket.off("player-joined");
			socket.off("player-left");
			socket.off("left-room");
			socket.off("time-travel-update");
			socket.off("error");
			socket.off("history");
		};
	}, [
		roomId,
	]);

	const handleBlockSubmit = useCallback((update: SubmitBlock) => {
		socket.emit("submit-block", update);
	}, []);

	const handleTimeTravel = useCallback((data: RequestTimeTravel) => {
		socket.emit("request-time-travel", data);
	}, []);

	const handleLeaveRoom = useCallback(() => {
		socket.emit("leave-room", { roomId });
	}, [roomId]);

	const handleGetHistory = useCallback(() => {
		socket.emit("get-history", { roomId });
	}, [roomId]);

	return {
		handleBlockSubmit,
		handleLeaveRoom,
		handleGetHistory,
		handleTimeTravel,
	};
}
