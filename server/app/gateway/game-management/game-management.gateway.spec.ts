// retrait du lint any pour accéder aux propriétés privées et retrait du maximum de lignes pour un fichier test
/* eslint-disable @typescript-eslint/no-explicit-any, max-lines */
import { CountDown, EmitMessageType, ORG_BANNED_NAME, QuestionType } from '@app/app.constants';
import { ChoiceAnswer } from '@app/model/database/answer-choice';
import { AnswerSubmit } from '@app/model/database/answer-submit';
import { ChoiceDeselection } from '@app/model/database/deselection';
import { HistogramChoice } from '@app/model/database/histogram-choices';
import { PlayerEvaluation } from '@app/model/database/player-to-evaluate';
import { Points } from '@app/model/database/points';
import { Question } from '@app/model/database/question';
import { QuestionAnswer } from '@app/model/database/question-answer';
import { Score } from '@app/model/database/score';
import { ChoiceSelection } from '@app/model/database/selection';
import { LobbyGameManagementService } from '@app/services/lobby/game-management/lobby-game-management.service';
import { LobbyTimer } from '@app/services/lobby/timer/lobby-timer.service';
import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter } from 'events';
import { SinonStubbedInstance, createStubInstance } from 'sinon';
import { BroadcastOperator, Server, Socket } from 'socket.io';
import { GameManagementGateway } from './game-management.gateway';

