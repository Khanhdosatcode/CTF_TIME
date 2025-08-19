#!/bin/sh
asc -o out.wasm \
 --use abort=index/abort_stub \
 --enable reference_types \
 --enable gc \
 --debug \
 ./index.ts