from flask import Blueprint

from controllers.budgets_controller import list_budgets, upsert_budget
from middlewares.auth_middleware import protect_route

budgets_bp = Blueprint("budgets", __name__)

budgets_bp.route("", methods=["GET"])(protect_route(list_budgets))
budgets_bp.route("", methods=["PUT"])(protect_route(upsert_budget))