describe('GameManagementGateway', () => {
    let gateway: GameManagementGateway;
    let service: LobbyGameManagementService;
    let serviceTimer: LobbyTimer;
    let socket: SinonStubbedInstance<Socket>;
    let server: SinonStubbedInstance<Server>;

    beforeEach(async () => {
        socket = createStubInstance<Socket>(Socket);
        server = Object.assign(createStubInstance<Server>(Server), {
            sockets: {
                sockets: new Map([[socket.id, socket]]),
            },
        });
        (socket as any).id = testId;
        const lobbyCountdown = new EventEmitter();
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                GameManagementGateway,
                { provide: LobbyGameManagementService, useValue: { service } },
                { provide: LobbyTimer, useValue: { lobbyCountdown } },
                {
                    provide: 'SharedRooms',
                    useValue: { a234: lobbyId1 },
                },
            ],
        }).compile();

        gateway = module.get<GameManagementGateway>(GameManagementGateway);
        gateway.server = server;
        service = module.get<LobbyGameManagementService>(LobbyGameManagementService);
        serviceTimer = module.get<LobbyTimer>(LobbyTimer);
    });

    it('should be defined', () => {
        expect(gateway).toBeDefined();
    });

    it('should handleQuestion with Qrl', () => {
        let question: QuestionAnswer = new QuestionAnswer();
        question = { points: pointsTest, type: QuestionType.QRL, text: 'test' };

        serviceTimer.startCountdown = jest.fn();
        service.checkIfGameIsOver = jest.fn().mockReturnValue(true);
        service.setQuestionStartPlayerCount = jest.fn();

        (gateway as any).handleQuestion(question, lobbyId1, socket);

        expect(serviceTimer.startCountdown).toHaveBeenCalledWith(lobbyId1, CountDown.QuestionTimeQrl);
        expect(service.checkIfGameIsOver).toHaveBeenCalledWith(lobbyId1);
        expect(service.setQuestionStartPlayerCount).toHaveBeenCalledWith(lobbyId1);
        expect(socket.emit.calledWith(EmitMessageType.EndGame));
    });

    it('should handleQuestion and populate score if question is undefined', () => {
        service.populateScores = jest.fn();
        service.setQuestionStartPlayerCount = jest.fn();

        (gateway as any).handleQuestion(undefined, lobbyId1, socket);

        expect(service.setQuestionStartPlayerCount).toHaveBeenCalledWith(lobbyId1);
        expect(service.populateScores).toHaveBeenCalledWith(lobbyId1);
    });

    it('should handleModifyQuestion and send a modifyQuestion to the organizer', () => {
        const selection: ChoiceSelection = { selection: 1, playerName: 'test' };
        socket.data = { playerName: 'bonjour' };
        let socketTest: SinonStubbedInstance<Socket>;
        // Désactiver le lint pour le let car on ne peut pas mettre de const
        // eslint-disable-next-line prefer-const
        socketTest = createStubInstance<Socket>(Socket);
        (socketTest as any).id = socketIdTest2;
        socketTest.data = { playerName: ORG_BANNED_NAME };
        let socketTest2: SinonStubbedInstance<Socket>;
        // Désactiver le lint pour le let car on ne peut pas mettre de const
        // eslint-disable-next-line prefer-const
        socketTest2 = createStubInstance<Socket>(Socket);
        (socketTest2 as any).id = socketIdTest3;

        service.getOrganizer = jest.fn().mockReturnValue(socketTest.id);
        const mockMap = new Map();
        mockMap.set(socket.id, socket);
        mockMap.set(socketTest.id, socketTest);
        mockMap.set(socketTest2.id, socketTest2);

        (gateway.server.sockets.sockets as any) = mockMap;
        gateway.server.sockets.sockets.get = jest.fn().mockReturnValueOnce(socket).mockReturnValueOnce(socketTest).mockReturnValueOnce(socketTest2);

        gateway.handleModifyQuestion(socket, true);

        expect(gateway.server.sockets.sockets.get).toHaveBeenCalledWith(socketIdTest2);
        expect(socketTest.emit.calledWith(EmitMessageType.ModifyQuestion, true));
        expect(service.getOrganizer).toHaveBeenCalledWith(lobbyId1);
        expect(socketTest.emit.calledWith(EmitMessageType.NewSelection, selection));
    });

    it('should handleQuestion with Qcm', () => {
        let question: QuestionAnswer = new QuestionAnswer();
        question = { points: pointsTest, type: QuestionType.QCM, text: 'test', choices: [] };

        serviceTimer.startCountdown = jest.fn();
        service.checkIfGameIsOver = jest.fn().mockReturnValue(true);
        service.setQuestionStartPlayerCount = jest.fn();

        (gateway as any).handleQuestion(question, lobbyId1, socket);

        expect(serviceTimer.startCountdown).toHaveBeenCalledWith(lobbyId1, CountDown.QuestionTime);
        expect(service.checkIfGameIsOver).toHaveBeenCalledWith(lobbyId1);
        expect(service.setQuestionStartPlayerCount).toHaveBeenCalledWith(lobbyId1);
        expect(socket.emit.calledWith(EmitMessageType.EndGame));
    });

    it('should handleFirstQuestion and call handleQuestion', () => {
        const question: QuestionAnswer = { points: pointsTest, type: QuestionType.QCM, text: 'test', choices: [new ChoiceAnswer()] };
        service.getFirstQuestion = jest.fn().mockReturnValue(question);

        (gateway as any).handleQuestion = jest.fn();

        gateway.handleFirstQuestion(socket);

        expect(socket.emit.calledWith(EmitMessageType.NewQuestion, question));
        expect((gateway as any).handleQuestion).toHaveBeenCalledWith(question, lobbyId1, socket);
    });

    it('should handleNextQuestion and call handleQuestion', () => {
        const question: QuestionAnswer = { points: pointsTest, type: QuestionType.QCM, text: 'test', choices: [] };
        service.getNextQuestion = jest.fn().mockReturnValue(question);
        server.to.returns({
            emit: (event: string) => {
                expect(event).toEqual(EmitMessageType.NewQuestion);
            },
        } as BroadcastOperator<any, any>);
        (gateway as any).handleQuestion = jest.fn();

        gateway.handleNextQuestion(socket);

        expect((gateway as any).handleQuestion).toHaveBeenCalledWith(question, lobbyId1, socket);
    });

    it('should emit countdown event when lobbyCountdown event is triggered', (done) => {
        const lobbyId = lobbyId1;
        const countdownDuration = CountDown.GameStart;

        server.to.returns({
            emit: (event: string, data: any) => {
                expect(event).toEqual(EmitMessageType.Countdown);
                expect(data).toEqual(countdownDuration);
                done();
            },
        } as BroadcastOperator<any, any>);

        serviceTimer.lobbyCountdown.emit('countdown', { lobbyId, countdownDuration });
    });

    it('should handleSubmitAnswerQcm and emit allSubmitted if endQuestion is true', () => {
        service.submitAnswer = jest.fn().mockReturnValue(true);
        service.calculatePoints = jest.fn();
        service.getCorrectChoices = jest.fn().mockReturnValue([1]);
        service.getOrganizer = jest.fn().mockReturnValue(socketIdTest2);
        // Désactiver le lint pour le let car on ne peut pas mettre de const
        // eslint-disable-next-line prefer-const
        let socketTest: SinonStubbedInstance<Socket>;
        // Désactiver le lint pour le let car on ne peut pas mettre de const
        // eslint-disable-next-line prefer-const
        socketTest = createStubInstance<Socket>(Socket);
        (socketTest as any).id = socketIdTest2;
        socketTest.data = { playerName: ORG_BANNED_NAME };

        const mockMap = new Map();
        mockMap.set(socket.id, socket);
        mockMap.set(socketTest.id, socketTest);
        (gateway.server.sockets.sockets as any) = mockMap;
        gateway.server.sockets.sockets.get = jest.fn().mockReturnValueOnce(socket).mockReturnValueOnce(socketTest);

        server.to.returns({
            emit: (event: string, data: number[]) => {
                expect(event).toEqual(EmitMessageType.ShowAnswer);
                expect(data).toEqual([1]);
            },
        } as BroadcastOperator<any, any>);

        service.resetSubmitAnswerCount = jest.fn();
        serviceTimer.stopCountdown = jest.fn();
        socket.data = { playerName: 'player1' };

        gateway.handleSubmitAnswerQcm(socket, new AnswerSubmit());

        expect(service.getCorrectChoices).toHaveBeenCalledWith(lobbyId1);
        expect(service.calculatePoints).toHaveBeenCalledWith(lobbyId1);
        expect(service.resetSubmitAnswerCount).toHaveBeenCalled();
        expect(serviceTimer.stopCountdown).toHaveBeenCalled();
        expect(gateway.server.sockets.sockets.get).toHaveBeenCalledWith(socketIdTest2);
        expect(socketTest.emit.calledWith(EmitMessageType.PlayerSubmit, socketTest.data.playerName));
    });

    it('should handleSubmitAnswerQcm and set the value of answerTime to Infinity if it receive null', () => {
        service.submitAnswer = jest.fn().mockReturnValue(false);
        socket.data = { playerName: 'player1' };

        service.getOrganizer = jest.fn().mockReturnValue(socketIdTest2);
        // Désactiver le lint pour le let car on ne peut pas mettre de const
        // eslint-disable-next-line prefer-const
        let socketTest: SinonStubbedInstance<Socket>;
        // Désactiver le lint pour le let car on ne peut pas mettre de const
        // eslint-disable-next-line prefer-const
        socketTest = createStubInstance<Socket>(Socket);
        (socketTest as any).id = socketIdTest2;
        socketTest.data = { playerName: ORG_BANNED_NAME };

        const mockMap = new Map();
        mockMap.set(socket.id, socket);
        mockMap.set(socketTest.id, socketTest);
        (gateway.server.sockets.sockets as any) = mockMap;
        gateway.server.sockets.sockets.get = jest.fn().mockReturnValueOnce(socket).mockReturnValueOnce(socketTest);

        gateway.handleSubmitAnswerQcm(socket, { answerTime: null, answer: [] });
        expect(service.submitAnswer).toHaveBeenCalledWith('player1', lobbyId1, { answerTime: Infinity, answer: [] });
        expect(socket.emit.calledWith(EmitMessageType.Wait));
        expect(gateway.server.sockets.sockets.get).toHaveBeenCalledWith(socketIdTest2);
        expect(socketTest.emit.calledWith(EmitMessageType.PlayerSubmit, socketTest.data.playerName));
    });

    it('should handleSubmitAnswerQcm and emit wait if endQuestion is false', () => {
        service.submitAnswer = jest.fn().mockReturnValue(false);
        socket.data = { playerName: 'player1' };

        service.getOrganizer = jest.fn().mockReturnValue(socketIdTest2);
        // Désactiver le lint pour le let car on ne peut pas mettre de const
        // eslint-disable-next-line prefer-const
        let socketTest: SinonStubbedInstance<Socket>;
        // Désactiver le lint pour le let car on ne peut pas mettre de const
        // eslint-disable-next-line prefer-const
        socketTest = createStubInstance<Socket>(Socket);
        (socketTest as any).id = socketIdTest2;
        socketTest.data = { playerName: ORG_BANNED_NAME };

        const mockMap = new Map();
        mockMap.set(socket.id, socket);
        mockMap.set(socketTest.id, socketTest);
        (gateway.server.sockets.sockets as any) = mockMap;
        gateway.server.sockets.sockets.get = jest.fn().mockReturnValueOnce(socket).mockReturnValueOnce(socketTest);

        gateway.handleSubmitAnswerQcm(socket, new AnswerSubmit());
        expect(socket.emit.calledWith(EmitMessageType.Wait));
        expect(gateway.server.sockets.sockets.get).toHaveBeenCalledWith(socketIdTest2);
        expect(socketTest.emit.calledWith(EmitMessageType.PlayerSubmit, socketTest.data.playerName));
    });

    it('should handleSubmitAnswerQrl and emit wait if endQuestion is false', () => {
        service.submitAnswer = jest.fn().mockReturnValue(false);
        socket.data = { playerName: 'player1' };

        service.getOrganizer = jest.fn().mockReturnValue(socketIdTest2);
        // Désactiver le lint pour le let car on ne peut pas mettre de const
        // eslint-disable-next-line prefer-const
        let socketTest: SinonStubbedInstance<Socket>;
        // Désactiver le lint pour le let car on ne peut pas mettre de const
        // eslint-disable-next-line prefer-const
        socketTest = createStubInstance<Socket>(Socket);
        (socketTest as any).id = socketIdTest2;
        socketTest.data = { playerName: ORG_BANNED_NAME };
        const mockMap = new Map();
        mockMap.set(socket.id, socket);
        mockMap.set(socketTest.id, socketTest);
        (gateway.server.sockets.sockets as any) = mockMap;
        gateway.server.sockets.sockets.get = jest.fn().mockReturnValueOnce(socket).mockReturnValueOnce(socketTest);

        gateway.handleSubmitAnswerQrl(socket, new AnswerSubmit());
        expect(socket.emit.calledWith(EmitMessageType.Wait));
        expect(gateway.server.sockets.sockets.get).toHaveBeenCalledWith(socketIdTest2);
        expect(socketTest.emit.calledWith(EmitMessageType.PlayerSubmit, socketTest.data.playerName));
    });

    it('should handleSubmitAnswerQrl and emit allSubmitted if endQuestion is true', () => {
        service.submitAnswer = jest.fn().mockReturnValue(true);
        service.orderPlayerEvaluation = jest.fn();
        service.getOrganizer = jest.fn().mockReturnValue(socketIdTest2);
        // Désactiver le lint pour le let car on ne peut pas mettre de const
        // eslint-disable-next-line prefer-const
        let socketTest: SinonStubbedInstance<Socket>;
        // Désactiver le lint pour le let car on ne peut pas mettre de const
        // eslint-disable-next-line prefer-const
        socketTest = createStubInstance<Socket>(Socket);
        (socketTest as any).id = socketIdTest2;
        socketTest.data = { playerName: ORG_BANNED_NAME };
        const mockMap = new Map();
        mockMap.set(socket.id, socket);
        mockMap.set(socketTest.id, socketTest);
        (gateway.server.sockets.sockets as any) = mockMap;
        gateway.server.sockets.sockets.get = jest.fn().mockReturnValueOnce(socket).mockReturnValueOnce(socketTest);
        server.to.returns({
            emit: (event: string) => {
                expect(event).toEqual(EmitMessageType.Evaluating);
            },
        } as BroadcastOperator<any, any>);
        service.resetSubmitAnswerCount = jest.fn();
        serviceTimer.stopCountdown = jest.fn();
        socket.data = { playerName: 'player1' };

        gateway.handleSubmitAnswerQrl(socket, new AnswerSubmit());

        expect(service.orderPlayerEvaluation).toHaveBeenCalledWith(lobbyId1);
        expect(service.resetSubmitAnswerCount).toHaveBeenCalled();
        expect(serviceTimer.stopCountdown).toHaveBeenCalled();
        expect(gateway.server.sockets.sockets.get).toHaveBeenCalledWith(socketIdTest2);
        expect(socketTest.emit.calledWith(EmitMessageType.PlayerSubmit, socketTest.data.playerName));
    });

    it('should handleEvaluateNextPlayer and add points', () => {
        service.addPoints = jest.fn();
        service.updateChoicesHistoryQRL = jest.fn();
        gateway.handleEvaluatePlayer = jest.fn();
        const points = new Points('test', pointsTest);

        gateway.handleEvaluateNextPlayer(socket, { points });

        expect(service.updateChoicesHistoryQRL).toHaveBeenCalledWith(lobbyId1, points);
        expect(service.addPoints).toHaveBeenCalledWith(points, lobbyId1);
        expect(gateway.handleEvaluatePlayer).toHaveBeenCalledWith(socket);
    });

    it('should handleEvaluatePlayer and emit EvaluatePlayer if there is still a player to evaluate', () => {
        const playerEvaluation = new PlayerEvaluation('test', 'test');
        service.getNextPlayerEvaluation = jest.fn().mockReturnValue(playerEvaluation);

        gateway.handleEvaluatePlayer(socket);

        expect(service.getNextPlayerEvaluation).toHaveBeenCalledWith(lobbyId1);
        expect(socket.emit.calledWith(EmitMessageType.EvaluatePlayer, playerEvaluation));
    });

    it('should handleEvaluatePlayer and emit ShowAnswer if there is no more player to evaluate', () => {
        service.getNextPlayerEvaluation = jest.fn().mockReturnValue(undefined);
        server.to.returns({
            emit: (event: string) => {
                expect(event).toEqual(EmitMessageType.ShowAnswer);
            },
        } as BroadcastOperator<any, any>);

        gateway.handleEvaluatePlayer(socket);

        expect(service.getNextPlayerEvaluation).toHaveBeenCalledWith(lobbyId1);
    });

    it('should handleNewSelection and emit newSelection', () => {
        socket.data = { playerName: 'test' };
        const selection: ChoiceSelection = { selection: 1, playerName: 'test' };
        server.to.returns({
            emit: (event: string, data: any) => {
                expect(event).toEqual(EmitMessageType.NewSelection);
                expect(data).toEqual(selection);
            },
        } as BroadcastOperator<any, any>);

        gateway.handleNewSelection(socket, 1);
    });

    it('should handleNewDeselection and emit newDeselection', () => {
        socket.data = { playerName: 'test' };
        const deselection: ChoiceDeselection = { deselection: 1, playerName: 'test' };
        server.to.returns({
            emit: (event: string, data: any) => {
                expect(event).toEqual(EmitMessageType.NewDeselection);
                expect(data).toEqual(deselection);
            },
        } as BroadcastOperator<any, any>);

        gateway.handleNewDeselection(socket, 1);
    });

    it('should handleStartGameCountdown', () => {
        serviceTimer.startCountdown = jest.fn();
        gateway.handleStartGameCountdown(socket);
        expect(serviceTimer.startCountdown).toHaveBeenCalledWith(lobbyId1, CountDown.GameStart);
    });

    it('should handlePoints', () => {
        socket.data = { playerName: testId };
        // retrait du lint nombre magique pour les tests
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        const points = new Points(testId, 40, true);
        service.getPlayerPoints = jest.fn().mockReturnValue(points);

        gateway.handlePoints(socket);

        expect(socket.emit.calledWith(EmitMessageType.Points, points));
        expect(service.getPlayerPoints).toHaveBeenCalledWith(lobbyId1, testId);
    });

    it('should handlePlayersPoints', () => {
        socket.data = { playerName: testId };
        // retrait du lint nombre magique pour les tests
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        const points = new Points(testId, 40, true);
        service.getAllPlayersPoints = jest.fn().mockReturnValue([points, points]);

        gateway.handlePlayersPoints(socket);

        expect(socket.emit.calledWith(EmitMessageType.PlayersPoints, [points, points]));
        expect(service.getAllPlayersPoints).toHaveBeenCalledWith(lobbyId1);
    });

    it('should handleRetrieveScore', () => {
        service.getScores = jest.fn().mockReturnValue([{ playerName: 'bonjour', points: 40, bonusCount: 1 }]);

        server.to.returns({
            emit: (event: string, data: Score[]) => {
                expect(event).toEqual(EmitMessageType.LobbyScores);
                expect(data).toEqual([{ playerName: 'bonjour', points: 40, bonusCount: 1 }]);
            },
        } as BroadcastOperator<any, any>);
        gateway.handleRetrieveScore(socket);

        expect(service.getScores).toHaveBeenCalledWith(lobbyId1);
    });

    it('should handleNavigateToResults', () => {
        service.populateScores = jest.fn();
        service.setGameOver = jest.fn();
        service.saveGameHistory = jest.fn();
        server.to.returns({
            emit: (event: string) => {
                expect(event).toEqual(EmitMessageType.NavigateToResults);
            },
        } as BroadcastOperator<any, any>);
        gateway.handleNavigateToResults(socket);

        expect(service.setGameOver).toHaveBeenCalledWith(lobbyId1);
        expect(service.populateScores).toHaveBeenCalledWith(lobbyId1);
    });

    it('should handleGetCorrectChoices', () => {
        service.getCorrectChoices = jest.fn().mockReturnValue([1, 2]);

        gateway.handleGetCorrectChoices(socket);

        expect(socket.emit.calledWith(EmitMessageType.PlayersPoints, [1, 2]));
        expect(service.getCorrectChoices).toHaveBeenCalledWith(lobbyId1);
    });

    it('should handleChoices', () => {
        service.updateChoicesHistoryQCM = jest.fn();

        gateway.handleChoices(socket, fakeChoices);

        expect(service.updateChoicesHistoryQCM).toHaveBeenCalledWith(lobbyId1, fakeChoices);
    });

    it('should handleRetrieveChoicesHistory', () => {
        service.getChoicesHistory = jest.fn().mockReturnValue(choicesHistory);

        server.to.returns({
            emit: (event: string, data: any) => {
                expect(event).toEqual(EmitMessageType.ChoicesHistory);
                expect(data).toEqual(choicesHistory);
            },
        } as BroadcastOperator<any, any>);

        gateway.handleRetrieveChoicesHistory(socket);

        expect(service.getChoicesHistory).toHaveBeenCalledWith(lobbyId1);
    });

    it('should handleQuestions', () => {
        service.getQuestions = jest.fn().mockReturnValue(fakeQuestions);

        server.to.returns({
            emit: (event: string, data: any) => {
                expect(event).toEqual(EmitMessageType.Questions);
                expect(data).toEqual(fakeQuestions);
            },
        } as BroadcastOperator<any, any>);

        gateway.handleQuestions(socket);

        expect(service.getQuestions).toHaveBeenCalledWith(lobbyId1);
    });

    it('should handleNextQuestionCountdown', () => {
        serviceTimer.startCountdown = jest.fn();

        gateway.handleNextQuestionCountdown(socket);

        expect(serviceTimer.startCountdown).toHaveBeenCalledWith(lobbyId1, CountDown.NextQuestion);
    });
    it('should handlePauseCountDown', () => {
        serviceTimer.pauseCountdown = jest.fn();

        gateway.handlePauseCountDown(socket);

        expect(serviceTimer.pauseCountdown).toHaveBeenCalled();
    });

    it('should handleUnpauseCountdown', () => {
        serviceTimer.unpauseCountdown = jest.fn();

        gateway.handleUnpauseCountdown(socket);

        expect(serviceTimer.unpauseCountdown).toHaveBeenCalled();
    });

    it('should handlePanicMode', () => {
        serviceTimer.setPanicMode = jest.fn();

        server.to.returns({
            emit: (event: string) => {
                expect(event).toEqual(EmitMessageType.PanicMode);
            },
        } as BroadcastOperator<any, any>);
        gateway.handlePanicMode(socket);

        expect(serviceTimer.setPanicMode).toHaveBeenCalled();
    });
});

