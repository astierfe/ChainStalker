# backend/app/api/stakes.py - v1.0
from flask import Blueprint

stakes_bp = Blueprint('stakes', __name__)

@stakes_bp.route('/', methods=['GET'])
def list_stakes():
    return {'message': 'Stakes endpoint - TODO'}, 200