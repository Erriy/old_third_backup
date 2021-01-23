# third

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
- [ ] 修改本地服务配置
- [ ] 重启本地服务
- [ ] 使用monaco-editor保存代码
- [ ] 剪贴板管理
- [ ] 使用neo4j-embedded

### 2020.01.24

- [ ] 服务器间同步