import os
import json
import tornado.httpserver
import tornado.ioloop
import tornado.options
import tornado.web

from tornado.options import options, define
from PIL import Image

define("port", default=8080, help="running on given port", type=int)
define("username", default="admin", help="user name", type=str)
define("passwd", default="ann123456", help="password", type=str)

class Application(tornado.web.Application):
    def __init__(self):
        handlers = [
            (r"/", MainHandler),
            (r"/login", LoginHandler),
            (r"/logout", LogoutHandler),
            (r"/upload_img", UploadHandler),
            (r"/delete_img", DeleteHandler),
            (r"/get_img_path", GetPathHandler),
        ]
        settings = dict(
            template_path=os.path.join(os.path.dirname(__file__), "../views"),
            static_path=os.path.join(os.path.dirname(__file__), "../static"),
            debug=True,
        )
        tornado.web.Application.__init__(self, handlers, **settings)


class BaseHandler(tornado.web.RequestHandler):
    def get_current_user(self):
        #return self.get_secure_cookie("username")
        pass


class MainHandler(BaseHandler):
    def get(self):
        self.render('index.html')


class LoginHandler(BaseHandler):
    def get(self, *args, **kwargs):
        self.render('login.html')

    def post(self, *args, **kwargs):
        username = self.get_argument('username', None)
        passwd = self.get_argument('passwd', None)

        if username == options.username and passwd == options.passwd:
            self.set_cookie(username, passwd)
            self.redirect('/')
        else:
            self.render('login.html')

class LogoutHandler(BaseHandler):
    def post(self):
        pass

class UploadHandler(BaseHandler):
    def post(self, *args, **kwargs):
        print('posting')
        menuId = self.get_argument('menuId', '/')
        picId = self.get_argument('picId', 'hello')
        file_imgs = self.request.files['img']
        menu_path = '../static/img/{0}'.format(menuId)
        save_to = '../static/img/{0}/{1}'.format(menuId, picId)
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

        except Exception as e:
            return_status["status"] = "fail"
            return_status["msg"] = str(e)
            print(e)

        finally:
            self.finish(return_status)
                    


class DeleteHandler(BaseHandler):
    def get(self, *args, **kwargs):
        menuId = self.get_argument('menuId', None)
        picId = self.get_argument('picId', None)

        file_path = '../static/img/{0}/{1}'.format(menuId, picId)
        return_status = {
            "status": None,
            "msg": None
        }
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
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

        files = os.listdir(menu_path)
        return_data = {
            "status": None,
            "msg": None,
            "data": []
        }
        for f in files:
            if not os.path.isdir(f):
                print('deleting file %s', f)
                file_path = menu_path.format(f)
                img = Image.open(file_path)
                img_size = img.size
                min_size = min(img_size)
                max_size = max(img_size)
                if os.path.splitext(f)[1]=='.jpg' or os.path.splitext(f)[1]=='.png':
                    data = {}
                    picId = os.path.splitext(f)[0]
                    size = "{0}*{1}".format(str(max_size), str(min_size)) 
                    data['picId'] = picId
                    data['size'] = size
                    return_data['data'].append(data)
        
        self.finish(return_data)



if __name__ == "__main__":
    tornado.options.parse_command_line()
    http_server = tornado.httpserver.HTTPServer(Application())
    http_server.listen(options.port)
    tornado.ioloop.IOLoop.instance().start()

