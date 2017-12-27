import Phaser from 'phaser';

export default class extends Phaser.Sprite {
  constructor ({ game, x, y, asset, frame, tileType }) {
    super(game, x, y, asset, frame);
    this.tileType = tileType;
  }

  update () {
  }
}
