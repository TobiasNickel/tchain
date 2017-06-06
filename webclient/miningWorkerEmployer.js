var tmitter = require('tmitter');
/**
 * employer for webworker
 */

module.exports.createEmployer = function() {

    const employer = {
        workers: [],
        task: undefined,
        setTask(task) {
            employer.task = task;
            employer.workers.forEach(worker => worker.postMessage(JSON.stringify({ type: 'message', task })));
        },
        getSpeed() {
            return employer.workers.reduce((sum, worker) => sum + worker.getSpeed(), 0)
        },
        hire() {
            var miningWorker = new Worker('miningWorkerBuild.js');
            miningWorker.getSpeed = function() {
                if (!miningWorker.lastWork) return 0;
                return Math.round(miningWorker.lastWork.amount / (miningWorker.lastWork.time / 1000));
            }
            miningWorker.onmessage = function(e) {
                var message = JSON.parse(e.data);
                if (message.type == 'solution') {
                    employer.task = undefined;
                    employer.emit('foundblock', message)
                } else if (message.type === 'worked') {
                    miningWorker.lastWork = message;
                }
            };
            if (employer.task) {
                miningWorker.postMessage(JSON.stringify({ type: 'message', task: employer.task }));
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
            worker.terminate();
            employer.workers.splice(employer.workers.indexOf(worker), 1);
        }
    };
    tMitter(employer);
    return employer;
}