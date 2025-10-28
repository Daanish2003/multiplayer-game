import { useCallback, useEffect } from "react";
import { socket } from "@/lib/socket";
import { useGameStore } from "@/store/use-game-store";
import type { RequestTimeTravel, SubmitBlock } from "@/types/socket";
import { getUserInfo } from "@/helpers/fetch";

export function useGameSocket(roomId: string) {
	const { updateCell, setRoomState, setHasSubmitted, addMessage, timeTravel } =
		useGameStore();


	useEffect(() => {
		if (!roomId) {
            return
        };

		const handleConnect = () => {
			socket.emit("join-room", { roomId });
		};

		if (!socket.connected) {
			const { userId, name} = getUserInfo()
			if(!name) {
				throw new Error("Name not found")
			}
			socket.auth = { token: JSON.stringify({userId, name})}
			socket.once("connect", handleConnect);
			socket.connect();
		}

		socket.on("room-update", ({ count, players }) => {
			setRoomState(count, players);
		});

		socket.on("cell-submitted", (update) => {
			updateCell(update);
		});

		socket.on("restriction-active", (data) => {
			addMessage(data.message);
			setHasSubmitted(true);
		});

		socket.on("restriction-disabled", (data) => {
			addMessage(data.message);
			setHasSubmitted(false);
		});

		socket.on("player-joined", (player) => {
			addMessage(`${player.name} joined the game.`);
		});

		socket.on("player-left", (player) => {
			addMessage(`${player.name} left the game.`);
		});

		socket.on("time-travel-update", (data) => {
			timeTravel(data)
		})

		return () => {
			socket.off("connect", handleConnect);
			socket.off("room-update");
			socket.off("cell-submitted");
			socket.off("restriction-active");
			socket.off("restriction-disabled");
			socket.off("player-joined");
			socket.off("player-left");
		};
	}, [roomId]);

	const handleBlockSubmit = useCallback(
		(update: SubmitBlock) => {
			socket.emit("submit-block", update);
		},
		[]
	);

	const handleTimeTravel = useCallback(
		(data: RequestTimeTravel) => {
			socket.emit("request-time-travel", data);
		},
		[]
	);

	const handleLeaveRoom = useCallback(() => {
		socket.emit("leave-room", { roomId });
		socket.disconnect();
	}, [roomId]);

	const handleGetHistory = useCallback(() => {
		socket.emit("get-history", { roomId });
	}, [roomId]);


	return {
		handleBlockSubmit,
		handleLeaveRoom,
		handleGetHistory,
		handleTimeTravel
	}
}
