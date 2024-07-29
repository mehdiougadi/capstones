import { HttpClientModule } from '@angular/common/http';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { Room } from '@app/common-client/interfaces/room';
import { GameControllerService } from '@app/services/controllers/game-controller/game-controller.service';
import { Player } from '@common/classes/player';
import { GameState } from '@common/enum/socket-messages';
import { QuestionStats } from '@common/interfaces/questionStats';
import { Quiz } from '@common/interfaces/quiz';
import { of } from 'rxjs';
import { ResultsViewComponent } from './results-view.component';

describe('ResultsViewComponent', () => {
    let component: ResultsViewComponent;
    let fixture: ComponentFixture<ResultsViewComponent>;
    let mockgameControllerService: jasmine.SpyObj<GameControllerService>;

    const mockQuestionStats: QuestionStats[] = [
        {
            questionIndex: 1,
            questionType: 'QCM',
            stats: {
                ['choiceA']: { count: 10, isCorrect: true },
                ['choiceB']: { count: 5, isCorrect: false },
            },
            statsQRL: {
                modifiedLastSeconds: 0,
                notModifiedLastSeconds: 0,
                scores: {
                    zeroPercent: 0,
                    fiftyPercent: 0,
                    hundredPercent: 0,
                },
            },
        },
    ];
    const player1: Player = new Player('Player1');
    player1.points = 10;
    player1.answered = true;
    player1.goodAnswers = true;
    player1.firstToAnswer = true;
    player1.bonusPoints = 0;
    player1.chosenAnswer = [];

    const player2: Player = new Player('Player2');
    player2.points = 2;
    player2.answered = false;
    player2.goodAnswers = false;
    player2.firstToAnswer = false;
    player2.bonusPoints = 0;
    player2.chosenAnswer = [];

    const mockRoom: Room = {
        id: 'mockRoomId',
        quiz: {} as Quiz,
        listPlayers: [player1, player2],
        isLocked: false,
        accessCode: 'mockAccessCode',
        questionStats: mockQuestionStats,
        currentTime: 0,
        currentQuestionIndex: 0,
        roundFinished: false,
        isPaused: false,
        isTesting: false,
        currentState: GameState.END_ROUND,
    };

    beforeEach(waitForAsync(() => {
        mockgameControllerService = jasmine.createSpyObj('GameControllerService', ['getGameInfo']);
        TestBed.configureTestingModule({
            declarations: [ResultsViewComponent],
            imports: [HttpClientModule, MatDialogModule],
            providers: [{ provide: GameControllerService, useValue: mockgameControllerService }],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ResultsViewComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should fetch room information on ngOnInit', () => {
        const roomId = 'mockRoomId';
        mockgameControllerService.getGameInfo.and.returnValue(of(mockRoom));

        component.roomId = roomId;
        component.ngOnInit();

        expect(mockgameControllerService.getGameInfo).toHaveBeenCalledWith(roomId);
        fixture.whenStable().then(() => {
            expect(component.listPlayers.length).toBe(2);
            expect(component.currentRoom).toEqual(mockRoom);
        });
    });
});
