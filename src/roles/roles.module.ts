import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RolesService } from './roles.service';
import { Role, RoleSchema } from './schemas/role.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Role.name, schema: RoleSchema }
    ])
  ],
  providers: [RolesService],
  exports: [RolesService, MongooseModule],  // Export MongooseModule to provide RoleModel
})
export class RolesModule {}