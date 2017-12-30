import Phaser from 'phaser';
import io from 'socket.io-client';
import * as parseUtils from '../utils/parseUtils';
import * as Command from '../constants/Command';
import * as TileType from '../constants/TileType';
import * as SpriteFrame from '../constants/SpriteFrame';
import config from '../config';
import Ui from '../utils/Ui';

export default class extends Phaser.State {
  init () {
    const tileSize = 64;
    const treasureMapTxt = this.game.cache.getText('treasureMapTxt');
    // console.log(utils.parseTreasureMapTxt(treasureMapTxt));
    const { bgLayer, fgLayer, outsideViewOverlay, notVisitedOverlay, agent } =
      parseUtils.parseMapTxt(treasureMapTxt, this.game, tileSize);
    this.bgLayer = bgLayer;
    this.fgLayer = fgLayer;
    this.outsideViewOverlay = outsideViewOverlay;
    this.notVisitedOverlay = notVisitedOverlay;
    this.agent = agent;

    this.gridWidth = this.bgLayer[0].length;
    this.gridHeight = this.bgLayer.length;
    this.worldWidth = this.gridWidth * 64;
    this.worldHeight = this.gridHeight * 64;
    this.game.world.setBounds(0, 0, this.worldWidth, this.worldHeight);

    this.cursors = this.game.input.keyboard.createCursorKeys();
    this.worldScale = 1;

    this.ui = new Ui();
    this.serverDisconnected = false;
  }

  preload () {}

  renderLayer (layerGrid) {
    layerGrid.map((row) =>
      row.map((tile) =>
        tile && this.game.add.existing(tile)
      )
    );
  }

  handleCommands = (cmds) => {
    if (this.commandWaitTimer.running) {
      this.commandWaitTimer.stop();
    } else {
      this.ui.setCommandIndicator(false);
    }
    this.startCommandWaitTimer();
    cmds.trim().split('').map((cmd) => this.handleCommand(cmd.toLowerCase()));
  };

  handleCommand = (cmd) => {
    console.log('Command:', cmd);
    const agentLookingAt = this.agentLookingAt();
    console.log('Looking at:', agentLookingAt && agentLookingAt.tileType);
    switch (cmd) {
      case Command.STEP_FORWARD:
        if (!agentLookingAt) {
          console.log('Stepping into the unknown. You die.');
          return;
        }

        if (agentLookingAt.isBlocking()) {
          console.log("Can't move!");
          return;
        }

        this.resetAgentView();
        this.agent.moveForward();
        this.clearAgentView();

        if (this.agent.onRaft() && agentLookingAt.tileType !== TileType.WATER) {
          this.agent.destroyRaft();
        }

        if (agentLookingAt.isCollectable()) {
          this.agent.addToInventory(agentLookingAt.tileType);
          this.removeFromFgLayer(agentLookingAt);
          agentLookingAt.destroy();
        } else if (agentLookingAt.tileType === TileType.WATER &&
          !this.agent.onRaft()) {
          if (!this.agent.has(TileType.TREE)) {
            console.log('You drowned');
          } else {
            this.agent.removeFromInventory(TileType.TREE);
            this.agent.makeRaft();
            console.log('You float on a raft');
          }
        }

        break;
      case Command.TURN_RIGHT:
        this.agent.turnRight();
        break;
      case Command.TURN_LEFT:
        this.agent.turnLeft();
        break;
      case Command.CUT:
        if (!this.agent.has(TileType.AXE)) {
          console.log("Can't cut without axe!");
          return;
        }
        if (agentLookingAt && agentLookingAt.tileType === TileType.TREE) {
          this.agent.addToInventory(agentLookingAt.tileType);
          agentLookingAt.frame = SpriteFrame.TREE_CUT;
          this.removeFromFgLayer(agentLookingAt);
        }
        break;
      case Command.UNLOCK:
        if (!this.agent.has(TileType.KEY)) {
          console.log("Can't unlock without key!");
          return;
        }
        if (agentLookingAt && agentLookingAt.tileType === TileType.DOOR) {
          agentLookingAt.frame =
            SpriteFrame[`DOOR_OPEN_LINKED_${agentLookingAt.linkType}`];
          this.removeFromFgLayer(agentLookingAt);
        }
        break;
      case Command.BOMB:
        if (!this.agent.has(TileType.DYNAMITE)) {
          console.log("Can't bomb without dynamite!");
          return;
        }
        if (agentLookingAt && agentLookingAt.isDestructableByBomb()) {
          agentLookingAt.frame = SpriteFrame.BOMBED_GROUND;
          this.removeFromFgLayer(agentLookingAt);
          this.agent.removeFromInventory(TileType.DYNAMITE);
        }
        break;
      default:
        console.log('Unhandled command');
        break;
    }
  };

