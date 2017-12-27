import Phaser from 'phaser';
import { centerGameObjects } from '../utils/common';
import spriteSheetImg from '../../assets/sprites.png';

export default class extends Phaser.State {
  init () {}

  preload () {
    this.loaderBg = this.add.sprite(this.game.world.centerX, this.game.world.centerY, 'loaderBg');
    this.loaderBar = this.add.sprite(this.game.world.centerX, this.game.world.centerY, 'loaderBar');
    centerGameObjects([this.loaderBg, this.loaderBar]);

    this.load.setPreloadSprite(this.loaderBar);
    //
    // load your assets
    //
    this.load.text('treasureMapTxt', '/treasure-map.txt');
    this.load.spritesheet('spriteSheet', spriteSheetImg, 64, 64);
  }

  create () {
    this.state.start('Game');
  }
}
