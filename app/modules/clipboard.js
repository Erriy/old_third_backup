const {clipboard} = require('electron');
const key_sender = require('node-key-sender');

function paste(data) {
    setTimeout(async ()=>{
        // todo 增加对mac系统的判断
        clipboard.writeText(data);
        await key_sender.sendCombination(['control', 'v']);
    }, 100);
}

module.exports = {
    paste,
};
