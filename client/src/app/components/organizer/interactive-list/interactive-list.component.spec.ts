import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatDialog } from '@angular/material/dialog';
import { Room } from '@app/common-client/interfaces/room';
import { RoomManagerService } from '@app/services/managers/room-manager/room-manager.service';
import { Player } from '@common/classes/player';
import { InteractiveListComponent } from './interactive-list.component';

describe('InteractiveListComponent', () => {
    let component: InteractiveListComponent;
    let fixture: ComponentFixture<InteractiveListComponent>;

    beforeEach(() => {
        const matDialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
        TestBed.configureTestingModule({
            declarations: [InteractiveListComponent],
            imports: [HttpClientTestingModule],
            providers: [RoomManagerService, { provide: MatDialog, useValue: matDialogSpy }],
        });
        fixture = TestBed.createComponent(InteractiveListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should toggle chat permission', () => {
        const spy = spyOn(component['chatService'], 'togglePlayerChatPermission');
        const mockPlayer = new Player('Alice');
        component.currentRoom = {} as Room;
        mockPlayer.isBannedFromChat = false;
        component.toggleChatPermission(mockPlayer);
        expect(mockPlayer.isBannedFromChat).toBeTrue();
        mockPlayer.isBannedFromChat = true;
        expect(spy).toHaveBeenCalledWith(mockPlayer, component.currentRoom);
    });

    it('should call the setter of roomService', () => {
        const spy = spyOn(component['roomManagerService'], 'setPropertyAndDirection');
        component.currentRoom = {} as Room;
        component.setPropertyAndDirection('interaction', 'asc');
        expect(spy).toHaveBeenCalledWith('interaction', 'asc', component.currentRoom);
    });
});
