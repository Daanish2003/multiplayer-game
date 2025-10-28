import { env } from "@/lib/env";
import { v4 as uuidv4 } from "uuid";

export const getUserInfo = () => {
	let userId = localStorage.getItem("userId");
	const name = localStorage.getItem("userName");

	if (!userId) {
		userId = uuidv4();
		localStorage.setItem("userId", userId);
	}

	if (name) {
		return { userId, name };
	}

	return { userId };
};


export const setUserInfo = (userId: string, name?: string) => {
	localStorage.setItem("userId", userId);
	if (name) {
		localStorage.setItem("userName", name);
	}
};


export const startRoom = async (name: string): Promise<string> => {
	const existing = getUserInfo();
	const userId = existing.userId;

	setUserInfo(userId, name);

	const res = await fetch(
		`${env.NEXT_PUBLIC_SERVER_URL}/api/v1/room/start-room`,
		{
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ userId, name }),
		}
	);

	if (!res.ok) {
		const data = await res.json();
		throw new Error(data.error || "Failed to start room");
	}

	const data = await res.json();
	return data.roomId as string;
};
