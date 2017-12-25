/* globals __DEV__ */
import Phaser from 'phaser';
import * as utils from './utils';

export default class extends Phaser.State {
  /* constructor (props) {
    super(props);
    this.bgLayer = null;
    this.fgLayer = null;
  } */

  init () {
    const treasureMapTxt = this.game.cache.getText('treasureMapTxt');
    // console.log(utils.parseTreasureMapTxt(treasureMapTxt));
    const tileLayers = utils.parseMapTxtToTileLayers(treasureMapTxt, this.game);
    console.log('tileLayers', tileLayers);
    this.bgLayer = tileLayers[0];
    this.fgLayer = tileLayers[1];

    const worldWidth = this.bgLayer[0].length * 64;
    const worldHeight = this.bgLayer.length * 64;
    this.game.world.setBounds(0, 0, worldWidth, worldHeight);

    this.cursors = this.game.input.keyboard.createCursorKeys();
  }

  preload () {}

  renderLayer (layerGrid) {
    layerGrid.map((row) =>
      row.map((tile) =>
        tile && this.game.add.existing(tile)
      )
    );
  }

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
    this.renderLayer(this.bgLayer);
    this.renderLayer(this.fgLayer);
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
  }

  render () {
    if (__DEV__) {
      // this.game.debug.spriteInfo(this.mushroom, 32, 32);
    }
  }
}
