/* 图片放大插件 */
(function () {
    function picZoom () {
        var $zoom = $('#zoom')
        var that = this
        $zoom.mousewheel(throttle(function (event, delta, deltaX, deltaY) {
            if (delta === -1) {
                // 下滑
                that._next()
            } else {
                // 上滑
                that._prev()
            }
        }, 100));

        $(document).keydown(function (event) {
            var keyNum = event.which;  //获取键值
            switch (keyNum) { //判断按键
                case 37: that._prev(); break;
                case 39: that._next(); break;
                default:
                    break;
            }
        });

        this.translateX = 0
        this.mainPicId = ''
        this.rightCount = 0 // 记住向右滚动了几次
    }

    var throttle = function (func, delay) {
        var prev = Date.now();
        return function () {
            var context = this;
            var args = arguments;
            var now = Date.now();
            if (now - prev >= delay) {
                func.apply(context, args);
                prev = Date.now();
            }
        }
    }

    picZoom.prototype.show = function (url, picData) {
        var $zoomTotalNum = $('#zoomTotalNum')
        $zoomTotalNum.html(picData.length)
        $('body').css('overflow', 'hidden');
        this.picData = picData
        this.totalNum = picData.length
        this._clear();
        this._add(url, picData);
    }
    picZoom.prototype.hide = function () {
        var $zoomMainPic = $('#zoomMainPic');
        $('body').css('overflow', 'auto');
        $('#zoom').addClass('d-n');
        $zoomMainPic.removeClass('zoom-pic--mini');
    }

    // 清除
    picZoom.prototype._clear = function () {
        let $zoomNum = $('#zoomNum')
        $zoomNum.html('1')
        $('#zoomMiniPicList').html('').css('transform', 'translateX(0)');
        this.translateX = 0
    }
    // 添加
    picZoom.prototype._add = function (url, picData) {
        var self = this;
        var $newZoom = $('#zoom');
        var $zoomMainPic = $('#zoomMainPic');
        var $zoomMiniPicList = $('#zoomMiniPicList');
        this._addMiniPic(picData);
        this._setEvent();
        this._setMainPic(url);

        if (picData.length > 1) {
            $zoomMainPic.addClass('zoom-pic--mini');
            $zoomMiniPicList.removeClass('d-n');
        }

        $newZoom.removeClass('d-n');
    }

    picZoom.prototype._setEvent = function () {
        var self = this;
        var $newZoom = $('#zoom');
        $newZoom.click(function (e) {
            if (e.target.nodeName !== 'IMG' && e.target.className.indexOf('zoom-mini-pic-list') === -1 && e.target.className.indexOf('zoom-mini-pic-item') === -1 && e.target.className.indexOf('zoom-mini-pic') === -1) {
                self.hide();
            }
        });
        $newZoom.delegate(".zoom-mini-pic", "click", function () {
            let picId = $(this).attr('data-picId');
            let menuId = $(this).attr('data-menuId');
            let picSrc = `../static/img/${menuId}/${picId}`;
            let num = $(this).attr('data-num')
            let $zoomNum = $('#zoomNum')
            $zoomNum.html(num)
            let check = self._swipe(picId)
            if (check)
                self._setMainPic(picSrc, picId);
        });
    }

    picZoom.prototype._prev = function () {
        var $curSelPic = $(`.zoom-mini-pic[data-picId="${this.mainPicId}"]`)
        var $curSelPicPar = $curSelPic.parent()
        var curNum = parseInt($curSelPic.attr('data-num'))
        if (curNum === 1)
            return
        var $prevPicPar = $curSelPicPar.prev()
        var $prevPic = $prevPicPar.find('.zoom-mini-pic')
        $prevPic.trigger('click')
    }

    picZoom.prototype._next = function () {
        var $curSelPic = $(`.zoom-mini-pic[data-picId="${this.mainPicId}"]`)
        var $curSelPicPar = $curSelPic.parent()
        var curNum = parseInt($curSelPic.attr('data-num'))
        if (curNum === this.totalNum)
            return
        var $nextPicPar = $curSelPicPar.next()
        var $nextPic = $nextPicPar.find('.zoom-mini-pic')
        $nextPic.trigger('click')
    }

    picZoom.prototype._swipe = function (picId) {
        var that = this
        var $zoomMiniPicListBox = $('#zoomMiniPicListBox')
        var $zoomMiniPicList = $('#zoomMiniPicList')
        var $curSelPic = $(`.zoom-mini-pic[data-picId="${picId}"]`)
        var num = parseInt($curSelPic.attr('data-num'))
        var $zoomMiniPicItem = $curSelPic.parent()
        var boxMarginR = $zoomMiniPicListBox.css('margin-right')
        var boxMarginL = $zoomMiniPicListBox.css('margin-left')
        var bodyW = $('html').width()
        boxMarginL = parseInt(boxMarginL.replace('px', ''))
        boxMarginR = parseInt(boxMarginR.replace('px', ''))
        var client = $zoomMiniPicItem[0].getBoundingClientRect()
        var itemOL = parseInt(client.x)
        var itemOW = client.width
        var itemOR = bodyW - itemOL - itemOW
        if ((itemOL - boxMarginL) < itemOW) {
            // 左侧图片
            this.translateX = this.translateX + itemOW
            $zoomMiniPicList.css('transform', `translateX(${this.translateX}px)`)
            that.rightCount--
        } else if ((itemOR - boxMarginR) < itemOW) {
            // 右侧图片
            this.translateX = this.translateX - itemOW
            $zoomMiniPicList.css('transform', `translateX(${this.translateX}px)`)
            that.rightCount++
        }
        return true
    }

    picZoom.prototype._correct = function (curNum, itemOW) {
        var $zoomMiniPicList = $('#zoomMiniPicList')
        console.log(curNum)
        if (curNum === 1) {
            $zoomMiniPicList.css('transform', `translateX(0px)`)
        } else if (curNum === this.totalNum) {
            $zoomMiniPicList.css('transform', `translateX(${-(itemOW * this.rightCount)}px)`)
            console.log(-(itemOW * this.rightCount))
        }
    }

    picZoom.prototype._setMainPic = function (url) {
        var temp = url.split('/')
        var picId = temp[temp.length - 1]
        var $img = $('#zoomMainImg');
        var $loadicon = $('#zoomLoadicon');
        $img.addClass('d-n')
        $loadicon.removeClass('d-n')
        $img.attr('src', url);
        $img.off('load').on('load', function () {
            $img.removeClass('d-n');
            $loadicon.addClass('d-n')
        });
        this.mainPicId = picId
        this._setMiniStyle(picId)
    }

    picZoom.prototype._setMiniStyle = function (picId) {
        var $zoomMainPics = $('#zoom').find('.zoom-mini-pic-div')
        $zoomMainPics.each(function (i, item) {
            var $pic = $(item)
            var id = $pic.attr('data-picId')
            if (picId === id)
                $pic.addClass('active')
            else
                $pic.removeClass('active')
        })
    }

    picZoom.prototype._addMiniPic = function (picData) {
        var $zoomMiniPicList = $('#zoomMiniPicList')
        var count = 1
        picData.forEach(element => {
            var menuId = element.picId.split('_')[0]
            if (count > 20) {
                return
            }
            $zoomMiniPicList.append(`
                <div class="zoom-mini-pic-item">
                    <div class="zoom-mini-pic-div zoom-mini-pic" \
                    data-num="${element.num + 1}" \
                    data-picId="${element.picId}" \
                    data-menuId="${menuId}" \
                    style="background-image: url(../static/img/${menuId}/mini_${element.picId})">
                    </div>
                </div>
            `)
            count++
        });
    }

    window.$picZoom = new picZoom();
})();