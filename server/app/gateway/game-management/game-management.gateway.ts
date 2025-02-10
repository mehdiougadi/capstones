import { CountDown, EmitMessageType, QuestionType, SubscribeMessageType } from '@app/app.constants';
import { AnswerSubmit } from '@app/model/database/answer-submit';
import { ChoiceDeselection } from '@app/model/database/deselection';
import { Evaluation } from '@app/model/database/evaluation';
import { HistogramChoice } from '@app/model/database/histogram-choices';
import { QuestionAnswer } from '@app/model/database/question-answer';
import { ChoiceSelection } from '@app/model/database/selection';
import { LobbyGameManagementService } from '@app/services/lobby/game-management/lobby-game-management.service';
import { LobbyTimer } from '@app/services/lobby/timer/lobby-timer.service';
import { Inject } from '@nestjs/common';
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: true })
export class GameManagementGateway {
    @WebSocketServer() server: Server;

    constructor(
        @Inject('SharedRooms') private rooms: { [key: string]: string },
        private service: LobbyGameManagementService,
        private serviceTimer: LobbyTimer,
    ) {
        this.serviceTimer.lobbyCountdown.on(EmitMessageType.Countdown, ({ lobbyId, countdownDuration }) => {
            this.server.to(lobbyId).emit(EmitMessageType.Countdown, countdownDuration);
        });
    }

    @SubscribeMessage(SubscribeMessageType.FirstQuestion)
    handleFirstQuestion(client: Socket) {
        const lobbyId: string = this.rooms[client.id];
        const question = this.service.getFirstQuestion(lobbyId);
        this.handleQuestion(question, lobbyId, client);
        client.emit(EmitMessageType.NewQuestion, question);
    }

    @SubscribeMessage(SubscribeMessageType.NextQuestion)
    handleNextQuestion(client: Socket) {
        const lobbyId: string = this.rooms[client.id];
        const question = this.service.getNextQuestion(lobbyId);
        this.handleQuestion(question, lobbyId, client);
        if (question) {
            this.server.to(lobbyId).emit(EmitMessageType.NewQuestion, question);
        }
    }
    @SubscribeMessage(SubscribeMessageType.NextQuestionCountdown)
    handleNextQuestionCountdown(client: Socket) {
        const lobbyId: string = this.rooms[client.id];
        this.serviceTimer.startCountdown(lobbyId, CountDown.NextQuestion);
    }

    @SubscribeMessage(SubscribeMessageType.PauseTimer)
    handlePauseCountDown(client: Socket) {
        const lobbyId: string = this.rooms[client.id];
        this.serviceTimer.pauseCountdown(lobbyId);
    }

    @SubscribeMessage(SubscribeMessageType.UnpauseTimer)
    handleUnpauseCountdown(client: Socket) {
        const lobbyId: string = this.rooms[client.id];
        this.serviceTimer.unpauseCountdown(lobbyId);
    }

    @SubscribeMessage(SubscribeMessageType.PanicMode)
    handlePanicMode(client: Socket) {
        const lobbyId: string = this.rooms[client.id];
        this.serviceTimer.setPanicMode(lobbyId);
        this.server.to(lobbyId).emit(EmitMessageType.PanicMode);
    }

    @SubscribeMessage(SubscribeMessageType.SubmitAnswerQcm)
    handleSubmitAnswerQcm(client: Socket, answerSubmit: AnswerSubmit) {
        const lobbyId: string = this.rooms[client.id];
        const id = this.service.getOrganizer(lobbyId);
        const socket: Socket = this.server.sockets.sockets.get(id);
        socket.emit(EmitMessageType.PlayerSubmit, client.data.playerName);
        if (answerSubmit.answerTime === null) answerSubmit.answerTime = Infinity;
        const endQuestion = this.service.submitAnswer(client.data.playerName, lobbyId, answerSubmit);
        if (endQuestion) {
            this.service.calculatePoints(lobbyId);
            this.service.resetSubmitAnswerCount(lobbyId);
            this.serviceTimer.stopCountdown(lobbyId);
            this.server.to(lobbyId).emit(EmitMessageType.ShowAnswer, this.service.getCorrectChoices(lobbyId));
        } else {
            client.emit(EmitMessageType.Wait);
        }
    }

    @SubscribeMessage(SubscribeMessageType.SubmitAnswerQrl)
    handleSubmitAnswerQrl(client: Socket, answerSubmit: AnswerSubmit) {
        const lobbyId: string = this.rooms[client.id];
        const id = this.service.getOrganizer(lobbyId);
        const socket: Socket = this.server.sockets.sockets.get(id);
        socket.emit(EmitMessageType.PlayerSubmit, client.data.playerName);
        const endQuestion = this.service.submitAnswer(client.data.playerName, lobbyId, answerSubmit);
        if (endQuestion) {
            this.service.resetSubmitAnswerCount(lobbyId);
            this.serviceTimer.stopCountdown(lobbyId);
            this.service.orderPlayerEvaluation(lobbyId);
            this.server.to(lobbyId).emit(EmitMessageType.Evaluating);
        } else {
            client.emit(EmitMessageType.Wait);
        }
    }

    @SubscribeMessage(SubscribeMessageType.CorrectChoices)
    handleGetCorrectChoices(client: Socket) {
        const lobbyId: string = this.rooms[client.id];
        client.emit(EmitMessageType.CorrectChoices, this.service.getCorrectChoices(lobbyId));
    }

