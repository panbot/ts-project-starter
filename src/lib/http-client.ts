import { RequestOptions } from "https";
import { URL } from "url";
import * as http from 'http';
import * as https from 'https';

export function get(
    url: URL,
    options: RequestOptions = {},
) {
    options.method = 'GET';
    return request(url, options, null);
}

export function post(
    url: URL,
    options: RequestOptions = {},
    data: any,
) {
    options.method = 'POST';
    return request(url, options, data);
}

export const request = (
    url: URL,
    options: RequestOptions,
    data: any,
) => new Promise<NodeJS.ReadableStream>((resolve, reject) => {
    let req: http.ClientRequest;
    switch (url.protocol) {
        case 'http:':
        req = http.request(url, options, res => resolve(res));
        break;

        case 'https:':
        req = https.request(url, options, res => resolve(res));
        break;

        default: throw new Error(`unsupported protocol "${url.protocol}"`);
    }
    req.on('error', reject);

    if (data) req.end(data);
    else req.end();
});

export const stream2buffer = (readable: NodeJS.ReadableStream) => new Promise<Buffer>((resolve, reject) => {
    let bufs: Buffer[] = [];
    readable.on('data', c => bufs.push(c));
    readable.on('end', () => resolve(Buffer.concat(bufs)));
    readable.on('error', reject);
})

