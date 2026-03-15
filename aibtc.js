#!/usr/bin/env node

const crypto = require("crypto");
const { ethers } = require("ethers");
const axios = require("axios");

// secp256k1 curve order
const N = BigInt("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141");

function generateAddress(address, seed1, seed2) {

    const addr = address.toLowerCase();

    const addrBuf = Buffer.from(addr, "utf8");

    const seedBuf1 = Buffer.alloc(8);
    const seedBuf2 = Buffer.alloc(8);

    seedBuf1.writeBigInt64BE(BigInt(seed1));
    seedBuf2.writeBigInt64BE(BigInt(seed2));

    const buf = Buffer.concat([addrBuf, seedBuf1, seedBuf2]);

    // sha256
    const hash = crypto.createHash("sha256").update(buf).digest();

    // convert to BigInt
    let pk = BigInt("0x" + hash.toString("hex"));

    // mod N
	pk = pk % N;

    // convert to 32 byte
    let pkHex = pk.toString(16).padStart(64, "0");

    const wallet = new ethers.Wallet("0x" + pkHex);

    return wallet.address.toLowerCase();
}


async function startWorker(address) {

    const prefix = "a1b7c";

    while (true) {

        let seed1 = Math.floor(Date.now()) + Math.floor(Math.random() * 1000);

        for (let seed2 = 0; seed2 <= 100000; seed2++) {

            const genAddr = generateAddress(address, seed1, seed2);

            const addr = genAddr.replace("0x", "").toLowerCase();

            if (addr.includes(prefix)) {

                console.log("FOUND:", genAddr, seed1, seed2);

                try {

                    await axios.post("http://52.44.108.84:8084/new/record", {
                        address: address,
                        seed1: seed1,
                        seed2: seed2
                    });

                    console.log("submitted");

                } catch (err) {

                    console.log("submit error:", err.message);

                }

            }

        }

    }

}


const address = process.argv[2];

if (!address) {
    console.log("Usage: node aibtc.js <address>");
    process.exit(1);
}

startWorker(address);