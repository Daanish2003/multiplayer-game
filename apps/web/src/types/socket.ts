
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

export type GameState = {
	grid: string[][];
	history: CellUpdate[];
	roomId: string;
	timestamp: number;
};

export type RoomStatePayload = {
	roomId: string;
	gameState: GameState;
	players: User[];
};

export type LeftRoomPayload = {
	message: string;
};

export type PlayerJoinedPayload = User & {
	roomId: string;
	isReconnect: boolean;
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

export type ErrorPayload = {
	message: string
	code?: string
}

export type HistoryPayload = {
	history: CellUpdate[];
	roomId: string;
};

export type ServerToClientEvents = {
		"room-state": (data: RoomStatePayload) => void;
		"left-room": (data: LeftRoomPayload) => void;
		"cell-submitted": (update: CellUpdate) => void;
		"restriction-active": (data: RestrictionPayload) => void;
		"restriction-disabled": (data: RestrictionPayload) => void;
		"player-joined": (player: User) => void;
		"player-left": (player: User) => void;
		"time-travel-update": (data: TimeTravelOutputPayload) => void;
		error: (data: ErrorPayload) => void;
	};

export type ClientToServerEvents = {
		"join-room": (data: { roomId: string }) => void;
		"leave-room": (data: { roomId: string }) => void;
		"submit-block": (data: SubmitBlock) => void;
		"request-time-travel": (data: RequestTimeTravel) => void;
	};
