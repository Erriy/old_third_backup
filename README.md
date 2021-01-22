# third

## 软件简介

> 略，稍后进行补充

## 软件逻辑简介

### seed 格式

``` json
{
    "meta": {
        "id": "", # uuid
        "time": {
            "update": {
                "timestamp": 111111 # 更新时间戳
            }
        }
    },
    "data": "" # 字符串数据，如果是对象，需要序列化为字符串
}
```

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

### 2020.01.20

- [x] 自动更新
- [x] 本地服务

### 2020.01.21

- [x] seed 接口
- [x] tray设置

### 2020.01.22

- [ ] 本地编辑器逻辑
