const store = require('electron-store');


let obj = {
    configs: {}
};


function get_config_obj(config_name) {
    if(!obj.configs[config_name]) {
        obj.configs[config_name] = new store({name:config_name});
    }
    return obj.configs[config_name];
}


function get(config_name) {
    return get_config_obj(config_name).store;
}


function set(config_name, config_object) {
    get_config_obj(config_name).store = config_object;
}


module.exports = {
    get,
    set,
};

