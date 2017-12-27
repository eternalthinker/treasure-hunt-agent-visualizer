import Phaser from 'phaser';
import io from 'socket.io-client';
import * as parseUtils from '../utils/parseUtils';
import * as Command from '../constants/Command';

export default class extends Phaser.State {
  /* constructor (props) {
    super(props);
    this.bgLayer = null;
    this.fgLayer = null;
  } */

  init () {
    const treasureMapTxt = this.game.cache.getText('treasureMapTxt');
    // console.log(utils.parseTreasureMapTxt(treasureMapTxt));
    const tileLayers = parseUtils.parseMapTxtToTileLayers(treasureMapTxt, this.game);
    this.bgLayer = tileLayers[0];
    this.fgLayer = tileLayers[1];

    const worldWidth = this.bgLayer[0].length * 64;
    const worldHeight = this.bgLayer.length * 64;
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
    switch (cmd) {
      case Command.STEP_FORWARD:
        console.log('Stepping forward');
        this.agent.y += 64;
        break;
      case Command.TURN_RIGHT:
      case Command.TURN_LEFT:
      case Command.CUT:
      case Command.UNLOCK:
      case Command.BOMB:
        console.log('Command not handled yet');
        break;
    }
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

    /* this.mushroom = new Mushroom({
      game: this.game,
      x: this.world.centerX,
      y: this.world.centerY,
      asset: 'mushroom'
    });

    this.game.add.existing(this.mushroom); */

    const r1 = this.fgLayer
      .map(row => row.filter(tile => tile && tile.tileType.startsWith('AGENT')));
    const r2 = r1
      .filter(row => row.length > 0);
    this.agent = r2[0][0];

    this.renderLayer(this.bgLayer);
    this.renderLayer(this.fgLayer);

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
    this.worldScale = Phaser.Math.clamp(this.worldScale, 0.5, 2);

    // set our world scale as needed
    this.game.world.scale.set(this.worldScale);
  }

  render () {
    /* if (__DEV__) {
      // this.game.debug.spriteInfo(this.mushroom, 32, 32);
    } */
  }
}
