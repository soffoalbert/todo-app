import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class TaskListEntity {
    @PrimaryGeneratedColumn()
    id: string;

    @Column({ nullable: false })
    name: string;
}