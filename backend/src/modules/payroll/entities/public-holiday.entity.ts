import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('public_holidays')
export class PublicHoliday {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'date', unique: true })
  date: Date;

  @Column()
  name: string;

  @Column()
  year: number;
}
