import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Contract } from './entities/contract.entity';
import { WorkerAvailability } from './entities/worker-availability.entity';
import { UserRole } from '@/common/enums';

@Injectable()
export class WorkersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Contract)
    private contractRepository: Repository<Contract>,
    @InjectRepository(WorkerAvailability)
    private availabilityRepository: Repository<WorkerAvailability>,
  ) {}

  async getWorkersByTenant(tenantId: string): Promise<User[]> {
    return this.userRepository.find({
      where: { tenantId, role: UserRole.WORKER, isActive: true },
    });
  }

  async createContract(contractData: Partial<Contract>): Promise<Contract> {
    const contract = this.contractRepository.create(contractData);
    return this.contractRepository.save(contract);
  }

  async getWorkerContracts(workerId: string): Promise<Contract[]> {
    return this.contractRepository.find({
      where: { workerId, isActive: true },
    });
  }

  async setAvailability(availabilityData: Partial<WorkerAvailability>): Promise<WorkerAvailability> {
    const availability = this.availabilityRepository.create(availabilityData);
    return this.availabilityRepository.save(availability);
  }

  async getWorkerAvailability(workerId: string): Promise<WorkerAvailability[]> {
    return this.availabilityRepository.find({
      where: { userId: workerId },
    });
  }
}
