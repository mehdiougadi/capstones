import { TestBed } from '@angular/core/testing';
import { SocketTestHelper } from '@app/classes/socket-test-helper';
import { AppRoutingModule } from '@app/modules/app-routing.module';
import { AppComponent } from '@app/pages/app/app.component';
import { SocketClientService } from '@app/services/socket-client/socket-client.service';
import { Socket } from 'socket.io-client';

class SocketClientServiceMock extends SocketClientService {
    override connect() {
        return;
    }
}

describe('AppComponent', () => {
    let app: AppComponent;
    let socketService: SocketClientServiceMock;
    let socketHelper: SocketTestHelper;
    beforeEach(async () => {
        socketHelper = new SocketTestHelper();
        socketService = new SocketClientServiceMock();
        socketService.socket = socketHelper as unknown as Socket;
        await TestBed.configureTestingModule({
            imports: [AppRoutingModule],
            declarations: [AppComponent],
            providers: [{ provide: SocketClientService, useValue: socketService }],
        }).compileComponents();
        const fixture = TestBed.createComponent(AppComponent);
        app = fixture.componentInstance;
    });

    it('should create the app', () => {
        expect(app).toBeTruthy();
    });

    it('ngOnInit should connect the socket', () => {
        spyOn(socketService, 'connect');
        app.ngOnInit();
        expect(socketService.connect).toHaveBeenCalled();
    });
});
