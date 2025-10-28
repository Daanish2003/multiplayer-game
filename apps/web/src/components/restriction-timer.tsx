import { useEffect, useRef, useState } from "react";

const THOUSAND = 1000;

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

	return (
		<div className="flex w-fit items-center justify-center gap-3 rounded-2xl border px-5 py-2 backdrop-blur-sm transition-all duration-300 hover:border-primary hover:bg-primary-foreground">
			<div className="flex flex-col items-center">
				<h2 className="font-semibold text-primary text-xl tabular-nums">
					{formatTime(timeLeft)}
				</h2>
			</div>
		</div>
	);
}