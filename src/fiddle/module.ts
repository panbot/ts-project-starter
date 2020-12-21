import Container from "typedi";
import { Module } from "../framework";
import { Runnable } from "../lib/runnable";

import './test1.module';
import './test2.module';

export default class implements Runnable {

    async run(
    ) {
        for (let ctor of Module.resolveDependencies()) {
            let modules = Container.get(ctor);
            if (modules.init) modules.init();
        }
    }
}
