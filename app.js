var express = require('express');
var fs = require("fs");
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var ejs = require('ejs');


var port = 4000; // 端口
var app = express();
var proxy = require('http-proxy-middleware');
var isProxy = true; // 是否连接代理服务器
var mockPath = path.join(__dirname, 'mock');
var proxyUrl = 'http://134.175.55.52:8080'; // 代理服务器地址(测试环境)
// var proxyUrl = 'http://172.20.60.30:8080'; // 代理服务器地址（小明本地环境）
// var proxyUrl = 'http://172.26.113.86:8088'; // 代理服务器地址（洋洋本地环境）
// var proxyUrl = 'http://172.20.61.20:8080'; // 代理服务器地址（吴剑锋本地环境）
var stPath = '';
var isDev = true; // true 开发环境   false 生产环境 用以调试dist目录

var filter = function (pathname, req) {
    var res = !/\.(jpg|png|gif|html|js|json|css|woff2|woff|ttf|svg|eot)$|login$|index$/.test(pathname);
    return res;
};

// 将服务器代理到localhost:8080端口上[本地服务器为localhost:3000]
if (isProxy) {
    var apiProxy = proxy(filter, { target: proxyUrl, changeOrigin: true });
    isProxy && app.use('/*', apiProxy);
}

// view engine setup
app.set('views', path.join(__dirname, isDev ? 'views/' : 'dist/view/html'));
app.engine('html', ejs.__express);
app.set('view engine', 'html');


app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(stPath + '/static', express.static(path.join(__dirname, isDev ? 'static' : 'dist/static')));
app.use(stPath + '/views', express.static(path.join(__dirname, isDev ? 'views' : 'dist/view')));
// app.use(stPath, express.static(path.join(__dirname, 'mock')));
app.use(stPath + '/index', function (req, res, next) {
    res.render('index');
});
app.use(stPath + '/', function (req, res, next) {
    res.render('login');
});

// 处理http请求，如果mock文件夹下存在相应文件则访问文件，如果不存在则自动响应数据
if (!isProxy) {
    var dirPath = path.join(__dirname, 'static/js');
    main(dirPath);

    function main(dirPath) {
        fs.readdir(dirPath, function (err, fileNames) {
            fileNames.forEach(function (fileName) {
                var filePath = path.join(dirPath, fileName);
                // 判断文件/文件夹
                fs.stat(filePath, function (error, stat) {
                    var isFile = stat.isFile();
                    if (isFile) {
                        router(filePath);
                    }
                    else {
                        main(filePath);
                    }
                });
            });
        });
    }

    // 找出url 并设置路由
    function router(filePath) {
        // 文件
        var fileContent = fs.readFileSync(filePath, 'utf-8').replace(/\s+/g, '');
        // 查找 request(url) request({...url:...}) ld_common.upload({...url:...})  datagrid({..url:...})
        var result = true;
        while (result) {
            result = fileContent.match(/(['"]\.\.\/\.\.\/)|(\$\.ajax\({((?!url).)*url:['"](?!\.\.\/\.\.\/))|(request\(['"](?!\.\.\/\.\.\/))|(request\({((?!url).)*url:['"](?!\.\.\/\.\.\/))|(ld_common.upload\({((?!url).)*url:['"](?!\.\.\/\.\.\/))|(\.datagrid\({((?!url).)*url:['"](?!\.\.\/\.\.\/))/);
            if (result) {
                var frontPart = fileContent.substr(0, result.index + result[0].length); // 前半部分
                var latterPart = fileContent.substr(result.index + result[0].length); // 后半部分
                // 获取url
                var urlLastIndex = latterPart.match(/['"?]/).index;
                var newUrl = latterPart.substr(0, urlLastIndex); // 形式为 'xxx/xxx'
                // 设置路由
                var isFileExist = fs.existsSync(mockPath + '/' + newUrl.replace(/\//g, '_') + '.js');
                if (isFileExist) {
                    // 已存在mock文件
                    app.all(stPath + `/${newUrl}`, require(mockPath + '/' + newUrl.replace(/\//g, '_') + '.js'));
                }
                else {
                    // 不存在mock文件
                    if (frontPart.lastIndexOf('\.datagrid(') !== -1) {
                        // datagrid 发起的请求
                        app.all(stPath + `/${newUrl}`, (function () {
                            var copy = latterPart; // 如果直接引用latterPart，那latterPart会互相覆盖
                            return function (req, res) {
                                var fields = getGridFields(copy);
                                var data = {};
                                fields.forEach(function (item) {
                                    data[item] = item;
                                });
                                res.send({
                                    "pageNum": 1,
                                    "pageSize": 15,
                                    "size": 1,
                                    "orderBy": null,
                                    "startRow": 1,
                                    "endRow": 1,
                                    "total": 1,
                                    "pages": 1,
                                    "list": [data],
                                    "firstPage": 1,
                                    "prePage": 0,
                                    "nextPage": 0,
                                    "lastPage": 1,
                                    "isFirstPage": true,
                                    "isLastPage": true,
                                    "hasPreviousPage": false,
                                    "hasNextPage": false,
                                    "navigatePages": 8,
                                    "navigatepageNums": [1]
                                });
                            };
                        })());
                    }
                    else {
                        // 其它 发起的请求
                        app.all(stPath + `/${newUrl}`, function (req, res) {
                            res.send({
                                msg: '操作成功',
                                data: null,
                                state: 'success'
                            });
                        });
                    }
                }
                fileContent = latterPart;
            }
        }
    }

    // 获取 grid 的field
    function getGridFields(str) {
        var fields = [];
        var result = true;
        var latterPart = '特殊标识' + str; // 特殊标识 配合 ?! 使用
        while (result) {
            result = latterPart.match(/特殊标识((?!\.datagrid\()(?!field:['"]).)*field:['"]/);
            if (result) {
                latterPart = latterPart.substr(result.index + result[0].length);
                var lastIndex = latterPart.match(/['"]/).index;
                var newField = latterPart.substr(0, lastIndex);
                fields.push(newField);
                latterPart = '特殊标识' + latterPart;
            }
        }
        return fields;
    }

    function uniq(arr) {
        var temp = [];
        arr.forEach(function (item) {
            if (temp.indexOf(item) === -1) {
                temp.push(item);
            }
        });
        return temp;
    }
}

app.port = port || 3000;
module.exports = app;