namespace = "workflow"
user = wiz.session.get("id")
server_id = namespace + "-" + user
workflow_id = wiz.request.query("workflow_id", True)

db = wiz.model("orm").use(namespace)

def run():
    server = wiz.model("dizest").load(server_id).server(user=user)
    specs = server.kernelspecs()
    spec = wiz.request.query("spec", None)
    if spec is None:
        spec = specs[0]
    
    workflow = server.workflow_by_id(workflow_id)
    if workflow is None:
        wpdata = db.get(id=workflow_id)
        workflow = server.workflow(wpdata)

    workflow.spawn(kernel_name=spec)
    wiz.response.status(200)

def stop():
    server = wiz.model("dizest").load(server_id).server(user=user)
    specs = server.kernelspecs()
    try:
        workflow = server.workflow_by_id(workflow_id)
        workflow.kill()
    except:
        pass
    wiz.response.status(200)
