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

    this.game.input.mouse.mouseWheelCallback = this.handleScroll;
    this.cursors = this.game.input.keyboard.createCursorKeys();
    this.worldScale = 1;

    this.ui = new Ui();
    this.serverDisconnected = false;

    this.keyStates = new Map([
      [Phaser.Keyboard.F, false]
    ]);
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
          this.ui.setInventory(this.agent.inventory);
          this.removeFromFgLayer(agentLookingAt);
          agentLookingAt.destroy();
        } else if (agentLookingAt.tileType === TileType.WATER &&
          !this.agent.onRaft()) {
          if (!this.agent.has(TileType.TREE)) {
            console.log('You drowned');
          } else {
            this.agent.removeFromInventory(TileType.TREE);
            this.ui.setInventory(this.agent.inventory);
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
          this.ui.setInventory(this.agent.inventory);
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
          this.ui.setInventory(this.agent.inventory);
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
    this.commandWaitTimer.add(Phaser.Timer.SECOND * 2, this.onCommandWaitTimer, this);
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
      if (!this.keyStates.get(Phaser.Keyboard.F)) {
        this.keyStates.set(Phaser.Keyboard.F, true);
        if (this.cameraFollow) {
          this.game.camera.unfollow();
          this.ui.setAgentFocus(false);
        } else {
          this.game.camera.follow(this.agent);
          this.ui.setAgentFocus(true);
        }
        this.cameraFollow = !this.cameraFollow;
      }
    } else {
      this.keyStates.set(Phaser.Keyboard.F, false);
    }

    if (this.game.input.activePointer.isDown) {
      if (this.game.origDragPoint) {
        // move the camera by the amount the mouse has moved since last update
        this.game.camera.x += this.game.origDragPoint.x - this.game.input.activePointer.position.x;
        this.game.camera.y += this.game.origDragPoint.y - this.game.input.activePointer.position.y;
      }
      // set new drag origin to current position
      this.game.origDragPoint = this.game.input.activePointer.position.clone();
    } else {
      this.game.origDragPoint = null;
    }
  }

  handleScroll = (event) => {
    let worldScale = this.worldScale;
    if (this.game.input.mouse.wheelDelta === Phaser.Mouse.WHEEL_UP) {
      worldScale += 0.05;
    } else {
      worldScale -= 0.05;
    }
    worldScale = Phaser.Math.clamp(worldScale, 0.25, 1);
    if (worldScale === this.worldScale) {
      this.ui.alert('Reached maximum zoom in this direction');
    } else {
      this.worldScale = worldScale;
      this.game.world.scale.set(this.worldScale);
    }
  };

  render () {
    /* if (__DEV__) {
      // this.game.debug.spriteInfo(this.mushroom, 32, 32);
    } */
  }
}
