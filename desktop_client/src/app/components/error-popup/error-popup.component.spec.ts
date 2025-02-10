import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { ErrorPopupComponent } from './error-popup.component';

describe('ErrorPopupComponent', () => {
    let fixture: ComponentFixture<ErrorPopupComponent>;
    let component: ErrorPopupComponent;
    let dialogRef: MatDialogRef<ErrorPopupComponent>;

    const dialogData = { title: 'Error Title', message: 'Error Message' };

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [ErrorPopupComponent],
            providers: [
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: dialogData,
                },
                {
                    provide: MatDialogRef,
                    useValue: {
                        close: jasmine.createSpy('close'),
                    },
                },
            ],
            imports: [MatDialogModule],
        });

        fixture = TestBed.createComponent(ErrorPopupComponent);
        component = fixture.componentInstance;
        dialogRef = TestBed.inject(MatDialogRef);
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should have the correct data', () => {
        expect(component.data).toEqual(dialogData);
    });

    it('should close the dialog when closeDialog is called', () => {
        component.closeDialog();
        expect(dialogRef.close).toHaveBeenCalled();
    });
});
