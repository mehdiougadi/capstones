import { Room } from '@app/common-server/room';
import { PlayerConnectionGateway } from '@app/gateways/player-connection/player-connection.gateway';
import { GameServiceTimer } from '@app/services/game-services/game-timer-service/game-timer-service';
import { VerificationService } from '@app/services/verification-service/verification.service';
import { Player } from '@common/classes/player';
import { FULL_POINTS, HALF_POINTS, MULT_POINTS, RED, ZERO_POINTS } from '@common/constant/constants';
import { QuestionType } from '@common/constant/state';
import { Answer } from '@common/interfaces/answer';
import { Question } from '@common/interfaces/question';
import { Injectable } from '@nestjs/common';

@Injectable()
export class GameServicePlayer {
    constructor(
        private readonly playerConnectionGateway: PlayerConnectionGateway,
        private readonly gameServiceTimer: GameServiceTimer,
        private readonly verification: VerificationService,
    ) {}
    nextRoundPlayer(room: Room) {
        if (!room) return;

        room.listPlayers.forEach((player) => {
            player.firstToAnswer = false;
            player.goodAnswers = false;
            player.answered = false;
            player.interaction = RED;
        });
    }

    endRoundPlayer(room: Room, playerList: Player[]) {
        this.addPlayerPoints(room, playerList);
        this.sortPlayersByPoints(room.listPlayers);
        this.setBestScore(room);
    }

    addPlayerPoints(room: Room, listPlayers): void {
        listPlayers.forEach((player) => {
            this.addPointsByType(player.name, room, player.pointFactor);
        });

        this.sortPlayersByPoints(room.listPlayers);
        this.playerConnectionGateway.sendPlayersUpdate(room.id, room.listPlayers);
    }

    addPointsByType(playerName: string, room: Room, factor: number): void {
        const player = this.findPlayerByName(playerName, room);
        if (room.quiz.questions[room.currentQuestionIndex].type === QuestionType.QCM) {
            const pointsToAdd = this.calculatePointsToAdd(player, room.currentQuestionIndex, room.quiz.questions);
            player.addPoints(pointsToAdd);
        } else if (room.quiz.questions[room.currentQuestionIndex].type === QuestionType.QRL) {
            const qrlPointsToAdd = this.calculateQrlPointsToAdd(room.currentQuestionIndex, factor, room);
            player.points += qrlPointsToAdd;
        }
    }

    verifyPlayerAnswers(room: Room, answers: Answer[], playerName: string): boolean {
        this.verifyAndRecordPlayerAnswers(room, answers, playerName);
        return this.checkAllPlayersAnswered(room);
    }

    verifyQrlAnswers(room: Room, qrlAnswer: string, playerName: string): boolean {
        this.setQrlAnswer(room, qrlAnswer, playerName);
        return this.checkAllPlayersAnswered(room);
    }

    findPlayerByName(name: string, room: Room): Player | null {
        const foundPlayer = room ? room.listPlayers.find((player) => player.name === name) : undefined;
        return foundPlayer ? foundPlayer : null;
    }

    togglePlayerChatPermission(player: Player, room: Room): void {
        this.findPlayerByName(player.name, room).isBannedFromChat = player.isBannedFromChat;
    }

    updatePlayerInteration(room: Room, player: Player): void {
        this.findPlayerByName(player.name, room).interaction = player.interaction;
        this.playerConnectionGateway.sendPlayerInteraction(room.id, player);
    }

    addPlayerToRoom(room: Room, username: string, isAdmin: boolean): string {
        const newPlayer = new Player(username);
        let failedJoin;
        if (!isAdmin) {
            failedJoin = this.verification.generalVerification(newPlayer, room);
        }
        if (!failedJoin) {
            this.playerConnectionGateway.sendNewPlayerToClient(newPlayer, room.id);
            room.listPlayers.push(newPlayer);
        }
        return failedJoin;
    }

    removePlayerFromRoom(room: Room, username: string): boolean {
        const isBanned = room.nameBanned.includes(username);
        this.playerConnectionGateway.sendLeftPlayerToClient(this.findPlayerByName(username, room), room.id, isBanned);
        room.listPlayers = room.listPlayers.filter((player) => player.name !== username);
        if (room.listPlayers.length === 0) {
            return true;
        }
        return false;
    }

    checkAllPlayersAnswered(room: Room): boolean {
        return this.everyPlayerAnswered(room);
    }

