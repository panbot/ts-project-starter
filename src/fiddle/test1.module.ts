import { Module } from "../framework";
import { Test2Module } from "./test2.module";

@Module({
    doc: `test1 module`,
    dependencies: () => [
        Test2Module,
    ]
})
export class Test1Module {
    init() {
        console.log(1);
    }
}
