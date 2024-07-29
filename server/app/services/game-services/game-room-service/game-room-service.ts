import { Room } from '@app/common-server/room';
import { GameConnectionGateway } from '@app/gateways/game-connection/game-connection.gateway';
import { QuestionDbService } from '@app/services/question-service/question.service';
import { QuizDbService } from '@app/services/quiz-service/quiz.service';
import { Player } from '@common/classes/player';
import { BASE_ROOM_ID, BASE_TAG_OFFESET, LOWER_BOUND, UPPER_LIMIT_ID } from '@common/constant/constants';
import { GameState } from '@common/enum/socket-messages';
import { Injectable } from '@nestjs/common';
@Injectable()
export class GameServiceRoom {
    private roomIDvalue: number = BASE_ROOM_ID;
    constructor(
        private readonly gameConnectionGateway: GameConnectionGateway,
        private quizDbService: QuizDbService,
        private questionsDbService: QuestionDbService,
    ) {}
    // eslint-disable-next-line max-params
    async createNewGame(quizId: string, isTesting: boolean, listRooms: Room[], randomMode: boolean): Promise<string> {
        const newRoom: Room = {
            isTesting,
            randomMode,
            isPaused: false,
            isPanicMode: false,
            listPlayers: [],
            nameBanned: [],
            currentQuestionIndex: 0,
            isLocked: false,
            currentState: GameState.NOT_STARTED,
            numberOfPlayers: 0,
            bestScore: 0,
        } as Room;
        await this.initParameters(newRoom, quizId, randomMode);
        this.incrementRoomIdValue();
        listRooms.push(newRoom);
        return newRoom.id;
    }

    initializeQuestionStats(room: Room): void {
        room.questionStats = new Array(room.quiz.questions.length);
        room.quiz.questions.forEach((question, index) => {
            const stats: { [choice: string]: { count: number; isCorrect: boolean } } = {};
            if (question.type === 'QCM') {
                question.choices.forEach((choice) => {
                    stats[choice.text] = {
                        count: 0,
                        isCorrect: choice.isCorrect,
                    };
                });
                room.questionStats[index] = {
                    questionType: 'QCM',
                    questionIndex: index,
                    stats,
                    statsQRL: null,
                };
            } else if (question.type === 'QRL') {
                room.questionStats[index] = {
                    questionType: 'QRL',
                    questionIndex: index,
                    stats: {},
                    statsQRL: {
                        modifiedLastSeconds: 0,
                        notModifiedLastSeconds: 0,
                        scores: {
                            zeroPercent: 0,
                            fiftyPercent: 0,
                            hundredPercent: 0,
                        },
                    },
                };
            }
        });
    }

    deleteRoom(room: Room, listRooms: Room[]): boolean {
        const roomIndex = listRooms.findIndex((currentRoom) => currentRoom.id === room.id);
        if (roomIndex === LOWER_BOUND) {
            return false;
        } else if (!room.isTesting) {
            this.gameConnectionGateway.sendRoomState(room.id, GameState.END_ROOM);
        }
        listRooms.splice(roomIndex, 1);
        return true;
    }

    changeLockRoom(room: Room) {
        room.isLocked = !room.isLocked;
    }

    banPlayerFromRoom(player: Player, room: Room) {
        room.nameBanned.push(player.name);
        this.gameConnectionGateway.banPlayerFromRoom(room.id, player.name);
    }

    prepareRoomForResponse(room: Room): Room {
        const roomCopy = { ...room };
        delete roomCopy.nameBanned;
        delete roomCopy.timer;
        delete roomCopy.isPanicMode;
        delete roomCopy.lockPlayerPoints;
        delete roomCopy.dateCreated;
        delete roomCopy.bestScore;
        delete roomCopy.numberOfPlayers;
        return roomCopy;
    }
    private async initParameters(newRoom: Room, quizId: string, randomMode: boolean): Promise<void> {
        if (randomMode) {
            const randomQuestions = await this.questionsDbService.generateRandomQuestion();
            newRoom.quiz = this.quizDbService.generateRandomQuiz(randomQuestions);
        } else {
            newRoom.quiz = await this.quizDbService.getQuiz(quizId);
        }
        this.initializeQuestionStats(newRoom);
        newRoom.id = this.roomIDvalue.toString();
        newRoom.accessCode = ((this.roomIDvalue + BASE_TAG_OFFESET) % UPPER_LIMIT_ID).toString();
        newRoom.currentTime = newRoom.quiz.duration;
        newRoom.dateCreated = new Date();
    }
    private incrementRoomIdValue(): void {
        this.roomIDvalue++;
    }
}
