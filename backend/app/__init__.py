# backend/app/__init__.py - v1.0
from flask import Flask
from flask_cors import CORS
from app.config import config
from app.tasks.celery_app import celery_app

__all__ = ['celery_app']

def create_app():
    app = Flask(__name__)
    app.config.from_object(config)
    
    CORS(app)
    
    config.validate()
    
    # Register blueprints
    from app.api.users import users_bp
    from app.api.stakes import stakes_bp
    from app.api.analytics import analytics_bp
    
    app.register_blueprint(users_bp, url_prefix='/api/users')
    app.register_blueprint(stakes_bp, url_prefix='/api/stakes')
    app.register_blueprint(analytics_bp, url_prefix='/api/analytics')
    
    @app.route('/health')
    def health():
        return {'status': 'healthy'}, 200
    
    return app