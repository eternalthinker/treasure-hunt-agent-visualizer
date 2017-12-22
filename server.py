from aiohttp import web
from aiohttp_index import IndexMiddleware
import socketio
import asyncio
import socket
import sys
import argparse


loop = asyncio.get_event_loop()
sio = socketio.AsyncServer()
app = web.Application(middlewares=[IndexMiddleware()])
sio.attach(app)
is_browser_connected = False
browser_queue = []

@sio.on('connect')
def connect(sid, environ):
    print("Browser connected")
    global is_browser_connected
    is_browser_connected = True
    for pair in browser_queue:
        if pair[0] == "server":
            sio.start_background_task(server_msg, pair[1])
        else:
            sio.start_background_task(client_msg, pair[1])

async def server_msg(data):
    await sio.emit('server', data)

async def client_msg(data):
    await sio.emit('client', data)

@sio.on('disconnect')
def disconnect(sid):
    print("Browser disconnected")

app.router.add_static('/', './ui/dist')

class Peer:
    def __init__(self, server, client_socket, client_name, is_game_server=False):
        self.loop = server.loop
        self.server = server
        self.client_socket = client_socket
        self.name = client_name
        self.message_len = 0
        self.cur_view = ""
        self.is_game_server = is_game_server
        self.peer_handler = asyncio.Task(self.peer_handler())

    @asyncio.coroutine
    def peer_handler(self):
        try:
            if self.is_game_server:
                yield from self.message_handler()
            else:
                yield from self.command_handler()
        except Exception as e:
            print("Error in message handling:", e)
            print("Terminating {} connection".format(self.name))
            self.server.exit()
        finally:
            #self.peer_handler.cancel()
            #self.terminate_connection()
            pass

    @asyncio.coroutine
    def message_handler(self):
        while True:
            buf = yield from self.loop.sock_recv(self.client_socket, 1024)
            cells = buf.decode('utf-8')
            if cells == '':
                raise Exception("Game server connection lost")
                return # We do not expect blank messages, except for client disconnection
            self.server.relay_to_game_client(buf)
            for cell in cells:
                self.message_len += 1
                self.cur_view += cell
                if self.message_len == 12:
                    self.cur_view += "^"
                    self.message_len += 1
                elif self.message_len == 25:
                    if is_browser_connected:
                        sio.start_background_task(server_msg, self.cur_view)
                    else:
                        browser_queue.append(("server", self.cur_view))
                    view = [ [self.cur_view[row*5 + col] for col in range(5)] for row in range(5)]
                    self. message_len = 0
                    self.cur_view = ""
                    self.print_view(view)

    def print_view(self, view,):
        print("\n+-----+")
        for row in range(5):
            print("|", end="")
            for col in range(5):
                print(view[row][col], end="")
            print("|")
        print("+-----+")

    @asyncio.coroutine
    def command_handler(self):
        while True:
            buf = yield from self.loop.sock_recv(self.client_socket, 1024)
            print("Received command #{}# from [{}]".format(buf.decode('utf-8'), self.name))
            commands = buf.decode('utf-8')
            if commands == '':
                raise Exception("Game client connection lost")
                return # We do not expect blank messages, except for client disconnection
            self.server.relay_to_game_server(buf)
            if is_browser_connected:
                sio.start_background_task(client_msg, commands)
            else:
                browser_queue.append(("client", commands))

    def terminate_connection(self):
        self.client_socket.close()
        self.server.remove(self)

    def send(self, buf):
        print("Sending message #{}# to {}".format(buf.decode('utf-8'), self.name))
        try:
            self.loop.sock_sendall(self.client_socket, buf)
        except:
            print("Exception in send")
            self.server.remove(self)
            return None

    def exit(self):
        print("Exiting peer handler", self.name)
        self.peer_handler.cancel()
        self.client_socket.close()
    

class PeerManager:
    def __init__(self, loop, server_port):
        self.loop = loop
        self.game_client = None
        self.game_server = None
        self.game_client_queue = []
        self.server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.server_socket.setblocking(0)
        self.server_socket.bind(('', server_port))
        self.server_socket.listen()
        asyncio.Task(self.server())

    @asyncio.coroutine
    def server(self):
        try:
            while True:
                client_socket, client_name = yield from self.loop.sock_accept(self.server_socket)
                client_socket.setblocking(0)
                self.game_client = Peer(self, client_socket, "game-client", is_game_server=False)
                print("Game client connected")
                for buf in self.game_client_queue:
                    self.relay_to_game_client(buf)
        except Exception as e:
            print("Exception", e)
            print("Server task exiting. Goodbye")
            self.exit()

    def connect(self, server_ip, server_port):
        peer_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        peer_socket.connect((server_ip, server_port))
        peer_socket.setblocking(0)
        listener = Peer(self, peer_socket, "game-server", is_game_server=True) # This listener thread is spawned to detect disconnection
        self.game_server = listener
        self.game_client_queue = [] # Starting a new run
        print("Connected to game server")

    def relay_to_game_client(self, buf):
        if not self.game_client:
            self.game_client_queue.append(buf)
            return
        try:
            self.game_client.send(buf)
        except Exception as e:
            print("Exception while sending message:", e)

    def relay_to_game_server(self, buf):
        if not self.game_server:
            return
        try:
            self.game_server.send(buf)
        except Exception as e:
            print("Exception while sending message:", e)
    
    def remove(self, peer):
        if peer == self.game_server:
            self.game_server = None
            print("Lost connection to game server")
        else:
            self.game_client = None
            print("Lost connection to game client")
        self.game_client_queue = []

    def exit(self):
        self.game_client and self.game_client.exit()
        self.game_server and self.game_server.exit()
        self.server_socket.close()
        sys.exit(0)


async def init(loop, web_port):
    handler = app.make_handler()
    srv = await loop.create_server(handler, '0.0.0.0', web_port)
    # print('Access following address in browser:', srv.sockets[0].getsockname())
    return srv

def main():
    parser = argparse.ArgumentParser(description='Treasure Hunt Agent visualizer')
    parser.add_argument('-g','--game-port', help='Port of the treasure hunt server', type=int, required=True)
    parser.add_argument('-p','--port', help='Port of the visualizer where agent can connect',  type=int, default=9000, required=False)
    parser.add_argument('-w','--web-port', help='Port for accessing visualizer from browser',  type=int, default=9001, required=False)
    args = parser.parse_args()

    game_port, port, web_port = args.game_port, args.port, args.web_port

    loop.run_until_complete(init(loop, web_port))
    peer_manager = PeerManager(loop, port)
    peer_manager.connect('localhost', game_port)
    print("Connect agent to this port:", port)
    print("Access browser at this url:", "http://localhost:{}".format(web_port))
    #try:
    #    web.run_app(app)
    #except:
    #    pass
    try:
        loop.run_forever()
    except Exception as e:
        pass

if __name__ == '__main__':
    #web.run_app(app)
    main()
