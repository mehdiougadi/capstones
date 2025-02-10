import {
    BASE_10,
    END_INDEX_SUBSTRING,
    ERROR_NAME_ALREADY_EXIST,
    ERROR_NAME_CANT_BE_EMPTY,
    ERROR_NAME_IS_BAN,
    LOBBY_ID_LENGTH,
    LOBBY_IS_CLOSE,
    LOBBY_NOT_EXISTING,
    START_INDEX_SUBSTRING,
    State,
} from '@app/app.constants';
import { Lobby } from '@app/model/database/lobby';
import { Player } from '@app/model/database/player';
import { GameService } from '@app/services/game/game.service';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class LobbyService {
    constructor(
        @Inject('SharedLobbies') private lobbies: { [lobby: string]: Lobby },
        private gameService: GameService,
    ) {}

    async createLobby(gameId: string): Promise<string> {
        let lobbyId: string = this.generateRandomLobbyId();
        while (this.lobbies[lobbyId]) {
            lobbyId = this.generateRandomLobbyId();
        }
        try {
            const game = await this.gameService.getGame(gameId, State.CreateLobby);
            this.lobbies[lobbyId] = new Lobby(lobbyId, game, this.getDate());
            return lobbyId;
        } catch (error) {
            throw new Error(error);
        }
    }

    lockLobby(lobbyId: string, isLocked: boolean) {
        this.lobbies[lobbyId].isLocked = isLocked;
    }

    addSocketToLobby(lobbyId: string, id: string) {
        this.lobbies[lobbyId].sockets.push(id);
    }
    checkIfJoinable(lobbyId: string): string {
        if (!this.lobbies[lobbyId]) {
            return LOBBY_NOT_EXISTING;
        } else if (this.lobbies[lobbyId].isLocked) {
            return LOBBY_IS_CLOSE;
        }
        return '';
    }

    deleteLobby(lobbyId: string) {
        delete this.lobbies[lobbyId];
    }

    addPlayerToLobby(lobbyId: string, playerName: string, id: string): void {
        this.lobbies[lobbyId].players.set(playerName.toLowerCase(), new Player(playerName, id));
    }

    deletePlayerFromLobby(lobbyId: string, playerName: string): void {
        if (playerName) {
            const points = this.lobbies[lobbyId].players.get(playerName).points;
            this.lobbies[lobbyId].highestScore = this.lobbies[lobbyId].highestScore < points ? points : this.lobbies[lobbyId].highestScore;
            this.lobbies[lobbyId].players.delete(playerName);
        }
    }

    getPLayersFromLobby(lobby: string): string[] {
        return [...this.lobbies[lobby].players.values()].map((player) => player.name);
    }

    checkPlayerName(lobbyId: string, playerName: string): string {
        if (!playerName) {
            return ERROR_NAME_CANT_BE_EMPTY;
        }

        if (this.lobbies[lobbyId].players.has(playerName.toLowerCase())) {
            return ERROR_NAME_ALREADY_EXIST;
        }

        for (const name of this.lobbies[lobbyId].nameBan) {
            if (name === playerName.toLowerCase()) {
                return ERROR_NAME_IS_BAN;
            }
        }
        return '';
    }

    getGameIdFromLobby(lobbyId: string) {
        return this.lobbies[lobbyId].game.id;
    }

    addBannedPlayer(lobbyId: string, playerName: string): string {
        this.lobbies[lobbyId].nameBan.push(playerName);
        return this.lobbies[lobbyId].players.get(playerName.toLowerCase()).id;
    }

    getSocketIdInLobby(lobbyId: string): string[] {
        return this.lobbies[lobbyId].sockets;
    }

    isInGame(lobbyId: string): boolean {
        return this.lobbies[lobbyId]?.inGame;
    }

    setInGame(lobbyId: string): void {
        this.lobbies[lobbyId].inGame = true;
        this.lobbies[lobbyId].numberOfPlayersAtTheBeginning = this.lobbies[lobbyId].players.size;
    }

    removeSocketIdFromLobby(id: string, lobbyId: string): void {
        if (this.lobbies[lobbyId]) {
            this.lobbies[lobbyId].sockets = this.lobbies[lobbyId].sockets.filter((socketId) => socketId !== id);
        }
    }

    private generateRandomLobbyId(): string {
        let lobbyId = '';
        lobbyId = '';
        while (lobbyId.length < LOBBY_ID_LENGTH) {
            const randomChar = Math.random().toString(BASE_10).substring(START_INDEX_SUBSTRING, END_INDEX_SUBSTRING);
            if (randomChar) {
                lobbyId += randomChar;
            }
        }
        return lobbyId;
    }

    private getDate(): string {
        const date = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }));

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }
}
