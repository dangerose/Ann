(function () {
    function picLazyLoad() {

    }

    picLazyLoad.prototype.set = function (boxId) {
        var self = this;
        this.$box = $('#' + boxId);
        this._start();
        /* 一开始没有滚动，也需要触发一次 */
        $(window).on('scroll', function () {
            self._start();
        });
    }

    picLazyLoad.prototype._start = function () {
        var self = this;
        this.$box.find('img').not('[data-isLoaded]').each(function () {
            var $img = $(this)
            if (self._isShow($img)) {
                self._loadImg($img)
                console.log($img.offset())
            }
        })
    }

    picLazyLoad.prototype._isShow = function($img) {
        // $(window).height() 获取的是网页可见区域的高度
        return $img.offset().top <= $(window).height() + $(window).scrollTop();
    }

    picLazyLoad.prototype._loadImg = function($img) {
        $img.attr('src', $img.attr('data-src'))
        $img.attr('data-isLoaded', 1)
        /*用于区别图片是否被加载过，防止重新加载*/
    }

    window.$picLazyLoad = new picLazyLoad();
})();