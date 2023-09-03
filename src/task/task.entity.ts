import { TaskListEntity } from "../task-list/task-list.entity";
import { Column, Entity, ManyToOne, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class TaskEntity {
    @PrimaryGeneratedColumn()
    id: string;

    @Column({ nullable: false })
    name: string;

    @Column({ nullable: false })
    isCompleted: boolean;

    @Column({ nullable: false })
    dueDate: Date;

    @Column({ nullable: true })
    todoistItemId: string;

    @ManyToOne(() => TaskListEntity, { onUpdate: 'CASCADE' })
    taskList: TaskListEntity;
}