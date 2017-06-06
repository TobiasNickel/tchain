//@ts-check
const tchain = require('./tchain');
const Koa = require('koa');
const Router = require('koa-router');
const app = new Koa();
const koaBody = require('koa-body');
var router = new Router();

var getCurrentTaskCount = 0;
router.get('/currentTask', function(ctx, next) {
    console.log('get currentTask', getCurrentTaskCount++);
    ctx.body = task;
});
router.get('/currentBlock', function(ctx, next) {
    ctx.body = currentBlock;
});

app.use(require('koa-static')('./public', {}));
app.use(koaBody({}));

router.post('/add', function(ctx) {
    // @ts-ignore
    messages.push(JSON.stringify(ctx.request.body));
    ctx.body = true;
});

var globalSpeed = 0;
router.post('/speed', function(ctx) {
    ctx.body = globalSpeed;
    var speed = parseInt(ctx.request.body.speed);
    if (!speed) return;
    if (speed < 0) return;

    globalSpeed += speed;
    setTimeout(function() { globalSpeed -= speed; }, 10000);
});

router.get('/speed', function(ctx) {
    ctx.body = globalSpeed;
})

router.post('/solution', function(ctx, next) {
    // @ts-ignore
    var inBlock = ctx.request.body;
    //console.log('inBlock', inBlock)
    const block = {
        algorithm: inBlock.algorithm + '',
        difficulty: parseInt(inBlock.difficulty),
        hash: inBlock.hash + '',
        signature: inBlock.signature + '',
        nonse: inBlock.nonse + '',
        start: parseInt(inBlock.start),
        testCount: parseInt(inBlock.testCount),
        end: parseInt(inBlock.end),
        time: currentBlock.time,
        lastBlockSignature: currentBlock.lastBlockSignature,
        lastBlockHash: currentBlock.lastBlockHash,
        lastBlockNonse: currentBlock.lastBlockNonse,
        data: currentBlock.data,
    }
    console.log(block)
    if (tchain.testBlock(block) && block.hash === task.dataHash) {
        require('fs').appendFile('./public/chain', JSON.stringify(block) + '\n', function(err) { if (err) console.log(err) })
        console.log('block', block);
        ctx.body = block;
        lastBlock = block;
        setTask();
        nextTaskRequests.forEach(function(future) {
            future.resolve(block);
        });
        nextTaskRequests = [];
    } else {
        ctx.body = false;
    }
});


var nextTaskRequests = [];
router.get('/nextTask', function(ctx, next) {
    var request = getFuture();
    nextTaskRequests.push(request);
    return request.promise.then(function(newTask) {
        ctx.body = newTask;
    });
})

app.use(router.routes());

app.listen(3000);


var task;
var currentBlock;
var lastBlock;
var messages = [];

function setTask() {
    var data = { messages };
    messages = [];
    const algorithm = 'sha256';
    const difficulty = 8;
    currentBlock = {
        data,
        time: Date.now(),
        difficulty,
        algorithm,
        lastBlockSignature: lastBlock ? lastBlock.signature : '',
        lastBlockHash: lastBlock ? lastBlock.hash : '',
        lastBlockNonse: lastBlock ? lastBlock.nonse : ''
    }
    currentBlock.hash = tchain.hashObjectData(currentBlock, algorithm)
    task = {
        dataHash: currentBlock.hash,
        difficulty,
        algorithm,
    }
    return task;
}
setTask();

/**
 * @typedef Future
 * @prop {function} resolve
 * @prop {function} reject
 * @prop {Promise} promise
 */

/**
 * @return {Future}
 */
function getFuture() {
    var def = {};
    def.promise = new Promise(function(resolve, reject) {
        def.resolve = resolve;
        def.reject = reject;
    });
    return def;
}

/**
 * messageStore
 */
var lastOpenMessages;

function storeOpenMessages() {
    var openMessages = JSON.stringify(messages)
    if (lastOpenMessages === openMessages) return;
    lastOpenMessages = openMessages;
    require('fs').writeFile('./public/openMessages', openMessages, function(err) { if (err) console.log(err) })
}
setInterval(storeOpenMessages, 10000);

function loadOpenMessages() {
    require('fs').readFile('./public/openMessages', function(err, buffer) {

        var lastOpenMessages = buffer ? (buffer + '') : '[]';
        messages = JSON.parse(lastOpenMessages);
        setTask()
    });
}
loadOpenMessages();

function loadLastBlock() {
    try {
        var chain = (require('fs').readFileSync('./public/chain') + '').split('\n');
        lastBlock = JSON.parse(chain[chain.length - 2]);
        setTask();
        console.log(lastBlock)
    } catch (err) {
        console.log(err)
    }
}
loadLastBlock();