// retrait du lint des nombres magiques pour les tests
/* eslint-disable @typescript-eslint/no-magic-numbers */
// retrait du lint any pour accéder aux propriétés privées
/* eslint-disable @typescript-eslint/no-explicit-any */
// retrait du lint any pour accéder aux propriétés privées
/* eslint-disable max-lines */
import { ORG_BANNED_NAME, QuestionType } from '@app/app.constants';
import { AnswerSubmit } from '@app/model/database/answer-submit';
import { Game } from '@app/model/database/game';
import { HistogramChoice } from '@app/model/database/histogram-choices';
import { Player } from '@app/model/database/player';
import { Points } from '@app/model/database/points';
import { Question } from '@app/model/database/question';
import { Score } from '@app/model/database/score';
import { HistoryService } from '@app/services/history/history.service';
import { Test, TestingModule } from '@nestjs/testing';
import { LobbyGameManagementService } from './lobby-game-management.service';

describe('LobbyGameManagementService', () => {
    let service: LobbyGameManagementService;
    const mockHistoryService = {
        addHistory: jest.fn(),
    };
    const scores: Score[] = [
        { playerName: 'player1', bonusCount: 0, points: 40 },
        { playerName: 'player2', bonusCount: 0, points: 48 },
        { playerName: 'player3', bonusCount: 0, points: 48 },
    ];

    let player1: Player;
    let player2: Player;

    beforeEach(async () => {
        player1 = new Player('player1', testId);
        player2 = new Player('player2', socketIdTest2);
        const gameTest = getFakeGame();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                LobbyGameManagementService,
                {
                    provide: 'SharedLobbies',
                    useValue: {},
                },
                {
                    provide: HistoryService,
                    useValue: mockHistoryService,
                },
            ],
        }).compile();

        service = module.get<LobbyGameManagementService>(LobbyGameManagementService);
        (service as any).lobbies = {
            abcd: {
                lobbyId: lobbyId1,
                players: new Map([
                    ['player1', player1],
                    ['player2', player2],
                ]),
                nameBan: [ORG_BANNED_NAME],
                isOpen: true,
                game: gameTest,
                dateStart: '',
                sockets: [testId, socketIdTest2],
                inGame: true,
                submitAnswerCount: 0,
                questionIndex: 0,
                lobbyScores: scores,
                playersToEvaluate: [],
                playerBonuses: '',
                highestScore: 0,
                questionStartPlayerCount: 0,
            },
            aaaa: {
                lobbyId: lobbyId2,
                players: new Map([
                    ['player3', new Player('player3', socketIdTest3)],
                    ['player4', new Player('player4', socketIdTest4)],
                ]),
                nameBan: [ORG_BANNED_NAME],
                isOpen: true,
                game: gameTest,
                dateStart: '',
                sockets: [],
                inGame: false,
            },
        };
    });

    it('should save game history', () => {
        const lobbyId = 'abcd';
        (service as any).lobbies[lobbyId].highestScore = 50;

        service.saveGameHistory(lobbyId);

        expect(mockHistoryService.addHistory).toHaveBeenCalled();
    });

    it('should save game history', () => {
        const lobbyId = 'abcd';

        service.saveGameHistory(lobbyId);

        expect(mockHistoryService.addHistory).toHaveBeenCalled();
    });

    it('should set question Start Player Count', () => {
        service.setQuestionStartPlayerCount(lobbyId1);

        expect((service as any).lobbies[lobbyId1].questionStartPlayerCount).toEqual(2);
    });

    it('should get first question', () => {
        const questionTest = (service as any).lobbies[lobbyId1].game.questions[0];
        jest.spyOn(service as any, 'formatQuestion').mockReturnValue(questionTest);
        const question = service.getFirstQuestion(lobbyId1);
        expect(question).toEqual(questionTest);
        expect((service as any).formatQuestion).toHaveBeenCalledWith((service as any).lobbies[lobbyId1].game.questions[0]);
    });

    it('should get first question and not call formatQuestion if it is a QRL', () => {
        jest.spyOn(service as any, 'formatQuestion');
        (service as any).lobbies[lobbyId1].game.questions[0] = getFakeQuestion(QuestionType.QRL);
        const question = service.getFirstQuestion(lobbyId1);
        expect(question).toEqual((service as any).lobbies[lobbyId1].game.questions[0]);
        expect((service as any).formatQuestion).not.toHaveBeenCalled();
    });

    it('should get next question', () => {
        const questionTest = (service as any).formatQuestion((service as any).lobbies[lobbyId1].game.questions[1]);
        const question = service.getNextQuestion(lobbyId1);
        expect(questionTest).toEqual(question);
    });

    it('should get next question if it is a QRL and not call formatQuestion', () => {
        jest.spyOn(service as any, 'formatQuestion');
        (service as any).lobbies[lobbyId1].questionIndex = 1;
        const question = service.getNextQuestion(lobbyId1);
        const questionTest = (service as any).lobbies[lobbyId1].game.questions[2];
        expect(questionTest).toEqual(question);
        expect((service as any).formatQuestion).not.toHaveBeenCalled();
    });

    it('should return undefined if there is no next question', () => {
        (service as any).lobbies[lobbyId1].questionIndex = 2;
        const question = service.getNextQuestion(lobbyId1);
        expect(question).toBeUndefined();
    });

    it('should be able to submit answer', () => {
        const time = new Date().getTime();
        const answer = [1];
        const realAnswer = new AnswerSubmit();
        realAnswer.answer = answer;
        realAnswer.answerTime = time;
        service.submitAnswer('player2', lobbyId1, realAnswer);
        const isFull = service.submitAnswer('player1', lobbyId1, realAnswer);
        expect(isFull).toBe(true);
        expect((service as any).lobbies[lobbyId1].players.get('Player1'.toLowerCase()).answerResponse.answerTime).toBe(time);
        expect((service as any).lobbies[lobbyId1].players.get('Player1'.toLowerCase()).answerResponse.answer).toBe(answer);
    });

    it('orderPlayerEvaluation() should sort the players by name and assign them to playersToEvaluate', () => {
        const expectValue = [
            { name: 'player1', answer: 'wakeUp' },
            { name: 'player2', answer: 'wakeUpPlz' },
        ];
        (service as any).lobbies[lobbyId1].players.get('Player1'.toLowerCase()).answerResponse.answer = 'wakeUp';
        (service as any).lobbies[lobbyId1].players.get('Player2'.toLowerCase()).answerResponse.answer = 'wakeUpPlz';
        service.orderPlayerEvaluation(lobbyId1);

        expect((service as any).lobbies[lobbyId1].playersToEvaluate).toEqual(expectValue);
    });

    it('getNextPlayerEvaluation() should return the next player to evaluate based on the submitAnswerCount', () => {
        (service as any).lobbies[lobbyId1].playersToEvaluate = [
            { name: 'player1', answer: 'wakeUp' },
            { name: 'player2', answer: 'wakeUpPlz' },
        ];
        jest.spyOn(service, 'resetSubmitAnswerCount');
        expect(service.getNextPlayerEvaluation(lobbyId1)).toEqual({ name: 'player1', answer: 'wakeUp' });
        expect(service.getNextPlayerEvaluation(lobbyId1)).toEqual({ name: 'player2', answer: 'wakeUpPlz' });
        expect(service.getNextPlayerEvaluation(lobbyId1)).toEqual(undefined);
        expect(service.resetSubmitAnswerCount).toHaveBeenCalledWith(lobbyId1);
    });

    it('addPoints() should add the point to the player', () => {
        const valueExpect = (50 / 100) * 10;
        const points = new Points('player1', 50);

        service.addPoints(points, lobbyId1);

        expect((service as any).lobbies[lobbyId1].players.get('player1').points).toEqual(valueExpect);
    });

    it('addPoints() should not add the point if the player quit', () => {
        const points = new Points('fakePlayer', 50);

        service.addPoints(points, lobbyId1);

        expect((service as any).lobbies[lobbyId1].players.get('fakePlayer')).toEqual(undefined);
    });

    it('should be able to reset answer count', () => {
        (service as any).lobbies[lobbyId1].submitAnswerCount = 42;
        service.resetSubmitAnswerCount(lobbyId1);
        expect((service as any).lobbies[lobbyId1].submitAnswerCount).toEqual(0);
    });

    it('should return true if game is over', () => {
        (service as any).lobbies[lobbyId1] = { questionIndex: 4, game: { questions: [1, 2, 3, 4, 5] } };

        const result = service.checkIfGameIsOver(lobbyId1);

        expect(result).toBe(true);
    });

    it('should return false if game is not over', () => {
        (service as any).lobbies[lobbyId1] = { questionIndex: 3, game: { questions: [1, 2, 3] } };
        const result = service.checkIfGameIsOver(lobbyId1);

        expect(result).toBe(false);
    });

    it('getCorrectChoices() should return the correct choice', () => {
        const result = service.getCorrectChoices(lobbyId1);
        expect(result).toEqual([0]);
    });

    it('getPlayerPoints() should return Points for a player', () => {
        (service as any).lobbies[lobbyId1].players.get('player1').points = 40;
        const result = service.getPlayerPoints(lobbyId1, 'Player1');
        expect(result).toEqual({ hasBonus: false, name: 'player1', points: 40 });
    });

    it('getScores() should return the scores in the lobby', () => {
        const result = service.getScores(lobbyId1);
        expect(result).toEqual(scores);
    });

    it('getAllPlayersPoints() should return Points for all players', () => {
        (service as any).lobbies[lobbyId1].players.get('player1').points = 10;
        (service as any).lobbies[lobbyId1].players.get('player2').points = 20;
        const result = service.getAllPlayersPoints(lobbyId1);

        expect(result).toEqual([new Points('player1', 10), new Points('player2', 20)]);
    });

    it('calculatePoints() should calculate points to all players and give the bonus if someone answer faster then the others', () => {
        (service as any).getFastestPlayers = jest.fn().mockReturnValue(['player1']);
        (service as any).getCorrectPlayers = jest.fn().mockReturnValue([player1]);

        service.calculatePoints(lobbyId1);

        expect((service as any).lobbies[lobbyId1].playerBonuses).toEqual('player1');
        expect((service as any).lobbies[lobbyId1].players.get('player1').points).toEqual(2);
        expect((service as any).lobbies[lobbyId1].players.get('player1').bonusCount).toEqual(1);
    });

    it('calculatePoints() should calculate points to all players and not give the bonus if no one answer faster then the others', () => {
        (service as any).getFastestPlayers = jest.fn().mockReturnValue(['player1', 'player2']);
        (service as any).getCorrectPlayers = jest.fn().mockReturnValue([player1, player2]);

        service.calculatePoints(lobbyId1);

        expect((service as any).lobbies[lobbyId1].playerBonuses).toEqual('');
        expect((service as any).lobbies[lobbyId1].players.get('player1').points).toEqual(0);
        expect((service as any).lobbies[lobbyId1].players.get('player1').bonusCount).toEqual(0);
    });

    it('getCorrectPlayers() should get the player with the correct answer', () => {
        (service as any).lobbies[lobbyId1].players.get('player1').answerResponse = { answer: [0], answerTime: 1 };
        (service as any).lobbies[lobbyId1].players.get('player2').answerResponse = { answer: [0], answerTime: 2 };
        player1.points = 10;
        player2.points = 10;

        service.getCorrectChoices = jest.fn().mockReturnValue([0]);

        const result = (service as any).getCorrectPlayers((service as any).lobbies[lobbyId1].players, lobbyId1);

        expect(result).toEqual([player1, player2]);
    });

    it('getFastestPlayers() should get the player with the correct answer that has answer the fastest', () => {
        player1.answerResponse = { answer: [0], answerTime: 1 };
        player2.answerResponse = { answer: [0], answerTime: 2 };

        const result = (service as any).getFastestPlayers([player1, player2], lobbyId1);

        expect(result).toEqual([player1.name]);
    });

    it('getFastestPlayers() should get all the player with the correct answer that has answer the fastest', () => {
        player1.answerResponse = { answer: [0], answerTime: 1 };
        player2.answerResponse = { answer: [0], answerTime: 1 };

        const result = (service as any).getFastestPlayers([player1, player2], lobbyId1);

        expect(result).toEqual([player1.name, player2.name]);
    });

    it('full test calculatePoints() should calculate points to all players and not give the bonus if no one answer faster then the others', () => {
        (service as any).lobbies[lobbyId1].players.get('player1').answerResponse = { answer: [0], answerTime: 1 };
        (service as any).lobbies[lobbyId1].players.get('player2').answerResponse = { answer: [0], answerTime: 1 };

        service.calculatePoints(lobbyId1);

        expect((service as any).lobbies[lobbyId1].playerBonuses).toEqual('');
        expect((service as any).lobbies[lobbyId1].players.get('player1').points).toEqual(10);
        expect((service as any).lobbies[lobbyId1].players.get('player1').bonusCount).toEqual(0);
        expect((service as any).lobbies[lobbyId1].players.get('player2').points).toEqual(10);
        expect((service as any).lobbies[lobbyId1].players.get('player2').bonusCount).toEqual(0);
    });

    it('full test calculatePoints() should calculate points to all players and give the bonus if one answer faster then the others', () => {
        (service as any).lobbies[lobbyId1].players.get('player1').answerResponse = { answer: [0], answerTime: 1 };
        (service as any).lobbies[lobbyId1].players.get('player2').answerResponse = { answer: [0], answerTime: 2 };

        service.calculatePoints(lobbyId1);

        expect((service as any).lobbies[lobbyId1].playerBonuses).toEqual('player1');
        expect((service as any).lobbies[lobbyId1].players.get('player1').points).toEqual(12);
        expect((service as any).lobbies[lobbyId1].players.get('player1').bonusCount).toEqual(1);
        expect((service as any).lobbies[lobbyId1].players.get('player2').points).toEqual(10);
        expect((service as any).lobbies[lobbyId1].players.get('player2').bonusCount).toEqual(0);
    });

    it('populateScores() should populate the attribute lobbyScores', () => {
        (service as any).lobbies[lobbyId1].lobbyScores = [];
        player1.points = 240;
        player2.bonusCount = 3;
        player2.points = 40;
        (service as any).lobbies[lobbyId1].players.set('player1', player1);
        (service as any).lobbies[lobbyId1].players.set('player2', player2);
        (service as any).orderScores = jest.fn();

        service.populateScores(lobbyId1);

        expect((service as any).orderScores).toHaveBeenCalledWith(lobbyId1);
        expect((service as any).lobbies[lobbyId1].lobbyScores).toEqual([
            { playerName: player1.name, points: player1.points, bonusCount: player1.bonusCount },
            { playerName: player2.name, points: player2.points, bonusCount: player2.bonusCount },
        ]);
    });

    it('getOrganizer() should get the organizer', () => {
        (service as any).lobbies[lobbyId1].inGame = true;

        const result = service.getOrganizer(lobbyId1);

        expect(result).toEqual(testId);
    });

    it('setGameOver() should change the state of  in game to false', () => {
        (service as any).lobbies[lobbyId1].inGame = true;

        service.setGameOver(lobbyId1);

        expect((service as any).lobbies[lobbyId1].inGame).toBe(false);
    });

    it('orderScores() should order the score from the highest to lowest', () => {
        (service as any).lobbies[lobbyId1].inGame = true;

        (service as any).orderScores(lobbyId1);

        expect((service as any).lobbies[lobbyId1].lobbyScores).toEqual([
            { playerName: 'player2', bonusCount: 0, points: 48 },
            { playerName: 'player3', bonusCount: 0, points: 48 },
            { playerName: 'player1', bonusCount: 0, points: 40 },
        ]);
    });

    it('getQuestions() should retrieve questions', () => {
        (service as any).lobbies[lobbyId1].game.questions = fakeQuestions;

        const question = service.getQuestions(lobbyId1);

        expect(question).toEqual(fakeQuestions);
    });

    it('updateChoicesHistoryQRL() should create a choice[] if choicesHistory < question.index and update selected value', () => {
        (service as any).lobbies[lobbyId1].choicesHistory = [];

        service.updateChoicesHistoryQRL(lobbyId1, fakePoints);

        expect((service as any).lobbies[lobbyId1].choicesHistory).toEqual(updatedHistogramChoices);
    });

    it('updateChoicesHistoryQCM() updates the selected value of selected QCM', () => {
        (service as any).lobbies[lobbyId1].choicesHistory = [];

        service.updateChoicesHistoryQCM(lobbyId1, newHistogramChoices);
        const updatedValue: HistogramChoice[][] = [];
        updatedValue.push(newHistogramChoices);
        updatedValue[0][0].selectedCount += 1;

        expect((service as any).lobbies[lobbyId1].choicesHistory).toEqual(updatedValue);
    });

    it('getChoicesHistory() should return ChoicesHistory', () => {
        (service as any).lobbies[lobbyId1].choicesHistory = updatedHistogramChoices;

        const choicesHistory = service.getChoicesHistory(lobbyId1);

        expect(choicesHistory).toEqual(updatedHistogramChoices);
    });
});

