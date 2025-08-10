import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '@app/guards/auth.guard';
import { AdministrationLoginComponent } from '@app/pages/administration-login/administration-login.component';
import { AdministrationPageComponent } from '@app/pages/administration-page/administration-page.component';
import { GameCreationPageComponent } from '@app/pages/game-creation-page/game-creation-page.component';
import { GamePageComponent } from '@app/pages/game-page/game-page.component';
import { LobbyPageComponent } from '@app/pages/lobby-page/lobby-page.component';
import { MainPageComponent } from '@app/pages/main-page/main-page.component';
import { ModifyGamePageComponent } from '@app/pages/modify-game-page/modify-game-page.component';
import { OrganizerPageComponent } from '@app/pages/organizer-page/organizer-page.component';
import { ResultsPageComponent } from '@app/pages/results-page/results-page.component';

const routes: Routes = [
    { path: '', redirectTo: '/home', pathMatch: 'full' },
    { path: 'home', component: MainPageComponent },
    { path: 'game/:mode/:id', component: GamePageComponent },
    { path: 'administration', component: AdministrationPageComponent, canActivate: [AuthGuard] },
    { path: 'administrationLogin', component: AdministrationLoginComponent },
    { path: 'creation', component: GameCreationPageComponent },
    { path: 'createQuiz', component: ModifyGamePageComponent },
    { path: 'createQuiz/:gameId', component: ModifyGamePageComponent },
    { path: 'gameOrganizerView/:roomId', component: OrganizerPageComponent },
    { path: 'lobby/:id', component: LobbyPageComponent },
    { path: 'results', component: ResultsPageComponent },
    { path: '**', redirectTo: '/home' },
];

@NgModule({
    imports: [RouterModule.forRoot(routes, { useHash: true })],
    exports: [RouterModule],
})
export class AppRoutingModule {}
