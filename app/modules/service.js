const service = require('../service');
const store = require('electron-store');


let obj = {
    config: new store({name: 'service'}),
    default_config: {
        neo4j: {
            uri: 'neo4j://localhost:7687',
            auth: {
                user: 'neo4j',
                password: 'neo4j',
            }
        },
        service: {
            autostart: false,
        }
    }
};


function config() {
    return obj.config.store;
}


function set_config(config_object) {
    obj.config.store = config_object;
}


function reset_config() {
    obj.config.store = obj.default_config;
}


async function start() {
    await service.start({
        neo4j: {
            uri: obj.config.get('neo4j.uri') || obj.default_config.neo4j.uri,
            user: obj.config.get('neo4j.auth.user') || obj.default_config.neo4j.auth.user,
            password: obj.config.get('neo4j.auth.password') || obj.default_config.neo4j.auth.password
        }
    });
}


function _initialize() {
    if (0 === obj.config.sizez) {
        reset_config();
    }
    if (obj.config.get('service.autostart')) {
        start();
    }
}


module.exports = {
    start,
    stop: service.stop,
    running: service.running,
    config,
    set_config,
    reset_config,
    _initialize,
};

