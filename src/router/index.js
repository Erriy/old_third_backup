const Vue = require('vue').default;
const VueRouter = require('vue-router').default;
const list = require('../views/list.vue').default;
const test = require('@/views/test.vue').default;

Vue.use(VueRouter);

const routes = [
    {
        path: '/',
        component: test
    },
    {
        path: '/list',
        component: list
    },
    {
        path: '/seed',
        component() {
            return require('../views/seed.vue').default;
        }
    },
    {
        path: '/service_config',
        component(){
            return require('../views/service_config.vue').default;
        }
    }
];

const router = new VueRouter({
    routes
});

module.exports = router;
