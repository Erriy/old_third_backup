# 页面设计


## 数据库存储内容

- seed
  // 通用杂项
  - fulltext: 全文搜索内容保存字段，可手动修改
  - delete_ts 删除时间，倒计时30天后再真正删除，可还原
  // fs_ 开头为webdav相关
  - fs_type: file/directory 文件或目录类型
  - fs_name: 显示名称
  - fs_uri: 资源定位标识符
  - fs_create_ts: 创建时间
  - fs_update_ts: 更新时间
