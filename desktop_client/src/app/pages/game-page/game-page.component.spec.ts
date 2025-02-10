// besoin du stub pour tester le component
// eslint-disable-next-line max-classes-per-file
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSidenavModule } from '@angular/material/sidenav';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { GameMode, Routes, SocketServerEventsSend } from '@app/app.constants';
import { SocketClientService } from '@app/services/socket-client/socket-client.service';
import { GamePageComponent } from './game-page.component';

@Component({
    selector: 'app-chat',
})
class ChatStubComponent {}

@Component({
    selector: 'app-chat-badge',
})
class ChatBadgeStubComponent {}
class SocketClientServiceMock extends SocketClientService {
    override connect() {
        return;
    }
}
describe('GamePageComponent', () => {
    let component: GamePageComponent;
    let fixture: ComponentFixture<GamePageComponent>;
    let route: ActivatedRoute;
    let router: Router;
    let socketService: SocketClientServiceMock;
    beforeEach(() => {
        socketService = new SocketClientServiceMock();
        TestBed.configureTestingModule({
            declarations: [GamePageComponent, ChatBadgeStubComponent, ChatStubComponent],
            providers: [
                { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({}) } } },
                { provide: SocketClientService, useValue: socketService },
                { provide: Router, useValue: { navigate: jasmine.createSpy('navigate') } },
            ],
            imports: [MatSidenavModule, BrowserAnimationsModule],
        });

        fixture = TestBed.createComponent(GamePageComponent);
        component = fixture.componentInstance;
        route = TestBed.inject(ActivatedRoute);
        router = TestBed.inject(Router);
    });
    it('ngOnInit should call the right function depending on navigationService return ', () => {
        spyOn(socketService, 'send');
        // retrait du lint pour le any pour acceder aux attributs privées
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        spyOn((component as any).navigationService, 'verifyPreviousRoute').and.returnValue(true);
        component.ngOnInit();
        expect(socketService.send).toHaveBeenCalledWith(SocketServerEventsSend.LeaveLobby);
        expect(router.navigate).toHaveBeenCalledWith([Routes.Home]);
    });

    it('should navigate to home if id or mode is not present', () => {
        component.ngOnInit();
        expect(router.navigate).toHaveBeenCalledWith([Routes.Home]);
    });

    it('should set gameId and gameMode if id and mode are present', () => {
        (route.snapshot.paramMap as unknown) = convertToParamMap({ id: '123', mode: GameMode.Test });
        component.ngOnInit();
        expect(component.gameId).toBe('123');
        expect(component.gameMode).toBe(GameMode.Test);
    });

    it('should set gameMode to Player if mode is not Test', () => {
        (route.snapshot.paramMap as unknown) = convertToParamMap({ id: '123', mode: GameMode.Player });
        component.ngOnInit();
        expect(component.gameId).toBe('123');
        expect(component.gameMode).toBe(GameMode.Player);
    });
});
