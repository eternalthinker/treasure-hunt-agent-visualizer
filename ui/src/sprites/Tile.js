import Phaser from 'phaser';

export default class extends Phaser.Sprite {
  constructor ({ game, x, y, asset, frame, tileType, tileSize }) {
    super(game, x, y, asset, frame);
    this.tileType = tileType;
    this.tileSize = tileSize;
    this.gridX = x / tileSize;
    this.gridY = y / tileSize;
  }

  update () {
  }
}
