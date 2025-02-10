import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { ConfirmationDialogComponent } from './confirmation-dialog.component';

describe('ConfirmationDialogComponent', () => {
    let component: ConfirmationDialogComponent;
    let fixture: ComponentFixture<ConfirmationDialogComponent>;

    const mockDialogRef = {
        close: jasmine.createSpy('close'),
    };

    const mockData = {
        title: 'Test Title',
        message: 'Test Message',
    };

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [ConfirmationDialogComponent],
            providers: [
                { provide: MatDialogRef, useValue: mockDialogRef },
                { provide: MAT_DIALOG_DATA, useValue: mockData },
            ],
            imports: [MatDialogModule],
        });

        fixture = TestBed.createComponent(ConfirmationDialogComponent);
        component = fixture.componentInstance;
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize with correct data', () => {
        expect(component.data).toEqual(mockData);
    });

    it('should call dialogRef.close with false onNoClick', () => {
        component.onNoClick();
        expect(mockDialogRef.close).toHaveBeenCalledWith(false);
    });

    it('should call dialogRef.close with true onYesClick', () => {
        component.onYesClick();
        expect(mockDialogRef.close).toHaveBeenCalledWith(true);
    });
});
