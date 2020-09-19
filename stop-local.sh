#!/bin/sh

if [ ! -f /tmp/cgdemopid ]; then
    echo "No instance running"
    exit 1
fi

pid=$(cat /tmp/cgdemopid)

kill $pid && echo "Instance killed ($pid)"
