import os
import json
import tornado.httpserver
import tornado.ioloop
import tornado.options
import tornado.web
import pymysql.cursors

from tornado.options import options, define
from urllib import parse
from PIL import Image

define("port", default=8081, help="running on given port", type=int)
define("username", default="admin", help="user name", type=str)
define("passwd", default="ann123456", help="password", type=str)

# 连接数据库
connect = pymysql.Connect(
    host='101.132.227.116',
    port=3306,
    user='root',
    passwd='Hh7664575',
    db='zhengming',
    charset='utf8'
)

sqlQueryMax = "select max(num) from picjf where menuId = '%s'"
sqlQueryByMenu = "select * from picjf where menuId = '%s' ORDER BY num"
sqlQueryByPicId = "select * from picjf where picId = '%s'"
sqlInsert = "INSERT INTO picjf (picId, name, num, path, size, menuId) VALUES ( '%s', '%s', '%d', '%s', '%s', '%s' )"
sqlDel = "DELETE FROM picjf WHERE picId = '%s'"
sqlSortDown = "UPDATE picjf SET num = num - 1 WHERE num > %d"

# 获取游标
cursor = connect.cursor()

class Application(tornado.web.Application):
    def __init__(self):
        handlers = [
            (r"/", MainHandler),
            (r"/admin", LoginHandler),
            (r"/upload_img", UploadHandler),
            (r"/delete_img", DeleteHandler),
            (r"/get_img_path", GetPathHandler),
            (r"/resort_img", reSortHandler),
            (r"/static/(.*)", StaticHandler, {'path': os.path.join(os.path.dirname(__file__), "../static")})
        ]
        settings = dict(
            template_path=os.path.join(os.path.dirname(__file__), "../views"),
            debug=True,
        )
        tornado.web.Application.__init__(self, handlers, **settings)


class BaseHandler(tornado.web.RequestHandler):
    def get_current_user(self):
        #return self.get_secure_cookie("username")
        pass


class MainHandler(BaseHandler):
    def get(self):
        self.set_header('Cache-Control', 'max-age=1')
        self.render('index.html')


class LoginHandler(BaseHandler):
    def get(self, *args, **kwargs):
        self.set_header('Cache-Control', 'max-age=1')
        self.render('index.html')


class UploadHandler(BaseHandler):
    def post(self, *args, **kwargs):
        menuId = self.get_argument('menuId', '/')
        picId = self.get_argument('picId', 'hello')
        file_imgs = self.request.files['img']
        menu_path = '../static/img/{0}'.format(menuId)
        save_to = '../static/img/{0}/{1}'.format(menuId, picId)
        min_img = '../static/img/{0}/mini_{1}'.format(menuId, picId)
        return_status = {
            "status": None,
            "msg": None
        }
        print(menu_path)
        print(save_to)
        try:
            if not os.path.exists(menu_path):
                os.makedirs(menu_path)

            for file_img in file_imgs:
                with open(save_to, 'wb') as f:
                    f.write(file_img["body"])
                    return_status["status"] = "ok"
                    return_status["msg"] = "success"
                
                img = Image.open(save_to)

                width = img.size[0]
                height = img.size[1]
                print('origin {0} *{1}'.format(width, height))

                if height > 150:
                    width = width * 150.0 / height
                new_size = (int(width), 150)
                print('new {0} * 150'.format(width))
                mini_img = img.resize(new_size,Image.BILINEAR)
                mini_img.save(min_img)

                # 查询最大排序
                cursor.execute(sqlQueryMax % (menuId))
                results = cursor.fetchall()
                max_num = 0
                for row in results:
                    if row[0] is not None:
                        max_num = row[0] + 1
                # 插入表中
                data = (picId, picId, max_num, save_to, new_size, menuId)
                cursor.execute(sqlInsert % data)
                connect.commit()
                print('成功插入', cursor.rowcount, '条数据')
                

        except Exception as e:
            return_status["status"] = "fail"
            return_status["msg"] = str(e)
            print(e)

        finally:
            self.finish(return_status)
                    


