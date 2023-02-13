import { createRegistryDecorator } from "./decorator";
import { ApiConstructor, ControllerConstructor, ModuleConstructor } from "./types";
import { Constructor, Instantiator } from "../types";
import { RunArgFactory, Runnable } from "../runnable";

export class ModuleOptions {
    doc: string;
    apis: ApiConstructor[] = [];
    controllers: ControllerConstructor[] = [];
    backgroundJobs: Constructor<Runnable>[] = [];
    dependencies: () => ModuleConstructor[] = () => [];
}

export default function (
    instantiator: Instantiator,
) {
    const Module = createRegistryDecorator<
        ModuleConstructor,
        ModuleOptions,
        {
            doc: string,
            apis?: ApiConstructor[],
            controllers?: ControllerConstructor[],
            backgroundJobs?: Constructor<Runnable>[],
            dependencies?: () => ModuleConstructor[],
        }
    >(
        () => new ModuleOptions(),
    );

    const resolveDependencies = (ctors: ModuleConstructor[]) => {
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
    }

    const inited = new Set<ModuleConstructor>();
    const initModules = async (modules: ModuleConstructor[]) =>  {
        for (let ctor of resolveDependencies(modules)) {
            if (inited.has(ctor)) continue;
            inited.add(ctor);
            let module = instantiator(ctor);
            if (module.init) await module.init();
        }
    }

    return Object.assign(
        Module,
        {
            resolveDependencies,
            initModules,

            RunArgLoader: class implements RunArgFactory {
                async produceRunArgFor(_: Runnable<unknown>, modules: ModuleConstructor[]) {
                    await initModules(modules)
                }
                async releaseRunArgFor(_: Runnable<unknown>) {
                }
            }
        }
    );
}
