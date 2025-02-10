import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
    async authenticate(passwd: string): Promise<boolean> {
        return passwd === 'admin';
    }
}
