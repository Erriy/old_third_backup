const Vue = require('vue').default;
const App = require('./App.vue').default;
const router = require('./router');
const api = require('./api');
const Antd = require('ant-design-vue').default;
require('ant-design-vue/dist/antd.css');
const ScrollLoader = require('vue-scroll-loader').default;


Vue.config.productionTip = false;
Vue.use(api);
Vue.use(Antd);
Vue.use(ScrollLoader);


Vue.prototype.$common = {
    service: 'http://localhost:6952',
    title: {
        __tmp: {
            change: false,
            filename: null,
            pagename: ''
        },
        update({
            change=undefined,
            filename=undefined,
            pagename=undefined,
        }={}) {
            undefined !== change && (this.__tmp.change = change);
            undefined !== filename && (this.__tmp.filename = filename);
            undefined !== pagename && (this.__tmp.pagename = pagename);
            document.title = `${this.__tmp.change?'*':''}${this.__tmp.filename.length>0?this.__tmp.filename + ' - ': ''}${this.__tmp.pagename} - third`;
        }
    }
};


new Vue({
    router,
    render: function (h) { return h(App); }
}).$mount('#app');

