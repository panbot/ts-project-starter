import ApiArgValidatableFactory from "./api-arg-validatable";
import ApiArgFactory from './api-arg';
import ApiFactory from './api';
import ModuleFactory from './module';
import RouteFactory from './route';
import { Instantiator } from "../types";

export default function (
    instantiator: Instantiator,
) {
    const Module = ModuleFactory(instantiator);
    const Api = ApiFactory(instantiator);
    const ApiArgValidatable = ApiArgValidatableFactory();
    const ApiArg = ApiArgFactory(Api, ApiArgValidatable);

    const Route = RouteFactory(
        instantiator,
    );

    return {
        ApiArgValidatable,
        ApiArg,
        Api,
        Module,
        Route,
    }
}