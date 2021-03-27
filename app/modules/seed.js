const axios = require('axios').default;
const open = require('open');
const sys_path = require('path');

async function _request({
    method='',
    service='http://127.0.0.1:6952',
    path='',
    data=null,
}={}) {
    let headers = {'Content-Type': 'application/json'};
    method = method.toUpperCase();
    let url = `${service}/api` + path;
    return new Promise((resolve, reject)=>{
        axios({
            method: method,
            url: url,
            headers: headers,
            data: data
        }).then(r=>resolve(r.data))
            .catch(e=>reject(e.response?e.response.data.message:e.message));
    });
}

async function search({
    key='',
    page=1,
    page_size=20,
    type='',
    tag='',
}={}) {
    return _request({
        method: 'GET',
        path: `/seed?page=${page}&page_size=${page_size}&key=${encodeURIComponent(key)}&type=${type}&tag=${encodeURIComponent(tag)}`
    });
}

async function add_tag({
    seedid='',
    tag='',
}={}) {
    return _request({
        method: 'PUT',
        path: `/seed/${seedid}/tag/${encodeURIComponent(tag)}`,
    });
}

async function del_tag({
    seedid='',
    tag='',
}={}) {
    return _request({
        method: 'DELETE',
        path: `/seed/${seedid}/tag/${encodeURIComponent(tag)}`,
    });
}

async function get_path({
    seedid='',
}={}) {
    return _request({
        method: 'GET',
        path: `/seed/${seedid}/path`
    });
}

async function _open({
    type='',
    path=''
}={}) {
    // todo 路径的跨平台支持
    // fixme 路径中的变量动态修改
    if('webdav'===type) {
        let file = sys_path.join(`/var/run/user/${process.getuid()}/gvfs/dav:host=localhost,port=63389,ssl=false,user=erriy/`, path);
        await open(file);
    }
}

module.exports = {
    search,
    add_tag,
    del_tag,
    get_path,
    open: _open,
};
