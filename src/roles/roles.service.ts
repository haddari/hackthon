import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { Model } from 'mongoose';
import { CreateRoleDto } from './dtos/role.dto';
import { Role } from './schemas/role.schema';

@Injectable()
export class RolesService {
  constructor(@InjectModel(Role.name) private RoleModel: Model<Role>) {}

  async createRole(role: CreateRoleDto) {
    //TODO: Validate unique names
    return this.RoleModel.create(role);
  }

  async getRoleById(roleId: string): Promise<Role> {
    const role = await this.RoleModel.findById(roleId).exec();
    if (!role) {
      throw new NotFoundException(`Role with ID ${roleId} not found`);
    }
    return role;
  }


}
