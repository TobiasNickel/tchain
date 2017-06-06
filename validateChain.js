var tchain = require('./tchain')
var fs = require('fs');
var chain = (fs.readFileSync('./public/chain') + '').split('\n').filter(line => !!line).map(JSON.parse)
    //console.log(chain)

function validateChain(chain) {
    for (var i = 0; i < chain.length; i++) {
        var block = chain[i];
        if (!tchain.testBlock(block)) {
            console.log('block is not valid:', block)
            return false;
        }

        if (i) {
            var lastBlock = chain[i - 1];
            if (lastBlock.hash !== block.lastBlockHash) {
                return false;
            }
        }
    }
    return true;
}

if (validateChain(chain)) {
    console.log('chain is valid')
} else {
    console.log('chain is not valid')
}