<template>
    <div>
        <a-table
            :columns="table.columns"
            :data-source="table.list"
            @change="table_change"
        ></a-table>
    </div>
</template>

<script>
export default {
    data() {
        return {
            table: {
                columns: [
                    {
                        title: '标题',
                        dataIndex: 'name',
                    },
                    {
                        title: '内容',
                        dataIndex: 'data'
                    },
                    {
                        title: '类型',
                        dataIndex: 'type',
                        filters: [
                            {
                                text: '文本',
                                value: 'text',
                            },
                            {
                                text: '音频',
                                value: 'audio'
                            },
                            {
                                text: '图像',
                                value: 'image'
                            },
                            {
                                text: '视频',
                                value: 'video'
                            },
                            {
                                text: '链接',
                                value: 'link'
                            }
                        ]
                    },
                    {
                        title: '更新时间',
                        dataIndex: 'update_ts',
                    }
                ],
                list: []
            }
        }
    },
    methods: {
        table_change(pagination, filters, sorter) {

        }
    }
}
</script>

<style>

</style>