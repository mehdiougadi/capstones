import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthController } from './controllers/auth/auth.controller';
import { GameController } from './controllers/game/game.controller';
import { HistoryController } from './controllers/history/history.controller';
import { QuestionController } from './controllers/question/question.controller';
import { ChatGateway } from './gateway/chat/chat.gateway';
import { GameManagementGateway } from './gateway/game-management/game-management.gateway';
import { LobbyGateway } from './gateway/lobby/lobby.gateway';
import { Game, gameSchema } from './model/database/game';
import { History, historySchema } from './model/database/history';
import { AuthService } from './services/auth/auth.service';
import { ChatService } from './services/chat/chat.service';
import { GameService } from './services/game/game.service';
import { HistoryService } from './services/history/history.service';
import { LobbyGameManagementService } from './services/lobby/game-management/lobby-game-management.service';
import { LobbyService } from './services/lobby/lobby/lobby.service';
import { LobbyTimer } from './services/lobby/timer/lobby-timer.service';
import { QuestionService } from './services/question/question.service';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        MongooseModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (config: ConfigService) => ({
                uri: config.get<string>('DATABASE_CONNECTION_STRING'), // Loaded from .env
            }),
        }),
        MongooseModule.forFeature([
            { name: Game.name, schema: gameSchema },
            { name: History.name, schema: historySchema },
        ]),
    ],
    controllers: [GameController, QuestionController, AuthController, HistoryController],
    providers: [
        Logger,
        QuestionService,
        GameService,
        AuthService,
        GameManagementGateway,
        LobbyGateway,
        ChatGateway,
        LobbyTimer,
        LobbyService,
        LobbyGameManagementService,
        ChatService,
        HistoryService,
        {
            provide: 'SharedLobbies',
            useValue: {},
        },
        {
            provide: 'SharedRooms',
            useValue: {},
        },
    ],
})
export class AppModule {}
