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