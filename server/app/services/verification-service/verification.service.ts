import { Room } from '@app/common-server/room';
import { Player } from '@common/classes/player';
import { GameAccess } from '@common/client-message/game-acces-pop-up';
import { MAX_NAME_LENGTH } from '@common/constant/constants';
import { Injectable } from '@nestjs/common';

@Injectable()
export class VerificationService {
    generalVerification(playerConcerned: Player, room: Room): string {
        if (!this.nameIsCorrectLength(playerConcerned.name)) return GameAccess.NAME_NOT_VALID;
        if (!this.nameInListPlayer(playerConcerned, room.listPlayers)) return GameAccess.NAME_TAKEN;
        if (this.nameInListBan(playerConcerned.name, room.nameBanned)) return GameAccess.NAME_BANNED;
        if (!this.nameReservedWord(playerConcerned.name)) return GameAccess.NAME_RESERVED;
        if (room.isLocked) return GameAccess.ROOM_LOCKED;
        return undefined;
    }
    nameIsCorrectLength(name: string): boolean {
        return name.trim().length > 0 && name.length <= MAX_NAME_LENGTH;
    }
    nameInListPlayer(playerConcerned: Player, listPlayers: Player[]): boolean {
        return listPlayers.find((player) => player.name.toUpperCase().trim() === playerConcerned.name.toUpperCase().trim()) === undefined;
    }

    nameInListBan(targetName: string, listNames: string[]): string {
        return listNames.find((name) => name.toUpperCase().trim() === targetName.toUpperCase().trim());
    }

    nameReservedWord(name: string): boolean {
        return name.toUpperCase().trim() !== 'Organisateur'.toUpperCase();
    }
}
