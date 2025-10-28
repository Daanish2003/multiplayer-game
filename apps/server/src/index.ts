import "dotenv/config";
import cors from "cors";
import express from "express";
import http from "node:http"; // ✅ Required for socket.io
import { Server } from "socket.io";
import { logger } from "./utils/logger";
import HTTP_STATUS from "http-status";
import { socketManager } from "./managers/socket.manager";
import { roomManager } from "./managers/room.manager";

const app = express();
const PORT = process.env.PORT;


app.use(
	cors({
		origin: process.env.CORS_ORIGIN,
		methods: ["GET", "POST", "OPTIONS"],
	})
);
app.use(express.json());

app.get("/", (_req, res) => {
	res.status(HTTP_STATUS.OK).send("OK");
});

app.post("/api/v1/room/start-room", (req, res) => {
	try {
		const { userId, name } = req.body;

		if (!(userId && name)) {
			return res
				.status(HTTP_STATUS.BAD_REQUEST)
				.json({ error: "Missing required fields: userId or name" });
		}

		const availableRoom =
			roomManager.findAvailableRoom() || roomManager.createRoom();

		return res.status(HTTP_STATUS.CREATED).json({
			message: "Room started successfully",
			roomId: availableRoom.id,
		});
	} catch (error) {
		console.error(error);
		res
			.status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
			.json({ error: "Failed to start room" });
	}
});

const server = http.createServer(app);

const io = new Server(server, {
	cors: {
		origin: process.env.CORS_ORIGIN,
		methods: ["GET", "POST"],
	},
});

socketManager.initialize(io);

server.listen(PORT, () => {
	logger.info(`🚀 Server is running on port ${PORT}`);
});
