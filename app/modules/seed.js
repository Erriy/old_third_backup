const axios = require('axios').default;
const open = require('open');
const sys_path = require('path');
const urljoin = require('url-join');
const gpg = require('./gpg');
const runtime = require('./runtime');

async function _request({
    method='',
    path='',
    data=null,
}={}) {
    let headers = {'Content-Type': 'application/json'};
    method = method.toUpperCase();
    let url = urljoin(await runtime.service(), 'api', path);
    let username = await runtime.fingerprint();
    let password = await gpg.token();
    return new Promise((resolve, reject)=>{
        axios({
            method: method,
            url: url,
            headers: headers,
            data: data,
            auth: {
                username,
                password
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

module.exports = {
    search,
    add_tag,
    del_tag,
    get_path,
};
