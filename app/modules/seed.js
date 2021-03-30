const axios = require('axios').default;
const open = require('open');
const sys_path = require('path');
const urljoin = require('url-join');
const gpg = require('./gpg');
const runtime = require('./runtime');

let obj = {
    token: null
};

async function _request({
    method='',
    path='',
    data=null,
}={}) {
    if (!obj.token) {
        obj.token = await gpg.token();
    }
    let headers = {'Content-Type': 'application/json'};
    method = method.toUpperCase();
    let url = urljoin(await runtime.service(), 'api', path);
    let username = await runtime.fingerprint();
    return new Promise((resolve, reject)=>{
        axios({
            method: method,
            url: url,
            headers: headers,
            data: data,
            auth: {
                username,
                password: obj.token
            }
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
        // let file = sys_path.join(`/var/run/user/${process.getuid()}/gvfs/dav:host=localhost,port=63389,ssl=false,user=${username}/`, path);
        // await open(file);
    }
}

module.exports = {
    search,
    add_tag,
    del_tag,
    get_path,
    open: _open,
};
