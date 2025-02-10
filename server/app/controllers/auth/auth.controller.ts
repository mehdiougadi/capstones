import { ErrorController } from '@app/controllers/error/error.controller';
import { AuthService } from '@app/services/auth/auth.service';
import { Body, Controller, HttpStatus, Post, Res } from '@nestjs/common';
import { ApiForbiddenResponse, ApiInternalServerErrorResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';

@ApiTags('Auth')
@Controller('auth')
export class AuthController extends ErrorController {
    constructor(private readonly authService: AuthService) {
        super();
    }

    @ApiOkResponse({
        description: 'Authenticate user',
        type: String,
    })
    @ApiForbiddenResponse({
        description: 'Return not FORBIDDEN http status when the request is not authorized',
    })
    @ApiInternalServerErrorResponse({
        description: 'Return INTERNAL_SERVER_ERROR http status when an error occurred in the server',
    })
    @Post('/')
    async authenticate(@Body('password') password: string, @Res() response: Response) {
        try {
            const isValid = await this.authService.authenticate(password);
            response.status(HttpStatus.OK).json(isValid);
        } catch (error) {
            response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Authentication failed' });
        }
    }
}
