import { Service } from "typedi";
import { createConnection, getConnection } from "typeorm";
import { Runnable } from "../lib/runnable";

export default class implements Runnable {

    async run(
    ) {
        try {
            await createConnection({
                type: 'mongodb'
            });

            console.log('mongodb connection created!');

            let conn = getConnection();
            conn.close();
            console.log('mongodb connection closed!');

        } catch (e) {
            console.error(e);
        }
    }
}
