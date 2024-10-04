import os
import sys
import season
import urllib
import json
import bcrypt
from dizest.extends.spawner import SimpleSpawner
from dizest.base.config import BaseConfig

project = wiz.project()

condapath = str(sys.executable)
condapath = os.path.dirname(condapath)
condapath = os.path.dirname(condapath)
if condapath.split("/")[-2] == "envs":
    condapath = os.path.dirname(condapath)
    condapath = os.path.dirname(condapath)

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

    wiz.response.redirect("/access")

def acl_workflow():
    if wiz.session.user_id() is None:
        wiz.response.status(401)

def acl_cron():
    ip = wiz.request.ip()
    return ip == '127.0.0.1'

class Config(BaseConfig):
    DEFAULT_VALUES = {
        'fs': (None, season.util.fs(storage_path())), 
        'condapath': (str, condapath),
        'spawner_class': (None, SimpleSpawner),
        'spawner_option': (None, spawner_option),
        'storage_path': (None, storage_path),
        'get_workflow': (None, get_workflow),
        'update_workflow': (None, update_workflow),
        'authenticate': (None, authenticate),
        'acl_cron': (None, acl_cron),
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