  removeFromFgLayer = (tile) => {
    this.fgLayer[tile.gridY][tile.gridX] = null;
  };

  isOutOfBounds = (x, y) =>
    x < 0 || x >= this.gridWidth || y < 0 || y >= this.gridHeight

  agentLookingAt = () => {
    const { x, y } = this.agent.lookingAt();
    if (this.isOutOfBounds(x, y)) {
      return null;
    }
    const tile = this.fgLayer[y][x] || this.bgLayer[y][x];
    return tile;
  };

  agentView = () =>
    this.agent.getView().filter(pos => !this.isOutOfBounds(pos.x, pos.y))

  resetAgentView = () =>
    this.agentView().forEach(pos => {
      this.outsideViewOverlay[pos.y][pos.x].visible = true;
    })

  clearAgentView = () =>
    this.agentView().forEach(pos => {
      this.notVisitedOverlay[pos.y][pos.x].destroy();
      this.outsideViewOverlay[pos.y][pos.x].visible = false;
    })

  create () {
    this.renderLayer(this.bgLayer);
    this.renderLayer(this.fgLayer);
    this.renderLayer(this.outsideViewOverlay);
    this.renderLayer(this.notVisitedOverlay);
    this.game.add.existing(this.agent);
    this.clearAgentView();
    this.game.camera.follow(this.agent);
    this.cameraFollow = true;
    this.game.stage.disableVisibilityChange = true;

    const displayWidth = config.gameWidth;
    const displayHeight = config.gameHeight;
    const widthScale = displayWidth / this.worldWidth;
    const heightScale = displayHeight / this.worldHeight;
    const worldScale = Math.min(widthScale, heightScale);
    this.worldScale = Phaser.Math.clamp(worldScale, 0.25, 1);
    if (worldScale === this.worldScale) {
      this.cameraFollow = false;
      this.world.camera.unfollow();
    }
    const gameWidth = Math.min(this.worldWidth * this.worldScale, config.gameWidth);
    const gameHeight = Math.min(this.worldHeight * this.worldScale, config.gameHeight);
    this.game.scale.setGameSize(gameWidth, gameHeight);

    this.game.world.scale.set(this.worldScale);

    this.socket = io();
    this.socket.on('connect', this.onConnect);
    this.socket.on('disconnect', this.onDisconnect);
    this.socket.on('commands', this.handleCommands);

    this.commandWaitTimer = this.game.time.create(false);
    this.commandWaitTimer.stop();
  }

  startCommandWaitTimer = () => {
    this.commandWaitTimer.add(Phaser.Timer.SECOND * 3, this.onCommandWaitTimer, this);
    this.commandWaitTimer.start();
  };

  onCommandWaitTimer = () => {
    this.commandWaitTimer.stop();
    this.ui.setCommandIndicator(true);
  };

  onConnect = () => {
    console.log('Connected to visualization server');
    if (this.serverDisconnected) {
      this.ui.reloadWindow();
    }
  };

  onDisconnect = () => {
    this.serverDisconnected = true;
    this.ui.notifyDisconnection();
  }

  update () {
    if (this.game.input.keyboard.isDown(Phaser.Keyboard.F)) {
      if (this.cameraFollow) {
        this.game.camera.unfollow();
      } else {
        this.game.camera.follow(this.agent);
      }
      this.cameraFollow = !this.cameraFollow;
    }

    if (this.game.input.keyboard.isDown(Phaser.Keyboard.Z)) {
      this.worldScale = 1;
      this.game.world.scale.set(this.worldScale);
    }

    if (this.cursors.up.isDown) {
      this.game.camera.y -= 4;
    } else if (this.cursors.down.isDown) {
      this.game.camera.y += 4;
    }

    if (this.cursors.left.isDown) {
      this.game.camera.x -= 4;
    } else if (this.cursors.right.isDown) {
      this.game.camera.x += 4;
    }

    // zoom -- should move to separate group when constant UI elements are there
    if (this.game.input.keyboard.isDown(Phaser.Keyboard.Q)) {
      this.worldScale += 0.05;
    } else if (this.game.input.keyboard.isDown(Phaser.Keyboard.A)) {
      this.worldScale -= 0.05;
    }

    // set a minimum and maximum scale value
    this.worldScale = Phaser.Math.clamp(this.worldScale, 0.25, 2);

    // set our world scale as needed
    this.game.world.scale.set(this.worldScale);
  }

  render () {
    /* if (__DEV__) {
      // this.game.debug.spriteInfo(this.mushroom, 32, 32);
    } */
  }
}
