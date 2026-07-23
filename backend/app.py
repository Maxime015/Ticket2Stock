import logging
import ssl
from datetime import datetime

import certifi
from flask import Flask, jsonify, request
from flask_cors import CORS

ssl._create_default_https_context = lambda: ssl.create_default_context(
    cafile=certifi.where()
)

from config.db import init_db
from config.env import ENV
from routes.auth_routes import auth_bp, limiter
from routes.budgets_routes import budgets_bp
from routes.shopping_routes import shopping_bp
from routes.stats_routes import stats_bp
from routes.stock_routes import stock_bp
from routes.ticket_routes import ticket_bp

app = Flask(__name__)
# Les tickets photographiés en base64 dépassent le 1 Mo par défaut
app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

CORS(app, supports_credentials=True)
# Sans init_app le rate limiting déclaré dans auth_routes n'est pas appliqué
limiter.init_app(app)

# --- BLUEPRINTS --- #
app.register_blueprint(auth_bp, url_prefix="/api/auth")
app.register_blueprint(ticket_bp, url_prefix="/api/tickets")
app.register_blueprint(stock_bp, url_prefix="/api/stock")
app.register_blueprint(shopping_bp, url_prefix="/api/shopping")
app.register_blueprint(stats_bp, url_prefix="/api/stats")
app.register_blueprint(budgets_bp, url_prefix="/api/budgets")


@app.route("/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "OK",
        "message": "Serveur fonctionne",
        "timestamp": datetime.utcnow().isoformat(),
        "environment": ENV.NODE_ENV or "development",
    }), 200


# --- ERREURS --- #
@app.errorhandler(404)
def not_found(error):
    return jsonify({
        "status": "error",
        "message": f"Route {request.path} non trouvée",
    }), 404


@app.errorhandler(413)
def payload_too_large(error):
    return jsonify({
        "status": "error",
        "message": "Image trop volumineuse (max 16 Mo).",
    }), 413


@app.errorhandler(Exception)
def handle_exception(error):
    logger.error(f"Erreur non gérée: {error}", exc_info=True)
    response = {
        "status": "error",
        "message": "Erreur interne du serveur",
    }
    if ENV.NODE_ENV != "production":
        import traceback
        response["stack"] = traceback.format_exc()
    return jsonify(response), 500


# --- LANCEMENT DU SERVEUR --- #
if __name__ == "__main__":
    try:
        init_db()
        logger.info("✅ Base de données initialisée avec succès !")
    except Exception as e:
        logger.error(f"❌ Erreur lors de l'initialisation de la base : {e}")
        raise e

    port = int(ENV.PORT) if ENV.PORT else 3000
    debug = ENV.NODE_ENV == "development"

    logger.info(f"🚀 Serveur Flask démarré sur le port {port}")
    logger.info(f"📍 Environnement: {ENV.NODE_ENV or 'development'}")
    logger.info(f"❤️  Health Check: http://localhost:{port}/health")

    app.run(host="0.0.0.0", port=port, debug=debug)
