(function() {
    // 图片点击事件
    var $content = $('#content');
    $content.delegate('img', 'click', function() {
        var $img = $(this);
        $picZoom.show($img.attr('src'));
    });
    /* // 图片懒加载
    window.$picLazyLoad.set('content');
    // 图片onload事件
    $content.find('img').attr('onload', function() {
        var $img = $(this);
        if ($img.attr('src')) {
            $img.removeAttr('width');
        }
    }) */
})()