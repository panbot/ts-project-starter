import { createHmac } from 'crypto';

export default function (secret: string, Error: new (msg: string) => any) {
    function sign(s: Buffer) {
        return createHmac('sha256', secret)
            .update(s)
            .digest('base64')
        ;
    }

    function verify(jwt: unknown) {
        if (
            jwt == null || typeof jwt != 'string'
        ) throw new Error(`input is not a string`);

        let parts = jwt.split('.');
        let theirSig: string;
        let mySig: string;
        let payload;
        switch (parts.length) {
            case 3:
            payload = parts[1];
            mySig = sign(Buffer.from(parts[0] + '.' + parts[1]));
            theirSig = parts[2];
            break;

            case 2:
            payload = parts[0];
            mySig = sign(Buffer.from(parts[0], 'base64'));
            theirSig = parts[1];
            break;

            default:
            throw new Error(`invalid jwt: wrong part size`);
        }

        if (normalize(mySig) != normalize(theirSig)) {
            throw new Error(`invalid jwt: signature mismatch`)
        }

        return Buffer.from(payload, 'base64');
    }

    function normalize(base64: string) {
        return base64.replace(/[^0-9A-Za-z]/g, '');
    }

    return {
        encode: (jsonable: Object) => {
            let buf = Buffer.from(JSON.stringify(jsonable));
            return (buf.toString('base64') + '.' + sign(buf)).replace(/=/g, '');
        },

        decode: (jwt: unknown) => {
            return JSON.parse(verify(jwt).toString('utf8'));
        }
    }
}