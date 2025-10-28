export type User = {
	socketId: string;
	userId: string
	name: string;
};

export type CellUpdate = {
	x: number;
	y: number;
	char: string;
	playerId: string;
	timestamp: number;
};


export type HandleCellUpdateCallback = {
		x: number;
		y: number;
		char: string;
		roomId: string
};


export type HandleRequestHistoryCallback = {
	roomId: string,
}

export type HandleRequestTimeTravelCallback = {
		timestamp: number;
		roomId: string;
	};






