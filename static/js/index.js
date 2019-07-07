(function () {
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
        // 菜单点击事件
        var $menu = $('#menu');
        $menu.delegate('li.menu-cont_title', 'click', function () {
            var $li = $(this);
            var menuId = $li.attr('data-menuId');
            var $uploadBox = $('#uploadBox');
            var $contentImgs = $('#contentImgs');
            $menu.find('.li-selected').removeClass('li-selected');
            $li.addClass('li-selected');

            //清空
            $contentImgs.find('.content-img_box').remove();

            // 设置 upload
            initFileInput();

            // 获取资源
            $.get("/get_img_path?menuId=" + menuId, function (data) {
                console.log(data);
                if (data.status === 'ok') {
                    // 加载图片
                    data.data.forEach(function(ele) {
                        var html = '<div class="content-img_box">\
                                        <img data-picId="'+ ele.picId +'" class="content-img" src="../static/img/'+ menuId +'/'+ ele.picId +'" alt="" height="133">\
                                        <div class="content-img_layer"><span class="glyphicon glyphicon-remove content-img_remove"></span></div>\
                                    </div>';
                        $uploadBox.before(html);
                    });
                }
            });
        });

        // 图片点击事件
        var $contentImgs = $('#contentImgs');
        $contentImgs.delegate('img', 'click', function () {
            var $img = $(this);
            $picZoom.show($img.attr('src'));
        });

        // 图片删除事件
        $contentImgs.delegate('.content-img_remove', 'click', function () {
            var $iconRemove = $(this);
            var $img = $iconRemove.parent().siblings('img');
            var picId = $img.attr('data-picId');
            var $menu = $('#menu');
            var $curSel = $menu.find('.li-selected');
            console.log(picId);
            $.get("/delete_img?picId=" + picId + "&menuId=" + $curSel.attr('data-menuId'), function (data, status) {
                alert("Data: " + data + "\nStatus: " + status);
            });
        });

        // hash 事件
        $(window).bind('hashchange', function () {
            var hash = window.location.hash.replace('#', '');
            var isEdit = hash === 'edit';
            view.toViewOrEdit(isEdit);
        });

        // 打开登录窗口 事件
        var dlgtrigger = document.querySelector('[data-dialog]'),
            somedialog = document.getElementById(dlgtrigger.getAttribute('data-dialog')),
            dlg = new DialogFx(somedialog);
        dlgtrigger.addEventListener('click', dlg.toggle.bind(dlg));

        // 密码输入框 enter 事件
        var $inputPassword = $('[name=password]');
        $inputPassword.on('keydown', function (e) {
            if (e.keyCode == 13) {
                // enter
                $('#btnLogin').trigger('click');
            }
        });

        // login 登录事件
        var $btnLogin = $('#btnLogin');
        $btnLogin.on('click', function () {
            var $username = $('[name=username]');
            var $password = $('[name=password]');
            if ($username.val() === 'admin' && $password.val() === 'admin') {
                // 登录成功
                Storage.set('hasLogin', true, 24 * 60 * 60);
                view.toViewOrEdit('edit'); // 显示上传和删除模块
                view.changeBtnLogin('success');
                view.changeBtnShow();
                setTimeout(function () {
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
        // 查看视图 还是 修改视图
        toViewOrEdit: function (isEdit) {
            var $uploadBox = $('#uploadBox');
            var $contentTitle = $('#contentTitle');
            var $imgDelLayer = $('.content-img_layer');
            // 是否修改视图
            if (isEdit) {
                // 显示登录工具栏
                $contentTitle.removeClass('d-n');
                // 判断是否登录
                if (Storage.get('hasLogin')) {
                    // 显示上传按钮
                    $uploadBox.removeClass('d-n');
                    // 显示图片删除按钮
                    $imgDelLayer.removeClass('d-n');
                }
                else {
                    // 隐藏上传按钮
                    $uploadBox.addClass('d-n');
                    // 隐藏图片删除按钮
                    $imgDelLayer.addClass('d-n');
                }
            }
            else {
                // 隐藏登录工具栏
                $contentTitle.addClass('d-n');
                // 隐藏上传按钮
                $uploadBox.addClass('d-n');
                // 隐藏图片删除按钮
                $imgDelLayer.addClass('d-n');
            }
        },
        // 登录按钮
        changeBtnShow: function () {
            var hash = window.location.hash.replace('#', '');
            var isEdit = hash === 'edit'; // 查看 还是 修改页面
            if (!isEdit) {
                return;
            }
            var $btnShow = $('#btnShow');
            var $btnShow_logined = $('#btnShow_logined');
            if (Storage.get('hasLogin')) {
                $btnShow.css('display', 'none');
                $btnShow_logined.css('display', 'inline-block');
            }
        },
        changeBtnLogin: function (type) {
            var hash = window.location.hash.replace('#', '');
            var isEdit = hash === 'edit'; // 查看 还是 修改页面
            if (!isEdit) {
                return;
            }
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

    function initFileInput() {
        var $btnUpload = $('#btnUpload');
        var $fileupload = $('#fileupload');
        var $menu = $('#menu');
        var curMenuId = $menu.find('.li-selected').attr('data-menuId');
        $btnUpload.off('click').click(function () {
            $fileupload.trigger('click');
        });
        $fileupload.fileupload({
            url: '/upload_img?menuId='+ curMenuId +'&picId=xxx.jpg',
            dataType: 'json',
            done: function (e, data) {
                console.log('done');
                /* $.each(data.result.files, function (index, file) {
                    $('<p/>').text(file.name).appendTo('#files');
                }); */
            },
            progressall: function (e, data) {
                var progress = parseInt(data.loaded / data.total * 100, 10);
                $('#progress .progress-bar').css(
                    'width',
                    progress + '%'
                );
            }
        }).prop('disabled', !$.support.fileInput)
            .parent().addClass($.support.fileInput ? undefined : 'disabled');
    }

    function init() {
        var hash = window.location.hash.replace('#', '');
        var isEdit = hash === 'edit'; // 查看 还是 修改页面
        bindEvents();
        view.toViewOrEdit(isEdit);
        view.changeBtnShow();
        $('#menu').find('.menu-cont_title').first().trigger('click');
    }

    init();
})()