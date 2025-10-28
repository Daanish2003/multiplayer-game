"use client"
import { useState, type FormEvent } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { startRoom } from "@/helpers/fetch";
import { useRouter } from "next/navigation";
import type { Route } from "next";

export default function StartGameCard() {
	const [playerName, setPlayerName] = useState("");
	const [error, setError] = useState("");
	const router = useRouter()


	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();

		if (!playerName.trim()) {
			setError("Please enter your name");
			return;
		}

		const roomId = await startRoom(playerName)

		router.push(`/room/${roomId}` as Route)
	}

	return (
		<div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
			<div className="mb-8">
				<h2 className="mb-2 font-semibold text-2xl text-slate-900">Welcome!</h2>
				<p className="text-slate-600">
					Enter your name to join the multiplayer puzzle grid and start placing
					Unicode characters.
				</p>
			</div>
			{/* Form */}
			<form className="space-y-6" onSubmit={handleSubmit}>
				<div>
					<label
						className="mb-2 block font-medium text-slate-700 text-sm"
						htmlFor="name"
					>
						Your Name
					</label>
					<Input
						id="name"
						type="text"
						value={playerName}
						placeholder="Enter your name"
						onChange={(e) => {
							setPlayerName(e.target.value);
							setError("");
						}}
						className="w-full rounded-lg border border-slate-300 px-4 py-3 transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
					/>
					{error && <p className="mt-2 text-red-500 text-sm">{error}</p>}
				</div>
				<Button
					type="submit"
					className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white transition duration-200 hover:bg-blue-700"
				>
					Start Game
				</Button>
			</form>
			{/* Info Section */}
			<div className="mt-8 border-slate-200 border-t pt-8">
				<h3 className="mb-4 font-semibold text-slate-900">How it works:</h3>
				<ul className="space-y-3 text-slate-600 text-sm">
					<li className="flex items-start gap-3">
						<span className="font-bold text-blue-600">1.</span>
						<span>Join the 10x10 grid with other players</span>
					</li>
					<li className="flex items-start gap-3">
						<span className="font-bold text-blue-600">2.</span>
						<span>Select a block and add a Unicode character</span>
					</li>
					<li className="flex items-start gap-3">
						<span className="font-bold text-blue-600">3.</span>
						<span>See updates in real-time from other players</span>
					</li>
				</ul>
			</div>
		</div>
	);
}