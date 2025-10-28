import { GameManager } from "@/managers/game.manager"
import { PlayerManager } from '../managers/player.manager';

export class Room {
		id: string;
		gameManager: GameManager;
		playerManager: PlayerManager;
		maxPlayers = 10;

		constructor(id: string) {
			this.id = id;
			this.gameManager = new GameManager(this.id);
			this.playerManager = new PlayerManager(this.id);
		}

		isFull() {
			return this.playerManager.getOnlineCount() >= this.maxPlayers;
		}
	}