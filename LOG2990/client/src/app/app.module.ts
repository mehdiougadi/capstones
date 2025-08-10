import { DragDropModule } from '@angular/cdk/drag-drop';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { SidebarComponent } from '@app/components/game/chat/sidebar.component';
import { AppRoutingModule } from '@app/modules/app-routing.module';
import { AppMaterialModule } from '@app/modules/material.module';
import { AppComponent } from '@app/pages/app/app.component';
import { GamePageComponent } from '@app/pages/game-page/game-page.component';
import { MainPageComponent } from '@app/pages/main-page/main-page.component';
import { MaterialPageComponent } from '@app/pages/material-page/material-page.component';
import { BankQuestionsComponent } from './components/admin/bank-questions/bank-questions.component';
import { ConfirmModalComponent } from './components/admin/confirm-modal/confirm-modal.component';
import { CreateQuizComponent } from './components/admin/create-quiz/create-quiz.component';
import { GameHistoryComponent } from './components/admin/game-history/game-history.component';
import { ImportModalComponent } from './components/admin/import-modal/import-modal.component';
import { ListQuizComponent } from './components/admin/list-quiz/list-quiz.component';
import { QuestionDisplayModalComponent } from './components/admin/question-display-modal/question-display-modal.component';
import { QuestionInBankComponent } from './components/admin/question-in-bank/question-in-bank.component';
import { GiveUpButtonComponent } from './components/game/give-up-button/give-up-button.component';
import { QuestionComponent } from './components/game/question/question.component';
import { TimerComponent } from './components/game/timer/timer.component';
import { FooterComponent } from './components/general/footer/footer.component';
import { HeaderComponent } from './components/general/header/header.component';
import { MessageDialogComponent } from './components/general/message-dialog/message-dialog.component';
import { AdminAccessModalComponent } from './components/main/admin-access-modal/admin-access-modal.component';
import { GameAccessModalComponent } from './components/main/game-access-modal/game-access-modal.component';
import { HistogramComponent } from './components/organizer/histogram/histogram.component';
import { ResultsViewComponent } from './components/organizer/results-view/results-view.component';
import { PlayerWaitingListComponent } from './components/waiting-room/player-waiting-list/player-waiting-list.component';
import { QuizInfoDisplayComponent } from './components/waiting-room/quiz-info-display/quiz-info-display.component';
import { AdminPageComponent } from './pages/admin-page/admin-page.component';
import { CreateGamePageComponent } from './pages/create-game-page/create-game-page.component';
import { OrganizerPageComponent } from './pages/organizer-page/organizer-page.component';
import { WaitingRoomPageComponent } from './pages/waiting-room-page/waiting-room-page.component';
import { InteractiveListComponent } from './components/organizer/interactive-list/interactive-list.component';
import { QrlAnswerComponent } from './components/game/qrl-answer/qrl-answer.component';

/**
 * Main module that is used in main.ts.
 * All automatically generated components will appear in this module.
 * Please do not move this module in the module folder.
 * Otherwise Angular Cli will not know in which module to put new component
 */
@NgModule({
    declarations: [
        AppComponent,
        GamePageComponent,
        MainPageComponent,
        MaterialPageComponent,
        AdminPageComponent,
        CreateQuizComponent,
        BankQuestionsComponent,
        CreateGamePageComponent,
        AdminAccessModalComponent,
        CreateQuizComponent,
        FooterComponent,
        SidebarComponent,
        HeaderComponent,
        TimerComponent,
        GiveUpButtonComponent,
        QuestionComponent,
        QuestionInBankComponent,
        QuestionDisplayModalComponent,
        GameAccessModalComponent,
        WaitingRoomPageComponent,
        MessageDialogComponent,
        ListQuizComponent,
        ImportModalComponent,
        ConfirmModalComponent,
        PlayerWaitingListComponent,
        QuizInfoDisplayComponent,
        OrganizerPageComponent,
        ResultsViewComponent,
        HistogramComponent,
        GameHistoryComponent,
        InteractiveListComponent,
        QrlAnswerComponent,
    ],
    imports: [
        AppMaterialModule,
        MatTooltipModule,
        AppRoutingModule,
        BrowserAnimationsModule,
        BrowserModule,
        DragDropModule,
        FormsModule,
        HttpClientModule,
    ],
    providers: [],
    bootstrap: [AppComponent],
})
export class AppModule {}
