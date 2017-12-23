import sys
import argparse
from pathlib import Path
from shutil import copyfile
import asyncio

from aiohttp import web
from aiohttp_index import IndexMiddleware

from server_lib import browser_socket
from server_lib.connection_manager import ConnectionManager

async def init(loop, app, web_port):
    handler = app.make_handler()
    srv = await loop.create_server(handler, '0.0.0.0', web_port)
    return srv

def main():
    parser = argparse.ArgumentParser(description='Treasure Hunt Agent visualizer')
    parser.add_argument('-g','--game-port', help='Port of the treasure hunt (Raft) server', 
        type=int, required=True)
    parser.add_argument('-m','--map-file', help='Path to treasure hunt map file', 
        type=str, required=True)
    parser.add_argument('-w','--web-port', help='Port for accessing visualizer from browser', 
        type=int, default=9000, required=False)
    parser.add_argument('-p','--port', help='Port to run the visualizer server where agent can connect',  
        type=int, default=9001, required=False)
    
    args = parser.parse_args()
    
    map_file = Path(args.map_file)
    if not map_file.is_file():
        print("[!] Could not find map file at", map_file)
        sys.exit(0)
    copyfile(str(map_file), "./ui/dist/" + map_file.name)

    game_port, port, web_port = args.game_port, args.port, args.web_port

    loop = asyncio.get_event_loop()
    app = web.Application(middlewares=[IndexMiddleware()])
    browser_socket.init(app)
    # This MUST be done after initializing browser socket.
    # Otherwise, the static path binding on '/' will 
    # mess with '/socketio' paths from browser.
    app.router.add_static('/', './ui/dist')

    loop.run_until_complete(init(loop, app, web_port))
    connection_manager = ConnectionManager(loop, port, browser_socket)
    connection_manager.connect('localhost', game_port)
    print("================================================================")
    print("*** Access browser at this url:", "http://localhost:{}".format(web_port))
    print("*** Connect agent to this port:", port)
    print("================================================================")
    try:
        loop.run_forever()
    except Exception as e:
        pass

if __name__ == '__main__':
    main()
