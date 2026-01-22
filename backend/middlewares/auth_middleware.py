from functools import wraps
import jwt
from flask import request, jsonify
from config.db import db
from config.env import ENV
import logging

logger = logging.getLogger(__name__)

def protect_route(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = None
        
        # Récupérer le token depuis l'en-tête Authorization
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
        
        if not token:
            return jsonify({'message': 'Aucun jeton d\'authentification, accès refusé'}), 401
        
        try:
            # Vérifier le token
            decoded = jwt.decode(token, ENV.JWT_SECRET, algorithms=['HS256'])
            
            # Récupérer l'utilisateur depuis la base de données
            with db.get_cursor() as cur:
                cur.execute('''
                    SELECT id, username, email, profile_image, created_at 
                    FROM users WHERE id = %s
                ''', (decoded['userId'],))
                user = cur.fetchone()
            
            if not user:
                return jsonify({'message': 'Le jeton n\'est pas valide'}), 401
            
            # Ajouter l'utilisateur à la requête
            request.user = {
                'id': user['id'],
                'username': user['username'],
                'email': user['email'],
                'profileImage': user['profile_image'],
                'createdAt': user['created_at']
            }
            
            return f(*args, **kwargs)
            
        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Le jeton a expiré'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'message': 'Jeton invalide'}), 401
        except Exception as e:
            logger.error(f"Erreur d'authentification : {str(e)}")
            return jsonify({'message': 'Le jeton n\'est pas valide'}), 401
    
    return decorated_function