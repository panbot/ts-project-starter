import { createHash, Hash } from "crypto";
import { Constructor } from "./types";

const symbol = Symbol('hashcash');

function createConsumer(algorithm: string = 'sha256') {
    let hash = createHash(algorithm);
    return {
        update(chunk: string | Buffer) { hash.update(chunk) },
        getZeroes() {
            let hex = hash.digest('hex');
            for (let i = 0; i < hex.length; ++i) if (hex.charAt(i) != '0') return i;
            return hex.length;
        },
    }
}

function setRequestHashcash(req: any, hashcash: {
    zeros: number,
}) {
    Reflect.defineMetadata(symbol, hashcash, req);
}

function getRequestHashcash(req: any) {
    return Reflect.getOwnMetadata(symbol, req) as {
        zeros: number
    } | undefined;
}

type HashcashOptions = {
    difficulty: number,
}

function Resource(options: HashcashOptions) {
    return function (resource: any) {
        Reflect.defineMetadata(Resource, options, resource);
    }
}

function getResourceRequiredDifficulty<T>(resources: Constructor<T> | Constructor<T>[]): number {
    let list = resources instanceof Array ? resources : [ resources ];
    return list.reduce(
        (pv, cv) => Math.max(
            pv,
            (Reflect.getMetadata(Resource, cv) as HashcashOptions | undefined)?.difficulty || 0),
        0,
    )
}

function checkRequestHashcash<T>(
    req: any,
    resources: Constructor<T> | Constructor<T>[],
) {
    let requiredDifficulty = getResourceRequiredDifficulty(resources);
    let providedDifficulty = getRequestHashcash(req)?.zeros || 0;

    if (providedDifficulty < requiredDifficulty) return {
        requiredDifficulty,
        providedDifficulty,
    }
}

export default {
    createConsumer,
    setRequestHashcash,
    getRequestHashcash,
    Resource,
    getResourceRequiredDifficulty,
    checkRequestHashcash,
}
