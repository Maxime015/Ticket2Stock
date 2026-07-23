from flask import Blueprint

from controllers.ticket_controller import (
    delete_ticket,
    get_ticket,
    list_tickets,
    save_ticket,
    scan_ticket,
)
from middlewares.auth_middleware import protect_route

ticket_bp = Blueprint("tickets", __name__)

ticket_bp.route("/scan", methods=["POST"])(protect_route(scan_ticket))
ticket_bp.route("", methods=["POST"])(protect_route(save_ticket))
ticket_bp.route("", methods=["GET"])(protect_route(list_tickets))
ticket_bp.route("/<ticket_id>", methods=["GET"])(protect_route(get_ticket))
ticket_bp.route("/<ticket_id>", methods=["DELETE"])(protect_route(delete_ticket))
