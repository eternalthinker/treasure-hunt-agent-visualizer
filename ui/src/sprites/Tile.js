import Phaser from 'phaser';
import * as TileType from '../constants/TileType';

export default class extends Phaser.Sprite {
  constructor ({ game, x, y, asset, frame, linkType, tileType, tileSize }) {
    super(game, x, y, asset, frame);
    this.tileType = tileType;
    this.tileSize = tileSize;
    this.gridX = x / tileSize;
    this.gridY = y / tileSize;
    this.linkType = linkType;
  }

  isBlocking = () =>
    [
      TileType.WALL,
      TileType.DOOR,
      TileType.TREE
    ].includes(this.tileType)

  isDestructableByBomb = () =>
    this.isBlocking()

  isCollectable = () =>
    [
      TileType.TREASURE,
      TileType.AXE,
      TileType.DYNAMITE,
      TileType.KEY
    ].includes(this.tileType)

  update () {
  }
}
