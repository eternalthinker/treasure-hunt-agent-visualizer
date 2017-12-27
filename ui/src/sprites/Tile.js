import Phaser from 'phaser';
import * as TileType from '../constants/TileType';

export default class extends Phaser.Sprite {
  constructor ({ game, x, y, asset, frame, tileType, tileSize }) {
    super(game, x, y, asset, frame);
    this.tileType = tileType;
    this.tileSize = tileSize;
    this.gridX = x / tileSize;
    this.gridY = y / tileSize;
  }

  isBlocking () {
    return [
      TileType.WALL,
      TileType.DOOR,
      TileType.TREE
    ].includes(this.tileType);
  }

  update () {
  }
}
