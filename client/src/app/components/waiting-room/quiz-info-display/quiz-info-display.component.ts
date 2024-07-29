import { Component, Input } from '@angular/core';
import { Quiz } from '@common/interfaces/quiz';

@Component({
    selector: 'app-quiz-info-display',
    templateUrl: './quiz-info-display.component.html',
    styleUrls: ['./quiz-info-display.component.scss'],
})
export class QuizInfoDisplayComponent {
    @Input() currentQuiz: Quiz;
}
