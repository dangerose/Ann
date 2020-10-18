function drags(name, name2, name3, cb) {
  var range = {x: 0, y: 0}; // 鼠标元素偏移量
  var lastPos = {x: 0, y: 0, x1: 0, y1: 0}; // 拖拽对象的四个坐标
  var tarPos = {x: 0, y: 0, x1: 0, y1: 0}; // 目标元素对象的坐标初始化
  var thidDiv = null, move = false, choose = false; // 拖拽对象 拖拽状态 选中状态
  //拖拽对象的索引、高度、的初始化。
  var thidDivWidth = 0, thidDivHeight = 0, thidDivHalfW = 0, thidDivHalfH = 0, tarFirstX = 0, tarFirstY = 0;
  var tarDiv = null, tarFirst, tempDiv; // 要插入的目标元素的对象, 临时的虚线对象
  var initPos = {x: 0, y: 0};  // 记录拖拽元素初始鼠标元素偏移量
  var startTime = 0 // 少于100为点击

  $('.' + name).off('mousedown').on('mousedown', function (event) {
      if ($(event.target).hasClass('content-img_remove') || $(event.target).hasClass('content-img_setMain') || $(event.target).hasClass('content-project_remove') || $(event.target).hasClass('content-project_edit'))
        return
      choose = true;
      startTime = new Date().getTime()
      // 拖拽对象
      thidDiv = $(this);
      // 记录拖拽元素初始位置
      initPos.x = thidDiv.offset().left;
      initPos.y = thidDiv.offset().top;
      
      // 鼠标元素相对偏移量
      range.x = event.pageX - thidDiv.offset().left;
      range.y = event.pageY - thidDiv.offset().top;

      thidDivWidth = thidDiv.width();
      thidDivHeight = thidDiv.height();
      thidDivOuterWidth = thidDiv.outerWidth();
      thidDivOuterHeight = thidDiv.outerHeight();
      thidDivHalfW = thidDivWidth / 2;
      thidDivHalfH = thidDivHeight / 2;
      thidDiv.attr('class', name2);
      thidDiv.css({left: initPos.x + 'px', top: initPos.y + 'px'});

      // 创建新元素 插入拖拽元素之前的位置(虚线框)
      let elem = `
        <div class='${name3}' style='width: ${thidDivWidth}px;height: ${thidDivHeight}px;padding:0 ${thidDivOuterWidth - thidDivWidth - 1}px ${thidDivOuterHeight - thidDivHeight - 1}px 0;'>
          <div></div>
        </div>
      `
      /* let elem = `
        <div class='${name3}' style='height:${thidDivHeight}px;padding:0 ${thidDivOuterWidth - thidDivWidth - 1}px ${thidDivOuterHeight - thidDivHeight - 1}px 0;'>
          <div></div>
        </div>
      ` */
      $(elem).insertBefore(thidDiv);
      tempDiv = $("." + name3);

  });

  $(document).on('mouseup', function (event) {
      let now = new Date().getTime()
      if (startTime > 0 && now - startTime > 0 && now - startTime < 200) {
        // 触发click事件console.log(event.starget)
        var $img = $(event.target)
        var $project = $img.parents('.div-dash')
        $project.trigger('click')
        thidDiv.attr("class", name);
        tempDiv.remove(); // 删除新建的虚线div
        choose = false;
        return false
      }
      if (!choose) {
          return false;
      }

      if (!move) {
          thidDiv.attr("class", name);
          tempDiv.remove(); // 删除新建的虚线div
          choose = false;
          return false;
      }

      thidDiv.insertBefore(tempDiv); // 拖拽元素插入到 虚线div的位置上
      thidDiv.attr("class", name); //恢复对象的初始样式
      tempDiv.remove(); // 删除新建的虚线div
      move = false;
      choose = false;
      cb && cb();

  }).on('mousemove', function (event) {
      if (!choose) return false;

      move = true;
      lastPos.x = event.pageX - range.x;
      lastPos.y = event.pageY - range.y;
      lastPos.x1 = lastPos.x + thidDivWidth;
      lastPos.y1 = lastPos.y + thidDivHeight;
      // 拖拽元素随鼠标移动
      thidDiv.css({left: lastPos.x + 'px', top: lastPos.y + 'px'});
      // 拖拽元素随鼠标移动 查找插入目标元素
      var $main = $('.' + name); // 局部变量：按照重新排列过的顺序 再次获取 各个元素的坐标，

      $main.each(function () {

          tarDiv = $(this);
          tarPos.x = tarDiv.offset().left;
          tarPos.y = tarDiv.offset().top;
          tarPos.x1 = tarPos.x + tarDiv.width() / 2;
          tarPos.y1 = tarPos.y + tarDiv.height() / 2;
          tarFirst = $main.eq(0); // 获得第一个元素
          tarFirstX = tarFirst.offset().left + thidDivHalfW; // 第一个元素对象的中心纵坐标
          tarFirstY = tarFirst.offset().top + thidDivHalfH; // 第一个元素对象的中心横坐标

          // 根据 拖拽对象x坐标 与 目标元素对象x坐标 对比，来显示 虚线div 在节点前、后出现的位置
          if (lastPos.x > tarPos.x) {

              // 判断要插入目标元素的 坐标后， 直接插入
              if (lastPos.x >= tarPos.x - thidDivHalfW && lastPos.x1 >= tarPos.x1 && lastPos.y >= tarPos.y - thidDivHalfH && lastPos.y1 >= tarPos.y1) {
                  tempDiv.insertAfter(tarDiv);
              }

              //拖拽对象 移动到第一个位置
              if (lastPos.x <= tarFirstX && lastPos.y <= tarFirstY) {
                  tempDiv.insertBefore(tarFirst);
              }

          } else {

              //拖拽对象 移动到第一个位置
              if (lastPos.x <= tarFirstX && lastPos.y <= tarFirstY) {
                  tempDiv.insertBefore(tarFirst);
              }

              // 判断要插入目标元素的 坐标后， 直接插入
              if (lastPos.x >= tarPos.x - thidDivHalfW && lastPos.x1 >= tarPos.x1 && lastPos.y >= tarPos.y - thidDivHalfH && lastPos.y1 >= tarPos.y1) {
                  tempDiv.insertAfter(tarDiv);
              }

          }

      });
  });
}
