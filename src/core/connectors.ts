import AOP from "../lib/aop";
import JWT from "../lib/jwt";
import CreateRun, { Runnable } from '../lib/runnable';
import Container from "typedi";
import { ParameterToken } from "./parameter";
import { AccessDeniedError } from "./error";
import { AgeCache } from "../lib/age-cache";

const instantiate = <T>(t: new (...args: any[]) => T) => Container.get(t);

export const { Before, After, Around } = AOP(
    instantiate,
    (s: Object) => Container.set(s.constructor, s),
);

export const run = CreateRun(
    instantiate,
)

export function RunnerAgeCache(Runner: new (...args: any[]) => Runnable, ttl: number) {
    return function (
        object: any,
        propertyName: string,
        index?: number,
    ) {
        Container.registerHandler({
            object,
            propertyName,
            index,
            value: container => new AgeCache(
                () => run(container.get(Runner)),
                ttl,
            ),
        })
    }
}


const parameters = Container.get(ParameterToken);
export const jwt = JWT(parameters.secret, AccessDeniedError);