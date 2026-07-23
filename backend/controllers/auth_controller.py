from flask import request, jsonify
import re
import jwt
from datetime import datetime, timedelta
from config.db import db, hash_password, compare_password
from config.env import ENV
import logging
import psycopg2


logger = logging.getLogger(__name__)

def generate_token(user_id):
    payload = {
        'userId': user_id,
        'exp': datetime.utcnow() + timedelta(days=15)
    }
    return jwt.encode(payload, ENV.JWT_SECRET, algorithm='HS256')

def register():
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'message': 'Données JSON requises'}), 400
            
        email = data.get('email')
        username = data.get('username')
        password = data.get('password')
        
        # Validation des champs
        if not username or not email or not password:
            return jsonify({'message': 'Le nom d\'utilisateur, l\'adresse e-mail et le mot de passe sont requis.'}), 400
        
        if email and not re.match(r'\S+@\S+\.\S+', email):
            return jsonify({'message': 'Format d\'adresse e-mail invalide.'}), 400
        
        if len(password) < 6:
            return jsonify({'message': 'Le mot de passe doit contenir au moins 6 caractères.'}), 400
        
        if len(username) < 3:
            return jsonify({'message': 'Le nom d\'utilisateur doit contenir au moins 3 caractères.'}), 400
        
        # Vérifier si l'utilisateur existe déjà
        with db.get_cursor() as cur:
            cur.execute('''
                SELECT * FROM users WHERE LOWER(email) = LOWER(%s) OR LOWER(username) = LOWER(%s)
            ''', (email, username))
            existing_user = cur.fetchall()
        
        if existing_user:
            user_dict = existing_user[0]
            if user_dict['email'].lower() == email.lower():
                return jsonify({'message': 'Cette adresse e-mail est déjà utilisée.'}), 400
            if user_dict['username'].lower() == username.lower():
                return jsonify({'message': 'Ce nom d\'utilisateur est déjà pris.'}), 400
        
        # Générer un avatar automatique et hacher le mot de passe
        profile_image = f'https://api.dicebear.com/7.x/avataaars/svg?seed={username}'
        hashed_password = hash_password(password)
        
        # Créer un nouvel utilisateur
        with db.get_connection() as conn:
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                cur.execute('''
                    INSERT INTO users (username, email, password, profile_image) 
                    VALUES (%s, %s, %s, %s)
                    RETURNING id, username, email, profile_image, created_at
                ''', (username, email, hashed_password, profile_image))
                new_user = cur.fetchone()
                
                if new_user:
                    token = generate_token(new_user['id'])
                    return jsonify({
                        'message': 'Utilisateur créé avec succès.',
                        'token': token,
                        'user': {
                            'id': new_user['id'],
                            'username': new_user['username'],
                            'email': new_user['email'],
                            'profileImage': new_user['profile_image'],
                            'createdAt': new_user['created_at'].isoformat() if new_user['created_at'] else None,
                        },
                    }), 201
                else:
                    return jsonify({'message': 'Données utilisateur invalides'}), 400
                    
    except Exception as error:
        logger.error(f"Erreur dans la route d'inscription : {error}")
        return jsonify({'message': 'Erreur interne du serveur.'}), 500

def login():
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'message': 'Données JSON requises'}), 400
            
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({'message': 'Tous les champs sont requis.'}), 400
        
        # Vérifier si l'utilisateur existe
        with db.get_cursor() as cur:
            cur.execute('SELECT * FROM users WHERE email = %s', (email,))
            users = cur.fetchall()
        
        if not users:
            return jsonify({'message': 'Identifiants invalides.'}), 400
        
        user = users[0]
        
        # Vérifier le mot de passe
        is_password_correct = compare_password(password, user['password'])
        if not is_password_correct:
            return jsonify({'message': 'Identifiants invalides.'}), 400
        
        token = generate_token(user['id'])

        return jsonify({
            'message': 'Connexion réussie.',
            'token': token,
            'user': {
                'id': user['id'],
                'username': user['username'],
                'email': user['email'],
                'profileImage': user['profile_image'],
                'createdAt': user['created_at'].isoformat() if user['created_at'] else None,
            },
        }), 200
        
    except Exception as error:
        logger.error(f"Erreur dans la route de connexion : {error}")
        return jsonify({'message': 'Erreur interne du serveur.'}), 500


def clear_data():
    """Efface toutes les données de l'utilisateur (tickets, stock, courses,
    budgets) sans supprimer le compte. Action irréversible."""
    try:
        user_id = request.user["id"]
        with db.get_connection() as conn:
            with conn.cursor() as cur:
                # ticket_items est supprimé en cascade avec tickets
                cur.execute("DELETE FROM tickets WHERE user_id = %s", (user_id,))
                cur.execute("DELETE FROM shopping_list_items WHERE user_id = %s", (user_id,))
                cur.execute("DELETE FROM stock_items WHERE user_id = %s", (user_id,))
                cur.execute("DELETE FROM budgets WHERE user_id = %s", (user_id,))
        return jsonify({"message": "Toutes vos données ont été effacées."}), 200
    except Exception as error:
        logger.error(f"Erreur lors de l'effacement des données : {error}", exc_info=True)
        return jsonify({"message": "Erreur interne du serveur."}), 500


def delete_account():
    """Supprime définitivement le compte de l'utilisateur. Toutes les données
    associées (tickets, articles de ticket, stock, courses, budgets) sont
    supprimées en cascade grâce aux contraintes ON DELETE CASCADE du schéma.
    Action irréversible."""
    try:
        user_id = request.user["id"]
        with db.get_connection() as conn:
            with conn.cursor() as cur:
                # La suppression de la ligne users déclenche la cascade sur
                # tickets → ticket_items, stock_items, shopping_list_items et budgets.
                cur.execute("DELETE FROM users WHERE id = %s", (user_id,))
                deleted = cur.rowcount
        if not deleted:
            return jsonify({"message": "Compte introuvable."}), 404
        return jsonify({"message": "Votre compte a été supprimé."}), 200
    except Exception as error:
        logger.error(f"Erreur lors de la suppression du compte : {error}", exc_info=True)
        return jsonify({"message": "Erreur interne du serveur."}), 500