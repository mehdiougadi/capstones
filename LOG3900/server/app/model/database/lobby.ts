import { ORG_BANNED_NAME } from '@app/app.constants';
import { Message } from '@app/model/database/message';
import { Score } from '@app/model/database/score';
import { Game } from './game';
import { HistogramChoice } from './histogram-choices';
import { Player } from './player';
import { PlayerEvaluation } from './player-to-evaluate';

export class Lobby {
    lobbyId: string;
    players: Map<string, Player>;
    numberOfPlayersAtTheBeginning: number;
    sockets: string[];
    nameBan: string[];
    timer: NodeJS.Timeout;
    timeLeft: number;
    isLocked: boolean;
    game: Game;
    dateStart: string;
    submitAnswerCount: number;
    questionIndex: number;
    currentMessages: Message[];
    lobbyScores: Score[];
    highestScore: number;
    playerBonuses: string;
    inGame: boolean;
    playersToEvaluate: PlayerEvaluation[];
    choicesHistory: HistogramChoice[][];
    disabledChatList: string[];
    questionStartPlayerCount: number;
    private isTimerPaused: boolean;
    private isPanicMode: boolean;

    constructor(lobbyId: string, game: Game, dateStart: string) {
        this.lobbyId = lobbyId;
        this.players = new Map();
        this.nameBan = [ORG_BANNED_NAME];
        this.isLocked = false;
        this.game = game;
        this.dateStart = dateStart;
        this.submitAnswerCount = 0;
        this.questionIndex = 0;
        this.timer = null;
        this.currentMessages = [];
        this.sockets = [];
        this.lobbyScores = [];
        this.playerBonuses = '';
        this.inGame = false;
        this.playersToEvaluate = [];
        this.isTimerPaused = false;
        this.isPanicMode = false;
        this.numberOfPlayersAtTheBeginning = 0;
        this.choicesHistory = [];
        this.disabledChatList = [];
        this.highestScore = 0;
        this.questionStartPlayerCount = 0;
    }

    setTimerPaused(): void {
        this.isTimerPaused = true;
    }

    setTimerUnpaused(): void {
        this.isTimerPaused = false;
    }

    setPanicMode(): void {
        this.isPanicMode = true;
    }

    disablePanicMode(): void {
        this.isPanicMode = false;
    }

    getIsTimerPaused(): boolean {
        return this.isTimerPaused;
    }

    getIsPanicMode(): boolean {
        return this.isPanicMode;
    }
}
