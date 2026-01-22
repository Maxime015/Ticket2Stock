import easyocr
from flask import Flask, request, jsonify
from flask_cors import CORS
from modules.OcrModule import OcrModule
import base64
import logging
from datetime import datetime
import ssl
import certifi

ssl._create_default_https_context = lambda: ssl.create_default_context(
    cafile=certifi.where()
)

# Import des modules de configuration
from config.env import ENV
from config.db import init_db

# Import des routes et middleware
from routes.auth_routes import auth_bp

app = Flask(__name__)

# Configuration du logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

CORS(app, supports_credentials=True)

# --- ROUTES --- #

@app.route("/api/scan", methods=['POST', 'GET'])
def load_ticket():
    content = request.get_json()
    base64_string = content.get('base64String')
    image = base64.b64decode(base64_string, validate=True)
    ocr = OcrModule()
    ocr.extract_data_from_ticket(image)
    result = ocr.formatToJson()
    print(result)
    return result


@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'OK',
        'message': 'Serveur fonctionne',
        'timestamp': datetime.utcnow().isoformat(),
        'environment': ENV.NODE_ENV or 'development'
    }), 200

# --- BLUEPRINTS --- #
app.register_blueprint(auth_bp, url_prefix='/api/auth')

# --- ERREURS --- #
@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'status': 'error',
        'message': f'Route {request.path} non trouvée'
    }), 404

@app.errorhandler(Exception)
def handle_exception(error):
    logger.error(f'Erreur non gérée: {error}')
    response = {
        'status': 'error',
        'message': 'Erreur interne du serveur'
    }
    if ENV.NODE_ENV != 'production':
        import traceback
        response['stack'] = traceback.format_exc()
    return jsonify(response), 500

# --- LANCEMENT DU SERVEUR --- #
if __name__ == '__main__':
    # Initialisation de la base de données avant de lancer le serveur
    try:
        init_db()
        logger.info("✅ Base de données initialisée avec succès !")
    except Exception as e:
        logger.error(f"❌ Erreur lors de l'initialisation de la base : {e}")
        raise e

    port = int(ENV.PORT) if ENV.PORT else 3000
    debug = ENV.NODE_ENV == 'development'

    logger.info(f"🚀 Serveur Flask démarré sur le port {port}")
    logger.info(f"📍 Environnement: {ENV.NODE_ENV or 'development'}")
    logger.info(f"❤️  Health Check: http://localhost:{port}/health")

    app.run(host='0.0.0.0', port=port, debug=debug)
