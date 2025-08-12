import { Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('patient_invites')
export class PatientInvite {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column()
  email!: string;

  @Index()
  @Column()
  token!: string;

  @ManyToOne(() => User, { eager: true, onDelete: 'SET NULL', nullable: true })
  invitedBy!: User | null;

  @Column({ type: 'timestamptz' })
  expiresAt!: Date;

  @CreateDateColumn()
  createdAt!: Date;
}



