from biodm.components.controllers import ResourceController
from biodm.utils.security import admin_required


class ProjectController(ResourceController):
    def __init__(self, app, entity = "", table = None, schema = None):
        super().__init__(app, entity, table, schema)
        self.create = admin_required(self.create)
        self.update = admin_required(self.update)
        self.delete = admin_required(self.delete)
