
<template>
    <div ref="container" class='editor-fullscreen'></div>
</template>

<script>
import * as monaco from "monaco-editor";
const {ipcRenderer} = window.require('electron');

export default{
    data() {
        return {
            editor: null,
            need_save: false,
        }
    },
    methods: {
        save_config() {
            try{
                let config_data = JSON.parse(this.editor.getValue());
                this.$api.service.set_config(config_data).then(()=>{
                    this.need_save = false;
                    this.$common.title.update({change:false});
                });
            }catch(err) {
                this.$message.error('配置格式错误');
            }
        },
        ipc_file_listener(e, a) {
            if(a.save) {
                this.save_config();
            }
            else if(a.close) {
                let that = this;
                if(this.need_save) {
                    this.$message.error('配置未保存');
                }
                else {
                    this.$router.go(-1);
                }
            }
        }
    },
    destroyed() {
        ipcRenderer.removeListener('file', this.ipc_file_listener);
    },
    async mounted() {
        this.$common.title.update({filename: 'service.json', pagename: 'config'});
        this.$api.menu.update({file:true, seed: false}).then();
        ipcRenderer.on('file', this.ipc_file_listener);
        window.onresize = ()=>{
            if(this.editor) {
                this.editor.layout();
            }
        };
        this.$api.service.config().then((config_data)=>{
            this.editor = monaco.editor.create(this.$refs.container, {
                value: JSON.stringify(config_data, null, 4),
                language: 'json',
                minimap:{
                    enabled:false
                },
                theme: 'vs-dark',
                selectOnLineNumbers: true,
                roundedSelection: false,
                cursorStyle: 'line', // 光标样式
                glyphMargin: true, // 字形边缘
                useTabStops: false,
                fontSize: 12, // 字体大小
            });
            this.editor.getModel().onDidChangeContent(e=>{
                this.need_save = true;
                this.$common.title.update({change: true});
            });
        });

    }
}
</script>

<style>
.editor-fullscreen {
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