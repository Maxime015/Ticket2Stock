from flask import Blueprint

from controllers.stats_controller import export_csv, get_overview
from middlewares.auth_middleware import protect_route

stats_bp = Blueprint("stats", __name__)

stats_bp.route("/overview", methods=["GET"])(protect_route(get_overview))
stats_bp.route("/export", methods=["GET"])(protect_route(export_csv))
