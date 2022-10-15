import os
import season
import json
import datetime
from flask import Response
from crontab import CronTab
import urllib

if wiz.request.uri().split("/")[4] != 'drive_api':
    workflow_id = wiz.request.query("workflow_id", True)
    namespace = wiz.request.query("namespace", True)
    user = wiz.session.get("id")
    server_id = namespace + "-" + user

    db = wiz.model("orm").use(namespace)
    server = wiz.model("dizest").load(server_id).server(user=user)
    workflow = server.workflow_by_id(workflow_id)

def kernel():
    data = server.kernelspecs()
    rows = []
    for item in data:
        item = server.kernelspec(item)
        rows.append(item)
    wiz.response.status(200, rows)

def get():
    data = db.get(id=workflow_id, user=user)
    if workflow is not None:
        data['status'] = workflow.status()
        data['kernel'] = workflow.kernelspec()
    else:
        data['status'] = 'stop'
        data['kernel'] = server.kernelspecs()[0]
    wiz.response.status(200, data)

def update():
    try:
        data = wiz.request.query("data", True)
        data = json.loads(data)
        if 'created' not in data:
            data['created'] = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        data['updated'] = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        try:
            del data['language']
        except:
            pass
        workflow.update(data)
        db.update(data, id=workflow_id)
    except Exception as e:
        wiz.response.status(500, str(e))
    wiz.response.status(200)

def start():
    specs = server.kernelspecs()
    spec = wiz.request.query("spec", None)
    if spec not in specs:
        wiz.response.status(500, f'not supported kernel spec')
    
    workflow = server.workflow_by_id(workflow_id)    
    if workflow is None:
        wpdata = db.get(id=workflow_id, user=user)
        workflow = server.workflow(wpdata)

    workflow.spawn(kernel_name=spec)
    wiz.response.status(200)

def kill():
    try:
        workflow.kill()
    except:
        pass
    wiz.response.status(200)

def run():
    try:
        fids = wiz.request.query("flow", None)
        if fids is None:
            workflow.run()
        else:
            fids = fids.split(",")
            for fid in fids:
                flow = workflow.flow(fid)
                flow.run()
    except Exception as e:
        wiz.response.status(500, str(e))
    wiz.response.status(200)

def stop():
    try:
        workflow.stop()
    except:
        pass
    wiz.response.status(200)

def kill():
    try:
        workflow.kill()
    except:
        pass
    wiz.response.status(200)

def status():
    log = wiz.request.query("log", False)
    if log == 'true': log = True
    else: log = False

    status = dict()
    try:
        flows = workflow.flows()
        for flow_id in flows:
            try:
                flow = workflow.flow(flow_id)
            except:
                pass            
            try:
                status[flow_id] = dict()
                status[flow_id]['flow_id'] = flow_id
                status[flow_id]['status'] = flow.status()
                status[flow_id]['index'] = flow.index()
            except:
                pass

            if log:
                try:
                    logs = flow.log()
                    status[flow_id]['log'] = "".join(logs)
                except:
                    pass
    except Exception as e:
        print(e)
        pass

    wiz.response.status(200, status)

def drive_api(segment):
    segment = segment.path.split("/")

    namespace = segment[0]
    workflow_id = segment[1]
    user = wiz.session.get("id")
    server_id = namespace + "-" + user

    db = wiz.model("orm").use(namespace)
    server = wiz.model("dizest").load(server_id).server(user=user)
    workflow = server.workflow_by_id(workflow_id)

    fnname = segment[2]
    path = "/".join(segment[3:])
    
    request = wiz.request.request()
    resp = None
    
    if fnname == 'ls':
        resp = server.drive_api.ls(path)
    elif fnname == 'create':
        data = wiz.request.query()
        resp = server.drive_api.create(path, data)
    elif fnname == 'rename':
        data = wiz.request.query()
        resp = server.drive_api.rename(path, data)
    elif fnname == 'remove':
        data = wiz.request.query()
        resp = server.drive_api.remove(path, data)
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
            server.drive_api.upload(path, method=request.method, files={"file": fd}, data=fdd)
        wiz.response.status(200)
    elif fnname == 'download':
        resp = server.drive_api.download(path)

    if resp is None:
        wiz.response.status(404)
    
    excluded_headers = ['content-encoding', 'content-length', 'transfer-encoding', 'connection']
    headers = [(name, value) for (name, value) in resp.raw.headers.items() if name.lower() not in excluded_headers]
    response = Response(resp.content, resp.status_code, headers)
    wiz.response.response(response)