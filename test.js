var tchain = require('./tchain');
var crypto = require('crypto');
console.log(crypto.getCurves());


var data = ['Tobias Nickel'];
var hash = tchain.hashObjectData(data, "md5");
var block = tchain.mine(hash, 'md5', 4);


console.log(JSON.stringify(block))

console.log(block.hash + '\n' + block.nonse)
console.log(tchain.hashMethods.md5(block.hash + '\n' + block.nonse))
console.log("testBlock", tchain.testBlock(block))

console.log()
console.log()
console.log()

var resBlock = {
    algorithm: 'md5',
    difficulty: '4',
    hash: '87ce20e1ce8e56c1a9b66b504af2b3c7',
    signature: '0000dfaae7f02b010b69c58452459871',
    nonse: '49218654013841734',
    start: '1494820331504',
    testCount: '25287',
    end: '2399'
}
console.log('testBlock')