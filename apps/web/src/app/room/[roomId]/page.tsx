"use client"
import { useParams } from "next/navigation";
import GameRoom from "@/components/game-room";

export default function GameRoomPage() {
	const { roomId } = useParams();

	return <GameRoom roomId={roomId as string} />;
}
