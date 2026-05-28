import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToMany,
} from 'typeorm';
import { Post } from '../../posts/entities/post.entity';

@Entity('tags')
export class Tag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 50 })
  name: string;

  @Column({ unique: true, length: 60 })
  slug: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relación ManyToMany inversa (el owner está en Post)
  @ManyToMany(() => Post, (post) => post.tags)
  posts: Post[];
}
