/* 图片放大插件 */
(function() {
    function picZoom () {

    }

    picZoom.prototype.show = function(url) {
        this._clear();
        this._add(url);
    }
    picZoom.prototype.hide = function() {
        this._clear();
    }

    // 清除
    picZoom.prototype._clear = function() {
        var $picZooms = $('body').find('.zoom');
        $picZooms.remove();
    }
    // 添加
    picZoom.prototype._add = function(url) {
        var self = this;
        var $body = $('body');
        var $newZoom = $('\
            <div class="zoom">\
                <div class="zoom-overlay"></div>\
                <div class="zoom-content d-n" id="zoomContent">\
                    <img class="zoom-pic" src="../static/img/001.jpg"/>\
                </div>\
                <div class="zoom-load" id="zoomLoad">\
                    <img class="zoom-loadicon" src="../static/img/loading.gif"/>\
                </div>\
            </div>\
        ');
        $newZoom.on('click', function() {
            self.hide();
        });
        $newZoom.find('.zoom-pic').attr('onload', function() {
            $newZoom.find('.zoom-content').removeClass('d-n');
            $newZoom.find('.zoom-load').addClass('d-n');
        });
        $body.append($newZoom);
        /* $('.zoom-overlay').fadeTo(100, 0.9); */
    }

    window.$picZoom = new picZoom();
})();