from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_login import current_user
from flask import request
from datetime import datetime
from database import db
from db_models import CommunityChatLog, User

# Initialize SocketIO (will be bound to app via init_app)
socketio = SocketIO(cors_allowed_origins="*", manage_session=False, async_mode='threading', logger=True, engineio_logger=False)

@socketio.on('connect')
def handle_connect():
    if current_user.is_authenticated:
        print(f"User connected: {current_user.username}")
    else:
        print("Anonymous connection attempt (auth required for persistent chat)")
        # We might allow read-only or reject. For now, we allow but they likely can't post if we verify on message.
        pass

@socketio.on('join')
def on_join(data):
    room = data.get('room')
    if not room:
        return

    join_room(room)
    print(f"User {current_user.username if current_user.is_authenticated else 'Guest'} joined {room}")
    
    # Send recent history (Limit 100)
    try:
        logs = CommunityChatLog.query.filter_by(room=room).order_by(CommunityChatLog.timestamp.desc()).limit(100).all()
        history = [log.as_dict() for log in reversed(logs)]
        emit('history', history)
    except Exception as e:
        print(f"Error fetching history for room {room}: {e}")
        emit('history', [])

@socketio.on('message')
def on_message(data):
    if not current_user.is_authenticated:
        return
    
    room = data.get('room')
    content = data.get('msg')
    
    if not room or not content:
        return
        
    # Save to DB with robust error handling
    try:
        log = CommunityChatLog(
            user_id=current_user.id,
            room=room,
            content=content,
            timestamp=datetime.utcnow()
        )
        db.session.add(log)
        db.session.commit()
        # Broadcast only after successful save
        emit('message', log.as_dict(), room=room, broadcast=True)
    except Exception as e:
        db.session.rollback()
        print(f"Failed to save/emit message: {e}")
        # Optionally notify the sender of failure
        emit('error', {'message': 'Message failed to send. Please try again.'})

@socketio.on('leave')
def on_leave(data):
    room = data.get('room')
    if room:
        leave_room(room)
        # print(f"User left {room}")
