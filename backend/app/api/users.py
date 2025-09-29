# backend/app/api/users.py - v1.0
from flask import Blueprint

users_bp = Blueprint('users', __name__)

@users_bp.route('/', methods=['GET'])
def list_users():
    return {'message': 'Users endpoint - TODO'}, 200