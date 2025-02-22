import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { Role } from './src/roles/schemas/role.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';

@Injectable()
class Seeder {
  constructor(@InjectModel(Role.name) private roleModel: Model<Role>) {}

  async seed() {
    const roles = [
      { name: 'admin', permissions: ['create', 'read', 'update', 'delete'] },
      { name: 'user', permissions: ['read'] },
    ];

    for (const role of roles) {
      const existingRole = await this.roleModel.findOne({ name: role.name });
      if (!existingRole) {
        await this.roleModel.create(role);
      }
    }

    console.log('Seeding complete!');
  }
}

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const seeder = app.get(Seeder);
  await seeder.seed();
  await app.close();
}

bootstrap();