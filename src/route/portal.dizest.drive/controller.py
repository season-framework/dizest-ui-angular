from flask import Response
import json

segment = wiz.request.match("/dizest/drive/<path:path>")
segment = segment.path.split("/")

uWebClass = wiz.model("portal/dizest/uweb")

uweb = uWebClass()

fnname = segment[0]
path = "/".join(segment[1:])

request = wiz.request.request()
resp = None

if fnname == 'ls':
    resp = uweb.drive.ls(path)
elif fnname == 'create':
    data = wiz.request.query()
    resp = uweb.drive.create(path, data)
elif fnname == 'rename':
    data = wiz.request.query()
    resp = uweb.drive.rename(path, data)
elif fnname == 'remove':
    data = wiz.request.query()
    resp = uweb.drive.remove(path, data)
elif fnname == 'upload':
    filepath = wiz.request.query("filepath", "[]")
    filepath = json.loads(filepath)
    files = wiz.request.files()
    for i in range(len(files)):
        f = files[i]
        fd = (f.filename, f.stream, f.content_type, f.headers)
        fdd = dict()
        if len(filepath) > 0: 
            fdd['filepath'] = filepath[i]
        uweb.drive.upload(path, method=request.method, files={"file": fd}, data=fdd)
    wiz.response.status(200)
elif fnname == 'download':
    resp = uweb.drive.download(path)

if resp is None:
    wiz.response.status(404)

excluded_headers = ['content-encoding', 'content-length', 'transfer-encoding', 'connection']
headers = [(name, value) for (name, value) in resp.raw.headers.items() if name.lower() not in excluded_headers]
response = Response(resp.content, resp.status_code, headers)
wiz.response.response(response)