const lobbyId1 = 'abcd';
const testId = 'a234';
const pointsTest = 50;
const socketIdTest2 = '123456';
const socketIdTest3 = '123455';
const fakeChoices: HistogramChoice[] = [
    { text: '100', isCorrect: true, selectedCount: 0 },
    { text: '50', isCorrect: false, selectedCount: 0 },
    { text: '0', isCorrect: false, selectedCount: 0 },
];
const choicesHistory: HistogramChoice[][] = [
    [
        { text: '100', isCorrect: true, selectedCount: 0 },
        { text: '50', isCorrect: false, selectedCount: 0 },
        { text: '0', isCorrect: false, selectedCount: 0 },
    ],
    [
        { text: '200', isCorrect: false, selectedCount: 0 },
        { text: '150', isCorrect: true, selectedCount: 0 },
        { text: '100', isCorrect: false, selectedCount: 0 },
    ],
    [
        { text: '300', isCorrect: false, selectedCount: 0 },
        { text: '550', isCorrect: false, selectedCount: 0 },
        { text: '150', isCorrect: true, selectedCount: 0 },
    ],
];
const fakeQuestions: Question[] = [
    {
        text: 'What is the capital of France?',
        choices: [
            { text: 'Paris', isCorrect: true },
            { text: 'Berlin', isCorrect: false },
            { text: 'London', isCorrect: false },
        ],
        points: 10,
        type: QuestionType.QCM,
    },
    {
        text: 'Who is known for the theory of relativity?',
        choices: [
            { text: 'Isaac Newton', isCorrect: false },
            { text: 'Albert Einstein', isCorrect: true },
            { text: 'Nikola Tesla', isCorrect: false },
        ],
        points: 10,
        type: QuestionType.QCM,
    },
    {
        text: 'In which year did the first moon landing occur?',
        choices: [
            { text: '1959', isCorrect: false },
            { text: '1969', isCorrect: true },
            { text: '1979', isCorrect: false },
        ],
        points: 10,
        type: QuestionType.QCM,
    },
];
