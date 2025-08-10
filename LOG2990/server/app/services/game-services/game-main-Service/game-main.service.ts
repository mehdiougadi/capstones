/* eslint-disable max-lines */
import { Room } from '@app/common-server/room';
import { GameConnectionGateway } from '@app/gateways/game-connection/game-connection.gateway';
import { PlayerConnectionGateway } from '@app/gateways/player-connection/player-connection.gateway';
import { CreateHistoryDto } from '@app/model/dto/game-history/create-history.dto';
import { GameHistoryDbService } from '@app/services/game-history/game-history.service';
import { GameServicePlayer } from '@app/services/game-services/game-player-Service/game-player-service';
import { GameServiceRoom } from '@app/services/game-services/game-room-service/game-room-service';
import { GameServiceState } from '@app/services/game-services/game-state-service/game-state-service';
import { GameServiceTimer } from '@app/services/game-services/game-timer-service/game-timer-service';
import { Player } from '@common/classes/player';
import { MIN_QCM_PANIC_TIME, MIN_QRL_PANIC_TIME, QRL_QUESTION_TIME, SECONDS_BEFORE_GAME, SECONDS_BETWEEN_ROUNDS } from '@common/constant/constants';
import { QuestionType } from '@common/constant/state';
import { GameState } from '@common/enum/socket-messages';
import { Answer } from '@common/interfaces/answer';
import { QuestionStats } from '@common/interfaces/questionStats';
import { Injectable } from '@nestjs/common';

@Injectable()
export class GameService {
    private listRooms: Room[] = [];

    // eslint-disable-next-line max-params
    constructor(
        private readonly gameConnectionGateway: GameConnectionGateway,
        private readonly gameServiceState: GameServiceState,
        private readonly gameServicePlayer: GameServicePlayer,
        private readonly gameServiceTimer: GameServiceTimer,
        private readonly gameServiceRoom: GameServiceRoom,
        private readonly gameHistoryDbService: GameHistoryDbService,
        private readonly playerConnectionGateway: PlayerConnectionGateway,
    ) {}

    async createRoomMain(quizId: string, isTesting: boolean, randomMode: boolean): Promise<string> {
        const roomId = await this.gameServiceRoom.createNewGame(quizId, isTesting, this.listRooms, randomMode);
        if (isTesting || randomMode) {
            this.changeGameState(roomId, GameState.NEXT_ROUND);
        }
        return roomId;
    }

    getGameInfo(id: string): Room {
        return this.gameServiceRoom.prepareRoomForResponse(this.findRoomById(id));
    }

    findRoomById(id: string): Room | null {
        const room = this.listRooms.find((currentRoom) => currentRoom.id === id);
        if (room) {
            return room;
        }
        return null;
    }

    getGamePlayers(id: string): Player[] | null {
        if (this.findRoomById(id)) {
            return this.findRoomById(id).listPlayers;
        }
        return null;
    }

    getRoomIdByCode(accessCode: string): Room {
        return this.listRooms.find((room) => room.accessCode === accessCode);
    }

    verifyPlayerAnswersMain(id: string, answers: Answer[], currentPlayer: string): void {
        if (this.gameServicePlayer.verifyPlayerAnswers(this.findRoomById(id), answers, currentPlayer)) {
            this.changeGameState(id, GameState.END_ROUND);
        }
    }

    verifyQrlAnswersMain(id: string, qrlAnswer: string, currentPlayer: string): void {
        if (this.findRoomById(id).isTesting) {
            this.gameServicePlayer.endRoundPlayer(this.findRoomById(id), this.findRoomById(id).listPlayers);
            this.changeGameState(id, GameState.END_ROUND);
        } else if (this.gameServicePlayer.verifyQrlAnswers(this.findRoomById(id), qrlAnswer, currentPlayer)) {
            this.changeGameState(id, GameState.QRL_EVALUATION);
        }
    }

    updateQrlInteration(room: Room, player: Player): void {
        if (player.hasInteracted) {
            this.updateQRLModified(room, 1);
        } else {
            this.updateQRLModified(room, 0);
        }
    }

