/* globals __DEV__ */
import Phaser from 'phaser';
import * as utils from './utils';

export default class extends Phaser.State {
  init () {
    const treasureMapTxt = this.game.cache.getText('treasureMapTxt');
    console.log(utils.parseTreasureMapTxt(treasureMapTxt));
  }

  preload () {}

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
  }

  render () {
    if (__DEV__) {
      // this.game.debug.spriteInfo(this.mushroom, 32, 32);
    }
  }
}
