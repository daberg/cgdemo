#!/bin/sh

killall -q webfsd && webfsd -p 8080 -f index.html -n localhost
