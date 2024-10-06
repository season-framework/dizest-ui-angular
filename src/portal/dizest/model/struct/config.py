import os
import sys
import season
import urllib
import json
import bcrypt
from dizest.extends.spawner import SimpleSpawner
from dizest.base.config import BaseConfig

project = wiz.project()

def storage_path():
    return os.path.join(os.getcwd(), "data")

def spawner_option():
    socket_uri = urllib.parse.urlparse(wiz.request.request().base_url)
    socket_uri = f"{socket_uri.scheme}://{socket_uri.netloc}"
    socket_namespace = f"/wiz/app/{project}/page.main"
    return dict(cwd=storage_path(), socket_uri=socket_uri, socket_namespace=socket_namespace)

def get_workflow(path):
    fs = season.util.fs(storage_path())
    if fs.exists(path) == False:
        return None
    data = fs.read.json(path, None)
    data['id'] = path

    if 'flow' in data:
        for flow_id in data['flow']:
            flow = data['flow'][flow_id]
            if 'active' not in flow:
                if 'inactive' in flow:
                    flow['active'] = False if flow['inactive'] else True
                    del flow['inactive']
                else:
                    flow['active'] = True

    return data

def update_workflow(path, data):
    fs = season.util.fs(storage_path())
    data = json.dumps(data, default=season.util.string.json_default)
    fs.write(path, data)

def authenticate(path):
    if path == 'login':
        passwd = wiz.request.query("password", True)

        def check(password):
            try:
                fs = season.util.fs(os.getcwd())
                value = fs.read("password")
                value = value.encode('utf-8')
                def check_password(password):
                    password = password.encode('utf-8')
                    return bcrypt.checkpw(password, value)
                if check_password(password):
                    return True
            except Exception as e:
                return str(e)
            return "incorrect password"

        chk = check(passwd)
        if chk is True:
            wiz.session.set(id="root")
            wiz.response.status(200, True)
        
        wiz.response.status(401, chk)

    redirect = wiz.request.query("redirect", None)
    if redirect:
        wiz.response.redirect("/access?redirect=" + redirect)
    wiz.response.redirect("/access")

def logout(path):
    wiz.session.clear()
    wiz.response.redirect("/")

def acl():
    if wiz.session.user_id() is None:
        wiz.response.status(401)

class Config(BaseConfig):
    DEFAULT_VALUES = {
        'fs': (None, season.util.fs(storage_path())), 
        'disk': (str, "/"), 
        'use_ai': (str, "notuse"), 
        'llm_gateway': (str, "https://api.openai.com/v1"), 
        'llm_api_key': (str, ""), 
        'llm_model': (str, "gpt-4o"), 
        'spawner_class': (None, SimpleSpawner),
        'spawner_option': (None, spawner_option),
        'storage_path': (None, storage_path),
        'get_workflow': (None, get_workflow),
        'update_workflow': (None, update_workflow),
        'authenticate': (None, authenticate),
        'logout': (None, logout),
        'acl': (None, acl),
    }

fs = season.util.fs(os.getcwd())
config = dict()

if fs.exists("config.py"):
    code = fs.read("config.py", "")
    configfile = season.util.compiler().build(code, name="dizest.config", logger=print, wiz=wiz).fn
    for key in configfile:
        if key in Config.DEFAULT_VALUES:
            config[key] = configfile[key]

Model = Config(config)