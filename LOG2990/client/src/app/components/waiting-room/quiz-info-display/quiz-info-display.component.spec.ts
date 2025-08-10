import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HttpClientModule } from '@angular/common/http';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { QuizInfoDisplayComponent } from './quiz-info-display.component';

describe('QuizInfoDisplayComponent', () => {
    let component: QuizInfoDisplayComponent;
    let fixture: ComponentFixture<QuizInfoDisplayComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [QuizInfoDisplayComponent],
            imports: [HttpClientModule],
            schemas: [NO_ERRORS_SCHEMA],
        });
        fixture = TestBed.createComponent(QuizInfoDisplayComponent);
        component = fixture.componentInstance;
        component.currentQuiz = {
            _id: 'sampleId',
            title: 'Sample Quiz',
            description: 'Sample description',
            questions: [],
            duration: 60,
            visible: true,
            lastModification: new Date(),
        };
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