const getFakeGame = (): Game => ({
    id: getRandomString(),
    title: getRandomString(),
    description: getRandomString(),
    lastModification: '',
    duration: 10,
    questions: [getFakeQuestion(QuestionType.QCM), getFakeQuestion(QuestionType.QCM), getFakeQuestion(QuestionType.QRL)],
    isVisible: true,
});

const getFakeQuestion = (type: QuestionType): Question => {
    const question: Question = {
        text: getRandomString(),
        points: 10,
        type,
    };

    if (type === QuestionType.QCM) {
        question.choices = [
            { text: 'choice1', isCorrect: true },
            { text: 'choice2', isCorrect: false },
        ];
    }

    return question;
};

const BASE_36 = 36;
const getRandomString = (): string => (Math.random() + 1).toString(BASE_36).substring(2);
const lobbyId1 = 'abcd';
const lobbyId2 = 'aaaa';
const testId = 'a234';
const socketIdTest2 = '123456';
const socketIdTest3 = '123455';
const socketIdTest4 = '123454';

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
const fakePoints = new Points('Player1', 100, false);
const newHistogramChoices: HistogramChoice[] = [
    { text: 'Oui', isCorrect: true, selectedCount: 0 },
    { text: 'Non', isCorrect: false, selectedCount: 0 },
    { text: 'Vraiment pas', isCorrect: false, selectedCount: 0 },
];
const updatedHistogramChoices: HistogramChoice[][] = [
    [
        { text: '100%', isCorrect: true, selectedCount: 1 },
        { text: '50%', isCorrect: false, selectedCount: 0 },
        { text: '0%', isCorrect: false, selectedCount: 0 },
    ],
];
