import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { StateHeader } from '@app/common-client/constant/state';
import { HeaderComponent } from './header.component';

describe('HeaderComponent', () => {
    let component: HeaderComponent;
    let fixture: ComponentFixture<HeaderComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [HeaderComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(HeaderComponent);
        component = fixture.componentInstance;
    });

    it('should display the home header when currentState is HOME', () => {
        component.currentState = StateHeader.HOME;
        fixture.detectChanges();
        const headerElement = fixture.debugElement.query(By.css('.home.header'));
        expect(headerElement).toBeTruthy();
    });

    it('should display the admin header and call deleteSessionStorage on click when currentState is ADMIN', () => {
        spyOn(component, 'deleteSessionStorage');
        component.currentState = StateHeader.ADMIN;
        fixture.detectChanges();
        const headerElement = fixture.debugElement.query(By.css('.admin.header'));
        expect(headerElement).toBeTruthy();
        headerElement.query(By.css('a')).triggerEventHandler('click', null);
        expect(component.deleteSessionStorage).toHaveBeenCalled();
    });

    it('should clear sessionStorage when deleteSessionStorage is called', () => {
        spyOn(sessionStorage, 'clear');
        component.deleteSessionStorage();
        expect(sessionStorage.clear).toHaveBeenCalled();
    });
    afterEach(() => {
        fixture.destroy();
    });
});
