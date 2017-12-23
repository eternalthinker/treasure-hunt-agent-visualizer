import socketio

sio = socketio.AsyncServer()
is_browser_connected = False
browser_queue = []

def init(app):
    sio.attach(app)

@sio.on('connect')
def connect(sid, environ):
    print("*** Browser connected")
    global is_browser_connected
    is_browser_connected = True
    for msg in browser_queue:
        sio.start_background_task(_send, msg)

def send(data):
    if is_browser_connected:
        sio.start_background_task(_send, data)
    else:
        browser_queue.append(data)

async def _send(data):
    await sio.emit('commands', data)

@sio.on('disconnect')
def disconnect(sid):
    print("[!] Browser disconnected")
    is_browser_connected = False
