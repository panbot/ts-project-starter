import './bootstrap';

import { Api, Inject, Module, Tokens } from './framework';
import { ModuleApiLookup } from './lib/framework/lookup';
import { Runnable } from './lib/runnable';
import { Command, Superuser } from './lib/framework/roles';
import { UserContext } from './app/security';

export default class implements Runnable {

    @Inject(Tokens.ModuleApiLookup)
    private lookup: ModuleApiLookup;

    async run() {
        let { module } = this.lookup.findModule(process.argv[3]);
        await Module.initModules([ module ]);

        let uc = new UserContext();
        uc.roles = Superuser | Command;

        await Api.run(
            this.lookup.findApi(process.argv[3], process.argv[4]).api,
            uc,
            JSON.parse(process.argv[5] || '{}')
        );
    }
}
