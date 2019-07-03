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

        // 图片删除事件
        $contentImgs.delegate('.content-img_remove', 'click', function () {
            var $iconRemove = $(this);
            var $img = $iconRemove.parent().siblings('img');
            var picId = $img.attr('data-picid');
            console.log(picId);
            $.get("http://134.175.55.52:8080/delete_img?picid=" + picId, function (data, status) {
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

    //初始化fileinput控件（第一次初始化）
    function initFileInput(ctrlName, uploadUrl) {
        $("#file-0").fileinput({
            'allowedFileExtensions': ['jpg', 'png', 'gif'],
            uploadUrl: uploadUrl, //上传的地址
        });
    }

    initFileInput();
    function initFileInput() {
        $("#uploadImg").fileinput({
            language: 'zh', //设置语言
            dropZoneTitle: '可以将图片拖放到这里 …支持多文件上传',
            uploadUrl: "http://134.175.55.52:8080/upload_img?merid=xxx", //上传的地址
            /* uploadExtraData: function (previewId, index) {   //该插件可以向您的服务器方法发送附加数据。这可以通过uploadExtraData在键值对中设置为关联数组对象来完成。所以如果你有设置uploadExtraData={id:'kv-1'}，在PHP中你可以读取这些数据$_POST['id']
                return { merId: '菜单id' };
            }, */
            allowedFileExtensions: ['jpg', 'png'],//接收的文件后缀
            uploadAsync: true, //默认异步上传
            showUpload: true, //是否显示上传按钮
            showRemove: true, //显示移除按钮
            showPreview: true, //是否显示预览
            showCancel: true,   //是否显示文件上传取消按钮。默认为true。只有在AJAX上传过程中，才会启用和显示
            showCaption: true,//是否显示文件标题，默认为true
            browseClass: "btn btn-primary", //文件选择器/浏览按钮的CSS类。默认为btn btn-primary
            dropZoneEnabled: true,//是否显示拖拽区域
            minImageWidth: 50, //图片的最小宽度
            minImageHeight: 50,//图片的最小高度
            maxImageWidth: 1000,//图片的最大宽度
            maxImageHeight: 1000,//图片的最大高度
            maxFileSize: 1024,//单位为kb，如果为0表示不限制文件大小
            minFileCount: 1, //每次上传允许的最少文件数。如果设置为0，则表示文件数是可选的。默认为0
            maxFileCount: 0, //每次上传允许的最大文件数。如果设置为0，则表示允许的文件数是无限制的。默认为0
            previewFileIcon: "<i class='glyphicon glyphicon-king'></i>",//当检测到用于预览的不可读文件类型时，将在每个预览文件缩略图中显示的图标。默认为<i class="glyphicon glyphicon-file"></i>  
            layoutTemplates: {
                actionUpload: '',//去除上传预览缩略图中的上传图片
                actionZoom: '',   //去除上传预览缩略图中的查看详情预览的缩略图标
                actionDownload: '', //去除上传预览缩略图中的下载图标
                actionDelete: '', //去除上传预览的缩略图中的删除图标
            },//对象用于渲染布局的每个部分的模板配置。您可以设置以下模板来控制窗口小部件布局.eg:去除上传图标
            msgFilesTooMany: "选择上传的文件数量({n}) 超过允许的最大数值{m}！",//字符串，当文件数超过设置的最大计数时显示的消息 maxFileCount。默认为：选择上传的文件数（{n}）超出了允许的最大限制{m}。请重试您的上传！
        }).on('filebatchpreupload', function (event, data) { //该方法将在上传之前触发
            var id = $('#id option:selected').val();
            if (id == 0) {
                return {
                    message: "请选择", // 验证错误信息在上传前要显示。如果设置了这个设置，插件会在调用时自动中止上传，并将其显示为错误消息。您可以使用此属性来读取文件并执行自己的自定义验证
                    data: {} // any other data to send that can be referred in `filecustomerror`
                };
            }
        });
    }
    //fileuploaded此事件仅针对ajax上传触发，并在每个缩略图文件上传完成后触发。此事件仅针对ajax上传并在以下情况下触发：当点击每个预览缩略图中的上传图标并且文件上传成功时，或者当你有 uploadAsync设置为true您已触发批量上传。在这种情况下，fileuploaded每一个人选择的文件被上传成功后，触发事件。
    /* var id_str = '';
    $('#uploadImg').on('fileuploaded', function (event, data, previewId, index) {
        if (typeof (data.response.id) != 'undefined') {
            id_str = id_str + data.response.id + ',';
        }
    });
    // filebatchuploadcomplete此事件仅在ajax上传和完成同步或异步ajax批量上传后触发。
    $('#uploadImg').on('filebatchuploadcomplete', function (event, files, extra) {
        if (id_str.length == 0) {
            layer.msg('上传失败', { icon: 0 });//弹框提示
            return false;
        }
        setTimeout(function () { //执行延时关闭
            closeSelf();
        }, 1000);
    }); */

    function init() {
        bindEvents();
        view.toViewOrEdit(isEdit);
        view.changeBtnShow();
    }

    init();
})()