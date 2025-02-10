import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSidenav } from '@angular/material/sidenav';
import { Router } from '@angular/router';
import { ORGANIZER_LEFT_POPUP, ORG_NAME, POPUP_WARNING, Routes, SocketClientEventsListen, SocketServerEventsSend } from '@app/app.constants';
import { ErrorPopupComponent } from '@app/components/error-popup/error-popup.component';
import { HistogramChoice } from '@app/interfaces/choice';
import { Question } from '@app/interfaces/question';
import { Score } from '@app/interfaces/score';
import { NavigationService } from '@app/services/navigation/navigation.service';
import { SocketClientService } from '@app/services/socket-client/socket-client.service';

@Component({
    selector: 'app-results-page',
    templateUrl: './results-page.component.html',
    styleUrls: ['./results-page.component.scss'],
})
export class ResultsPageComponent implements OnInit, OnDestroy {
    @ViewChild('sidenav') sidenav: MatSidenav;
    playersName: string[];
    roomId: string;
    clientName: string;
    lobbyScores: Score[];
    hasLeft: boolean;
    histogramChoices: HistogramChoice[][];
    questions: Question[];
    currentIndex: number;

    // les quatre paramètre sont nécessaire
    // eslint-disable-next-line max-params
    constructor(
        private readonly navigationService: NavigationService,
        private readonly socketClientService: SocketClientService,
        private router: Router,
        private readonly dialog: MatDialog,
    ) {
        this.questions = [];
        this.playersName = [];
        this.lobbyScores = [];
        this.hasLeft = false;
        this.histogramChoices = [];
        this.currentIndex = 0;
    }

    ngOnInit() {
        this.navigationService.verifyPreviousRoute(Routes.Results);
        this.socketClientService.send(SocketServerEventsSend.RequestRoomId);
        this.socketClientService.on(SocketClientEventsListen.RoomId, async (roomId: string) => {
            this.roomId = roomId;
            if (roomId) {
                this.retrieveQuestions();
                this.retrievePlayerList();
                this.retrieveLobbyScores();
                this.listenDisconnect();
                this.retrieveClientName();
                this.retrieveChoiceHistory();
            } else {
                this.router.navigate([Routes.Home]);
            }
        });
    }

    ngOnDestroy() {
        this.socketClientService.socket.removeAllListeners();
    }

    retrieveClientName() {
        this.socketClientService.on(SocketClientEventsListen.PlayerName, (name: string) => {
            this.clientName = name;
        });
        this.socketClientService.send(SocketServerEventsSend.RequestName);
    }

    listenDisconnect() {
        this.socketClientService.on(SocketClientEventsListen.Disconnected, () => {
            if (this.clientName !== ORG_NAME) {
                if (!this.hasLeft) {
                    this.dialog.open(ErrorPopupComponent, { data: { title: POPUP_WARNING, message: ORGANIZER_LEFT_POPUP } });
                }
                this.router.navigate([Routes.Home]);
            } else {
                this.router.navigate([Routes.Creation]);
            }
        });
    }

    navigateToHome() {
        this.hasLeft = true;
        this.socketClientService.send(SocketServerEventsSend.LeaveLobby);
    }

    retrievePlayerList() {
        this.socketClientService.on(SocketClientEventsListen.NewPlayer, (players: string[]) => {
            this.playersName = players;
        });
        this.socketClientService.send(SocketServerEventsSend.RequestCurrentPlayers);
    }

    retrieveLobbyScores() {
        this.socketClientService.on(SocketClientEventsListen.LobbyScores, (scores: Score[]) => {
            this.lobbyScores = scores;
        });
        this.socketClientService.send(SocketServerEventsSend.RetrieveLobbyScores);
    }

    retrieveChoiceHistory() {
        this.socketClientService.on(SocketClientEventsListen.ChoicesHistory, (choicesHistory: HistogramChoice[][]) => {
            this.histogramChoices = choicesHistory;
        });
        this.socketClientService.send(SocketServerEventsSend.RetrieveChoicesHistory);
    }

    retrieveQuestions() {
        this.socketClientService.on(SocketClientEventsListen.Questions, (questions: Question[]) => {
            this.questions = questions;
        });
        this.socketClientService.send(SocketServerEventsSend.RetrieveQuestions);
    }

    goToPreviousQuestion() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
        }
    }

    goToNextQuestion() {
        if (this.currentIndex < this.questions.length - 1) {
            this.currentIndex++;
        }
    }
}
