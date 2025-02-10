import { ERROR_400, ERROR_403, ERROR_404 } from '@app/app.constants';
import { HttpStatus } from '@nestjs/common';

export class ErrorController {
    protected errorCode(message: string): number {
        for (const error404 of ERROR_404) {
            if (message === error404) {
                return HttpStatus.NOT_FOUND;
            }
        }

        for (const error400 of ERROR_400) {
            if (message === error400) {
                return HttpStatus.BAD_REQUEST;
            }
        }

        for (const error403 of ERROR_403) {
            if (message === error403) {
                return HttpStatus.FORBIDDEN;
            }
        }

        return HttpStatus.INTERNAL_SERVER_ERROR;
    }
}
