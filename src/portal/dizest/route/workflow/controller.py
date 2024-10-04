import season
import os
import math
import json
import time
import datetime
import shutil
import zipfile
import tempfile

segment = wiz.request.match("/api/dizest/workflow/<path:path>")
action = segment.path
struct = wiz.model("portal/dizest/struct")
config = struct.config

if action == 'load':
    path = wiz.request.query("path", True)
    data = config.get_workflow(path)
    wiz.response.status(200, data)

if action == 'init':
    path = wiz.request.query("path", True)
    data = config.get_workflow(path)

    kernel_id = None
    if 'kernel_id' in data:
        kernel_id = data['kernel_id']

    kernel = struct.kernel(kernel_id)
    kernel.path = path
    kernel_id = kernel.id

    data = kernel.update(data)
    if data is None:
        wiz.response.status(400, "path not defined")
    wiz.response.status(200, data)

kernel_id = wiz.request.query("kernel_id", True)
kernel = struct.kernel(kernel_id)

if action == 'update':
    data = json.loads(wiz.request.query("data", True))
    data = kernel.update(data)
    if data is None:
        wiz.response.status(400, "path not defined")    
    wiz.response.status(200, data)

if action == 'status':
    status = kernel.workflow.status()
    flow_status = kernel.workflow.flow.status()
    wiz.response.status(200, workflow=status, flow=flow_status)

if action == 'run':
    kernel.workflow.run()
    wiz.response.status(200)

if action == 'stop':
    kernel.workflow.stop()
    wiz.response.status(200)

if action == "flow/run":
    flow_id = wiz.request.query("flow_id")
    res = kernel.workflow.flow.run(flow_id)
    wiz.response.status(res.code, res.data)

if action == "flow/stop":
    flow_id = wiz.request.query("flow_id")
    res = kernel.workflow.flow.stop(flow_id)
    wiz.response.status(res.code)

wiz.response.status(404)