#!/bin/sh

if [ -f /tmp/cgdemopid ]; then
    echo "An instance is already running ($(cat /tmp/cgdemopid))"
    exit 1
fi

webfsd -p 8080 -f index.html -n localhost -k /tmp/cgdemopid && echo "Started instance ($(cat /tmp/cgdemopid))"
