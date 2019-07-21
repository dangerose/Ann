(function () {
    var _isAdmin = window.location.href.substr(-5).toLowerCase() === 'admin';

    var Storage = {
        get: function (name) {
            var data = localStorage.getItem(name);
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
            localStorage.setItem(name, JSON.stringify({ value: val, expries: expriesTime }));
        },
        delete: function (name) {
            localStorage.removeItem(name);
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

            // 获取资源
            $.get("/get_img_path?menuId=" + menuId, function (data) {
                if (data.status === 'ok') {
                    // 加载图片
                    data.data.forEach(function (ele) {
                        if (ele.picId.substr(0, 4) === 'mini') {
                            var html = '<div class="content-img_box">\
                                            <img data-picId="'+ ele.picId + '" class="content-img" src="../static/img/' + menuId + '/' + ele.picId + '" alt="" height="133">\
                                            <div class="content-img_layer"><span class="glyphicon glyphicon-remove content-img_remove"></span></div>\
                                        </div>';
                            $uploadBox.before(html);
                        }
                    });
                    view.toViewOrEdit();
                }
            });
        });

        // 图片点击事件
        var $contentImgs = $('#contentImgs');
        $contentImgs.delegate('img', 'click', function () {
            var $img = $(this);
            $picZoom.show($img.attr('src').replace('mini_', ''));
        });

        // 图片删除事件
        $contentImgs.delegate('.content-img_remove', 'click', function () {
            var $iconRemove = $(this);
            var $img = $iconRemove.parent().siblings('img');
            var picId = $img.attr('data-picId');
            var $menu = $('#menu');
            var $curSel = $menu.find('.li-selected');
            var $contentBox = $iconRemove.parents('.content-img_box');
            
            $.get("/delete_img?picId=" + picId + "&menuId=" + $curSel.attr('data-menuId'), function (data, status) {
                $contentBox.remove();
            });
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
                view.toViewOrEdit(); // 显示上传和删除模块
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
        toViewOrEdit: function () {
            var $uploadBox = $('#uploadBox');
            var $contentTitle = $('#contentTitle');
            var $imgDelLayer = $('.content-img_layer');
            // 是否修改视图
            if (_isAdmin) {
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
            if (!_isAdmin) {
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
            if (!_isAdmin) {
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
        var $uploadBox = $('#uploadBox');
        var $fileupload = $('#fileupload');

        // 事件
        $uploadBox.off('click').click(function () {
            $fileupload.val("");
            $fileupload.parent().click(function(e) {
                e.stopPropagation();
            });
            
            $fileupload.trigger('click').fileupload({
                url: '/upload_img',
                dataType: 'json',
                /* sequentialUploads: true, // 是否按顺序一个个上传 */
                limitConcurrentUploads: 3, 
                add: function (e, data) {
                    var allowTypes = ['jpg'];
                    var _type = $(data.files[0].name.split('.')).last()[0].toLowerCase(); // 文件后缀
                    var $menu = $('#menu');
                    var $html, newPicId, curMenuId;
                    
                    curMenuId = $menu.find('.li-selected').attr('data-menuId');
                    newPicId = curMenuId + '_' + findMaxNum() + '.' + _type;
                    if ($.inArray(_type, allowTypes) != -1) {
                        data.formData = { menuId: curMenuId, picId: newPicId };
                        data.submit();

                        // 增加到页面   文件名是唯一的可以作为id
                        var html = '<div class="content-img_box">\
                                        <img data-picId="mini_'+ newPicId +'" class="content-img" src="" alt="" height="133" width="133">\
                                        <div class="content-img_layer t-0">\
                                            <div class="progress content-img_progress">\
                                                <div class="progress-bar progress-bar-striped active" role="progressbar" aria-valuenow="45" aria-valuemin="0" aria-valuemax="100" style="width: 5%">\
                                                    <span class="sr-only">Complete</span>\
                                                </div>\
                                            </div>\
                                        </div>\
                                    </div>';
                        $html = $(html);
                        $html.find('img').on('load', function () {
                            $(this).width('auto');
                            $html.find('.content-img_layer').removeClass('t-0');
                            $html.find('.content-img_layer').html('<span class="glyphicon glyphicon-remove content-img_remove"></span>');
                        });
                        $('#uploadBox').before($html);
                    }
                },
                done: function (e, data) {
                    var $img = $('[data-picId="mini_'+ data.formData.picId +'"]');
                    var $html = $img.parent();
                    var curMenuId = data.formData.menuId;
                    var newPicId = data.formData.picId;
                    $html.find('img').attr('src', '../static/img/'+ curMenuId + '/mini_' + newPicId);
                    $html.removeAttr('id').removeAttr('data-curMenuId').removeAttr('data-newPicId');
                    console.log('done');
                },
                progress: function (e, data) {
                    var $img = $('[data-picId="mini_'+ data.formData.picId +'"]');
                    var $html = $img.parent();
                    var progress = parseInt(data.loaded / data.total * 100, 10);
                    $html.find('.progress-bar').css(
                        'width',
                        progress + '%'
                    );
                }
            }).prop('disabled', !$.support.fileInput)
                .parent().addClass($.support.fileInput ? undefined : 'disabled');
        });

    }

    function findMaxNum() {
        var $imgs = $('#contentImgs').find('.content-img');
        var maxNum = 0;

        // 找出最大的id
        $imgs.each(function (index, item) {
            var picId = $(item).attr('data-picId'); // picId 格式为 menuId01_001.jpg
            var num = picId.split('.')[0].substr(-3);
            num = parseInt(num);
            if (num !== NaN && (!maxNum || maxNum < num)) {
                maxNum = num;
            };
        });

        maxNum++;
        // 补足0
        var result = ('000' + maxNum).substr(-3);

        return result;
    }

    function init() {
        bindEvents();
        view.toViewOrEdit();
        view.changeBtnShow();
        initFileInput();
        $('#menu').find('.menu-cont_title').first().trigger('click');
    }

    init();
})()