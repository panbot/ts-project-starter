import './bootstrap';

import { Inject } from 'typedi';
import { Api, Module, Tokens } from './framework';
import { ModuleApiLookup } from './lib/framework/lookup';
import { Runnable } from './lib/runnable';
import { UserContext } from './app';
import { CommandUser, Superuser } from './lib/framework/roles';

export default class implements Runnable {

    @Inject(Tokens.ModuleApiLookup)
    private lookup: ModuleApiLookup;

    async run() {
        let { module } = this.lookup.findModule(process.argv[3]);
        await Module.initModules([ module ]);

        let uc = new UserContext();
        uc.roles = Superuser | CommandUser;

        await Api.run(
            this.lookup.findApi(process.argv[3], process.argv[4]).api,
            uc,
            JSON.parse(process.argv[5] || '{}')
        );
    }
}
