import Phaser from 'phaser';
import io from 'socket.io-client';
import * as parseUtils from '../utils/parseUtils';
import * as Command from '../constants/Command';
import * as TileType from '../constants/TileType';
import * as SpriteFrame from '../constants/SpriteFrame';

export default class extends Phaser.State {
  init () {
    const tileSize = 64;
    const treasureMapTxt = this.game.cache.getText('treasureMapTxt');
    // console.log(utils.parseTreasureMapTxt(treasureMapTxt));
    const { bgLayer, fgLayer, agent } =
      parseUtils.parseMapTxt(treasureMapTxt, this.game, tileSize);
    this.bgLayer = bgLayer;
    this.fgLayer = fgLayer;
    this.agent = agent;

    this.gridWidth = this.bgLayer[0].length;
    this.gridHeight = this.bgLayer.length;
    const worldWidth = this.gridWidth * 64;
    const worldHeight = this.gridHeight * 64;
    this.game.world.setBounds(0, 0, worldWidth, worldHeight);

    this.cursors = this.game.input.keyboard.createCursorKeys();
    this.worldScale = 1;
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

        this.agent.moveForward();

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

  create () {
    const bannerText = 'Phaser + ES6 + Webpack';
    var style = {
      font: '32px Arial',
      fill: '#ff0044',
      wordWrap: true,
      align: 'center',
      backgroundColor: '#ffff00'
    };
    let banner = this.add.text(this.world.centerX,
      this.game.height - 80,
      bannerText,
      style);
    banner.font = 'Bangers';
    banner.padding.set(10, 16);
    banner.fontSize = 40;
    banner.fill = '#77BFA3';
    banner.smoothed = false;
    banner.anchor.setTo(0.5);

    this.renderLayer(this.bgLayer);
    this.renderLayer(this.fgLayer);
    this.game.add.existing(this.agent);

    this.socket = io();
    const onConnect = () => {
      console.log('Connected to visualization server');
    };
    this.socket.on('connect', onConnect);
    this.socket.on('commands', this.handleCommands);
  }

  update () {
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
