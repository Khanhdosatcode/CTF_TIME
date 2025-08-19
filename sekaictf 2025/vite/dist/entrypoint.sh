#!/bin/bash

gcc /root/flag.s -static -nostdlib -o /flag && strip /flag && chmod 1 /flag
/usr/bin/supervisord -c /etc/supervisord.conf