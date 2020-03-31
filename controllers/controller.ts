'use strict';
import {Request, Response } from 'express';
import * as bc from 'bigint-conversion';
import {KeyPair,PublicKey} from "rsa";
const rsa = require('rsa');
const sha = require('object-sha');

let keyPair: KeyPair;

let aPubKey;

let kpo: string;
let key: string;

let message;

async function firstAsync() {
    return rsa.generateRandomKeys();
}

firstAsync().then(data => keyPair = data);

exports.publishKey = async function (req: Request, res: Response){
    let b = req.body.body;
    let signature = req.body.signature;

    aPubKey = new PublicKey(bc.hexToBigint(req.body.pubKey.e),bc.hexToBigint(req.body.pubKey.n));
    let proofDigest = bc.bigintToHex(await aPubKey.verify(bc.hexToBigint(signature)));
    console.log(proofDigest);
    console.log(await digest(JSON.stringify(b)));
    let test = await digest(JSON.stringify(b));
    if(test === proofDigest){
        kpo = signature;
        key = b.msg;
        let body = { type: 4, src: 'TTP', dst: ['A','B'], msg: b.msg, timestamp: Date.now() };
        let sign = '';
        await digest(body)
            .then(data => keyPair.privateKey.sign(bc.hexToBigint(data)))
            .then(data => sign = bc.bigintToHex(data));

        message = { body: body, signature: sign,
            pubKey: { e: bc.bigintToHex(keyPair.publicKey.e), n: bc.bigintToHex(keyPair.publicKey.n) }
        };
        return res.status(200).send(message);
    } else {
        res.status(401).send({error:"Bad authentication of proof of origin"})
    }
};

async function digest(obj:any) {
    return await sha.digest(obj,'SHA-256');
}
