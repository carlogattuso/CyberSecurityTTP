'use strict';
import {Request, Response } from 'express';
import * as bc from 'bigint-conversion';
import {KeyPair,PublicKey} from "rsa";
import * as socket from 'socket.io';
const rsa = require('rsa');
const sha = require('object-sha');

const io = socket.listen(50002);

let keyPair: KeyPair;

let aPubKey;

let pko;
let pkp;
let key;
let iv;

let mBody;

io.on('connection', (socket) => {
    socket.on('get-key-error', (message) => {
        console.log(message.msg);
    });
});

async function firstAsync() {
    return rsa.generateRandomKeys();
}

firstAsync().then(data => keyPair = data);

exports.publishKey = async function (req: Request, res: Response){
    let json = req.body;
    let body = await JSON.parse(JSON.stringify(json.body));
    aPubKey = new PublicKey(bc.hexToBigint(json.pubKey.e),bc.hexToBigint(json.pubKey.n));
    let proofDigest = await bc.bigintToHex(await aPubKey.verify(bc.hexToBigint(json.signature)));
    let bodyDigest = await digest(body);
    if(bodyDigest.trim() === proofDigest.trim() && checkTimestamp(body.timestamp)) {
        pko = json.signature;
        key = body.msg;
        iv = body.iv;

        mBody = JSON.parse(JSON.stringify({ type: 4, src: 'TTP', dst: ['A','B'], msg: key, iv: iv, timestamp: Date.now() }));

        await digest(mBody)
            .then(data => keyPair.privateKey.sign(bc.hexToBigint(data)))
            .then(data => pkp = bc.bigintToHex(data));

        let jsonToSend = JSON.parse(JSON.stringify({
            body: mBody, signature: pkp,
            pubKey: {e: bc.bigintToHex(keyPair.publicKey.e), n: bc.bigintToHex(keyPair.publicKey.n)}
        }));

        console.log("All data verified");
        console.log({
            pko: pko,
            key: key
        });
        io.emit('get-key', {msg: "The key is ready to download it"});

        return res.status(200).send(jsonToSend);
    } else {
        return res.status(401).send({error:"Bad authentication of proof of key origin"});
    }
};

exports.getPublishedKey = async function (req: Request, res: Response) {
    let jsonToSend = await JSON.parse(JSON.stringify({
        body: mBody, signature: pkp,
        pubKey: {e: bc.bigintToHex(keyPair.publicKey.e), n: bc.bigintToHex(keyPair.publicKey.n)}
    }));

    return res.status(200).send(jsonToSend);
};

function checkTimestamp(timestamp:number) {
    const time = Date.now();
    return (timestamp > (time - 300000) && timestamp < (time + 300000));
}

async function digest(obj) {
    return await sha.digest(obj,'SHA-256');
}
