import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NavigationEnd, Router } from '@angular/router';
import { Routes } from '@app/app.constants';
import { SocketTestHelper } from '@app/classes/socket-test-helper';
import { SocketClientService } from '@app/services/socket-client/socket-client.service';
import { EMPTY, Observable, of } from 'rxjs';
import { Socket } from 'socket.io-client';
import { LogoComponent } from './logo.component';

class SocketClientServiceMock extends SocketClientService {
    override connect() {
        return;
    }
}

describe('LogoComponent', () => {
    let component: LogoComponent;
    let fixture: ComponentFixture<LogoComponent>;
    let router: { events: Observable<unknown>; url: string; navigate: jasmine.Spy };
    let socketService: SocketClientServiceMock;
    let socketHelper: SocketTestHelper;

    beforeEach(async () => {
        socketHelper = new SocketTestHelper();
        socketService = new SocketClientServiceMock();
        socketService.socket = socketHelper as unknown as Socket;
        router = { events: EMPTY, url: '', navigate: jasmine.createSpy('navigate') };

        await TestBed.configureTestingModule({
            declarations: [LogoComponent],
            providers: [
                { provide: Router, useValue: router },
                { provide: SocketClientService, useValue: socketService },
            ],
        }).compileComponents();
    });

    it('should set isHomePage to true when the url includes /home', () => {
        router.events = of(new NavigationEnd(0, '/home', '/home'));
        router.url = '/home';
        fixture = TestBed.createComponent(LogoComponent);
        component = fixture.componentInstance;
        expect(component.isHomePage).toBeTrue();
        expect(component.isAdminPage).toBeFalse();
        expect(component.isPlayPage).toBeFalse();
    });

    it('should set isAdminPage to true when the url includes /administration', () => {
        router.events = of(new NavigationEnd(0, '/administration', '/administration'));
        router.url = '/administration';
        fixture = TestBed.createComponent(LogoComponent);
        component = fixture.componentInstance;
        expect(component.isHomePage).toBeFalse();
        expect(component.isAdminPage).toBeTrue();
        expect(component.isPlayPage).toBeFalse();
    });

    it('should set isAdminPage to true when the url includes /createQuiz', () => {
        router.events = of(new NavigationEnd(0, '/createQuiz', '/createQuiz'));
        router.url = '/createQuiz';
        fixture = TestBed.createComponent(LogoComponent);
        component = fixture.componentInstance;
        expect(component.isHomePage).toBeFalse();
        expect(component.isAdminPage).toBeTrue();
        expect(component.isPlayPage).toBeFalse();
    });

    it('should set isPlayPage to true when the url includes /game', () => {
        router.events = of(new NavigationEnd(0, '/game', '/game'));
        router.url = '/game';
        fixture = TestBed.createComponent(LogoComponent);
        component = fixture.componentInstance;
        expect(component.isHomePage).toBeFalse();
        expect(component.isAdminPage).toBeFalse();
        expect(component.isPlayPage).toBeTrue();
    });

    it('should reroute if you click on the logo', () => {
        fixture = TestBed.createComponent(LogoComponent);
        component = fixture.componentInstance;
        component.navigateToHome();
        expect(router.navigate).toHaveBeenCalledWith([Routes.Home]);
    });
});
