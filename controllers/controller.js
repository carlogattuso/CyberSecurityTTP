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
const socket = __importStar(require("socket.io"));
const rsa = require('rsa');
const sha = require('object-sha');
const io = socket.listen(50002);
let keyPair;
let aPubKey;
let pko;
let pkp;
let key;
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
exports.publishKey = async function (req, res) {
    let json = req.body;
    let body = await JSON.parse(JSON.stringify(json.body));
    aPubKey = new rsa_1.PublicKey(bc.hexToBigint(json.pubKey.e), bc.hexToBigint(json.pubKey.n));
    let proofDigest = await bc.bigintToHex(await aPubKey.verify(bc.hexToBigint(json.signature)));
    let bodyDigest = await digest(body);
    if (bodyDigest.trim() === proofDigest.trim()) {
        pko = json.signature;
        key = body.msg;
        mBody = JSON.parse(JSON.stringify({ type: 4, src: 'TTP', dst: ['A', 'B'], msg: key, timestamp: Date.now() }));
        await digest(mBody)
            .then(data => keyPair.privateKey.sign(bc.hexToBigint(data)))
            .then(data => pkp = bc.bigintToHex(data));
        let jsonToSend = JSON.parse(JSON.stringify({
            body: mBody, signature: pkp,
            pubKey: { e: bc.bigintToHex(keyPair.publicKey.e), n: bc.bigintToHex(keyPair.publicKey.n) }
        }));
        console.log("All data verified");
        console.log({
            pko: pko,
            key: key
        });
        io.emit('get-key', { msg: "The key is ready to download it" });
        return res.status(200).send(jsonToSend);
    }
    else {
        return res.status(401).send({ error: "Bad authentication of proof of key origin" });
    }
};
exports.getPublishedKey = async function (req, res) {
    let jsonToSend = await JSON.parse(JSON.stringify({
        body: mBody, signature: pkp,
        pubKey: { e: bc.bigintToHex(keyPair.publicKey.e), n: bc.bigintToHex(keyPair.publicKey.n) }
    }));
    return res.status(200).send(jsonToSend);
};
async function digest(obj) {
    return await sha.digest(obj, 'SHA-256');
}
