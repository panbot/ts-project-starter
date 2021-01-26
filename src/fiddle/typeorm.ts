import { Service } from "typedi";
import { createConnection } from "typeorm";
import { Runnable } from "../lib/runnable";

export default class implements Runnable {

    async run(
    ) {
        createConnection({
            type: 'mongodb'
          }).catch(error => {
            console.error(`Couldn't connect to the database!`);
            console.error(error);
          });
    }
}
