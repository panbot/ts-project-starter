import { Module } from "../framework";
import { Test1Module } from "./test1.module";

@Module({
    doc: `test2 module`,
    dependencies: () => [
    ]
})
export class Test2Module {
    init() {
        console.log(2);
    }
}
