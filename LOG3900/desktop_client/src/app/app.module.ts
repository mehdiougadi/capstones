import { DragDropModule } from '@angular/cdk/drag-drop';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatBadgeModule } from '@angular/material/badge';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CarouselComponent } from '@app/components/carousel/carousel.component';
import { ChatComponent } from '@app/components/chat/chat.component';
import { CreateQuestionComponent } from '@app/components/create-question/create-question.component';
import { GameCardComponent } from '@app/components/game-card/game-card.component';
import { LogoComponent } from '@app/components/logo/logo.component';
import { PlayAreaComponent } from '@app/components/play-area/play-area.component';
import { QuestionComponent } from '@app/components/question/question.component';
import { AppRoutingModule } from '@app/modules/app-routing.module';
import { AppMaterialModule } from '@app/modules/material.module';
import { AdministrationLoginComponent } from '@app/pages/administration-login/administration-login.component';
import { AdministrationPageComponent } from '@app/pages/administration-page/administration-page.component';
import { AppComponent } from '@app/pages/app/app.component';
import { GameCreationPageComponent } from '@app/pages/game-creation-page/game-creation-page.component';
import { GamePageComponent } from '@app/pages/game-page/game-page.component';
import { LobbyPageComponent } from '@app/pages/lobby-page/lobby-page.component';
import { MainPageComponent } from '@app/pages/main-page/main-page.component';
import { ModifyGamePageComponent } from '@app/pages/modify-game-page/modify-game-page.component';
import { GameService } from '@app/services/game/game.service';
import { ChatBadgeComponent } from './chat-badge/chat-badge.component';
import { ConfirmationDialogComponent } from './components/confirmation-dialog/confirmation-dialog.component';
import { ErrorPopupComponent } from './components/error-popup/error-popup.component';
import { HistogramComponent } from './components/histogram/histogram.component';
import { HistoriesListComponent } from './components/histories-list/histories-list.component';
import { QrlFormComponent } from './components/qrl-form/qrl-form.component';
import { TimerComponent } from './components/timer/timer.component';
import { OrganizerPageComponent } from './pages/organizer-page/organizer-page.component';
import { ResultsPageComponent } from './pages/results-page/results-page.component';
import { AuthService } from './services/auth/auth.service';
import { GameValidationService } from './services/game-validation/game-validation.service';
import { NavigationService } from './services/navigation/navigation.service';
import { SocketClientService } from './services/socket-client/socket-client.service';
import { TimeService } from './services/timer/timer.service';
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
        PlayAreaComponent,
        ChatComponent,
        QuestionComponent,
        AdministrationPageComponent,
        AdministrationLoginComponent,
        GameCreationPageComponent,
        GameCardComponent,
        CarouselComponent,
        LobbyPageComponent,
        ModifyGamePageComponent,
        LogoComponent,
        CreateQuestionComponent,
        ErrorPopupComponent,
        OrganizerPageComponent,
        HistogramComponent,
        ResultsPageComponent,
        HistoriesListComponent,
        ConfirmationDialogComponent,
        QrlFormComponent,
        ChatBadgeComponent,
        TimerComponent,
    ],
    imports: [
        AppMaterialModule,
        AppRoutingModule,
        BrowserAnimationsModule,
        BrowserModule,
        FormsModule,
        HttpClientModule,
        DragDropModule,
        ReactiveFormsModule,
        MatTooltipModule,
        MatFormFieldModule,
        MatChipsModule,
        MatProgressSpinnerModule,
        MatDividerModule,
        MatSelectModule,
        MatSlideToggleModule,
        MatSidenavModule,
        MatIconModule,
        MatBadgeModule,
    ],
    providers: [GameService, AuthService, GameValidationService, NavigationService, SocketClientService, TimeService],
    bootstrap: [AppComponent],
})
export class AppModule {}
