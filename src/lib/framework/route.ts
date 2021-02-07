import {
    ControllerConstructor,
    RouteAdapter,
    RouteOptions,
} from "./types";
import { Instantiator } from "../types";

export default function (
    instantiator: Instantiator,
) {
    let routes = new Map<ControllerConstructor, Map<string, RouteOptions>>();

    const Route = (
        options: RouteOptions,
    ) => (
        proto: any, methodName: string
    ) => {
        let ctor = proto.constructor as ControllerConstructor;
        let methods = routes.get(ctor);
        if (!methods) {
            methods = new Map<string, RouteOptions>();
            routes.set(ctor, methods);
        }
        methods.set(methodName, options);
    }

    return Object.assign(Route, {
        addRoutes(
            controllers: ControllerConstructor[],
            routeAdapter: RouteAdapter,
        ) {
            for (let ctor of controllers) {
                const methods = routes.get(ctor);
                if (!methods) throw new Error(`routes for controller "${ctor.name}" not found`);

                const controller = instantiator(ctor);

                for (let [ methodName, options ] of methods) {
                    for (let url of (options.aliases || []).concat(options.path)) {
                        routeAdapter.addRoute(
                            options,
                            ctx => controller[methodName](ctx),
                        );
                    }
                }
            }
        },
    })
}