    stopTimer(roomId: string): void {
        this.gameServiceTimer.stopTimerForRoom(this.findRoomById(roomId));
    }
    restartTimer(roomId: string): void {
        const room: Room = this.findRoomById(roomId);
        if (this.canRestartTimer(room)) {
            this.handleTimerBasedOnPanicMode(room);
        }
    }

    enablePanicMode(roomId: string): void {
        const room = this.findRoomById(roomId);
        if (room.currentState !== GameState.NEXT_ROUND) return;
        if (room.currentTime > (room.quiz.questions[room.currentQuestionIndex].type === QuestionType.QCM ? MIN_QCM_PANIC_TIME : MIN_QRL_PANIC_TIME)) {
            if (!room.isPanicMode) {
                this.emitRoundState(room.id, GameState.PANIC_MODE);
                room.isPanicMode = true;
                this.restartTimer(room.id);
            }
        }
    }

    updateStatsSelectedOptions(roomId: string, answer: Answer, action: number): Room {
        const room = this.findRoomById(roomId);
        if (!room || room.questionStats.length === 0) {
            return room;
        }
        const selectedStat = room.questionStats[room.currentQuestionIndex].stats[answer.text];
        if (selectedStat) {
            if (action === 1) {
                selectedStat.count++;
            } else {
                selectedStat.count--;
            }
            room.questionStats[room.currentQuestionIndex].stats[answer.text].count = selectedStat.count;
        }
        return room;
    }

    updateQRLModified(room: Room, action: number): void {
        if (!room || !room.questionStats || room.questionStats.length === 0) {
            return;
        }
        const currentQuestionStats = this.getCurrentQuestionStats(room);
        if (this.isQRLQuestion(currentQuestionStats)) {
            this.updateQRLStats(currentQuestionStats, action, room.listPlayers.length);
            this.playerConnectionGateway.sendUpdatedStats(room.id, room.questionStats);
        }
    }

    getCurrentQuestionStats(room: Room): QuestionStats | undefined {
        const indexQuestion = room.currentQuestionIndex;
        return room.questionStats[indexQuestion];
    }

    isQRLQuestion(stats: QuestionStats): boolean {
        return stats && stats.statsQRL && stats.questionType === 'QRL';
    }

    updateQRLStats(currentQuestionStats: QuestionStats, action: number, playersCount: number): void {
        const statsQRL = currentQuestionStats.statsQRL;
        if (action === 1) {
            statsQRL.modifiedLastSeconds++;
            statsQRL.notModifiedLastSeconds = playersCount - statsQRL.modifiedLastSeconds;
        } else {
            statsQRL.notModifiedLastSeconds++;
            statsQRL.modifiedLastSeconds = playersCount - statsQRL.notModifiedLastSeconds;
        }
    }

    deletePlayerFromRoom(room: Room, username: string): boolean {
        if (this.gameServicePlayer.removePlayerFromRoom(room, username)) {
            if (room.currentState !== GameState.NOT_STARTED && room.currentState !== GameState.TRANSITION) {
                this.changeGameState(room.id, GameState.END_ROOM);
            }
        } else if (
            this.gameServicePlayer.checkAllPlayersAnswered(room) &&
            room.currentState !== GameState.BETWEEN_ROUNDS &&
            room.currentState !== GameState.END_ROUND &&
            room.quiz.questions[room.currentQuestionIndex].type === QuestionType.QCM
        ) {
            this.changeGameState(room.id, GameState.END_ROUND);
        } else if (
            this.gameServicePlayer.checkAllPlayersAnswered(room) &&
            room.currentState !== GameState.BETWEEN_ROUNDS &&
            room.currentState !== GameState.END_ROUND &&
            room.quiz.questions[room.currentQuestionIndex].type === QuestionType.QRL
        ) {
            this.changeGameState(room.id, GameState.QRL_EVALUATION);
        }
        return true;
    }

