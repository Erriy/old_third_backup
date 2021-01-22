<template>
    <div>
        <div id="vditor" class="vditor-toolbar--hide"></div>
    </div>
</template>

<script>
const { v1: uuidv1 } = require('uuid');
import Vditor from 'vditor';
const {ipcRenderer} = window.require('electron');
export default {
    data() {
        return {
            seed: {
                id: '',
            }
        }
    },
    methods: {
        new_seed() {
            let random_data = [];
            for(let i=0; i<6; i++) {
                random_data[i] = Math.floor(Math.random()*0xFF);
            }
            this.seed.id = uuidv1({node:random_data});
            try {
                this.vditor.setValue('');
                this.vditor.focus();
            }catch(err){}
        },
        save() {
            this.$api.seed.save({
                id: this.seed.id,
                service: this.$common.service,
                data: this.vditor.getValue(),
            })
            .then((r)=>{
                console.log(r);
                this.$message.success("已保存");
            })
            .catch((r)=>{
                this.$message.error(i.message);
            });
        },
        delete() {
            this.$api.seed.delete({
                id: this.seed.id,
                service:this.$common.service,
            })
            .then((r)=>{
                console.log(r);
                this.$message.success('已删除');
            })
            .catch((r)=>{
                this.$message.error(i.message);
            });
        },
        ipc_seed_listener(e, a) {
            // todo 创建、删除节点和返回列表前提醒是否保存或是否删除
            if(a.new) {
                this.new_seed();
            }
            else if(a.list) {
                this.$router.replace('/list');
            }
            else if(a.save) {
                this.save();
            }
            else if(a.delete) {
                this.delete();
                this.$router.go(-1);
            }
        }
    },
    destroyed() {
        ipcRenderer.removeListener('seed', this.ipc_seed_listener);
    },
    mounted() {
        ipcRenderer.on('seed', this.ipc_seed_listener);
        this.$api.menu.update({seed: {delete: 'show'}});

        let content = '';
        if(this.$route.query.id) {
            let seed = sessionStorage[this.$route.query.id];
            if(typeof(seed) == 'string' && seed.length > 0) {
                seed = JSON.parse(seed);
                this.seed.id = seed.meta.id;
                content = seed.data;
            }
        }
        else {
            this.new_seed();
        }
        this.vditor = new Vditor('vditor', {
            mode: 'ir',
            toolbar: [],
            cache: {
                enable: false,
            },
            after: () => {
                this.vditor.setValue(content);
                this.vditor.focus();
            },
        });
    }
}
</script>

<style>
@import "~vditor/dist/index.css";
#vditor {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1000;
}
</style>