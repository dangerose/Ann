import os
import tornado.httpserver
import tornado.ioloop
import tornado.options
import tornado.web

from tornado.options import options, define

define("port", default=8080, help="running on given port", type=int)

class Application(tornado.web.Application):
    def __init__(self):
        handlers = [
            (r"/", MainHandler),
            (r"/login", LoginHandler),
            (r"/logout", LogoutHandler),
            (r"/upload", UploadHandler),
            (r"/delete", DeleteHandler),
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
    def post(self):
        pass

class LogoutHandler(BaseHandler):
    def post(self):
        pass

class UploadHandler(BaseHandler):
    def post(self):
        pass

class DeleteHandler(BaseHandler):
    def post(self):
        pass

if __name__ == "__main__":
    tornado.options.parse_command_line()
    http_server = tornado.httpserver.HTTPServer(Application())
    http_server.listen(options.port)
    tornado.ioloop.IOLoop.instance().start()
