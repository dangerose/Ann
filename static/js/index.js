(function () {
    var hash = window.location.hash.replace('#', '');
    var isEdit = hash === 'edit'; // 查看 还是 修改页面

    var Storage = {
        get: function (name) {
            var data = sessionStorage.getItem(name);
            var curTime = new Date().getTime();
            if (!data) {
                return data;
            }
            data = JSON.parse(data);
            if (data.expries < curTime) {
                // 过期
                this.delete(name);
                return null;
            }
            else {
                // 未过期
                return data.value;
            }
        },
        // expries 过期时间 单位s
        set: function (name, val, expries) {
            var curTime = new Date().getTime();
            var expriesTime = curTime + expries * 1000;
            sessionStorage.setItem(name, JSON.stringify({ value: val, expries: expriesTime }));
        },
        delete: function (name) {
            sessionStorage.removeItem(name);
        }
    };

    // 绑定事件
    function bindEvents() {
        // 图片点击事件
        var $contentImgs = $('#contentImgs');
        $contentImgs.delegate('img', 'click', function () {
            var $img = $(this);
            $picZoom.show($img.attr('src'));
        });

        // hash 事件
        $(window).bind('hashchange', function () {
            var hash = window.location.hash.replace('#', '');
            console.log(hash);
        });

        // 打开登录窗口 事件
        var dlgtrigger = document.querySelector('[data-dialog]'),
            somedialog = document.getElementById(dlgtrigger.getAttribute('data-dialog')),
            dlg = new DialogFx(somedialog);
        dlgtrigger.addEventListener('click', dlg.toggle.bind(dlg));

        // login 登录事件
        var $btnLogin = $('#btnLogin');
        $btnLogin.on('click', function () {
            var $username = $('[name=username]');
            var $password = $('[name=password]');
            if ($username.val() === 'admin' && $password.val() === '123456') {
                // 登录成功
                Storage.set('hasLogin', true, 24 * 60 * 60);
                view.changeBtnLogin('success');
                view.changeBtnShow();
                setTimeout(function() {
                    $('#btnClose').trigger('click');
                }, 1000);
            }
            else {
                // 登录失败
                view.changeBtnLogin('fail');
            }
        });

        // login 注销事件
        var $btnLogOut = $('#btnLogOut');
        $btnLogOut.on('click', function () {
            Storage.delete('hasLogin');
            window.location.reload();
        });
    }

    // 改变视图
    var view = {
        changeBtnShow: function () {
            var $btnShow = $('#btnShow');
            var $btnShow_logined = $('#btnShow_logined');
            if (Storage.get('hasLogin')) {
                $btnShow.css('display', 'none');
                $btnShow_logined.css('display', 'inline-block');
            }
        },
        changeBtnLogin: function (type) {
            var $btnLogin = $('#btnLogin');
            if (type === 'success') {
                $btnLogin.text('登录成功');
                $btnLogin.css('pointer-events', 'none').addClass('green').removeClass('black');
                setTimeout(function () {
                    $btnLogin.text('登录');
                    $btnLogin.css('pointer-events', 'auto').addClass('black').removeClass('green');
                }, 1000);
            }
            else {
                $btnLogin.text('用户名或密码错误');
                $btnLogin.css('pointer-events', 'none').addClass('red').removeClass('black');
                setTimeout(function () {
                    $btnLogin.text('登录');
                    $btnLogin.css('pointer-events', 'auto').addClass('black').removeClass('red');
                }, 1000);
            }
        }
    }

    /* // 图片懒加载
    window.$picLazyLoad.set('contentImgs');
    // 图片onload事件
    $contentImgs.find('img').attr('onload', function() {
        var $img = $(this);
        if ($img.attr('src')) {
            $img.removeAttr('width');
        }
    }) */

    // 改变视图
    function changeView(type) {

    }

    function init() {
        bindEvents();
        view.changeBtnShow();
    }

    init();
})()