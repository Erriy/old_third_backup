const Vue = require('vue').default;
const VueRouter = require('vue-router').default;
const fm = require('../views/fm.vue').default;

Vue.use(VueRouter);

const routes = [
    {
        path: '/',
        component: fm
    },
];

const router = new VueRouter({
    routes
});

module.exports = router;
