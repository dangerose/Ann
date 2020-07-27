/* 图片放大插件 */
(function() {
    function picZoom () {
    }

    picZoom.prototype.show = function(url, picData) {
        $('body').css('overflow', 'hidden');
        this._clear();
        this._add(url, picData);
    }
    picZoom.prototype.hide = function() {
        var $zoomMainPic = $('#zoomMainPic');
        var $zoomMiniPicList = $('#zoomMiniPicList');
        $('body').css('overflow', 'auto');
        $('#zoom').addClass('d-n');
        $zoomMainPic.removeClass('zoom-pic--mini');
        $zoomMiniPicList.addClass('d-n');
    }

    // 清除
    picZoom.prototype._clear = function() {
        $('#zoomMiniPicList').html('');
    }
    // 添加
    picZoom.prototype._add = function(url, picData) {
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
        $newZoom.click(function(e) {
            if (e.target.nodeName !== 'IMG' && e.target.className.indexOf('zoom-mini-pic-list') === -1 && e.target.className.indexOf('zoom-mini-pic-item') === -1)
                self.hide();
        });
        $newZoom.delegate(".zoom-mini-pic","click",function(){
            let miniPicSrc = $(this).attr('src');
            let picSrc = miniPicSrc.replace('mini_', '');
            self._setMainPic(picSrc);
        });
    }

    picZoom.prototype._setMainPic = function (url) {
        var $pic = $('.zoom-pic');
        var $newZoom = $('#zoom');
        $pic.attr('onload', function() {
            $pic.removeClass('d-n');
            $newZoom.find('.zoom-load').addClass('d-n');
        });
        $pic.attr('src', url);
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
                    <div class="ech-fade-c-in">
                        <img src="../static/img/${menuId}/mini_${element.picId}" alt="" class="zoom-mini-pic">
                    </div>
                </div>
            `)
            count++
        });
    }

    window.$picZoom = new picZoom();
})();