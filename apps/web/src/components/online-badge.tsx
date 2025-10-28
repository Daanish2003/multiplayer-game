import { Badge } from "./ui/badge";


export function OnlineBadge({ count }: { count: number }) {
	return (
		<Badge className="gap-2 bg-linear-to-r from-green-500 to-emerald-500 px-3 py-1.5 text-white">
			<div className="h-2 w-2 animate-pulse rounded-full bg-white" />
			<span className="font-semibold">{count} online</span>
		</Badge>
	);
}