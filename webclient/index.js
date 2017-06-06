//@ts-check
// .\node_modules\.bin\webpack webclient\index.js --output-filename public\bundle.js
var $ = require('jquery');
var miningWorkerEmployer = require('./miningWorkerEmployer').createEmployer();
//var tchain = require('../tchain')

/**
 * @typedef Task
 * @prop {string} dataHash
 * @prop {string} algorithm
 * @prop {number} difficulty 
 */

miningWorkerEmployer.on('foundblock', function(message) {
    processNextTask();
    $.post('/solution', message.block, function(res) {
        if (res) {
            console.log('won', count++);
            document.body.appendChild($('<p>won ' + count + ', <\p>')[0])
        } else {
            document.body.appendChild($('<p>lost   </p >)')[0])
            console.log('not won');
        }
        updateCurrentBlock();
        updateOpenMessages();
        updateChain();
    });
})

setInterval(function() {
    $.get('/speed', function(globalSpeed) {

        speedDisplay.innerText = miningWorkerEmployer.getSpeed() + ' h/s, ' + miningWorkerEmployer.workers.length + 'workers, ' + globalSpeed + 'h/s global Speed';
    })
}, 1000);
setInterval(function() {
    var speed = miningWorkerEmployer.getSpeed();
    $.post('/speed', { speed })
}, 10000)

var count = 0;
/**
 * @param {Task} task
 */
function newTaskHandler(task) {
    miningWorkerEmployer.setTask(task);
}

function processNextTask(data) {
    $.get('/currentTask', newTaskHandler)
}
processNextTask();

setInterval(processNextTask, 3000);

var textarea = document.createElement('textarea');
document.body.appendChild(textarea);
var addButton = document.createElement('button');
addButton.innerText = 'add'
document.body.appendChild(addButton);
addButton.addEventListener('click', function() {
    var text = textarea.value;
    if (text) {
        $.post('add', { type: 'unstructuredText', text: text }, function() {
            updateOpenMessages()
            textarea.value = '';
        });
    }
})

var speedDisplay = document.createElement('div');
document.body.appendChild(speedDisplay);


var hireButton = document.createElement('button');
hireButton.innerText = "hire";
document.body.appendChild(hireButton);
var fireButton = document.createElement('button');
fireButton.innerText = "fire";
document.body.appendChild(fireButton);
hireButton.addEventListener('click', function() {
    miningWorkerEmployer.hire();
})
fireButton.addEventListener('click', function() {
    miningWorkerEmployer.fire();
})

var openMessagesDisplay = document.createElement('pre');
document.body.appendChild($('<h2>nextData</h2>')[0]);
document.body.appendChild(openMessagesDisplay);

function updateOpenMessages() {
    $.get('/openMessages', function(openMessages) {
        openMessagesDisplay.innerText = JSON.stringify(JSON.parse(openMessages + ''), null, '  ');
    });
}
updateOpenMessages();


var currentBlockDisplay = document.createElement('pre');
document.body.appendChild($('<h2>currentBlock</h2>')[0]);
document.body.appendChild(currentBlockDisplay);

function updateCurrentBlock() {
    $.get('/currentBlock', function(block) {
        currentBlockDisplay.innerText = JSON.stringify(block, null, '  ');
    });
}
updateCurrentBlock();

var chainDisplay = document.createElement('pre');
document.body.appendChild($('<h2>chain</h2>')[0]);
document.body.appendChild(chainDisplay);

function updateChain() {
    $.get('/chain', function(chain) {
        var blockChain = chain.split('\n').filter(b => !!b).map(JSON.parse).map(block => {
            return {
                algorithm: block.algorithm,
                difficulty: block.difficulty,
                hash: block.hash,
                signature: block.signature,
                nonse: block.nonse,
                time: block.start - block.time,
                data: block.data
            }
        });
        chainDisplay.innerText = JSON.stringify(blockChain, null, '  ');
    });
}
updateChain();