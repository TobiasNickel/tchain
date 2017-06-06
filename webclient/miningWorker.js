//@ts-check
var tchain = require('../tchain');

var task;
onmessage = function(event) {
    task = JSON.parse(event.data).task;
    //console.log(task)
    setTimeout(work, 1);
}


function work() {
    if (!task) return;
    var workAmount = 50000;
    var start = Date.now();
    var block = tchain.tryMine(task.dataHash, task.algorithm, task.difficulty, workAmount);
    // @ts-ignore
    postMessage(JSON.stringify({ type: 'worked', amount: workAmount, time: Date.now() - start }))
    if (block) {
        // @ts-ignore
        postMessage(JSON.stringify({ type: 'solution', block: block }))

        task = undefined;
    } else { setTimeout(work, 1); }
}