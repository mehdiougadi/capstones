import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatChipOption } from '@angular/material/chips';
import { SocketClientEventsListen, SocketServerEventsSend } from '@app/app.constants';
import { SocketTestHelper } from '@app/classes/socket-test-helper';
import { SocketClientService } from '@app/services/socket-client/socket-client.service';
import { Socket } from 'socket.io-client';
import { QrlFormComponent } from './qrl-form.component';

class SocketClientServiceMock extends SocketClientService {
    override connect() {
        return;
    }
}

describe('QrlForm', () => {
    let component: QrlFormComponent;
    let fixture: ComponentFixture<QrlFormComponent>;
    let socketService: SocketClientServiceMock;
    let mockChip: jasmine.SpyObj<MatChipOption>;
    let socketHelper: SocketTestHelper;

    beforeEach(() => {
        socketHelper = new SocketTestHelper();
        socketService = new SocketClientServiceMock();
        socketService.socket = socketHelper as unknown as Socket;
        mockChip = jasmine.createSpyObj('MatChipOption', ['deselect']);

        TestBed.configureTestingModule({
            declarations: [QrlFormComponent],
            providers: [
                { provide: SocketClientService, useValue: socketService },
                { provide: MatChipOption, useValue: mockChip },
            ],
        });
        fixture = TestBed.createComponent(QrlFormComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        // retrait du lint de nombre magique pour les tests
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        component.scores = [10, 20, 30];
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should send evaluation when selected chip index is not null', () => {
        spyOn(socketService, 'send');
        component.selectedChipIndex = 1;
        component.currentEvaluation = { name: 'Alice', answer: 'Yep' };

        component.sendEvaluation();

        expect(socketService.send).toHaveBeenCalledWith(SocketServerEventsSend.EvaluateNextPlayer, { points: { name: 'Alice', points: 20 } });
        expect(component.selectedChipIndex).toBeNull();
        expect(component.selectedChipRef).toBeNull();
    });

    it('should not send evaluation when selected chip index is null', () => {
        spyOn(socketService, 'send');
        component.selectedChipIndex = null;
        component.currentEvaluation = { name: 'Alice', answer: 'WAKE UP' };

        component.sendEvaluation();

        expect(socketService.send).not.toHaveBeenCalled();
        expect(component.selectedChipIndex).toBeNull();
        expect(component.selectedChipRef).toBeNull();
    });

    it('should select chip when chip is selected', () => {
        component.selectedChipIndex = null;
        component.selectedChipRef = null;
        mockChip.selected = true;

        component.selectChip(1, mockChip);

        expect(component.selectedChipIndex as unknown as number).toBe(1);
        expect(component.selectedChipRef as unknown as MatChipOption).toBe(mockChip);
    });

    it('should deselect chip when chip is not selected', () => {
        component.selectedChipIndex = 1;
        component.selectedChipRef = mockChip;
        mockChip.selected = false;

        component.selectChip(1, mockChip);

        expect(component.selectedChipIndex).toBeNull();
        expect(component.selectedChipRef).toBeNull();
    });

    it(' listenEvaluatePlayer should listen to Evaluate Player event from socket service and modify currentEvaluation', () => {
        const form = { name: 'Youpi', answer: 'WAKE UP' };
        component.listenEvaluatePlayer();
        socketHelper.peerSideEmit(SocketClientEventsListen.EvaluatePlayer, form);

        expect(component.currentEvaluation).toEqual(form);
    });
});
