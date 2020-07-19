/* 图片放大插件 */
(function() {
    function picZoom () {
    }

    picZoom.prototype.show = function(url) {
        $('body').css('overflow', 'hidden');
        this._clear();
        this._add(url);
    }
    picZoom.prototype.hide = function() {
        $('body').css('overflow', 'auto');
        $('#zoom').addClass('d-n');
    }

    // 清除
    picZoom.prototype._clear = function() {
        /* var $picZooms = $('body').find('.zoom');
        $picZooms.remove(); */
    }
    // 添加
    picZoom.prototype._add = function(url) {
        var self = this;
        var $body = $('body');
        var $newZoom = $('#zoom');
        var $overLay = $('.zoom-overlay');
        var $pic = $('.zoom-pic');
        $newZoom.removeClass('d-n');
        $newZoom.click(function() {
            self.hide();
        });
        $pic.attr('onload', function() {
            $pic.removeClass('d-n');
            $newZoom.find('.zoom-load').addClass('d-n');
        });
        $pic.attr('src', url);
        /* $('.zoom-overlay').fadeTo(100, 0.9); */
    }

    window.$picZoom = new picZoom();
})();