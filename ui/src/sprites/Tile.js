import Phaser from 'phaser';

export default class extends Phaser.Sprite {
  constructor ({ game, x, y, asset, tileType }) {
    super(game, x, y, asset);
    this.tileType = tileType;
  }

  update () {
  }
}