    @SubscribeMessage(SubscribeMessageType.Points)
    handlePoints(client: Socket) {
        const lobbyId: string = this.rooms[client.id];
        const playerName: string = client.data.playerName;
        client.emit(EmitMessageType.Points, this.service.getPlayerPoints(lobbyId, playerName));
    }

    @SubscribeMessage(SubscribeMessageType.PlayersPoints)
    handlePlayersPoints(client: Socket) {
        const lobbyId: string = this.rooms[client.id];
        client.emit(EmitMessageType.PlayersPoints, this.service.getAllPlayersPoints(lobbyId));
    }

    @SubscribeMessage(SubscribeMessageType.NewSelection)
    handleNewSelection(client: Socket, index: number) {
        const lobbyId: string = this.rooms[client.id];
        const playerSelection: ChoiceSelection = { selection: index, playerName: client.data.playerName };
        this.server.to(lobbyId).emit(EmitMessageType.NewSelection, playerSelection);
    }

    @SubscribeMessage(SubscribeMessageType.NewDeselection)
    handleNewDeselection(client: Socket, index: number) {
        const lobbyId: string = this.rooms[client.id];
        const playerDeselection: ChoiceDeselection = { deselection: index, playerName: client.data.playerName };
        this.server.to(lobbyId).emit(EmitMessageType.NewDeselection, playerDeselection);
    }

    @SubscribeMessage(SubscribeMessageType.StarGameCountdown)
    handleStartGameCountdown(client: Socket) {
        const lobbyId: string = this.rooms[client.id];
        this.serviceTimer.startCountdown(lobbyId, CountDown.GameStart);
        client.emit(EmitMessageType.StartGame);
    }

    @SubscribeMessage(SubscribeMessageType.RetrieveLobbyScores)
    handleRetrieveScore(client: Socket) {
        const lobbyId: string = this.rooms[client.id];
        this.server.to(lobbyId).emit(EmitMessageType.LobbyScores, this.service.getScores(lobbyId));
    }

    @SubscribeMessage(SubscribeMessageType.NavigateToResults)
    handleNavigateToResults(client: Socket) {
        this.service.setGameOver(this.rooms[client.id]);
        const lobbyId: string = this.rooms[client.id];
        this.service.populateScores(lobbyId);
        this.service.saveGameHistory(lobbyId);
        this.server.to(lobbyId).emit(EmitMessageType.NavigateToResults);
    }

    @SubscribeMessage(SubscribeMessageType.EvaluateFirstPlayer)
    handleEvaluatePlayer(client: Socket) {
        const lobbyId: string = this.rooms[client.id];
        const playerEvaluation = this.service.getNextPlayerEvaluation(lobbyId);
        if (playerEvaluation) {
            client.emit(EmitMessageType.EvaluatePlayer, playerEvaluation);
        } else {
            this.server.to(lobbyId).emit(EmitMessageType.ShowAnswer);
        }
    }

    @SubscribeMessage(SubscribeMessageType.EvaluateNextPlayer)
    handleEvaluateNextPlayer(client: Socket, evaluation: Evaluation) {
        const lobbyId: string = this.rooms[client.id];
        if (!evaluation.isInTest) {
            this.service.updateChoicesHistoryQRL(lobbyId, evaluation.points);
        }
        this.service.addPoints(evaluation.points, lobbyId);
        this.handleEvaluatePlayer(client);
    }

    @SubscribeMessage(SubscribeMessageType.ModifyQuestion)
    handleModifyQuestion(client: Socket, isModify: boolean) {
        const lobbyId: string = this.rooms[client.id];
        const id = this.service.getOrganizer(lobbyId);
        const socket: Socket = this.server.sockets.sockets.get(id);
        const playerSelection: ChoiceSelection = { selection: 1, playerName: client.data.playerName };
        if (isModify) socket.emit(EmitMessageType.NewSelection, playerSelection);
        socket.emit(EmitMessageType.ModifyQuestion, isModify);
    }

    @SubscribeMessage(SubscribeMessageType.Choices)
    handleChoices(client: Socket, choices: HistogramChoice[]) {
        const lobbyId: string = this.rooms[client.id];
        this.service.updateChoicesHistoryQCM(lobbyId, choices);
    }

    @SubscribeMessage(SubscribeMessageType.RetrieveChoicesHistory)
    handleRetrieveChoicesHistory(client: Socket) {
        const lobbyId: string = this.rooms[client.id];
        const choicesHistory = this.service.getChoicesHistory(lobbyId);
        this.server.to(lobbyId).emit(EmitMessageType.ChoicesHistory, choicesHistory);
    }

    @SubscribeMessage(SubscribeMessageType.RetrieveQuestions)
    handleQuestions(client: Socket) {
        const lobbyId: string = this.rooms[client.id];
        const questions = this.service.getQuestions(lobbyId);
        this.server.to(lobbyId).emit(EmitMessageType.Questions, questions);
    }

    private handleQuestion(question: QuestionAnswer, lobbyId: string, client: Socket) {
        this.service.setQuestionStartPlayerCount(lobbyId);
        if (question) {
            if (question.type === QuestionType.QRL) {
                this.serviceTimer.startCountdown(lobbyId, CountDown.QuestionTimeQrl);
            } else {
                this.serviceTimer.startCountdown(lobbyId, CountDown.QuestionTime);
            }
            if (this.service.checkIfGameIsOver(lobbyId)) {
                client.emit(EmitMessageType.EndGame);
            }
        } else {
            this.service.populateScores(lobbyId);
        }
    }
}
