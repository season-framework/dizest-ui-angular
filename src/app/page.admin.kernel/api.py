import os
import json

if wiz.session.get("role") != "admin":
    wiz.response.abort(401)

fs = wiz.workspace("service").fs("config")

def load():
    config = fs.read.json("kernel.json", [])
    wiz.response.status(200, config)

def update():
    data = wiz.request.query("data", True)
    data = json.loads(data)
    config = fs.write.json("kernel.json", data)
    wiz.response.status(200)

def conda_list():
    result = os.popen('ls /').read()
