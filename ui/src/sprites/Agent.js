import Phaser from 'phaser';
import * as directionUtils from '../utils/directionUtils';

export default class extends Phaser.Sprite {
  constructor ({ game, x, y, asset, frame, tileType, tileSize }) {
    super(game, x, y, asset, frame);
    this.tileSize = tileSize;
    this.gridX = x / tileSize;
    this.gridY = y / tileSize;
    this.direction = tileType.split('_')[1];
  }

  lookingAt () {
    return directionUtils.coordsTowards(this.gridX, this.gridY, this.direction);
  }

  update () {
  }
}
