# simple-server.py
import http.server
import socketserver
import urllib.request
import sys

class FlagHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        try:
            print('Fetching flag...', file=sys.stderr)
            
            with urllib.request.urlopen('http://127.0.0.1:3000/flag') as response:
                flag = response.read().decode('utf-8')
            
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            self.wfile.write(f'<h1>FLAG:</h1><pre>{flag}</pre>'.encode())
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'text/html')  
            self.end_headers()
            self.wfile.write(f'<h1>Error:</h1><pre>{str(e)}</pre>'.encode())

with socketserver.TCPServer(("", 8080), FlagHandler) as httpd:
    print("Server running on port 8080")
    httpd.serve_forever()