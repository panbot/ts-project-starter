export default function (secret: string, Error: new (msg: string) => any): {
    encode: (jsonable: Object) => string;
    decode: (jwt: unknown) => any;
};
