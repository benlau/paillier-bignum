'use strict';

const bignum = require('bignum');

module.exports = class Paillier {
    constructor(privateKey) {
        this.privateKey = privateKey;
        this.publicKey = this.privateKey.publicKey;
    }
    static generateKeys(bitlength = 2048, simplevariant) {
        let p, q, n, phi, n2, g, lambda, mu;
        // if p and q are bitlength/2 long, n is then bitlength long
        console.log('Generating Paillier keys of', bitlength, 'bits');
        do {
            p = bignum.prime(bitlength / 2);
            q = bignum.prime(bitlength / 2);
            n = p.mul(q);
            phi = p.sub(1).mul(q.sub(1));
        } while (q.cmp(p) == 0 || n.bitLength() != bitlength);

        n2 = n.pow(2);

        if (simplevariant === true) {
            //If using p,q of equivalent length, a simpler variant of the key
            // generation steps would be to set
            // g=n+1, lambda=(p-1)(q-1), mu=lambda.invertm(n)
            g = n.add(1);
            lambda = phi;
            mu = lambda.invertm(n);
        } else {
            g = getGenerator(n, n2);
            lambda = lcm(p.sub(1), q.sub(1));
            mu = L(g.powm(lambda, n2), n).invertm(n);
        }

        const publicKey = new PaillierPublicKey(this.bitlength, n, g);
        return new Paillier(new PaillierPrivateKey(lambda, mu, p, q, publicKey));
    }
};

class PaillierPrivateKey {
    constructor(lambda, mu, p, q, publicKey) {
        this.lambda = lambda;
        this.mu = mu;
        this._p = p;
        this._q = q;
        this.publicKey = publicKey;
    }
    decrypt(c) {
        return L(c.powm(this.lambda, this.publicKey._n2), this.publicKey.n).mul(this.mu).mod(this.publicKey.n);
    }
}

class PaillierPublicKey {
    constructor(bits, n, g) {
        this.n = n;
        this._n2 = n.pow(2); // cache n^2
        this.g = g;
    }
    encrypt(m) {
        let r;
        do {
            r = bignum.rand(this.n);
        } while (r.le(1));
        return this.g.powm(m, this._n2).mul(r.powm(this.n, this._n2)).mod(this._n2);
    }
}

function lcm(a, b) {
    return a.mul(b).div(a.gcd(b));
}

function L(a, n) {
    return a.sub(1).div(n);
}

function getGenerator(n, n2 = n.pow(2)) {
    const alpha = bignum.rand(n);
    const beta = bignum.rand(n);
    return alpha.mul(n).add(1).mul(beta.powm(n, n2)).mod(n2);
}