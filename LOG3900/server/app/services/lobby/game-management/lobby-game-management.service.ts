import { BONUS, FIRST_QUESTION_INDEX, PERCENT, QuestionType } from '@app/app.constants';
import { AnswerSubmit } from '@app/model/database/answer-submit';
import { HistogramChoice } from '@app/model/database/histogram-choices';
import { Lobby } from '@app/model/database/lobby';
import { Player } from '@app/model/database/player';
import { PlayerEvaluation } from '@app/model/database/player-to-evaluate';
import { Points } from '@app/model/database/points';
import { Question } from '@app/model/database/question';
import { QuestionAnswer } from '@app/model/database/question-answer';
import { Score } from '@app/model/database/score';
import { HistoryService } from '@app/services/history/history.service';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class LobbyGameManagementService {
    constructor(
        @Inject('SharedLobbies') private lobbies: { [lobby: string]: Lobby },
        private readonly historyService: HistoryService,
    ) {}

    getNextQuestion(lobbyId: string): QuestionAnswer {
        let currentIndex: number = this.lobbies[lobbyId].questionIndex;
        if (++currentIndex === this.lobbies[lobbyId].game.questions.length) {
            return undefined;
        }
        const question: Question = this.lobbies[lobbyId].game.questions[currentIndex];
        this.lobbies[lobbyId].questionIndex = currentIndex;
        this.lobbies[lobbyId].playerBonuses = '';
        if (question.type === QuestionType.QCM) {
            return this.formatQuestion(question);
        }
        return question;
    }

    getOrganizer(lobbyId: string): string {
        return this.lobbies[lobbyId].sockets[0];
    }

    checkIfGameIsOver(lobbyId: string) {
        let currentIndex: number = this.lobbies[lobbyId].questionIndex;
        if (++currentIndex === this.lobbies[lobbyId].game.questions.length) {
            return true;
        }
        return false;
    }

    getFirstQuestion(lobbyId: string) {
        const question: Question = this.lobbies[lobbyId].game.questions[FIRST_QUESTION_INDEX];
        if (question.type === QuestionType.QCM) return this.formatQuestion(question);
        return question;
    }

    getPlayerPoints(lobbyId: string, playerName: string): Points {
        const lobby = this.lobbies[lobbyId];
        const player = this.lobbies[lobbyId].players.get(playerName.toLowerCase());
        const points: Points = new Points(player.name, player.points, lobby.playerBonuses === playerName);
        return points;
    }

    getCorrectChoices(lobbyId: string): number[] {
        const questionIndex = this.lobbies[lobbyId].questionIndex;
        const choices = this.lobbies[lobbyId].game.questions[questionIndex].choices;
        const correctChoices: number[] = [];
        choices.forEach((choice, index) => {
            if (choice.isCorrect) {
                correctChoices.push(index);
            }
        });
        return correctChoices;
    }

    getScores(lobbyId: string): Score[] {
        return this.lobbies[lobbyId].lobbyScores;
    }

    getQuestions(lobbyId: string) {
        return this.lobbies[lobbyId].game.questions;
    }

    setQuestionStartPlayerCount(lobbyId: string) {
        this.lobbies[lobbyId].questionStartPlayerCount = this.lobbies[lobbyId].players.size;
    }

    submitAnswer(playerName: string, lobbyId: string, submitAnswer: AnswerSubmit) {
        this.lobbies[lobbyId].players.get(playerName.toLowerCase()).answerResponse = submitAnswer;
        this.lobbies[lobbyId].submitAnswerCount++;
        const matchStartPlayer = this.lobbies[lobbyId].submitAnswerCount === this.lobbies[lobbyId].questionStartPlayerCount;
        const matchCurrentPlayer = this.lobbies[lobbyId].submitAnswerCount === this.lobbies[lobbyId].players.size;
        return matchStartPlayer || matchCurrentPlayer;
    }

    orderPlayerEvaluation(lobbyId: string) {
        const playersAnswer: PlayerEvaluation[] = [...this.lobbies[lobbyId].players.values()].map((player) => {
            return new PlayerEvaluation(player.answerResponse.answer as string, player.name);
        });
        playersAnswer.sort((playerAnswer1: PlayerEvaluation, playerAnswer2: PlayerEvaluation) => {
            return playerAnswer1.name.localeCompare(playerAnswer2.name);
        });
        this.lobbies[lobbyId].playersToEvaluate = playersAnswer;
    }

    getNextPlayerEvaluation(lobbyId: string): PlayerEvaluation {
        const index = this.lobbies[lobbyId].submitAnswerCount;
        if (index !== this.lobbies[lobbyId].playersToEvaluate.length) {
            const playerToEvaluate = this.lobbies[lobbyId].playersToEvaluate[index];
            this.lobbies[lobbyId].submitAnswerCount++;
            return playerToEvaluate;
        }
        this.resetSubmitAnswerCount(lobbyId);
        return undefined;
    }

    resetSubmitAnswerCount(lobbyId: string) {
        this.lobbies[lobbyId].submitAnswerCount = 0;
    }

    getAllPlayersPoints(lobbyId: string): Points[] {
        return [...this.lobbies[lobbyId].players.values()].map((player) => {
            return new Points(player.name, player.points);
        });
    }

    addPoints(points: Points, lobbyId: string) {
        const index = this.lobbies[lobbyId].questionIndex;
        if (!this.lobbies[lobbyId].players.get(points.name.toLowerCase())) return;
        const pointsToAdd: number = this.lobbies[lobbyId].game.questions[index].points;
        this.lobbies[lobbyId].players.get(points.name.toLowerCase()).points += (points.points / PERCENT) * pointsToAdd;
    }

    calculatePoints(lobbyId: string) {
        const lobby = this.lobbies[lobbyId];
        const players = lobby.players;
        const questionPoints = lobby.game.questions[lobby.questionIndex].points;

        const fastestPlayers: string[] = this.getFastestPlayers(this.getCorrectPlayers(players, lobbyId));

        if (fastestPlayers.length === 1) {
            players.get(fastestPlayers[0].toLowerCase()).points += questionPoints * BONUS;
            players.get(fastestPlayers[0].toLowerCase()).bonusCount += 1;
            lobby.playerBonuses = fastestPlayers[0];
        }
    }

    populateScores(lobbyId: string) {
        const lobby = this.lobbies[lobbyId];
        const players = this.lobbies[lobbyId].players;
        players.forEach((player) => {
            const name = player.name;
            const points = player.points;
            const bonuses = player.bonusCount;
            const playerScore: Score = { playerName: name, points, bonusCount: bonuses };
            lobby.lobbyScores.push(playerScore);
        });
        this.orderScores(lobbyId);
    }

    setGameOver(lobbyId: string) {
        this.lobbies[lobbyId].inGame = false;
    }

    saveGameHistory(lobbyId: string) {
        const lobby = this.lobbies[lobbyId];
        const bestScore = lobby.lobbyScores.reduce((max, current) => (current.points > max.points ? current : max), lobby.lobbyScores[0]).points;
        lobby.highestScore = bestScore > lobby.highestScore ? bestScore : lobby.highestScore;
        const history = {
            gameTitle: lobby.game.title,
            date: lobby.dateStart,
            numberOfPlayers: lobby.numberOfPlayersAtTheBeginning,
            bestScore: lobby.highestScore,
        };
        this.historyService.addHistory(history);
    }

    updateChoicesHistoryQRL(lobbyId: string, points: Points) {
        const lobby = this.lobbies[lobbyId];
        if (!lobby.choicesHistory[lobby.questionIndex]) {
            const newHistogramChoices: HistogramChoice[] = [
                { text: '100%', isCorrect: true, selectedCount: 0 },
                { text: '50%', isCorrect: false, selectedCount: 0 },
                { text: '0%', isCorrect: false, selectedCount: 0 },
            ];
            lobby.choicesHistory.push(newHistogramChoices);
        }

        const percentage = points.points.toString() + '%';
        const currentChoices = lobby.choicesHistory[lobby.questionIndex];

        for (const choice of currentChoices) {
            if (choice.text === percentage) {
                choice.selectedCount += 1;
                break;
            }
        }
    }

    updateChoicesHistoryQCM(lobbyId: string, histogramChoices: HistogramChoice[]) {
        const lobby = this.lobbies[lobbyId];
        lobby.choicesHistory.push(histogramChoices);
    }

    getChoicesHistory(lobbyId: string) {
        return this.lobbies[lobbyId].choicesHistory;
    }

    private getCorrectPlayers(players: Map<string, Player>, lobbyId: string): Player[] {
        const successfulPlayers: Player[] = [];
        const correctAnswers = this.getCorrectChoices(lobbyId);
        const questionIndex: number = this.lobbies[lobbyId].questionIndex;
        for (const player of players.values()) {
            const playerAnswers = player.answerResponse.answer;
            if (
                playerAnswers.length === correctAnswers.length &&
                (playerAnswers as number[]).every((value, index) => {
                    return value === correctAnswers[index];
                })
            ) {
                player.points += this.lobbies[lobbyId].game.questions[questionIndex].points;
                successfulPlayers.push(player);
            }
        }
        return successfulPlayers;
    }

    private getFastestPlayers(successfulPlayers: Player[]): string[] {
        let fastestCorrectAnswerTime = Infinity;
        let fastestPlayers: string[] = [];
        for (const player of successfulPlayers) {
            if (player.answerResponse.answerTime === fastestCorrectAnswerTime) {
                fastestPlayers.push(player.name);
            } else if (player.answerResponse.answerTime < fastestCorrectAnswerTime) {
                fastestCorrectAnswerTime = player.answerResponse.answerTime;
                fastestPlayers = [player.name];
            }
        }
        return fastestPlayers;
    }

    private orderScores(lobbyId: string) {
        const lobby = this.lobbies[lobbyId];
        lobby.lobbyScores.sort((firstScore, secondScore) => {
            if (firstScore.points !== secondScore.points) {
                return secondScore.points - firstScore.points;
            }
            return firstScore.playerName.localeCompare(secondScore.playerName);
        });
    }

    private formatQuestion(question: Question): QuestionAnswer {
        return {
            ...question,
            choices: question.choices.map((choice) => {
                return {
                    text: choice.text,
                };
            }),
        };
    }
}
