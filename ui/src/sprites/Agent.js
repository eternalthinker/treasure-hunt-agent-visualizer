import Phaser from 'phaser';
import * as directionUtils from '../utils/directionUtils';
import * as SpriteFrame from '../constants/SpriteFrame';

export default class extends Phaser.Sprite {
  constructor ({ game, x, y, asset, frame, tileType, tileSize }) {
    super(game, x, y, asset, frame);
    this.tileSize = tileSize;
    this.gridX = x / tileSize;
    this.gridY = y / tileSize;
    this.direction = tileType.split('_')[1];
    this.tileType = 'AGENT_';
  }

  lookingAt () {
    return directionUtils.coordsTowards(this.gridX, this.gridY, this.direction);
  }

  turnRight () {
    this.direction = directionUtils.turnRight(this.direction);
    this.frame = SpriteFrame[this.tileType + this.direction];
  }

  turnLeft () {
    this.direction = directionUtils.turnLeft(this.direction);
    this.frame = SpriteFrame[this.tileType + this.direction];
  }

  moveForward () {
    const { x, y } = this.lookingAt();
    this.gridX = x;
    this.gridY = y;
    this.x = x * this.tileSize;
    this.y = y * this.tileSize;
  }

  update () {
  }
}
