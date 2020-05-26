import { ObjectID } from "typeorm";
export declare class DemoEntity {
    id: ObjectID;
    token: string;
    name: string;
    description: string;
    since: Date;
    until: Date;
    createdAt: Date;
}
