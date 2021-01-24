<template>
    <div id="app">
        <router-view/>
    </div>
</template>

<script>
const {ipcRenderer} = window.require('electron');
export default {
    methods: {
        ipc_config_listener(e, a) {
            if(a.config) {
                this.$router.push({path:`/${a.config}_config`});
            }
        }
    },
    destroyed() {
        ipcRenderer.removeListener('config', this.ipc_config_listener);
    },
    mounted() {
        this.$api.menu.update().then();
        ipcRenderer.on('config', this.ipc_config_listener);
    }
}
</script>


<style>

</style>
