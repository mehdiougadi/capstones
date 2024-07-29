import { Room } from '@app/common-server/room';
import { GameConnectionGateway } from '@app/gateways/game-connection/game-connection.gateway';
import { QuestionType } from '@common/constant/state';
import { Question } from '@common/interfaces/question';
import { GameServiceState } from './game-state-service';

describe('GameServiceState', () => {
    let gameServiceState: GameServiceState;
    let gameConnectionGatewayMock: Partial<GameConnectionGateway>;
    let room: Room;
    let question1: Question;
    let question2: Question;

    beforeEach(() => {
        gameConnectionGatewayMock = {
            startGame: jest.fn(),
            sendRoomState: jest.fn(),
        };

        gameServiceState = new GameServiceState(gameConnectionGatewayMock as GameConnectionGateway);

        room = {
            id: 'roomId',
            roundFinished: false,
            currentQuestionIndex: 0,
            currentTime: 0,
            lockPlayerPoints: false,
            quiz: {
                questions: [{}],
                duration: 30,
            },
        } as Room;

        question1 = {
            _id: 'q1',
            text: 'Quelle est la capitale de la France ?',
            type: QuestionType.QCM,
            points: 10,
            choices: [
                { text: 'Paris', isCorrect: true },
                { text: 'Berlin', isCorrect: false },
                { text: 'Madrid', isCorrect: false },
                { text: 'Londres', isCorrect: false },
            ],
            date: new Date(),
        };

        question2 = {
            _id: 'q2',
            text: 'Qui est l\'auteur de "Les Misérables" ?',
            type: QuestionType.QCM,
            points: 15,
            choices: [
                { text: 'Victor Hugo', isCorrect: true },
                { text: 'Albert Camus', isCorrect: false },
                { text: 'Jean-Paul Sartre', isCorrect: false },
                { text: 'Émile Zola', isCorrect: false },
            ],
            date: new Date(),
        };
    });

    describe('nextRoundState', () => {
        it('should start the game if it is the first question and update room state', () => {
            const result = gameServiceState.nextRoundState(room);

            expect(result).toBe(true);
            expect(gameConnectionGatewayMock.startGame).toHaveBeenCalledWith(room.id);
            expect(room.roundFinished).toBe(false);
        });
    });

    describe('endRoundState', () => {
        it('should set the room to the end of the round state and increment currentQuestionIndex', () => {
            gameServiceState.endRoundState(room);

            expect(room.roundFinished).toBe(true);
            expect(room.currentQuestionIndex).toBe(1);
        });
        it('should reset currentTime to quiz duration if there are more questions left', () => {
            room.quiz.questions = [question1, question2];
            room.currentQuestionIndex = 0;
            room.quiz.duration = 30;

            gameServiceState.endRoundState(room);

            expect(room.currentQuestionIndex).toBe(1);
            expect(room.currentTime).toBe(room.quiz.duration);
        });
    });
});
