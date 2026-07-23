from flask import Blueprint

from controllers.stock_controller import (
    create_stock_item,
    delete_stock_item,
    list_stock,
    update_stock_item,
)
from middlewares.auth_middleware import protect_route

stock_bp = Blueprint("stock", __name__)

stock_bp.route("", methods=["GET"])(protect_route(list_stock))
stock_bp.route("", methods=["POST"])(protect_route(create_stock_item))
stock_bp.route("/<item_id>", methods=["PATCH"])(protect_route(update_stock_item))
stock_bp.route("/<item_id>", methods=["DELETE"])(protect_route(delete_stock_item))
