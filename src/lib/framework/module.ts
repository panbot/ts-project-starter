import { createRegistryDecorator } from "./decorator";
import { ApiConstructor, ControllerConstructor, ModuleConstructor } from "./types";
import { Instantiator } from "../types";

export class ModuleOptions {
    doc: string;
    apis: ApiConstructor[] = [];
    controllers: ControllerConstructor[] = [];
    dependencies: () => ModuleConstructor[] = () => [];
}

export default function (
    instantiator: Instantiator,
) {

    let Module = Object.assign(
        createRegistryDecorator<
            ModuleConstructor,
            ModuleOptions,
            {
                doc: string,
                apis?: ApiConstructor[],
                controllers?: ControllerConstructor[],
                dependencies?: () => ModuleConstructor[],
            }
        >(
            () => new ModuleOptions(),
        ),
        {
            resolveDependencies(ctors: ModuleConstructor[]) {
                let visited = new Set<ModuleConstructor>();
                let ret: ModuleConstructor[] = [];

                for (let ctor of ctors) visit(ctor, new Set<ModuleConstructor>());

                return ret;

                function visit(ctor: ModuleConstructor, path: Set<ModuleConstructor>) {
                    if (visited.has(ctor)) return;

                    if (path.has(ctor)) throw new Error(
                        `circular dependency found, ` + [ ...path, ctor ].map(v => v.name).join(' -> ')
                    );
                    path.add(ctor);

                    for (let dep of Module.get(ctor).dependencies()) {
                        visit(dep, new Set<ModuleConstructor>([ ...path ]))
                    }

                    ret.push(ctor);
                    visited.add(ctor);
                }
            },

            async initModules(modules: ModuleConstructor[]) {
                for (let ctor of Module.resolveDependencies(modules)) {
                    let module = instantiator(ctor);
                    if (module.init) await module.init();
                }
            }
        }
    );

    return Module;
}
