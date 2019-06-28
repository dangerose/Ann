import os
import tornado.httpserver
import tornado.ioloop
import tornado.options
import tornado.web

from tornado.options import options, define

define("port", default=8080, help="running on given port", type=int)

class MainHandler(tornado.web.RequestHandler):
    def get(self):
        self.render('index.html')


if __name__ == "__main__":
    tornado.options.parse_command_line()
    app = tornado.web.Application(
            handlers=[(r"/", MainHandler)],
            template_path=os.path.join(os.path.dirname(__file__), "../views"),
            static_path=os.path.join(os.path.dirname(__file__), "../static")
        )
    http_server = tornado.httpserver.HTTPServer(app)
    http_server.listen(options.port)
    tornado.ioloop.IOLoop.instance().start()
