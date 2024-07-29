import { PasswordDto } from '@app/model/dto/admin/admin.dto';
import { AdminService } from '@app/services/admin-service/admin.service';
import { Body, Controller, Post } from '@nestjs/common';

@Controller('admin')
export class AdminController {
    constructor(private readonly adminService: AdminService) {}

    @Post()
    async verifyPassword(@Body() passwordDto: PasswordDto): Promise<boolean> {
        return this.adminService.validatePassword(passwordDto.password);
    }
}
