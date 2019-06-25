#!/usr/local/bin/python3
# -*- coding: utf-8 -*-
#
from httpserver import HttpMuxServer


if __name__ == '__main__':

    _httpd1 = HttpMuxServer(8080, bind='127.0.0.1', doDebug=True)
    _httpd1.start()