class DeleteHandler(BaseHandler):
    def get(self, *args, **kwargs):
        menuId = self.get_argument('menuId', None)
        miniPicId = self.get_argument('picId', None)
        miniChar = 'mini_'
        picId = miniPicId.replace(miniChar, '')
        file_path = '../static/img/{0}/{1}'.format(menuId, miniPicId)
        full_path = '../static/img/{0}/{1}'.format(menuId, picId)

        return_status = {
            "status": None,
            "msg": None
        }

        try:
            # 查出序号
            cursor.execute(sqlQueryByPicId % picId)
            picInfo = cursor.fetchone()
            picNum = picInfo[2]
            # 删除数据库行
            cursor.execute(sqlDel % picId)
            connect.commit()
            # 更新其它排序
            cursor.execute(sqlSortDown % picNum)
            connect.commit()
            # 删除文件
            if os.path.exists(file_path):
                os.remove(file_path)
                if os.path.exists(full_path):
                    os.remove(full_path)
                return_status["status"] = "ok"
                return_status["msg"] = "success"
                print("delete ok")

            else:
                return_status["status"] = "fail"
                return_status["msg"] = file_path + " not found"
                print("delete not found")

        except Exception as e:
            return_status["status"] = "fail"
            return_status["msg"] = str(e)
            print(str(e))

        finally:
            self.finish(return_status)
        

class GetPathHandler(BaseHandler):
    def get(self, *args, **kwargs):
        menuId = self.get_argument('menuId', None)
        menu_path = '../static/img/{0}/'.format(menuId)

        return_data = {
            "status": None,
            "msg": None,
            "data": []
        }

        if not os.path.exists(menu_path):
            return_data['status']='fail'
            return_data['msg']='{0} not exists.'.format(menu_path)
            self.finish(return_data)
            return
        try:
            cursor.execute(sqlQueryByMenu % (menuId))
            table = cursor.fetchall()
            for row in table:
                if row[0] is not None:
                    file_path = row[3]
                    if os.path.exists(file_path):
                        img = Image.open(file_path)
                        img_size = img.size
                        min_size = min(img_size)
                        max_size = max(img_size)
                        data = {}
                        picId = row[0]
                        size = "{0}*{1}".format(str(max_size), str(min_size))
                        data['picId'] = picId
                        data['num'] = row[2]
                        data['size'] = '{0}*{1}'.format(max_size,min_size)
                        return_data['status'] = 'ok'
                        return_data['msg'] = 'success'
                        return_data['data'].append(data)

        except Exception as e:
            return_data['status']='fail'
            return_data['msg']=str(e)
            
        finally:
            self.finish(return_data)

class reSortHandler(BaseHandler):
    def post(self, *args, **kwargs):
        body = self.request.body
        args = dict([x.split('=') for x in body.decode().split('&')])
        pic_data = args.get('picData')
        pic_data = parse.unquote(pic_data)
        pic_data = json.loads(pic_data)

        return_status = {
            "status": None,
            "msg": None
        }

        sql = 'UPDATE picjf SET num = case picId'
        try:
            for pic in pic_data:
                sql = sql + ' WHEN \'' + pic['picId'] + '\' THEN ' + str(pic['num'])
            sql = sql + ' END'
            cursor.execute(sql)
            connect.commit()
            return_status["status"] = "ok"
            return_status["msg"] = "success"

        except Exception as e:
            return_status["status"] = "fail"
            return_status["msg"] = str(e)
            print(e)

        finally:
            self.finish(return_status)


class StaticHandler(tornado.web.StaticFileHandler):
    def set_extra_headers(self, path):
        self.set_header('Cache-Control', 'max-age=1')



if __name__ == "__main__":
    tornado.options.parse_command_line()
    http_server = tornado.httpserver.HTTPServer(Application())
    http_server.listen(options.port)
    tornado.ioloop.IOLoop.instance().start()

