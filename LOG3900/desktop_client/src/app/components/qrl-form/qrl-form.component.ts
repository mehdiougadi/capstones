import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { MatChipOption } from '@angular/material/chips';
import { ChipColor, QuestionPoints, SocketClientEventsListen, SocketServerEventsSend } from '@app/app.constants';
import { Points } from '@app/interfaces/answer-points';
import { PlayerEvaluation } from '@app/interfaces/player-evaluation';
import { SocketClientService } from '@app/services/socket-client/socket-client.service';

@Component({
    selector: 'app-qrl-form',
    templateUrl: './qrl-form.component.html',
    styleUrls: ['./qrl-form.component.scss'],
})
export class QrlFormComponent implements OnInit, OnDestroy {
    @Input() currentQuestionType: string;
    @Input() evaluating: boolean;
    color: string[];
    currentEvaluation: PlayerEvaluation;
    selectedChipIndex: number | null;
    selectedChipRef: MatChipOption | null;
    scores: number[];

    constructor(public socketService: SocketClientService) {
        this.currentEvaluation = { name: '', answer: '' };
        this.selectedChipIndex = null;
        this.selectedChipRef = null;
        this.color = [ChipColor.Warn, ChipColor.Accent, ChipColor.Primary];
        this.scores = [QuestionPoints.NoPoints, QuestionPoints.HalfPoints, QuestionPoints.AllPoints];
    }

    ngOnInit(): void {
        this.listenEvaluatePlayer();
    }

    ngOnDestroy(): void {
        this.socketService.socket.removeAllListeners();
    }

    listenEvaluatePlayer() {
        this.socketService.on(SocketClientEventsListen.EvaluatePlayer, (playerEvaluation: PlayerEvaluation) => {
            this.currentEvaluation = playerEvaluation;
        });
    }

    sendEvaluation() {
        if (this.selectedChipIndex !== null) {
            const playerScore: Points = { name: this.currentEvaluation.name, points: this.scores[this.selectedChipIndex] };
            this.socketService.send(SocketServerEventsSend.EvaluateNextPlayer, { points: playerScore });
            this.selectedChipIndex = null;
            this.selectedChipRef?.deselect();
            this.selectedChipRef = null;
        }
    }

    selectChip(index: number, chip: MatChipOption): void {
        this.selectedChipRef = chip;
        if (this.selectedChipRef?.selected) {
            this.selectedChipIndex = index;
        } else {
            this.selectedChipRef = null;
            this.selectedChipIndex = null;
        }
    }
}
