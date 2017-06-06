//@ts-check
var tchain = require('./tchain');
var cluster = require('cluster');
var task;

process.on('message', (message, data) => {
    //console.log('message in worker:', message)
    task = JSON.parse(message).task;
    //console.log('worker has a task', task)
    setTimeout(work, 1);
})


function work() {
    if (!task) return;
    var workAmount = 50000;
    var start = Date.now();
    var block = tchain.tryMine(task.dataHash, task.algorithm, task.difficulty, workAmount);
    // @ts-ignore
    process.send(JSON.stringify({ type: 'worked', amount: workAmount, time: Date.now() - start }))
    if (block) {
        // @ts-ignore
        process.send(JSON.stringify({ type: 'solution', block: block }))

        task = undefined;
    } else { setTimeout(work, 10); }
}