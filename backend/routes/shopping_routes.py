from flask import Blueprint

from controllers.shopping_controller import (
    add_shopping_item,
    clear_checked,
    delete_shopping_item,
    generate_shopping_list,
    list_shopping,
    toggle_shopping_item,
)
from middlewares.auth_middleware import protect_route

shopping_bp = Blueprint("shopping", __name__)

shopping_bp.route("", methods=["GET"])(protect_route(list_shopping))
shopping_bp.route("", methods=["POST"])(protect_route(add_shopping_item))
shopping_bp.route("/generate", methods=["POST"])(protect_route(generate_shopping_list))
shopping_bp.route("/clear-checked", methods=["DELETE"])(protect_route(clear_checked))
shopping_bp.route("/<item_id>/toggle", methods=["PATCH"])(protect_route(toggle_shopping_item))
shopping_bp.route("/<item_id>", methods=["DELETE"])(protect_route(delete_shopping_item))
