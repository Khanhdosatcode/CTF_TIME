#!/bin/bash

gcc /root/flag.s -static -nostdlib -o /flag && strip /flag && chmod 1 /flag
java -jar target/hn-1.0-SNAPSHOT-jar-with-dependencies.jar