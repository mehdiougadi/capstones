import {
    EmitMessageType,
    ORG_BANNED_NAME,
    SubscribeMessageType,
    logClientConnectedToServer,
    logClientDisconnectedFromServer,
    logPlayerLeavingRoom,
    logRoomCreation,
    logRoomDestroy,
    logRoomJoining,
    logSocketLeavingRoom,
} from '@app/app.constants';
import { LobbyService } from '@app/services/lobby/lobby/lobby.service';
import { Inject, Logger } from '@nestjs/common';
import { OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
@WebSocketGateway({ cors: true })
export class LobbyGateway implements OnGatewayDisconnect, OnGatewayConnection {
    @WebSocketServer() server: Server;
    constructor(
        @Inject('SharedRooms') private rooms: { [key: string]: string },
        private lobbyService: LobbyService,
        private logger: Logger,
    ) {}

    @SubscribeMessage(SubscribeMessageType.CreateRoom)
    async handleCreateRoom(client: Socket, gameId: string) {
        try {
            const lobbyId: string = await this.lobbyService.createLobby(gameId);
            this.logger.log(logRoomCreation(lobbyId));
            this.rooms[client.id] = lobbyId;
            client.join(lobbyId);
            client.data = { playerName: 'Organisateur' };
            this.lobbyService.addSocketToLobby(lobbyId, client.id);
        } catch (error) {
            client.emit(EmitMessageType.RoomCreation, { success: false, message: "La session n'a pas pu être créée, " + error });
        }
        client.emit(EmitMessageType.RoomCreation, { success: true, message: 'La session a été créée avec succès!' });
    }

    @SubscribeMessage(SubscribeMessageType.CheckRoom)
    handleJoin(client: Socket, lobbyId: string) {
        const answer: string = this.lobbyService.checkIfJoinable(lobbyId);
        if (answer) {
            client.emit(EmitMessageType.RoomJoining, { success: false, message: answer });
            return;
        }
        this.rooms[client.id] = lobbyId;
        client.join(lobbyId);
        this.logger.log(logRoomJoining(client.id, lobbyId));
        this.lobbyService.addSocketToLobby(lobbyId, client.id);
        client.emit(EmitMessageType.RoomJoining, { success: true, message: 'Vous avez rejoint la session ' + lobbyId + ' avec succès!' });
    }

    @SubscribeMessage(SubscribeMessageType.JoinRoom)
    handleChooseName(client: Socket, playerName: string) {
        const lobbyId: string = this.rooms[client.id];
        const answer: string = this.lobbyService.checkPlayerName(lobbyId, playerName);
        if (answer) {
            client.emit(EmitMessageType.ChooseNameError, answer);
        } else {
            this.lobbyService.addPlayerToLobby(lobbyId, playerName, client.id);
            client.data = { playerName };
            client.emit(EmitMessageType.ValidName);
            this.server.to(lobbyId).emit(EmitMessageType.NewPlayer, this.lobbyService.getPLayersFromLobby(lobbyId));
        }
    }

    @SubscribeMessage(SubscribeMessageType.StartGame)
    handleStartGame(client: Socket) {
        const lobbyId = this.rooms[client.id];
        const ids = this.lobbyService.getSocketIdInLobby(lobbyId);
        this.lobbyService.setInGame(lobbyId);
        for (const id of ids) {
            const socket: Socket = this.server.sockets.sockets.get(id);
            if (!socket.data.playerName) {
                this.handleLeaveLobby(socket);
            }
        }
    }

    @SubscribeMessage(SubscribeMessageType.RequestRoomId)
    handleRequestRoomId(client: Socket) {
        const roomId = this.rooms[client.id];
        client.emit(EmitMessageType.RoomId, roomId);
    }

    @SubscribeMessage(SubscribeMessageType.RequestCurrentPlayers)
    handleRequestCurrentPlayer(client: Socket) {
        const lobbyId = this.rooms[client.id];
        if (lobbyId) client.emit(EmitMessageType.NewPlayer, this.lobbyService.getPLayersFromLobby(lobbyId));
    }

    @SubscribeMessage(SubscribeMessageType.RequestName)
    handleRequestName(client: Socket) {
        client.emit(EmitMessageType.PlayerName, client.data.playerName);
    }

    @SubscribeMessage(SubscribeMessageType.LockLobby)
    handleLockLobby(client: Socket, lobbyLockState: boolean) {
        const lobbyId = this.rooms[client.id];
        this.lobbyService.lockLobby(lobbyId, lobbyLockState);
    }

    @SubscribeMessage(SubscribeMessageType.LeaveLobby)
    handleLeaveLobby(client: Socket) {
        const playerName: string = client.data.playerName ? client.data.playerName : '';
        const room = this.rooms[client.id];
        const destroyRoom = this.lobbyService.isInGame(room);
        if (playerName.toLowerCase() === ORG_BANNED_NAME || (playerName && this.lobbyService.getPLayersFromLobby(room).length === 1 && destroyRoom)) {
            this.deleteRoom(client, room);
        } else {
            this.lobbyService.deletePlayerFromLobby(room, playerName.toLowerCase());
            if (playerName) {
                this.server.to(room).emit(EmitMessageType.PlayerDisconnected, playerName);
                this.logger.log(logPlayerLeavingRoom(playerName, room));
                client.data = {};
            } else this.logger.log(logSocketLeavingRoom(client.id, room));
        }
        client.emit(EmitMessageType.Disconnected);
        delete this.rooms[client.id];
        this.lobbyService.removeSocketIdFromLobby(client.id, room);
        client.leave(room);
    }

    @SubscribeMessage(SubscribeMessageType.KickPlayer)
    handleKickPlayer(client: Socket, playerName: string) {
        const lobbyId = this.rooms[client.id];
        const idBanned = this.lobbyService.addBannedPlayer(lobbyId, playerName);
        const playerKicked = this.server.sockets.sockets.get(idBanned);
        playerKicked.emit(EmitMessageType.PlayerKicked);
        this.handleLeaveLobby(playerKicked);
    }

    @SubscribeMessage(SubscribeMessageType.RetrieveGameId)
    handleRetrieveGameId(client: Socket) {
        const lobbyId = this.rooms[client.id];
        if (lobbyId) {
            const gameId = this.lobbyService.getGameIdFromLobby(lobbyId);
            client.emit(EmitMessageType.RetrieveGameId, gameId);
        }
    }

    handleConnection(client: Socket) {
        client.data = {};
        this.logger.log(logClientConnectedToServer(client.id));
    }

    handleDisconnect(client: Socket) {
        if (this.rooms[client.id]) {
            this.handleLeaveLobby(client);
        } else {
            client.emit(EmitMessageType.Disconnected);
        }
        this.logger.log(logClientDisconnectedFromServer(client.id));
    }

    private deleteRoom(client: Socket, room: string) {
        const ids = this.lobbyService.getSocketIdInLobby(room);
        for (const id of ids) {
            const socket: Socket = this.server.sockets.sockets.get(id);
            delete this.rooms[id];
            if (id !== client.id) {
                socket.leave(room);
                socket.emit(EmitMessageType.Disconnected);
                if (socket.data?.playerName) {
                    this.logger.log(logPlayerLeavingRoom(socket.data.playerName, room));
                } else {
                    this.logger.log(logSocketLeavingRoom(socket.id, room));
                }
                this.lobbyService.removeSocketIdFromLobby(id, room);
                socket.data = {};
            } else {
                this.logger.log(logSocketLeavingRoom(client.data.playerName, room));
            }
        }
        client.data = {};
        this.lobbyService.deleteLobby(room);
        client.emit(EmitMessageType.Disconnected);
        this.logger.log(logRoomDestroy(room));
    }
}
