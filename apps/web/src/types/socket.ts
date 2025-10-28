
export type CellUpdate = {
	x: number;
	y: number;
	char: string;
	playerId: string;
	timestamp: number;
};

export type User = {
	socketId: string;
	userId: string;
	name: string;
};

export type RoomUpdatePayload = {
	count: number;
	players: User[];
};

export type RestrictionPayload = {
	message: string;
	remaining?: number;
};

export type TimeTravelOutputPayload = {
	grid: string[][];
	timestamp: number;
};


export type SubmitBlock = {
		x: number;
		y: number;
		char: string;
		roomId: string;
	};

export type RequestTimeTravel = {
		timestamp: number;
        roomId: string
	};

export type ServerToClientEvents = {
	"room-update": (data: RoomUpdatePayload) => void;
	"cell-submitted": (update: CellUpdate) => void;
	"restriction-active": (data: RestrictionPayload) => void;
	"restriction-disabled": (data: RestrictionPayload) => void;
	"player-joined": (player: User) => void;
	"player-left": (player: User) => void;
    "time-travel-update": (data: TimeTravelOutputPayload) => void
}

export type ClientToServerEvents = {
		"join-room": (data: { roomId: string }) => void;
		"leave-room": (data: { roomId: string }) => void;
		"submit-block": (data: SubmitBlock) => void;
        "get-history": (data: { roomId : string}) => void
		"request-time-travel": (data: RequestTimeTravel) => void;
	};
