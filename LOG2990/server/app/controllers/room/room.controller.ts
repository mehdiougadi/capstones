import { Room } from '@app/model/schema/room/room.schema';
import { GameService } from '@app/services/game-services/game-main-Service/game-main.service';
import { GameServicePlayer } from '@app/services/game-services/game-player-Service/game-player-service';
import { GameServiceRoom } from '@app/services/game-services/game-room-service/game-room-service';
import { Player } from '@common/classes/player';
import { GameAccess } from '@common/client-message/game-acces-pop-up';
import { GameState } from '@common/enum/socket-messages';
import { Answer } from '@common/interfaces/answer';
import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOkResponse } from '@nestjs/swagger';
@Controller('room')
export class RoomController {
    // eslint-disable-next-line max-params
    constructor(
        private gameService: GameService,
        private gameServicePlayers: GameServicePlayer,
        private gameServiceRoom: GameServiceRoom,
    ) {}

    @Post('/create/:id')
    @ApiOkResponse({
        description: 'Return game pin',
        type: String,
    })
    async create(@Param('id') id: string, @Body('isTesting') isTesting: boolean, @Body('randomMode') randomMode: boolean) {
        return this.gameService.createRoomMain(id, isTesting, randomMode);
    }
    @Get('/:id')
    async getRoomById(@Param('id') id: string) {
        return this.gameService.findRoomById(id);
    }

    @Post('/addPlayer')
    async addPlayerToRoom(@Query('username') username: string, @Query('accessCode') accessCode: string, @Query('isRandomMode') isRandomMode: string) {
        const room = this.gameService.getRoomIdByCode(accessCode);
        if (!room) {
            return { id: null, msg: GameAccess.ROOM_NOT_FOUND };
        }
        const failedJoin = this.gameServicePlayers.addPlayerToRoom(room, username, JSON.parse(isRandomMode.toLowerCase()));
        if (!failedJoin) {
            return { id: this.gameService.getRoomIdByCode(accessCode).id, msg: null };
        }
        return { id: null, msg: failedJoin };
    }

    @Post('/removePlayer')
    async removePlayerToRoom(@Query('username') username: string, @Query('roomId') roomId: string) {
        if (this.gameService.deletePlayerFromRoom(this.gameService.findRoomById(roomId), username)) {
            return { msg: 'Success' };
        }
        return { msg: 'FAIL' };
    }

    @Post('/changeLock')
    async changeLockRoom(@Body() body): Promise<void> {
        await this.gameServiceRoom.changeLockRoom(this.gameService.findRoomById(body.room.id));
    }

    @Post('/startGame')
    async startGameForRoom(@Body() body) {
        await this.gameService.changeGameState(body.room.id, GameState.BEFORE_START);
        return true;
    }

    @Post('/nextRound')
    async startNextRoundForRoom(@Body() body) {
        await this.gameService.changeGameState(body.room.id, GameState.BETWEEN_ROUNDS);
    }

    @Get('/room/:id')
    @ApiOkResponse({
        description: 'Return game informations',
        type: Room,
    })
    async getGameInfo(@Param('id') id: string) {
        return this.gameService.getGameInfo(id);
    }
    @Post('/start/:id')
    @ApiOkResponse({
        description: 'start round for server',
    })
    async startRound(@Param('id') id: string) {
        return this.gameService.changeGameState(id, GameState.NEXT_ROUND);
    }
    @Post('/:id/endGame')
    @ApiOkResponse({
        description: 'start round for server',
    })
    async endGame(@Param('id') id: string) {
        this.gameService.changeGameState(id, GameState.END_GAME);
        return true;
    }
    @Get('/room/:id/players')
    @ApiOkResponse({
        description: 'Return game playerList',
        type: [Player],
    })
    async getGamePlayers(@Param('id') id: string) {
        return this.gameService.getGamePlayers(id);
    }

    @Post('/room/:id/verif')
    @ApiOkResponse({
        description: 'verify player answers',
        type: Boolean,
    })
    async verifyAnswers(@Param('id') id: string, @Body() verificationData: { currentPlayer: string; answers: Answer[] }) {
        return this.gameService.verifyPlayerAnswersMain(id, verificationData.answers, verificationData.currentPlayer);
    }

    @Post('/room/:id/qrl')
    @ApiOkResponse({
        description: 'verify player qrl answers',
        type: Boolean,
    })
    async verifyQrl(@Param('id') id: string, @Body() verificationData: { currentPlayer: string; qrlAnswer: string }) {
        return this.gameService.verifyQrlAnswersMain(id, verificationData.qrlAnswer, verificationData.currentPlayer);
    }

    @Post('/updateListPlayers')
    @ApiOkResponse({
        description: 'update list players',
    })
    async updateListPlayers(@Body() body: { roomId: string; listPlayers: Player[] }) {
        this.gameService.updateListPlayers(this.gameService.findRoomById(body.roomId), body.listPlayers);
    }

    @Post('/delete/:id')
    @ApiOkResponse({
        description: 'delete room',
    })
    async deleteRoom(@Param('id') id: string) {
        return this.gameService.changeGameState(id, GameState.END_ROOM);
    }

    @Post('/banPlayer')
    async banPlayerFromRoom(@Body() body: { player: Player; room: Room }) {
        this.gameServiceRoom.banPlayerFromRoom(body.player, this.gameService.findRoomById(body.room.id));
    }

    @Post('/interaction')
    async updatePlayerInteration(@Body() body: { player: Player; roomId: string }) {
        this.gameServicePlayers.updatePlayerInteration(this.gameService.findRoomById(body.roomId), body.player);
    }

    @Post('qrlInteraction')
    async updateQrlInteration(@Body() body: { player: Player; roomId: string }) {
        this.gameService.updateQrlInteration(this.gameService.findRoomById(body.roomId), body.player);
    }

    @Post('/:roomId/stopTimer')
    async stopTimer(@Param('roomId') roomId: string): Promise<boolean> {
        this.gameService.stopTimer(roomId);
        return true;
    }
    @Post('/:roomId/restartTimer')
    async restartTimer(@Param('roomId') roomId: string): Promise<boolean> {
        this.gameService.restartTimer(roomId);
        return true;
    }
    @Post('/:roomId/panicMode')
    async enablePanicMode(@Param('roomId') roomId: string): Promise<boolean> {
        this.gameService.enablePanicMode(roomId);
        return true;
    }
}