    changeGameState(roomId: string, newState: string): void {
        const room = this.findRoomById(roomId);
        if (room) {
            switch (newState) {
                case GameState.BEFORE_START:
                    this.beforeStartMain(room);
                    break;
                case GameState.NEXT_ROUND:
                    this.nextRoundMain(room);
                    break;
                case GameState.BETWEEN_ROUNDS:
                    this.betweenRoundMain(room);
                    break;
                case GameState.END_ROUND:
                    this.endRoundMain(room);
                    break;
                case GameState.QRL_EVALUATION:
                    this.evaluateQrlMain(room);
                    break;
                case GameState.END_ROOM:
                    this.endRoomMain(room);
                    break;
                case GameState.END_GAME:
                    this.endGameMain(room);
                    break;
            }
        }
    }

    updateListPlayers(room: Room, playerList: Player[]): void {
        this.gameServicePlayer.endRoundPlayer(room, playerList);
        this.changeGameState(room.id, GameState.END_ROUND);
    }

    private endTimerController(room: Room): void {
        switch (room.currentState) {
            case GameState.BEFORE_START: {
                this.beforeStartEndTimer(room);
                break;
            }
            case GameState.NEXT_ROUND: {
                this.nextRoundEndTimer(room);
                break;
            }
            case GameState.BETWEEN_ROUNDS: {
                this.betweenRoundEndTimer(room);
                break;
            }
        }
    }

    private beforeStartMain(room: Room): void {
        room.currentState = GameState.BEFORE_START;
        this.emitRoundState(room.id, GameState.BEFORE_START);
        this.gameServiceTimer.startTimerForRoom(room, SECONDS_BEFORE_GAME, () => {
            this.beforeStartEndTimer(room);
        });
    }
    private beforeStartEndTimer(room: Room): void {
        room.numberOfPlayers = room.listPlayers.length;
        room.currentState = GameState.TRANSITION;
        this.gameConnectionGateway.startGame(room.id);
    }
    private nextRoundMain(room: Room): void {
        this.gameServiceTimer.updateClientTime(room, room.quiz.duration);
        this.gameServiceState.nextRoundState(room);
        this.gameServicePlayer.nextRoundPlayer(room);
        room.currentState = GameState.NEXT_ROUND;
        this.emitRoundState(room.id, GameState.NEXT_ROUND);
        if (room.quiz.questions[room.currentQuestionIndex].type === QuestionType.QCM) {
            this.gameServiceTimer.startTimerForRoom(room, room.quiz.duration, () => {
                this.nextRoundEndTimer(room);
            });
        } else if (room.quiz.questions[room.currentQuestionIndex].type === QuestionType.QRL) {
            room.questionStats[room.currentQuestionIndex].statsQRL.notModifiedLastSeconds = room.listPlayers.length;
            this.playerConnectionGateway.sendUpdatedStats(room.id, room.questionStats);
            this.gameServiceTimer.startTimerForRoom(room, QRL_QUESTION_TIME, () => {
                this.nextRoundEndTimer(room);
            });
        }
    }
    private nextRoundEndTimer(room: Room): void {
        this.gameServiceTimer.timerNextRoundManager(room, true);
    }
    private betweenRoundMain(room: Room): void {
        room.currentState = GameState.BETWEEN_ROUNDS;
        this.emitTransitionBetweenRounds(room.id);
        this.gameServiceTimer.startTimerForRoom(room, SECONDS_BETWEEN_ROUNDS, () => {
            this.betweenRoundEndTimer(room);
        });
    }
    private betweenRoundEndTimer(room: Room): void {
        this.changeGameState(room.id, GameState.NEXT_ROUND);
    }
    private endRoundMain(room: Room): void {
        room.isPanicMode = false;
        this.gameServiceTimer.stopTimerForRoom(room);
        this.gameServiceTimer.updateClientTime(room, 0);
        this.questionTypeChecker(room);
        this.gameServiceState.endRoundState(room);
        this.emitEndRound(room);
        if ((room.isTesting || room.randomMode) && room.currentQuestionIndex < room.quiz.questions.length) {
            this.gameServiceTimer.startTimerForRoom(room, SECONDS_BETWEEN_ROUNDS, () => {
                this.changeGameState(room.id, GameState.NEXT_ROUND);
            });
        }
    }