    private setBestScore(room: Room) {
        for (const player of room.listPlayers) {
            if (player.points > room.bestScore) {
                room.bestScore = player.points;
            }
        }
    }

    private verifyAnswersReceived(room: Room, answers: Answer[]): boolean {
        const currentQuestion = room.quiz.questions[room.currentQuestionIndex];

        if (this.hasIncorrectAnswers(answers, currentQuestion)) {
            return false;
        }
        return this.isCorrectAnswerCountMatch(answers, currentQuestion);
    }

    private verifyAndRecordPlayerAnswers(room: Room, answers: Answer[], playerName: string): void {
        const player = this.findPlayerByName(playerName, room);
        if (this.verifyAnswersReceived(room, answers)) {
            this.firstOrSecondPlayer(room);
            player.goodAnswers = true;
            if (this.firstPlayerToAnswer(room)) {
                if (!room.lockPlayerPoints) {
                    player.firstToAnswer = true;
                    player.bonusPoints++;
                }
            }
        }
        player.answered = true;
    }

    private setQrlAnswer(room: Room, qrlAnswer: string, playerName: string): void {
        const player = this.findPlayerByName(playerName, room);
        player.qrlAnswer = qrlAnswer;
        player.answered = true;
    }

    private sortPlayersByPoints(listPlayers: Player[]): void {
        listPlayers.sort((a, b) => {
            if (a.points === b.points) {
                return a.name.localeCompare(b.name);
            }
            return b.points - a.points;
        });
    }

    private calculatePointsToAdd(player: Player, currentQuestionIndex: number, questions: Question[]): number {
        if (!player.goodAnswers) return 0;

        let pointsToAdd = questions[currentQuestionIndex].points;
        if (player.firstToAnswer) {
            pointsToAdd *= MULT_POINTS;
        }

        return pointsToAdd;
    }

    private calculateQrlPointsToAdd(currentQuestionIndex: number, pointFactor: number, room: Room): number {
        if (room.isTesting) {
            const pointsToAddTest = room.quiz.questions[currentQuestionIndex].points;
            return pointsToAddTest;
        } else {
            const pointsToAdd = room.quiz.questions[currentQuestionIndex].points * pointFactor;
            this.updateQRLStats(room, pointFactor, currentQuestionIndex);
            return pointsToAdd;
        }
    }

    private everyPlayerAnswered(room: Room): boolean {
        return room.listPlayers.every((currentPlayer) => currentPlayer.answered);
    }
    private hasIncorrectAnswers(answers: Answer[], question: Question): boolean {
        return answers.some((answer) => !answer.isCorrect && question.choices.some((option) => option.text === answer.text && !option.isCorrect));
    }

    private isCorrectAnswerCountMatch(answers: Answer[], question: Question): boolean {
        return answers.filter((answer) => answer.isCorrect).length === question.choices.filter((option) => option.isCorrect).length;
    }

    private firstPlayerToAnswer(room: Room): boolean {
        return room.listPlayers.every((p) => !p.firstToAnswer);
    }

    private firstOrSecondPlayer(room: Room): boolean {
        if (room.lockPlayerPoints) {
            return false;
        }
        return this.checkFirstPlayerToAnswer(room);
    }

    private checkFirstPlayerToAnswer(room: Room): boolean {
        if (room.listPlayers.some((player) => player.firstToAnswer)) {
            this.resetFirstToAnswerStatus(room);
            return false;
        } else {
            const isFirstToAnswer = room.listPlayers.every((player) => !player.firstToAnswer);
            if (isFirstToAnswer) {
                this.gameServiceTimer.startTimerFirstToAnswer(room);
            }

            return isFirstToAnswer;
        }
    }
    private resetFirstToAnswerStatus(room: Room): void {
        room.listPlayers.forEach((player) => {
            room.lockPlayerPoints = true;
            if (player.firstToAnswer) {
                player.bonusPoints--;
            }
            player.firstToAnswer = false;
        });
    }

    private updateQRLStats(room: Room, pointFactor: number, currentQuestionIndex: number): void {
        switch (pointFactor) {
            case FULL_POINTS:
                room.questionStats[currentQuestionIndex].statsQRL.scores.hundredPercent++;
                break;
            case HALF_POINTS:
                room.questionStats[currentQuestionIndex].statsQRL.scores.fiftyPercent++;
                break;
            case ZERO_POINTS:
                room.questionStats[currentQuestionIndex].statsQRL.scores.zeroPercent++;
                break;
            default:
        }
    }
}
