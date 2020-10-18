(function () {
    var _isAdmin = window.location.href.substr(-5).toLowerCase() === 'admin';

    // 判断是否是移动设备
    var u = navigator.userAgent;
    var isAndroid = u.indexOf('Android') > -1 || u.indexOf('Adr') > -1; //android终端
    var isiOS = !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/); //ios终端
    var _curMenuId = 'menu01'
    var _curMenuName = 'Architecture'
    var _curProjectId = ''
    var _mainPicIdInCurProject = ''
    var _showAddProDialog = null
    var _showCommonDialog = null
    if ((isAndroid || isiOS) && window.location.href.indexOf('admin') !== -1) {
        window.location.href = '/';
        return;
    }

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

    var _menuProData = []
    var _menuPicData = []

    var addDialog = {
        show: function(type) {
            _showAddProDialog()
            this.changeView(type)
        },
        changeView: function(type) {
            var $addProDialog = $('#addProDialog')
            var $head = $addProDialog.find('.dialog__header')
            var $btnAddPro = $('#btnAddPro')
            var $btnUpdatePro = $('#btnUpdatePro')
            if (type === 'add') {
                $head.html('新增项目')
                $btnAddPro.removeClass('d-n')
                $btnUpdatePro.addClass('d-n')
            }
            else {
                $head.html('修改项目')
                $btnAddPro.addClass('d-n')
                $btnUpdatePro.removeClass('d-n')
            }
        }
    }

    // 面包屑导航
    var breadCrumb = {
        $ele: $('#breadCrumb'),
        level: 1,
        clear: function() {
            this.$ele.html('')
        },
        update: function(arr) {
            var that = this
            this.level = arr.length
            if (this.level >= 2) {
                this.clear()
                var html = ''
                arr.forEach((item, i) => {
                    if (i < arr.length - 1)
                        html += `<li class="breadCrumb-item"><a>${item}</a></li>`
                    else
                        html += `<li class="active">${item}</li>`
                })
                this.$ele.html(html)
            }
            if (this.level < 2) {
                that.$ele.addClass('o-0')
            }
            else {
                that.$ele.removeClass('o-0')
            }
        }
    }

    // 项目
    var project = {
        get: function(menuId) {
            var $uploadBox = $('#uploadBox')
            $.get("/get_project?menuId=" + menuId, function (data) {
                if (data.status === 'ok') {
                    // 加载图片
                    var projectData = _menuProData = data.data
                    projectData.forEach(function (ele) {
                        var html = '';
                        if (ele.mainPicPath) {
                            let i = ele.mainPicPath.lastIndexOf('/')
                            ele.mainPicPath = ele.mainPicPath.substr(0, i+1) + 'mini_' + ele.mainPicPath.substr(i+1)
                            html = `<div class="content-project_box">\
                                        <div class="content-project_wrap">\
                                            <img data-projectId="${ele.projectId}" data-mainPicId="${ele.mainPicId}" \
                                            data-projectCNName="${ele.projectCNName}" \
                                            data-projectENName="${ele.projectENName || ''}" \
                                            data-mainPicPath="${ele.mainPicPath}" \
                                            data-num="${ele.num}" \
                                            class="content-project" src="${ele.mainPicPath}" alt="">\
                                            <div class="content-project_layer ${_isAdmin && Storage.get('hasLogin') ? '' : 'content-project_layer--text'}">\
                                            ${(_isAdmin && Storage.get('hasLogin')) ? '<span class="glyphicon glyphicon-remove content-project_remove"></span><span class="content-project_split"></span><span class="glyphicon glyphicon-edit content-project_edit"></span>' : `<div><p>${ele.projectCNName}</p><p style="letter-spacing: 1px;">${ele.projectENName || ''}</p></div>`}\
                                            </div>\
                                        </div>\
                                    </div>`
                        }
                        else {
                            html = `<div class="content-project_box">\
                                        <div class="content-project_wrap" style="display:flex;align-items:flex-end">\
                                            <span class="glyphicon glyphicon-picture content-project" aria-hidden="true" style="font-size: 112px;height:112px;height:auto;" data-projectId="${ele.projectId}" \
                                            data-mainPicId="${ele.mainPicId}" \
                                            data-mainPicPath="${ele.mainPicPath}"\
                                            data-num="${ele.num}" \
                                            data-projectCNName="${ele.projectCNName}"\
                                            data-projectENName="${ele.projectENName || ''}"></span>\
                                            <div class="content-project_layer ${_isAdmin && Storage.get('hasLogin') ? '' : 'content-project_layer--text'}">\
                                            ${(_isAdmin && Storage.get('hasLogin')) ? '<span class="glyphicon glyphicon-remove content-project_remove"></span><span class="content-project_split"></span><span class="glyphicon glyphicon-edit content-project_edit"></span>' : `<div><p>${ele.projectCNName}</p><p style="letter-spacing: 1px;">${ele.projectENName || ''}</p></div>`}\
                                            </div>\
                                        </div>\
                                    </div>`
                        }
                        $uploadBox.before(html);
                        view.toViewOrEdit();
                        if (_isAdmin && Storage.get('hasLogin')) {
                            window.drags('content-project_box', 'div-dash', 'dash', sortProAfterDrag);
                        }
                    });
                }
            });
        },
        delete: function(projectId) {
            $.get("/delete_project?projectId=" + projectId + "&menuId=" + _curMenuId, function (data) {
                if (data.status === 'ok') {
                    commonDialog.changeBtnView('success', '删除成功', true)
                }
                else {
                    commonDialog.changeBtnView('fail', '删除失败', true)
                }
            })
        }
    }

    var projectImg = {
        isLoading: false,
        get: function(projectId, notCreateHtml, success) {
            var $uploadBox = $('#uploadBox')
            var that = this
            if (this.isLoading) {
                return
            }
            this.isLoading = true
            $.get("/get_img_path?menuId="+ _curMenuId +"&projectId=" + projectId + '&time=' + new Date().getTime(), function (data) {
                that.isLoading = false
                if (data.status === 'ok') {
                    // 加载图片
                    _menuPicData = data.data
                    if (notCreateHtml) {
                        success && success()
                        return
                    }
                    data.data.forEach(function (ele) {
                        var html = '<div class="content-img_box">\
                                        <div class="content-img_wrap">\
                                            <img data-picId="mini_'+ ele.picId + '" class="content-img" src="../static/img/' + _curMenuId + '/mini_' + ele.picId + '" alt="">\
                                            <div class="content-img_layer">\
                                                <span class="glyphicon glyphicon-remove content-img_remove"></span>\
                                                <span class="content-img_split"></span>\
                                                <span class="glyphicon glyphicon-ok content-img_setMain"></span>\
                                            </div>\
                                        </div>\
                                    </div>';
                        var $html = $(html)
                        if (ele.picId === _mainPicIdInCurProject) {
                            $html.find('.content-img').addClass('main-img');
                        }
                        $uploadBox.before($html);
                        view.toViewOrEdit();
                        window.drags('content-img_box', 'div-dash', 'dash', sortPicAfterDrag);
                    });
                    success && success()
                }
            });
        }
    }

    function setMainPic (mainPicId) {
        var $contentImgs = $('#contentImgs');
        var $imgs = $contentImgs.find('.content-img');
        $contentImgs.find('.content-img').removeClass('main-img');
        $imgs.each(function(i, item) {
            var $img = $(item)
            var miniPicId = $img.attr('data-picid')
            var picId = miniPicId.replace('mini_', '')
            if (mainPicId === picId)
                $img.addClass('main-img')
            else
                $img.removeClass('main-img')
        })
    }

    function removePicData (picId) {
        for (var index = 0; index < _menuPicData.length; index++) {
            var element = _menuPicData[index];
            if (element.picId === picId) {
                _menuPicData.splice(index, 1)
                break;
            }
        }
        _menuPicData.forEach(function (item, i) {
            item.num = i
        })
        console.log('remove ', _menuPicData)
    }

    function addPicData (picId) {
        _menuPicData.push({
            picId: picId,
            size: '',
            num: _menuPicData.length === 0 ? 0 : (_menuPicData[_menuPicData.length - 1].num + 1)
        })
        console.log('add ',_menuPicData)
    }

    function removeProData (proId) {
        for (var index = 0; index < _menuProData.length; index++) {
            var element = _menuProData[index];
            if (element.projectId === proId) {
                _menuProData.splice(index, 1)
                break;
            }
        }
        _menuProData.forEach(function (item, i) {
            item.num = i
        })
    }

    function sortPicAfterDrag () {
        var $pics = $('.content-img_box')
        var newArr = []
        $pics.each(function (i) {
            var $pic = $(this)
            let picId = $pic.find('.content-img').attr('data-picId').replace('mini_', '')
            for (var index = 0; index < _menuPicData.length; index++) {
                var element = _menuPicData[index];
                if (element.picId === picId) {
                    element.num = i
                    newArr.push(element)
                    break
                }
            }
        })
        _menuPicData = newArr
        console.log('drag ',_menuPicData)
        $.ajax({
            type: 'post',
            url:'/resort_img',
            contentType:'application/json',
            data:{
               picData: JSON.stringify(_menuPicData)
            },
            dataType:'json',
            success:function (data) {
            }
        }) 
    }

    function sortProAfterDrag () {
        var $pics = $('.content-project_box')
        var newArr = []
        $pics.each(function (i) {
            var $pic = $(this)
            let projectId = $pic.find('.content-project').attr('data-projectId')
            for (var index = 0; index < _menuProData.length; index++) {
                var element = _menuProData[index];
                if (element.projectId === projectId) {
                    element.num = i
                    newArr.push(element)
                    break
                }
            }
        })
        _menuProData = newArr
        $.ajax({
            type: 'post',
            url:'/resort_pro',
            contentType:'application/json',
            data:{
               proData: JSON.stringify(_menuProData)
            },
            dataType:'json',
            success:function (data) {
            }
        }) 
    }

    var commonDialog = {
        show: function(text, cb) {
            var $btnCommon = $('#btnCommon')
            var $commonDialogText = $('#commonDialogText')
            $btnCommon.off('click').on('click', cb)
            $commonDialogText.html(text)
            _showCommonDialog()
        },
        close: function () {
            _showCommonDialog()
        },
        changeBtnView: function(type, text, isClose) {
            var $btnCommon = $('#btnCommon');
            $btnCommon.css('border', 'none').css('outline', 'none')
            if (type === 'success') {
                $btnCommon.text(text);
                $btnCommon.css('pointer-events', 'none').addClass('green').removeClass('black');
                setTimeout(function () {
                    $btnCommon.text('确定');
                    $btnCommon.css('pointer-events', 'auto').addClass('black').removeClass('green');
                    if (isClose)
                        commonDialog.close()
                }, 1000);
            }
            else {
                $btnCommon.text(text);
                $btnCommon.css('pointer-events', 'none').addClass('red').removeClass('black');
                setTimeout(function () {
                    $btnCommon.text('确定');
                    $btnCommon.css('pointer-events', 'auto').addClass('black').removeClass('red');
                    if (isClose)
                        commonDialog.close()
                }, 1000);
            }
        }
    }

    function showCommonDialog (text, cb) {
        var $btnCommon = $('#btnCommon')
        var $commonDialogText = $('#commonDialogText')
        $btnCommon.off('click').on('click', cb)
        $commonDialogText.html(text)
        _showCommonDialog()
    }

    // 绑定事件
    function bindEvents () {
        // 菜单点击事件
        var $menu = $('#menu');
        $menu.delegate('li.menu-cont_title', 'click', function () {
            var $li = $(this);
            var menuId = $li.attr('data-menuId');
            var $p = $li.find('p')
            $menu.find('.li-selected').removeClass('li-selected');
            $li.addClass('li-selected');
            view.toViewOrEdit();
            _curMenuId = menuId;
            _curMenuName = $p.text();
            //设置bread
            breadCrumb.update([$p.text()])
            //获取项目
            view.clearContView()
            project.get(menuId)
        });

        // 面包屑导航点击事件
        $('#breadCrumb').delegate('li.breadCrumb-item', 'click', function () {
            breadCrumb.update([_curMenuName])
            view.switchContView(_curMenuId)
        })

        $('html').delegate('img', "contextmenu", function(e){ return false; });

        $('#photoIntro').click(function() {
            $('#intro').removeClass('d-n')
        })

        $('#intro').click(function () {
            $('#intro').addClass('d-n')
        })

        // project点击事件
        var $contentImgs = $('#contentImgs');
        $contentImgs.delegate('.content-project_box,.div-dash', 'click', function (e) {
            var $box = $(this)
            var target = e.target
            if (target.className.indexOf('content-project_remove') >= 0 || target.className.indexOf('content-project_edit') >= 0)
                return
            var $img = $box.find('.content-project');
            var projectId = $img.attr('data-projectId')
            var mainPicId = $img.attr('data-mainPicId')
            var projectCNName = $img.attr('data-projectCNName')
            var mainPicPath = $img.attr('data-mainPicPath')
            if (!projectId)
              return
            breadCrumb.update([_curMenuName, projectCNName])
            _curProjectId = projectId
            _mainPicIdInCurProject = mainPicId
            if (_isAdmin) {
                view.switchContView(projectId)
            }
            else {
                projectImg.get(projectId, true, function() {
                    if (!mainPicPath && _menuPicData.length === 0) {
                        showCommonDialog('项目还未添加图片')
                        return
                    }
                    mainPicPath = _menuPicData[0].path // 默认主图是第一张
                    $picZoom.show(mainPicPath, _menuPicData)
                })
            }
        });

        // 图片点击事件
        var $contentImgs = $('#contentImgs');
        $contentImgs.delegate('img.content-img', 'click', function () {
            /* var $img = $(this);
            $picZoom.show($img.attr('src').replace('mini_', ''), _menuPicData); */
        });

        // 图片删除事件
        $contentImgs.delegate('.content-img_remove', 'click', function () {
            var $iconRemove = $(this);
            var $img = $iconRemove.parent().siblings('img');
            var miniPicId = $img.attr('data-picId');
            var picId = miniPicId.replace('mini_', '');
            var $contentBox = $iconRemove.parents('.content-img_box');
            $contentBox.remove();
            removePicData(picId);
            $.get("/delete_img?projectId=" + _curProjectId + "&picId=" + miniPicId + "&menuId=" + _curMenuId, function (data, status) {
            });
        });

        // 图片设为主图事件
        $contentImgs.delegate('.content-img_setMain', 'click', function () {
            var $iconRemove = $(this);
            var $img = $iconRemove.parent().siblings('img');
            var miniPicId = $img.attr('data-picId');
            var picId = miniPicId.replace('mini_', '');
            _mainPicIdInCurProject = picId;
            setMainPic(picId);
            $.get("/update_main_picid?projectId=" + _curProjectId + "&picId=" + picId,
            function (data, status) {
            });
        });

        // 项目删除事件
        $contentImgs.delegate('.content-project_remove', 'click', function () {
            var $iconRemove = $(this);
            var $img = $iconRemove.parent().siblings('.content-project');
            var projectId = $img.attr('data-projectId');
            var $contentBox = $iconRemove.parents('.content-project_box');
            showCommonDialog('确定删除该项目及项目下的所有图片？', function () {
                $contentBox.remove();
                project.delete(projectId)
            })
        });

        // 项目编辑事件
        $contentImgs.delegate('.content-project_edit', 'click', function () {
            var $iconEdit = $(this);
            var $img = $iconEdit.parent().siblings('.content-project');
            var projectCNName = $img.attr('data-projectCNName');
            var projectENName = $img.attr('data-projectENName');
            _curProjectId = $img.attr('data-projectId');
            $('[name=projectCNName]').val(projectCNName)
            $('[name=projectENName]').val(projectENName)
            addDialog.show('edit')
        });

        // 打开登录窗口 事件
        var dlgtrigger = document.querySelector('[data-dialog=somedialog]'),
            somedialog = document.getElementById('somedialog'),
            dlg = new DialogFx(somedialog);
        var dlgFun = dlg.toggle.bind(dlg)
        dlgtrigger.addEventListener('click', function () {
            var $username = $('[name=username]')
            $username.focus()
            dlgFun()
        });

        // 添加项目窗口 事件
        var addProDialog = document.getElementById('addProDialog'),
            addDlg = new DialogFx(addProDialog);
        _showAddProDialog = addDlg.toggle.bind(addDlg)

        // 添加项目窗口 事件
        var commonDialog = document.getElementById('commonDialog'),
            commDlg = new DialogFx(commonDialog);
        _showCommonDialog = commDlg.toggle.bind(commDlg)

        // 密码输入框 enter 事件
        var $inputPassword = $('[name=password]');
        $inputPassword.on('keydown', function (e) {
            if (e.keyCode == 13) {
                // enter
                $('#btnLogin').trigger('click');
            }
        });

        // 新增项目事件
        var $btnAddPro = $('#btnAddPro');
        $btnAddPro.on('click', function () {
            var $projectCNName = $('[name=projectCNName]');
            var $projectENName = $('[name=projectENName]');
            if ($projectCNName.val() && $projectENName.val()) {
                $.get("/add_project?menuId="+ _curMenuId + "&projectCNName=" + $projectCNName.val() + "&projectENName=" + $projectENName.val(), function (data) {
                    if (data.status === 'ok') {
                        view.changeBtnAddPro('success', 'btnAddPro');
                    }
                });
            }
            else {
                view.changeBtnAddPro('fail', 'btnAddPro');
            }
        });

        // 修改项目事件
        var $btnUpdatePro = $('#btnUpdatePro');
        $btnUpdatePro.on('click', function () {
            var $projectCNName = $('[name=projectCNName]');
            var $projectENName = $('[name=projectENName]');
            if ($projectCNName.val() && $projectENName.val()) {
                $.get("/update_project?projectId="+ _curProjectId + "&projectCNName=" + $projectCNName.val() + "&projectENName=" + $projectENName.val(), function (data) {
                    if (data.status === 'ok') {
                        view.changeBtnAddPro('success', 'btnUpdatePro');
                    }
                });
            }
            else {
                view.changeBtnAddPro('fail', 'btnUpdatePro');
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
                    window.location.reload();
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

    function filetoDataURL (file, fn) {
        var reader = new FileReader();
        reader.onloadend = function (e) {
            fn(e.target.result);
        };
        reader.readAsDataURL(file);
    };

    // 改变视图
    var view = {
        // 定义根元素html的font-size
        defineRem: function () {
            //var screenH = window.screen.height; // 分辨率
            //$('html').css('font-size', screenH / 100);
        },
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
            $btnLogin.css('border', 'none').css('outline', 'none')
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
        },
        changeBtnAddPro: function (type, id) {
            if (!_isAdmin) {
                return;
            }
            var $btnAddPro = $('#' + id);
            $btnAddPro.css('border', 'none').css('outline', 'none')
            var originText = $btnAddPro.text()
            if (type === 'success') {
                $btnAddPro.text('操作成功');
                $btnAddPro.css('pointer-events', 'none').addClass('green').removeClass('black');
                setTimeout(function () {
                    _showAddProDialog();
                    view.clearContView()
                    project.get(_curMenuId)
                    $btnAddPro.text(originText);
                    $btnAddPro.css('pointer-events', 'auto').addClass('black').removeClass('green');
                }, 1000);
            }
            else {
                $btnAddPro.text('请填写完整');
                $btnAddPro.css('pointer-events', 'none').addClass('red').removeClass('black');
                setTimeout(function () {
                    $btnAddPro.text(originText);
                    $btnAddPro.css('pointer-events', 'auto').addClass('black').removeClass('red');
                }, 1000);
            }
        },
        clearContView: function() {
            var $contentImgs = $('#contentImgs');
            //清空
            $contentImgs.find('.content-img_box').remove();
            $contentImgs.find('.content-project_box').remove();
        },
        switchContView: function(id) {
            this.clearContView()
            if (id.indexOf('project') >= 0) {
                projectImg.get(id)
            }
            else {
                project.get(id)
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

    function initFileInput () {
        var $uploadBox = $('#uploadBox');
        var $fileupload = $('#fileupload');
        var count = 0
        var lastTime = 0
        
        // 事件
        $uploadBox.off('click').click(function () {
            if (breadCrumb.level === 1) {
                var $projectCNName = $('[name=projectCNName]')
                $projectCNName.focus()
                _showAddProDialog()
            }
            else {
                $fileupload.val("");
                $fileupload.parent().click(function (e) {
                    e.stopPropagation();
                });
                
                $fileupload.trigger('click').fileupload({
                    url: '/upload_img',
                    dataType: 'json',
                    sequentialUploads: true, // 是否按顺序一个个上传
                    limitConcurrentUploads: 1,
                    add: function (e, data) {
                        var allowTypes = ['jpg'];
                        var _type = $(data.files[0].name.split('.')).last()[0].toLowerCase(); // 文件后缀
                        var $html, newPicId;
                        var time = new Date().getTime() + ''
                        if (time === lastTime) {
                            count++
                            time += count
                        } else {
                            count = 0
                            lastTime = time
                        }

                        newPicId = _curMenuId + '_' + time + '.' + _type;
                        if ($.inArray(_type, allowTypes) != -1) {
                            data.formData = {
                                menuId: _curMenuId,
                                projectId: _curProjectId,
                                picId: newPicId
                            };
                            data.submit();

                            // 增加到页面   文件名是唯一的可以作为id
                            var html = '<div class="content-img_box">\
                                            <div class="content-img_wrap">\
                                                <img data-picId="mini_'+ newPicId + '" class="content-img" src="" alt="" height="133" width="133">\
                                                <div class="content-img_layer t-0">\
                                                    <div class="progress content-img_progress">\
                                                        <div class="progress-bar progress-bar-striped active" role="progressbar" aria-valuenow="45" aria-valuemin="0" aria-valuemax="100" style="width: 5%">\
                                                            <span class="sr-only">Complete</span>\
                                                        </div>\
                                                    </div>\
                                                </div>\
                                            </div>\
                                        </div>';
                            $html = $(html);
                            $html.find('img').on('load', function () {
                                $(this).removeAttr('height').removeAttr('width');
                                $html.find('.content-img_layer').removeClass('t-0');
                                $html.find('.content-img_layer').html('<span class="glyphicon glyphicon-remove content-img_remove"></span>\
                                <span class="content-img_split"></span>\
                                <span class="glyphicon glyphicon-ok content-img_setMain"></span>');
                            });
                            $('#uploadBox').before($html);
                        }
                    },
                    done: function (e, data) {
                        var $img = $('[data-picId="mini_' + data.formData.picId + '"]');
                        var $html = $img.parent();
                        var curMenuId = data.formData.menuId;
                        var newPicId = data.formData.picId;
                        filetoDataURL(data.files[0], function (dataUrl) {
                            $html.find('img').attr('src', '../static/img/' + curMenuId + '/mini_' + newPicId + '?' + new Date().getTime());
                        });
                        $html.removeAttr('id').removeAttr('data-curMenuId').removeAttr('data-newPicId');
                        console.log('done');
                        addPicData(newPicId);
                        window.drags('content-img_box', 'div-dash', 'dash', sortPicAfterDrag);
                    },
                    progress: function (e, data) {
                        var $img = $('[data-picId="mini_' + data.formData.picId + '"]');
                        var $html = $img.parent();
                        var progress = parseInt(data.loaded / data.total * 100, 10);
                        $html.find('.progress-bar').css(
                            'width',
                            progress + '%'
                        );
                    }
                }).prop('disabled', !$.support.fileInput)
                    .parent().addClass($.support.fileInput ? undefined : 'disabled');
            }
        });

    }

    function init () {
        view.defineRem();
        bindEvents();
        view.toViewOrEdit();
        view.changeBtnShow();
        initFileInput();
        $('#menu').find('.menu-cont_title').first().trigger('click');
    }

    function initSwiper () {
        var swiper = new Swiper('.swiper-container');
    }

    init();
})()