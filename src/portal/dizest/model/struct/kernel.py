import os
import sys
import requests
import datetime
import season
import json
import uuid

Workflow = wiz.model("portal/dizest/struct/workflow")

class Model:
    def __init__(self, core, id=None):
        self.core = core
        self.id = id
        if id is None:
            return
        
        self.path = None
        opts = core.config.spawner_option()
        opts['id'] = self.id
        self.spawner = core.config.spawner_class(**opts)
        self.spawner.start()
        self.workflow = Workflow(self)

    """
    static functions
    """
    def __call__(self, id):
        cache = self.cache()
        if id is None:
            id = str(uuid.uuid1())

        if id not in cache:
            id = str(uuid.uuid1())
            cache[id] = Model(self.core, id)
        return cache[id]
    
    def cache(self):
        cache = self.core.cache()
        if 'kernel' not in cache:
            cache.kernel = season.util.stdClass()
        return cache.kernel
    
    def list(self):
        cache = self.core.cache().kernel
        res = []
        for kernel_id in cache:
            kernel = cache[kernel_id]
            res.append(kernel)
        return res
        
    """
    instance functions
    """
    def uri(self):
        if self.id is None: return
        return self.spawner.uri()

    def status(self):
        if self.id is None: return
        return self.spawner.status()
    
    def update(self, data):
        if self.path is None:
            return None
        path = self.path
        return self.workflow.update(path, data)
