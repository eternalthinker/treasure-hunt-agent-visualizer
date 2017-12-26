import asyncio
import socket
import sys

class Connection:
    def __init__(self, server, client_socket, client_name, browser_socket=None, is_game_server=False):
        self.loop = server.loop
        self.server = server
        self.client_socket = client_socket
        self.name = client_name
        self.message_len = 0
        self.cur_view = ""
        self.is_game_server = is_game_server
        self.browser_socket = browser_socket
        self.connection_handler = asyncio.Task(self.connection_handler())

    @asyncio.coroutine
    def connection_handler(self):
        try:
            if self.is_game_server:
                yield from self.message_handler()
            else:
                yield from self.command_handler()
        except Exception as e:
            print("[!] Error in connection:", e)
            print("[!] Terminating {} connection".format(self.name))
            self.server.exit()

    @asyncio.coroutine
    def message_handler(self):
        while True:
            buf = yield from self.loop.sock_recv(self.client_socket, 1024)
            cells = buf.decode('utf-8')
            if cells == '':
                raise Exception("[!] Game server connection lost")
                return # We do not expect blank messages, except for client disconnection
            self.server.relay_to_game_client(buf)
            # for cell in cells:
            #     self.message_len += 1
            #     self.cur_view += cell
            #     if self.message_len == 12:
            #         self.cur_view += "^"
            #         self.message_len += 1
            #     elif self.message_len == 25:
            #         view = [ [self.cur_view[row*5 + col] for col in range(5)] for row in range(5)]
            #         self. message_len = 0
            #         self.cur_view = ""
            #         self.print_view(view)

    def print_view(self, view,):
        print("<<< [{}]:".format(self.name))
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
            # print("<<< [{}]: [{}]".format(self.name, buf.decode('utf-8')))
            commands = buf.decode('utf-8')
            if commands == '':
                raise Exception("[!] Agent connection lost")
                return # We do not expect blank messages, except for client disconnection
            self.server.relay_to_game_server(buf)
            self.browser_socket.send(commands)

    def terminate_connection(self):
        self.client_socket.close()
        self.server.remove(self)

    def send(self, buf):
        # print(">>> [{}]: [{}]".format(self.name, buf.decode('utf-8')))
        try:
            self.loop.sock_sendall(self.client_socket, buf)
        except:
            print("[!] Exception in sending message")
            self.server.remove(self)
            return None

    def exit(self):
        print("[!] Exiting connection handler for [{}]".format(self.name))
        self.connection_handler.cancel()
        self.client_socket.close()
        sys.exit(0)
    

class ConnectionManager:
    def __init__(self, loop, server_port, browser_socket):
        self.loop = loop
        self.game_client = None
        self.game_server = None
        self.game_client_queue = [] # Buffer for messages from game server before agent client connects
        self.browser_socket = browser_socket
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
                self.game_client = Connection(self, 
                    client_socket, 
                    "agent", 
                    browser_socket=self.browser_socket,
                    is_game_server=False)
                print("*** Agent connected")
                for buf in self.game_client_queue:
                    self.relay_to_game_client(buf)
        except Exception as e:
            print("[!] Exception", e)
            print("[!] Visualization server task exiting. Goodbye")
            self.exit()

    def connect(self, server_ip, server_port):
        connection_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        connection_socket.connect((server_ip, server_port))
        connection_socket.setblocking(0)
        listener = Connection(self, connection_socket, "game-server", is_game_server=True) # This listener thread is spawned to detect disconnection
        self.game_server = listener
        self.game_client_queue = [] # Starting a new run
        print("*** Connected to game server")

    def relay_to_game_client(self, buf):
        if not self.game_client:
            self.game_client_queue.append(buf)
            return
        try:
            self.game_client.send(buf)
        except Exception as e:
            print("[!] Exception while sending message:", e)

    def relay_to_game_server(self, buf):
        if not self.game_server:
            return
        try:
            self.game_server.send(buf)
        except Exception as e:
            print("[!] Exception while sending message:", e)
    
    def remove(self, connection):
        if connection == self.game_server:
            self.game_server = None
            print("[!] Lost connection to game server")
        else:
            self.game_client = None
            print("[!] Lost connection to agent")
        self.game_client_queue = []

    def exit(self):
        self.game_client and self.game_client.exit()
        self.game_server and self.game_server.exit()
        self.server_socket.close()
