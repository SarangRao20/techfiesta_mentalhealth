from flask import request
from flask_restx import Namespace, Resource, fields
from flask_login import login_required, current_user
from models import VentingPost, VentingResponse, SoundVentingSession, User
from app import db
from datetime import datetime

ns = Namespace('venting', description='Venting wall and emotional expression')

post_model = ns.model('VentingPost', {
    'content': fields.String(required=True, description='Post content'),
    'anonymous': fields.Boolean(default=True, description='Whether to post anonymously')
})

response_model = ns.model('VentingResponse', {
    'post_id': fields.Integer(required=True, description='Post ID'),
    'content': fields.String(required=True, description='Response content'),
    'anonymous': fields.Boolean(default=True, description='Whether to respond anonymously')
})

sound_venting_model = ns.model('SoundVentingSession', {
    'duration': fields.Integer(required=True),
    'max_decibel': fields.Float(required=True),
    'avg_decibel': fields.Float(required=True),
    'scream_count': fields.Integer(required=True),
    'session_type': fields.String(default='sound_venting')
})

@ns.route('/posts')
class Posts(Resource):
    @login_required
    def get(self):
        """Get all venting posts"""
        posts = VentingPost.query.order_by(VentingPost.created_at.desc()).all()
        return [
            {
                'id': p.id,
                'content': p.content,
                'anonymous': p.anonymous,
                'author': 'Anonymous' if p.anonymous else User.query.get(p.user_id).username,
                'created_at': p.created_at.isoformat(),
                'likes': p.likes,
                'responses_count': len(p.responses) if p.responses else 0,
                'is_owner': p.user_id == current_user.id,
                'user_id': p.user_id
            } for p in posts
        ], 200

    @login_required
    @ns.expect(post_model)
    def post(self):
        """Create a new venting post"""
        data = ns.payload
        post = VentingPost(
            user_id=current_user.id,
            content=data.get('content'),
            anonymous=data.get('anonymous', True)
        )
        db.session.add(post)
        
        # Universal Activity Log
        from models import UserActivityLog
        log = UserActivityLog(
            user_id=current_user.id,
            activity_type='venting',
            action='post_created',
            extra_data={'anonymous': data.get('anonymous', True)},
            timestamp=datetime.utcnow()
        )
        db.session.add(log)
        
        db.session.commit()
        return {'message': 'Post created', 'id': post.id}, 201

@ns.route('/posts/<int:post_id>/like')
class LikePost(Resource):
    @login_required
    def post(self, post_id):
        """Like a post"""
        post = VentingPost.query.get_or_404(post_id)
        post.likes += 1
        db.session.commit()
        return {'likes': post.likes}, 200

@ns.route('/responses')
class Responses(Resource):
    @login_required
    @ns.expect(response_model)
    def post(self):
        """Respond to a post"""
        data = ns.payload
        response = VentingResponse(
            post_id=data.get('post_id'),
            user_id=current_user.id,
            content=data.get('content'),
            anonymous=data.get('anonymous', True)
        )
        db.session.add(response)
        db.session.commit()
        return {'message': 'Response added', 'id': response.id}, 201

@ns.route('/sound_session')
class SoundSession(Resource):
    @login_required
    @ns.expect(sound_venting_model)
    def post(self):
        """Save a sound venting session"""
        data = ns.payload
        session = SoundVentingSession(
            user_id=current_user.id,
            duration=data.get('duration'),
            max_decibel=data.get('max_decibel'),
            avg_decibel=data.get('avg_decibel'),
            scream_count=data.get('scream_count'),
            session_type=data.get('session_type', 'sound_venting')
        )
        db.session.add(session)
        
        # Universal Activity Log
        from models import UserActivityLog
        log = UserActivityLog(
            user_id=current_user.id,
            activity_type='venting',
            action='sound_session_complete',
            duration=data.get('duration'),
            result_value=data.get('max_decibel'),
            extra_data={'avg_decibel': data.get('avg_decibel'), 'scream_count': data.get('scream_count')},
            timestamp=datetime.utcnow()
        )
        db.session.add(log)
        
        db.session.commit()
        return {'message': 'Sound session saved'}, 201
