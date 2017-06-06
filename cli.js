const readline = require('readline');
const cluster = require('cluster');
const tmitter = require('tmitter');
const request = require('request');

var employer;
var count = 0;


if (cluster.isMaster) {
    employer = createEmployer();
    employer.on('foundblock', function(message) {
        console.log('won', count++);
        console.log(message.block)
        var url = 'http://localhost:3000/solution';
        request.post({ url, form: message.block }, function(err, res, data) {
            console.log('foundSolution:', data)
        })
    })

    function processNextTask(data) {
        request('http://localhost:3000/currentTask', function(err, res, body) {
            employer.setTask(JSON.parse(body));
        });
    }
    processNextTask();

    setInterval(processNextTask, 3000);
    loop();
} else {
    require('./cliMinerManager.js')
}

function loop() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    rl.question(':', (answer) => {
        if (answer === 'hire') {
            employer.hire();
        } else if (answer === 'fire') {
            employer.fire();
        } else if (answer === 'status' || answer === 's') {
            console.log('number of workers:', employer.workers.length)
            console.log('speed            :', employer.getSpeed())
            console.log('win count        :', count)
            console.log('miningAmount     :', employer.miningAmount)

        } else if (answer === 'quit') {
            process.exit();
        }
        //console.log(answer);
        stop();
        loop();
    });
    var timeout = setTimeout(function() {
        stop();
        loop();
    }, 60000);

    function stop() {
        clearTimeout(timeout);
        rl.close();
    }
}

/**
 * employer for webworker
 */

function createEmployer() {

    const employer = {
        miningAmount: 0,
        workers: [],
        task: undefined,
        setTask(task) {
            employer.task = task;
            employer.workers.forEach(worker => worker.send(JSON.stringify({ type: 'message', task })));
        },
        getSpeed() {
            return employer.workers.reduce((sum, worker) => sum + worker.getSpeed(), 0)
        },
        hire() {
            var miningWorker = cluster.fork();
            miningWorker.getSpeed = function() {
                if (!miningWorker.lastWork) return 0;
                return Math.round(miningWorker.lastWork.amount / (miningWorker.lastWork.time / 1000));
            }
            miningWorker.on('message', function(message) {
                message = JSON.parse(message);
                //console.log(message)
                if (message.type == 'solution') {
                    console.log('found solution')
                    employer.task = undefined;
                    employer.emit('foundblock', message)
                } else if (message.type === 'worked') {
                    //console.log('worked')
                    employer.miningAmount += message.amount;
                    miningWorker.lastWork = message;
                } else {
                    console.log('unknown message,', message)
                }
            });
            if (employer.task) {
                miningWorker.send(JSON.stringify({ type: 'message', task: employer.task }));
            }
            employer.workers.push(miningWorker);
        },
        /**
         * 
         * @param {WebWorker | number} [worker] 
         */
        fire(worker) {
            if (!worker) worker = 0;
            if (typeof worker === 'number') {
                worker = employer.workers[worker];
            }
            return employer.fireWorker(worker);
        },
        /**
         * @param {WebWorker} worker 
         */
        fireWorker(worker) {
            worker.kill();
            employer.workers.splice(employer.workers.indexOf(worker), 1);
        }
    };
    tMitter(employer);
    return employer;
}