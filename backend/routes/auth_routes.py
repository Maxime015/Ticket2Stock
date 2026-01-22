from flask import Blueprint
from controllers.auth_controller import register, login
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

auth_bp = Blueprint('auth', __name__)

# Configuration du rate limiting (similaire à express-rate-limit)
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"]
)

# Appliquer le rate limiting uniquement à la route de login
@auth_bp.route('/login', methods=['POST'])
@limiter.limit("3 per minute")  # 3 tentatives par minute
def login_route():
    return login()

@auth_bp.route('/register', methods=['POST'])
def register_route():
    return register()