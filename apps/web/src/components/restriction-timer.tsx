import { Clock, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const THOUSAND = 1000;
const FIFTY_SIX = 56;
const HUNDERED = 100

export function RestrictionTimer({
	restrictionSeconds = 60,
	restrictionTrigger = null,
	onRestrictionStart,
	onRestrictionEnd,
}: {
	restrictionSeconds?: number;
	restrictionTrigger?: number | null;
	onRestrictionStart?: () => void;
	onRestrictionEnd?: () => void;
}) {
	const [timeLeft, setTimeLeft] = useState<number>(0);
	const timerRef = useRef<NodeJS.Timeout | null>(null);
	const lastTriggerRef = useRef<number | null>(null);

	useEffect(() => {
		if (restrictionTrigger == null) { 
            return; 
        }
		if (lastTriggerRef.current === restrictionTrigger) { 
            return; 
        }

		lastTriggerRef.current = restrictionTrigger;
		setTimeLeft(restrictionSeconds);
		onRestrictionStart?.();

		if (timerRef.current) { 
            clearInterval(timerRef.current); 
        }

		timerRef.current = setInterval(() => {
			setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
		}, THOUSAND);

		return () => {
			if (timerRef.current) { 
                clearInterval(timerRef.current);
            }
		};
	}, [restrictionTrigger, restrictionSeconds, onRestrictionStart]);

	useEffect(() => {
		if (timeLeft === 0 && timerRef.current) {
			clearInterval(timerRef.current);
			timerRef.current = null;
			onRestrictionEnd?.();
		}
	}, [timeLeft, onRestrictionEnd]);

	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
	};

	const percentage =
		((restrictionSeconds - timeLeft) / restrictionSeconds) * HUNDERED;

	return (
		<div className="flex flex-col items-center gap-3">
			{timeLeft > 0 ? (
				<>
					<div className="relative">
						<div className="flex h-32 w-32 items-center justify-center rounded-full border-8 border-blue-100 bg-linear-to-br from-blue-50 to-indigo-50 shadow-lg">
							<div className="text-center">
								<Clock className="mx-auto mb-1 h-6 w-6 text-blue-600" />
								<p className="font-bold font-mono text-2xl text-blue-600">
									{formatTime(timeLeft)}
								</p>
							</div>
						</div>
						<svg
							className="-rotate-90 absolute top-0 left-0"
							width="128"
							height="128"
						>
							<circle
								cx="64"
								cy="64"
								r="56"
								stroke="#3b82f6"
								strokeWidth="8"
								fill="none"
								strokeDasharray={`${2 * Math.PI * FIFTY_SIX}`}
								strokeDashoffset={`${2 * Math.PI * FIFTY_SIX * (1 - percentage / HUNDERED)}`}
								className="transition-all duration-1000"
							/>
						</svg>
					</div>
					<div className="text-center">
						<p className="font-medium text-slate-700 text-sm">
							Cooldown Active
						</p>
						<p className="text-slate-500 text-xs">
							Wait to place another emoji
						</p>
					</div>
				</>
			) : (
				<div className="flex flex-col items-center gap-2 rounded-xl bg-linear-to-br from-green-50 to-emerald-50 p-6 shadow-md">
					<div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500">
						<Sparkles className="h-8 w-8 text-white" />
					</div>
					<p className="font-semibold text-green-700">Ready!</p>
					<p className="text-center text-green-600 text-xs">
						Click any cell to place an emoji
					</p>
				</div>
			)}
		</div>
	);
}