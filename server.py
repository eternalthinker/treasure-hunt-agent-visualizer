from aiohttp import web
from aiohttp_index import IndexMiddleware
import socketio
import asyncio
import socket
import sys
import argparse
from pathlib import Path
from shutil import copyfile


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
    for msg in browser_queue:
        sio.start_background_task(browser_relay, msg)

async def browser_relay(data):
    await sio.emit('commands', data)

@sio.on('disconnect')
def disconnect(sid):
    print("Browser disconnected")
    global is_browser_connected
    is_browser_connected = False

app.router.add_static('/', './ui/dist')

class Connection:
    def __init__(self, server, client_socket, client_name, is_game_server=False):
        self.loop = server.loop
        self.server = server
        self.client_socket = client_socket
        self.name = client_name
        self.message_len = 0
        self.cur_view = ""
        self.is_game_server = is_game_server
        self.connection_handler = asyncio.Task(self.connection_handler())

    @asyncio.coroutine
    def connection_handler(self):
        try:
            if self.is_game_server:
                yield from self.message_handler()
            else:
                yield from self.command_handler()
        except Exception as e:
            print("Error in connection:", e)
            print("Terminating {} connection".format(self.name))
            self.server.exit()

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
                sio.start_background_task(browser_relay, commands)
            else:
                browser_queue.append(commands)

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
        print("Exiting connection handler", self.name)
        self.connection_handler.cancel()
        self.client_socket.close()
    

class ConnectionManager:
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
                self.game_client = Connection(self, client_socket, "game-client", is_game_server=False)
                print("Game client connected")
                for buf in self.game_client_queue:
                    self.relay_to_game_client(buf)
        except Exception as e:
            print("Exception", e)
            print("Server task exiting. Goodbye")
            self.exit()

    def connect(self, server_ip, server_port):
        connection_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        connection_socket.connect((server_ip, server_port))
        connection_socket.setblocking(0)
        listener = Connection(self, connection_socket, "game-server", is_game_server=True) # This listener thread is spawned to detect disconnection
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
    
    def remove(self, connection):
        if connection == self.game_server:
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
    return srv

def main():
    parser = argparse.ArgumentParser(description='Treasure Hunt Agent visualizer')
    parser.add_argument('-g','--game-port', help='Port of the treasure hunt (Raft) server', type=int, required=True)
    parser.add_argument('-m','--map', help='Path to treasure hunt map file', type=str, required=True)
    parser.add_argument('-p','--port', help='Port to run the visualizer server where agent can connect',  type=int, default=9000, required=False)
    parser.add_argument('-w','--web-port', help='Port for accessing visualizer from browser',  type=int, default=9001, required=False)
    args = parser.parse_args()
    
    map_file = Path(args.map)
    if not map_file.is_file():
        print("[!] Could not find map file at", map_file)
        sys.exit(0)
    copyfile(str(map_file), "./ui/dist/" + map_file.name)

    game_port, port, web_port = args.game_port, args.port, args.web_port
    loop.run_until_complete(init(loop, web_port))
    connection_manager = ConnectionManager(loop, port)
    connection_manager.connect('localhost', game_port)
    print("Connect agent to this port:", port)
    print("Access browser at this url:", "http://localhost:{}".format(web_port))
    try:
        loop.run_forever()
    except Exception as e:
        pass

if __name__ == '__main__':
    main()
