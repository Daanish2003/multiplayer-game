import Header from "@/components/header";
import StartGameCard from "@/components/start-game-start";

export default function Home() {
	return (
		<div className="flex min-h-screen items-center justify-center px-4">
			<div className="w-full max-w-md">
				<Header />
				<StartGameCard />
			</div>			
		</div>
	);
}
