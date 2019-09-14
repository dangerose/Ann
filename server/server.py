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
            (r"/admin", LoginHandler),
            (r"/upload_img", UploadHandler),
            (r"/delete_img", DeleteHandler),
            (r"/get_img_path", GetPathHandler),
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
        print('posting')
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
                mini_img = img.resize(new_size,Image.ANTIALIAS)
                mini_img.save(min_img)
                

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
        miniChar = 'mini_'
        file_path = '../static/img/{0}/{1}'.format(menuId, picId)
        full_path = ''

        if miniChar in picId:
            full_path = file_path.replace(miniChar, '')

        return_status = {
            "status": None,
            "msg": None
        }

        try:
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
            files = os.listdir(menu_path)
            for f in files:
                if not os.path.isdir(f):
                    file_path = '{0}{1}'.format(menu_path, f)
                    print('****opening file %s', file_path)
                    img = Image.open(file_path)
                    img_size = img.size
                    min_size = min(img_size)
                    max_size = max(img_size)
                    data = {}
                    picId = str(f)
                    size = "{0}*{1}".format(str(max_size), str(min_size)) 
                    data['picId'] = picId
                    data['size'] = '{0}*{1}'.format(max_size,min_size)
                    return_data['status'] = 'ok'
                    return_data['msg'] = 'success'
                    return_data['data'].append(data)

        except Exception as e:
            return_data['status']='fail'
            return_data['msg']=str(e)
            
        finally:
            self.finish(return_data)

class StaticHandler(tornado.web.StaticFileHandler):
    def set_extra_headers(self, path):
        self.set_header('Cache-Control', 'max-age=1')



if __name__ == "__main__":
    tornado.options.parse_command_line()
    http_server = tornado.httpserver.HTTPServer(Application())
    http_server.listen(options.port)
    tornado.ioloop.IOLoop.instance().start()