    private evaluateQrlMain(room: Room): void {
        this.gameServiceTimer.stopTimerForRoom(room);
        this.gameServiceTimer.updateClientTime(room, 0);
        this.playerConnectionGateway.sendPlayersUpdate(room.id, room.listPlayers);
        this.emitRoundState(room.id, GameState.QRL_EVALUATION);
    }

    private questionTypeChecker(room: Room): void {
        if (room.quiz.questions[room.currentQuestionIndex].type === QuestionType.QCM) {
            this.gameServicePlayer.endRoundPlayer(room, room.listPlayers);
        } else if (room.quiz.questions[room.currentQuestionIndex].type === QuestionType.QRL) {
            this.playerConnectionGateway.sendPlayersUpdate(room.id, room.listPlayers);
        }
    }

    private endRoomMain(room: Room): void {
        if (room.currentState !== GameState.TRANSITION) {
            this.gameServiceTimer.stopTimerForRoom(room);
            this.gameServiceRoom.deleteRoom(room, this.listRooms);
        }
    }
    private endGameInTestingMode(room: Room): void {
        this.gameServiceTimer.stopTimerForRoom(room);
        this.gameServiceTimer.startTimerForRoom(room, SECONDS_BETWEEN_ROUNDS, () => {
            if (room.randomMode) {
                this.endGameInProductionMode(room);
            } else {
                this.emitEndGame(room.id);
            }
        });
    }
    private endGameInProductionMode(room: Room): void {
        this.saveGame(room);
        room.currentState = GameState.GAME_FINISHED;
        this.emitEndGame(room.id);
    }

    private endGameMain(room: Room): void {
        if (room.isTesting || room.randomMode) {
            this.endGameInTestingMode(room);
        } else {
            this.endGameInProductionMode(room);
        }
    }
    private async saveGame(room): Promise<void> {
        const newHistory: CreateHistoryDto = {
            quizName: room.quiz.title,
            playerCount: room.numberOfPlayers,
            topScore: room.bestScore,
            startTime: room.dateCreated,
        };
        await this.gameHistoryDbService.addGameToHistory(newHistory);
    }

    private emitTransitionBetweenRounds(roomId: string): void {
        if (!this.findRoomById(roomId).isTesting || !this.findRoomById(roomId).randomMode) {
            this.emitRoundState(roomId, GameState.BETWEEN_ROUNDS);
        }
    }

    private emitEndRound(room: Room): void {
        if (room.currentQuestionIndex < room.quiz.questions.length) {
            this.emitRoundState(room.id, GameState.END_ROUND);
        } else if (room.isTesting || room.randomMode) {
            this.emitRoundState(room.id, GameState.END_ROUND);
            this.changeGameState(room.id, GameState.END_GAME);
        } else {
            this.emitRoundState(room.id, GameState.FINAL_END_ROUND);
        }
    }
    private emitEndGame(roomId: string): void {
        this.gameConnectionGateway.sendRoomState(roomId, GameState.END_GAME);
    }
    private emitRoundState(roomId: string, state: string): void {
        this.gameConnectionGateway.sendRoomState(roomId, state);
    }
    private canRestartTimer(room: Room): boolean {
        return (
            room.currentTime > 0 &&
            room.currentState !== GameState.END_ROUND &&
            room.currentState !== GameState.BETWEEN_ROUNDS &&
            room.currentState !== GameState.QRL_EVALUATION
        );
    }

    private handleTimerBasedOnPanicMode(room: Room): void {
        if (room.isPanicMode) {
            this.startPanicModeTimer(room);
        } else {
            this.startRegularTimer(room);
        }
    }
    private startPanicModeTimer(room: Room): void {
        this.gameServiceTimer.startPanicTimerForRoom(room, room.currentTime, () => {
            this.endTimerController(room);
        });
    }

    private startRegularTimer(room: Room): void {
        this.gameServiceTimer.startTimerForRoom(room, room.currentTime, () => {
            this.endTimerController(room);
        });
    }
}
