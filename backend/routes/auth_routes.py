from flask import Blueprint
from controllers.auth_controller import clear_data, delete_account, register, login
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from middlewares.auth_middleware import protect_route

auth_bp = Blueprint('auth', __name__)

# Rate limiting appliqué uniquement aux routes décorées (pas de limite
# globale : le mobile fait beaucoup d'appels stock/courses légitimes)
limiter = Limiter(key_func=get_remote_address, storage_uri="memory://")

# Appliquer le rate limiting uniquement à la route de login
@auth_bp.route('/login', methods=['POST'])
@limiter.limit("3 per minute")  # 3 tentatives par minute
def login_route():
    return login()

@auth_bp.route('/register', methods=['POST'])
def register_route():
    return register()

# Effacement de toutes les données de l'utilisateur (protégé par JWT)
auth_bp.route('/data', methods=['DELETE'])(protect_route(clear_data))

# Suppression définitive du compte + données en cascade (protégé par JWT)
auth_bp.route('/account', methods=['DELETE'])(protect_route(delete_account))