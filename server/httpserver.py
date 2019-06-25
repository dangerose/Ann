#!/usr/local/bin/python3
# -*- coding: utf-8 -*-

import logging, threading, os, json, urllib, time, ssl, datetime
import http.client, http.server
from random import Random

from urllib.parse import urlparse
from http.server import BaseHTTPRequestHandler
from http.server import HTTPServer
from http.server import HTTPStatus


class HttpHandler(BaseHTTPRequestHandler):
    _internal_keys = ['protocol', 'statuscode', 'body', 'bodyfrom']
    _time_elems = ['Date', 'Expires', 'Last-Modified']
    _ext_name = '.json'

    def do_GET(self):
        self._handle_request()

    def do_HEAD(self):
        self._handle_request()

    def do_POST(self):
        self._handle_request()

    def _handle_request(self):
        # keep current client request headers.
        self.server.append_header(self.headers)

        self.server.set_url('http://' + self.headers['Host'] + self.path)

        if self.server.doDebug is True:
            print("====handle request====")
            now = datetime.datetime.now()
            print(now)
            print(self.server.address)
            print(self.command + " " + self.path + " " + self.request_version)
            print(self.headers)

        if self.command == 'POST':
            post_body, ret = self._get_post_body()
            if ret is False:
                self.send_error(HTTPStatus.BAD_REQUEST)
                return

        items = self._get_response_items()
        if items is None:
            self.send_error(HTTPStatus.NOT_FOUND)
        else:
            self._do_response(items['Response'])

    def _get_post_body(self):
        cl_str = self.headers['Content-Length']

        if cl_str is not None:
            post_body = self.rfile.read(int(cl_str))
            if self.server.doDebug is True:
                print("read body length: %d" % len(post_body))
            return post_body, True
        else:
            return None, False


    def _do_response(self, resp_data):
        if self.server.custom_resp != {}:
            resp_data = self._set_custom_response(resp_data)

        ext_hdrs = {}
        status_code = None

        body, body_len = self._get_body(resp_data)

        if self.command == 'HEAD':
            http_range = None

        custom_content_length = self.server.custom_resp.get('Content-Length')
        if custom_content_length is not None:
            ext_hdrs['Content-Length'] = custom_content_length

        elif body is not None:
            ext_hdrs['Content-Length'] = len(body)

        custom_resp_status = self.server.custom_resp.get('statuscode')
        if custom_resp_status is not None:
            status_code = custom_resp_status

        self._do_send_headers(resp_data, status_code, ext_hdrs)
        if self.command == 'HEAD':
            return

        length = 0
        try:
            length = self._do_send_body(body)
        except (ConnectionResetError, BrokenPipeError) as err:
            if self.server.doDebug is True:
                print(err)
            pass
        
        if self.server.doDebug is True:
            print("====send bytes: %d====" % length)

    def _set_custom_response(self, resp_data):
        for k, v in self.server.custom_resp.items():
            if k != 'Range' and k != 'sleeptime':
                resp_data[k] = self.server.custom_resp[k]
                
        return resp_data

    def _get_response_items(self):
        file_path = self._get_request_file_path()

        file_path = file_path.replace('%20', '')

        if os.access(file_path, os.F_OK):
            with open(file_path) as f:
                items = json.load(f)
            assert(items is not None)
            return items
        else:
            return None


    def _do_send_headers(self, resp_data, status_code=None, ext_hdrs={}):
        self.protocol_version = resp_data['protocol']

        if status_code is None:
            status_code = resp_data['statuscode']

        self.send_response(int(status_code))
        if self.server.doDebug is True:
            print("====status_code: %d====" % status_code)

        for k, v in resp_data.items():
            if k in self._internal_keys:
                continue
            if k in self._time_elems:
                v = self._format_gmt_time(v)
            self.send_header(k, v)

        for k, v in ext_hdrs.items():
            self.send_header(k, v)

        self.end_headers()


    def _do_send_body(self, body=None):
        if body is None:
            return 0

        if type(body) == str:
            body = bytes(body, "utf-8")

        length = self.wfile.write(body)

        return length

    def _get_body(self, resp_data):
        body = resp_data.get('body')
        if body is None:
            body_from = resp_data.get('bodyfrom')
            if body_from is not None:
                body = self._get_body_from(body_from)

        length = None
        if body is not None:
            length = len(body)
        return body, length

    def _get_body_from(self, body_path):
        body = None
        if os.path.exists(body_path):
            with open(body_path, 'rb') as fh:
                body = fh.read()
                fh.close()

        return body


    def _format_gmt_time(self, value):
        cur_time = int(time.time())
        words = value.split()
        if words[0] != 'now' and len(words) == 1:
            return int(words[0])

        if len(words) == 3:
            if words[1] == '-':
                cur_time -= int(words[2])
            elif words[1] == '+':
                cur_time += int(words[2])
            return time.strftime("%a, %d %b %Y %H:%M:%S GMT", time.gmtime(cur_time))

        return value

    def _get_request_file_path(self):
        return self._get_json_file_path()

    def _get_json_file_path(self):
        host = self.headers['Host'].split(':')[0]
        res = urllib.parse.urlparse(self.path)
        url_path = '/' + os.path.basename(res.path)

        # is root path, use index.html
        if url_path == '/':
            url_path += '/index.html'

        join_path = os.getcwd() + '/www/' + host + url_path + self._ext_name
        print(join_path)
        return join_path


# 针对HTTPServer的封装,用于记录到服务端的请求头信息
class ServerWarp(HTTPServer):
    def __init__(self, server_address, RequestHandlerClass, doDebug=False):
        HTTPServer.__init__(self, server_address, RequestHandlerClass)
        self.request_headers = {}
        self.custom_resp = {}
        self.request_url = ''
        self.doDebug = doDebug
        self.address = server_address

    def append_header(self, hdrs):
        if self.doDebug is True:
            print("====appending headers...====")
            now = datetime.datetime.now()
            print(now)
            print(hdrs)
        for k, v in hdrs.items():
            if self.request_headers.get(k) is None:
                self.request_headers[k] = v
            else:
                self.request_headers[k] += v

    def set_url(self, url):
        self.request_url = url

    def new_test_case(self):
        self.request_url = ''
        self.request_headers.clear()

    def set_custom_response(self, custom_resp):
        self.custom_resp = custom_resp

    def clear_response(self):
        self.custom_resp.clear()


# HTTPServer线程的封装.
class HttpMuxServer(threading.Thread):
    def __init__(self, port=8080, bind='localhost', keyfile=None, certfile=None, doDebug=False):
        ser_name = '%s:%d' % (bind, port)
        threading.Thread.__init__(self, name=ser_name)
        self._server_address = (bind, port)
        self._httpd = ServerWarp(self._server_address, HttpHandler, doDebug)
        self._keyfile = keyfile
        self._certfile = certfile

    def run(self):
        sa = self._httpd.socket.getsockname()
        self._httpd.serve_forever()

    def stop(self):
        self._httpd.shutdown()
        self._httpd.server_close()
        self.join(2)

    def get_request_headers(self):
        return self._httpd.request_headers

    def set_debug(self, doDebug):
        self._httpd.doDebug = doDebug

    def new_test_case(self):
        self._httpd.new_test_case()

    def set_custom_response(self, custom_resp):
        self._httpd.set_custom_response(custom_resp)

    def clear_response(self):
        self._httpd.clear_response()



