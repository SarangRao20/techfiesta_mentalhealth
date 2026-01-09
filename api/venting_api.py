from flask import request
from flask_restx import Namespace, Resource, fields
from flask_login import login_required, current_user
from db_models import VentingPost, VentingResponse, VentingPostLike, SoundVentingSession, User
from database import db, cache
from datetime import datetime

ns = Namespace('venting', description='Community support and emotional expression')

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
        """Get all posts for Community Support (Cached per user)"""
        cache_key = f"community_posts_user_{current_user.id}"
        cached = cache.get(cache_key)
        if cached:
            return cached, 200

        posts = VentingPost.query.order_by(VentingPost.created_at.desc()).all()
        
        # Get list of post IDs liked by current user
        liked_post_ids = [l.post_id for l in VentingPostLike.query.filter_by(user_id=current_user.id).all()]
        
        result = [
            {
                'id': p.id,
                'content': p.content,
                'anonymous': p.anonymous,
                'author': 'Anonymous' if p.anonymous else User.query.get(p.user_id).username,
                'created_at': p.created_at.isoformat(),
                'likes': p.likes,
                'liked_by_me': p.id in liked_post_ids,
                'responses': [
                    {
                        'id': r.id,
                        'content': r.content,
                        'author': 'Anonymous' if r.anonymous else User.query.get(r.user_id).username,
                        'created_at': r.created_at.isoformat()
                    } for r in p.responses
                ] if p.responses else [],
                'responses_count': len(p.responses) if p.responses else 0,
                'is_owner': p.user_id == current_user.id
            } for p in posts
        ]
        
        cache.set(cache_key, result, timeout=300)
        return result, 200

    @login_required
    @ns.expect(post_model)
    def post(self):
        """Create a new community support post"""
        data = ns.payload
        post = VentingPost(
            user_id=current_user.id,
            content=data.get('content'),
            anonymous=data.get('anonymous', True)
        )
        db.session.add(post)
        db.session.commit()
        # Invalidate ALL community caches because a new post/like affects everyone's view (likes/responses)
        # However, since we use per-user keys, we either need a way to clear all or just accept 5min stale for others.
        # Redis scan/delete is heavy. Better to use a versioned key if we want instant.
        # For now, let's just clear the current user's cache and let others catch up.
        cache.delete(f"community_posts_user_{current_user.id}")
        return {'message': 'Post created', 'id': post.id}, 201

@ns.route('/posts/<int:post_id>/like')
class LikePost(Resource):
    @login_required
    def post(self, post_id):
        """Like or Unlike a post"""
        post = VentingPost.query.get_or_404(post_id)
        existing_like = VentingPostLike.query.filter_by(post_id=post_id, user_id=current_user.id).first()
        
        if existing_like:
            # Unlike logic: remove like and decrement count
            db.session.delete(existing_like)
            post.likes = max(0, post.likes - 1)
            db.session.commit()
            cache.delete(f"community_posts_user_{current_user.id}")
            return {'likes': post.likes, 'liked': False}, 200
        else:
            # Like logic: add like and increment count
            new_like = VentingPostLike(post_id=post_id, user_id=current_user.id)
            db.session.add(new_like)
            post.likes += 1
            db.session.commit()
            cache.delete(f"community_posts_user_{current_user.id}")
            return {'likes': post.likes, 'liked': True}, 200

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
        # Invalidate ALL community caches because a new post/like affects everyone's view (likes/responses)
        # However, since we use per-user keys, we either need a way to clear all or just accept 5min stale for others.
        # Redis scan/delete is heavy. Better to use a versioned key if we want instant.
        # For now, let's just clear the current user's cache and let others catch up.
        cache.delete(f"community_posts_user_{current_user.id}")
        return {'message': 'Response added', 'id': response.id, 'likes': 0}, 201

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
        from db_models import UserActivityLog
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
