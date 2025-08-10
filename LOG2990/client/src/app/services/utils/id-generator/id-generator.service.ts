import { Injectable } from '@angular/core';
import { ACCESS_CODE_SIZE } from '@common/constant/constants';
import { v4 as uuidv4 } from 'uuid';

@Injectable({
    providedIn: 'root',
})
export class IdGeneratorService {
    generateId(): string {
        return uuidv4();
    }

    generateAccessCode(): string {
        return this.generateId().slice(0, ACCESS_CODE_SIZE).toUpperCase();
    }
}
