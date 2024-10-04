segment = wiz.request.match("/api/dizest/auth/<path:path>")
struct = wiz.model("portal/dizest/struct")
config = struct.config
config.authenticate(segment.path)