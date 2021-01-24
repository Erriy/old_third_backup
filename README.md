# third

> third 没有任何意义，仅仅是因为喜欢这个名字罢了。本意最初的想法叫memories，后来想叫link&share，但是由于功能的逐步添加，感觉哪个名字都不够贴切。third没有意义，希望有一天third有其自身的含义。

## 软件简介

> 略，稍后进行补充

## 软件逻辑简介

### seed 格式

``` json
{
    "meta": {
        "id": "", # 初始作者指纹.uuid
        "time": {
            "update": {
                "timestamp": 111111 # 更新时间戳
            }
        }
    },
    "data": "" # 字符串数据，如果是对象，需要序列化为字符串
}
```

### 服务器选择

包括本机服务器、本地服务器和手动添加的服务器
选中服务器后修改配置则是修改服务器的配置
每个应用窗口可指定不同服务器

## 代码使用方法

### 安装环境

``` shell
npm install
```

### 调试启动

> 涉及到electron的api调用，不能使用浏览器调试
>
> 修改electron的窗口加载url在`app/moudles/window.js@create`中，
>
> - win.loadURL(`http://localhost:8080/#${path}`);

``` shell
# 启动vue调试服务
npm run vue:serve
# 调试启动electron，自动加载本地8080端口
npm run electron:serve
```

### 构建应用


``` shell
# 生成位置在dist目录下
npm run build
```


## todo

- [ ] git-hooks
  - [ ] eslint 语法检查
  - [x] 提交时修改版本则自动发布
  - [ ] commit message 规范
  - [ ] pre-commit 进行测试
- [ ] 使用jest做测试模块，编写单元测试代码

### 2020.01.20

- [x] 自动更新
- [x] 本地服务

### 2020.01.21

- [x] seed 接口
- [x] tray设置

### 2020.01.22

- [ ] 本地编辑器逻辑
- [x] 使用githooks


### 2020.01.23

- [ ] 添加标签以及与标签的关系
- [ ] 根据标签搜索
- [x] 修改本地服务配置
- [x] 重启本地服务
- [ ] 使用monaco-editor保存代码
- [ ] 剪贴板管理
- [ ] 使用neo4j-embedded（有必要么？）

### 2020.01.24

- [ ] 服务器间同步
- [ ] 本地配置加密存储(https://github.com/atom/node-keytar)

### 2020.01.25

- [ ] 侧边栏，编辑器可全屏，可隐藏侧边栏
  - [ ] 侧边栏管理上下有关联数据



## 版本计划

| 版本 | 功能                                                         |
| ---- | ------------------------------------------------------------ |
| v0.1 | 本地自带服务文本编辑器，任意节点关系建立，带关系索引         |
| v0.2 | 个人设备/服务器间同步，gpg加密身份体系                       |
| v0.3 | 剪贴板管理                                                   |
| v0.4 | 支持文件系统（本地文件指向、网络文件指向、图片/视频预览，使用webdav实现），通过文件系统兼容第三方应用编辑内容 |
| v0.5 | 自动采集（关注与自动追踪）                                   |
| v0.6 | 公开数据发布到github（或其他服务接口）                       |