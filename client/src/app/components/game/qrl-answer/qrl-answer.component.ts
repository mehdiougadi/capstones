import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Room } from '@app/common-client/interfaces/room';
import { Subscriptions } from '@app/common-client/interfaces/subscribtion';
import { MessageDialogComponent } from '@app/components/general/message-dialog/message-dialog.component';
import { RoomManagerService } from '@app/services/managers/room-manager/room-manager.service';
import { GameConnectionSocketService } from '@app/services/sockets/game-connection-socket/game-connection-socket.service';
import { Player } from '@common/classes/player';
import { OrganizerMessage } from '@common/client-message/organizer-game-pop-up';
import { QRL_ONE, QRL_POINT_FIVE, QRL_ZERO } from '@common/constant/constants';
import { GameState } from '@common/enum/socket-messages';

@Component({
    selector: 'app-qrl-answer',
    templateUrl: './qrl-answer.component.html',
    styleUrls: ['./qrl-answer.component.scss'],
})
export class QrlAnswerComponent implements OnInit, OnDestroy {
    @Input() currentRoom: Room;
    @Input() isDisabled: boolean;
    currentIndex: number = 0;
    scoresTable: number[] = [];
    private validGrades: number[] = [QRL_ZERO, QRL_POINT_FIVE, QRL_ONE];
    private isGradesValid: boolean = false;
    private subscriptions: Subscriptions = {};

    constructor(
        private roomManagerService: RoomManagerService,
        private readonly dialog: MatDialog,
        private readonly gameConnectionSocket: GameConnectionSocketService,
    ) {}

    get sortedPlayers() {
        return this.currentRoom.listPlayers
            .filter((player) => player.interaction !== 'black')
            .slice()
            .sort((a, b) => a.name.localeCompare(b.name));
    }

    ngOnInit(): void {
        this.subscribeRoomState();
    }

    confirmAnswers(): void {
        this.verifyGrades();
        if (this.isGradesValid) {
            this.addScore();
            this.currentIndex = 0;
            this.isGradesValid = false;
        }
    }

    ngOnDestroy(): void {
        this.subscriptions.gameStageSubscription?.unsubscribe();
    }

    private verifyGrades(): void {
        const inputs = document.querySelectorAll('table.qrl-table input[type="number"]');
        inputs.forEach((input: Element) => {
            const value = parseFloat((input as HTMLInputElement).value);
            if (this.validGrades.includes(value)) {
                this.isGradesValid = true;
            } else if (Number.isNaN(value)) {
                this.dialog.open(MessageDialogComponent, {
                    data: { message: OrganizerMessage.MISSING_GRADE },
                });
            } else {
                this.dialog.open(MessageDialogComponent, {
                    data: { message: OrganizerMessage.WRONG_GRADE },
                });
            }
        });
    }

    private addScore(): void {
        const scores: number[] = [];
        this.sortedPlayers.forEach((player: Player) => {
            scores.push(player.pointFactor * this.currentRoom.quiz.questions[this.currentRoom.currentQuestionIndex].points);
        });
        this.scoresTable = scores;
        this.roomManagerService.sendUpdatedListPlayers(
            this.currentRoom.id,
            this.currentRoom.listPlayers.filter((player) => player.interaction !== 'black'),
        );
    }

    private handleGameState(state: string): void {
        switch (state) {
            case GameState.NEXT_ROUND:
                this.resetQrlTable();
                break;
        }
    }

    private subscribeRoomState() {
        this.subscriptions.gameStageSubscription = this.gameConnectionSocket.gameStageSubject$.subscribe((state: string) => {
            this.handleGameState(state);
        });
    }

    private resetQrlTable() {
        this.sortedPlayers.forEach((player: Player) => {
            player.pointFactor = 0;
            player.qrlAnswer = '';
        });
        this.scoresTable = [];
    }
}
