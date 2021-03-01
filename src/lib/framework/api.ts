import { Anonymous, assertRoles, Command } from "./roles";
import { ApiArgOptions, ApiConstructor, UserContextBase } from "./types";
import { createRegistryDecorator } from "./decorator";
import { ArgumentError } from "./error";
import { Constructor, Instantiator } from "../types";
import CreateRun, { Runnable } from '../runnable';

export class ApiOptions {
    doc: string;
    roles: number = Anonymous;
    args = new Map<string, ApiArgOptions>();

    validateAll(
        runnable: Runnable,
        values: { [ key: string ]: unknown },
        userContext: any,
    ) {
        let errors: any = {};

        for (let [ name, options ] of this.args) {
            let { skip, error, value } = this.validateByOptions(
                runnable,
                name,
                values[name],
                userContext,
                options,
            );
            if (skip) continue;

            if (error) {
                errors[name] = error;
                continue;
            }

            (runnable as any)[name] = value;
        }

        if (Object.keys(errors).length) throw new ArgumentError(
            Object.values(errors).join(', '),
            400,
            {
                code: 'ARGUMENT_VALIDATION_ERROR',
                errors,
            }
        );
    }

    private validateByOptions(
        runnable: Runnable,
        name: string,
        input: unknown,
        userContext: any,
        options: ApiArgOptions,
    ): { skip: boolean, error?: string, value?: any } {
        if (input == null) {
            switch (options.necessity) {
                case 'optional':
                    return { skip: true }

                case 'required':
                    return { skip: false, error: `"${name}" is required` }

                case "overridden": break;

                default: throw new Error('invalid value for "necessity"');
            }
        }

        try {
            let value = options.parser.call(runnable, input, { userContext, Type: options.Type });

            let error = options.validator.call(runnable, value, { userContext, Type: options.Type });
            if (typeof error == 'string') return { skip: false, error }

            return { skip: false, value };
        } catch (e) {
            return { skip: false, error: e.message || e }
        }
    }
}

export default function (
    instantiate: Instantiator,
) {
    const run = CreateRun(instantiate);

    const Api = createRegistryDecorator<ApiConstructor, ApiOptions, { doc: string, roles?: number }>(
        () => new ApiOptions(),
    );
    return Object.assign(Api, {

        run: async <T extends Runnable>(
            ctor: Constructor<T>,
            userContext: UserContextBase,
            args: { [ key: string ]: unknown },
        ): Promise<ReturnType<T['run']>> => {
            const opts = Api.get(ctor);
            if (!opts) throw new ArgumentError(`api "${ctor.name} not found`, 404);
            assertRoles(opts.roles, userContext.roles);

            let runnable: T = Object.create(instantiate(ctor));
            opts.validateAll(runnable, args, userContext);

            return run(runnable);
        },

        Cli: (doc: string, roles: number = 0) => Api({
            doc,
            roles: roles | Command,
        }),
    })
}
