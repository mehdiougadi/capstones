import { Admin, AdminDocument } from '@app/model/schema/admin/admin.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

export class AdminService {
    constructor(@InjectModel(Admin.name) private adminModel: Model<AdminDocument>) {}

    async validatePassword(enteredPassword: string): Promise<boolean> {
        return (await this.adminModel.findOne()).password === enteredPassword;
    }
}
