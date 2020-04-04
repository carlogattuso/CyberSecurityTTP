'use strict';
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const bc = __importStar(require("bigint-conversion"));
const rsa_1 = require("rsa");
const rsa = require('rsa');
const sha = require('object-sha');
let keyPair;
let aPubKey;
let pko;
let pkp;
let key;
async function firstAsync() {
    return rsa.generateRandomKeys();
}
firstAsync().then(data => keyPair = data);
exports.publishKey = async function (req, res) {
    let json = req.body;
    let body = JSON.parse(JSON.stringify(json.body));
    aPubKey = new rsa_1.PublicKey(bc.hexToBigint(json.pubKey.e), bc.hexToBigint(json.pubKey.n));
    let proofDigest = bc.bigintToHex(await aPubKey.verify(bc.hexToBigint(json.signature)));
    let bodyDigest = await sha.digest(body);
    if (bodyDigest === proofDigest && checkTimestamp(body.timestamp)) {
        pko = json.signature;
        key = body.msg;
        let mBody = JSON.parse(JSON.stringify({ type: 4, src: 'TTP', dst: ['A', 'B'], msg: key, timestamp: Date.now() }));
        await digest(mBody)
            .then(data => keyPair.privateKey.sign(bc.hexToBigint(data)))
            .then(data => pkp = bc.bigintToHex(data));
        let jsonToSend = JSON.parse(JSON.stringify({
            body: mBody, signature: pkp,
            pubKey: { e: bc.bigintToHex(keyPair.publicKey.e), n: bc.bigintToHex(keyPair.publicKey.n) }
        }));
        //Emit socket.io
        return res.status(200).send(jsonToSend);
    }
    else {
        return res.status(401).send({ error: "Bad authentication of proof of key origin" });
    }
};
function checkTimestamp(timestamp) {
    const time = Date.now();
    return (timestamp > (time - 300000) && timestamp < (time + 300000));
}
async function digest(obj) {
    return await sha.digest(obj, 'SHA-256');
}
