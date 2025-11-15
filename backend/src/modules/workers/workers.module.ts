import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkersController } from './workers.controller';
import { WorkersService } from './workers.service';
import { User } from '../users/entities/user.entity';
import { Contract } from './entities/contract.entity';
import { WorkerAvailability } from './entities/worker-availability.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Contract, WorkerAvailability])],
  controllers: [WorkersController],
  providers: [WorkersService],
  exports: [WorkersService],
})
export class WorkersModule {}
