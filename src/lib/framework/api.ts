import { Anonymous, assertRoles, Command } from "./roles";
import { ApiArgOptions, ApiConstructor, UserContextBase } from "./types";
import { createRegistryDecorator } from "./decorator";
import { ArgumentError } from "./error";
import { Instantiator } from "../types";
import CreateRun from '../runnable';

export class ApiOptions {
    doc: string;
    roles: number = Anonymous;
    args = new Map<string, ApiArgOptions>();

    validateAll(
        Api: ApiConstructor,
        values: { [ key: string ]: unknown },
        userContext: any,
    ) {
        let ret: any = {};
        let errors: any = {};

        for (let [ name, options ] of this.args) {
            let { skip, error, value } = this.validateByOptions(
                Api,
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

            ret[name] = value;
        }

        if (Object.keys(errors).length) throw new ArgumentError(
            Object.values(errors).join(', '),
            400,
            {
                code: 'ARGUMENT_VALIDATION_ERROR',
                errors,
            }
        );

        return ret;
    }

    private validateByOptions(
        Api: ApiConstructor,
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
            let value = options.parser(input, { Api, userContext, Type: options.Type });

            let error = options.validator(value, { Api, userContext, Type: options.Type });
            if (typeof error == 'string') return { skip: false, error }

            return { skip: false, value };
        } catch (e) {
            return { skip: false, error: e.message || e }
        }
    }
}

export default function (
    instantiator: Instantiator,
) {
    const run = CreateRun(instantiator);

    const Api = createRegistryDecorator<ApiConstructor, ApiOptions, { doc: string, roles?: number }>(
        () => new ApiOptions(),
    );
    return Object.assign(Api, {

        run: async (
            ctor: ApiConstructor,
            userContext: UserContextBase,
            args: { [ key: string ]: unknown },
        ) => {
            const opts = Api.get(ctor);
            if (!opts) throw new ArgumentError(`api "${ctor.name} not found`, 404);
            assertRoles(opts.roles, userContext.roles);

            let runnable = Object.create(instantiator(ctor));
            Object.assign(runnable, opts.validateAll(ctor, args, userContext));

            return run(runnable);
        },


        Cli: (doc: string, roles: number = 0) => Api({
            doc,
            roles: roles | Command,
        }),
    })
}
