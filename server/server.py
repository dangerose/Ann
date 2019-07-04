import os
import json
import tornado.httpserver
import tornado.ioloop
import tornado.options
import tornado.web

from tornado.options import options, define

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
        menuId = self.get_argument('menuId', '/')
        picId = self.get_argument('picId', 'hello')
        file_imgs = self.request.files['img']
        menu_path = '../static/img/{0}'.format(menuId)
        save_to = '../static/img/{0}/{1}'.format(menuId, picId)
        try:
            if not os.path.exists(menu_path):
                os.makedirs(menu_path)

            for file_img in file_imgs:
                with open(save_to, 'wb') as f:
                    print('open ok')
                    f.write(file_img["body"])
                    print('write ok')
                    self.finish({"status":"ok",
                                  "msg": "操作成功"})
                    print('upload img success')

        except Exception as e:
            self.finish({"status": "fail",
                         "msg": str(e)}) 
            print(e)
                    


class DeleteHandler(BaseHandler):
    def post(self):
        pass
        
class GetPathHandler(BaseHandler):
    def get(self, *args, **kwargs):
        menuId = self.get_argument('menuId', None)
        picId = self.get_argument('picId', None)

        file_path = '../static/img/{0}/{1}'.format(menuId, picId)
        if os.path.exists(file_path):
            os.remove(file_path)
        else:
            pass



if __name__ == "__main__":
    tornado.options.parse_command_line()
    http_server = tornado.httpserver.HTTPServer(Application())
    http_server.listen(options.port)
    tornado.ioloop.IOLoop.instance().start()

