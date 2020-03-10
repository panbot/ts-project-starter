import {
    ObjectIdColumn,
    ObjectID,
    Entity,
    Column,
    CreateDateColumn,
} from "typeorm";
import EV from '../../lib/entity-validator';

@Entity({
    name: 'DemoEntity',
})
export class DemoEntity {

    @ObjectIdColumn()
    id: ObjectID;

    @Column({
        unique: true,
    })
    @EV.NotBlank()
    token: string;

    @Column()
    @EV.NotBlank()
    name: string;

    @Column()
    description: string;

    @Column()
    @EV.NotBlank()
    since: Date;

    @Column()
    @EV.NotBlank()
    until: Date;

    @CreateDateColumn()
    createdAt: Date;
}
