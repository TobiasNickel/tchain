"use strict";
//@ts-check
var createHash = require('create-hash');

/**
 * @typedef block 
 * @property {string} algorithm 
 * @property {number} difficulty 
 * @property {string} hash 
 * @property {string} nonse 
 * @property {number} start 
 * @property {number} testCount 
 * @property {number} end 
 **/

// * @property {string} data 

const hashMethods = {
    /**
     * @param {string} data
     */
    md5: function(data) {
        return createHash('md5').update(data).digest('hex');
    },

    /**
     * @param {string} data
     */
    sha256: function(data) {
        return createHash('sha256').update(data).digest('hex');
    },
};

/**
 * @param {string} hash 
 * @param {string} algorithm 
 * @param {number} difficulty 
 * @return {block}
 */
function mine(hash, algorithm, difficulty) {
    var resStart = new Array(difficulty + 1).join('0');
    var nonse;
    var hashMethod = hashMethods[algorithm];
    var testCount = 0
    var start = Date.now()
    while (true) {
        testCount++;
        nonse = (Math.random() + '').substr(2);
        var signature = hashMethod(hash + '\n' + nonse);
        if (signature.substr(0, difficulty) == resStart) {
            return {
                algorithm,
                difficulty,
                hash,
                signature,
                nonse,
                start,
                testCount,
                end: Date.now() - start
            };
        }
    }
}

/**
 * @param {string} hash 
 * @param {string} algorithm 
 * @param {number} difficulty 
 * @return {block}
 */
function tryMine(hash, algorithm, difficulty, maxTry) {
    var resStart = new Array(difficulty + 1).join('0');
    var nonse;
    var hashMethod = hashMethods[algorithm];
    var testCount = 0
    var start = Date.now()
    while (testCount < maxTry) {
        testCount++;
        nonse = (Math.random() + '').substr(2);
        var signature = hashMethod(hash + '\n' + nonse);
        if (parseInt(signature.substr(0, difficulty), 16) === 0) {
            return {
                algorithm,
                difficulty,
                hash,
                signature,
                nonse,
                start,
                end: Date.now() - start
            };
        }
    }
}


/**
 * 
 * @param {block} block 
 */
function testBlock(block) {
    var resStart = new Array(block.difficulty + 1).join('0');
    var shouldHash = hashObjectData(block, block.algorithm);
    if (shouldHash !== block.hash) {
        console.log(shouldHash, block.hash)
        console.log('the hash is not right')
        return false;
    }
    var hash = hashMethods[block.algorithm](block.hash + '\n' + block.nonse);
    return hash.substr(0, block.difficulty) == resStart;
}




/**
 * @function 
 * function that is able to consistently hash no metter in what order props where added
 * @param {*} data
 * @param {string} algorithm
 * @return {string}
 */
function hashObjectData(block, algorithm) {
    //console.log('hashBlock:', block)
    return hashMethods[algorithm](JSON.stringify(sortOjectsPropsByName(block.data)) + ':' + (block.lastBlockHash || '') + ':' + block.time);
}

/**
 * When use JSON.stringify, the order of properties is not guarantied. althou
 * it is consistent in JS. The order of props in the JSON is the same order as they
 * where added to the object you stringify.
 * if you parse and stringify, the props in each object will remain the same order.
 * But when there was used different methods to create objects, the order of properties
 * might vary and also the implementations in other languages might differ, so for the
 * blockchain it will be nessasary to guarantie an order of props, to hash the stringified data.
 * 
 * The current implementation might not be fast, but it is reliable
 * 
 */
function sortOjectsPropsByName(object) {
    if (typeof object !== 'object') {
        return object; // not an object
    }
    if (Array.isArray(object)) {
        return object.map(sortOjectsPropsByName);
    }
    var keys = Object.keys(object).sort();
    var out = {};
    keys.forEach(function(key) {
        out[key] = sortOjectsPropsByName(object[key]);
    });
    return out;
}

module.exports.hashObjectData = hashObjectData;
module.exports.hashMethods = hashMethods;
module.exports.testBlock = testBlock;
module.exports.mine = mine;
module.exports.tryMine = tryMine;