import Phaser from 'phaser';
import * as directionUtils from '../utils/directionUtils';
import * as SpriteFrame from '../constants/SpriteFrame';
import * as TileType from '../constants/TileType';
import Tile from './Tile';

export default class extends Phaser.Sprite {
  constructor ({ game, x, y, asset, frame, tileType, tileSize }) {
    super(game, x, y, null, frame);
    this.tileSize = tileSize;
    this.gridX = x / tileSize;
    this.gridY = y / tileSize;
    this.direction = tileType.split('_')[1];
    this.tileType = 'AGENT_';
    this.inventory = new Map();
    this.raft = null;
    this.asset = asset;
    this.raft = this.addChild(new Tile({
      x: 0,
      y: 0,
      asset: this.asset,
      frame: SpriteFrame.RAFT,
      game: this.game,
      tileType: null,
      tileSize: this.tileSize
    }));
    this.raft.visible = false;
    this.agent = this.addChild(new Tile({
      x: 0,
      y: 0,
      asset: this.asset,
      frame: SpriteFrame[this.tileType + this.direction],
      game: this.game,
      tileType: null,
      tileSize: this.tileSize
    }));
  }

  addToInventory = (tileType) => {
    const count = (this.inventory.get(tileType) || 0) + 1;
    if (tileType !== TileType.DYNAMITE && count > 1) {
      console.log(`Inventory already contains ${tileType}. Cannot add more.`);
      return;
    }
    this.inventory.set(tileType, count);
    console.log(`Added ${tileType} to inventory. Current count = ${count}`);
  };

  makeRaft = () => {
    this.raft.visible = true;
  };

  destroyRaft = () => {
    this.raft.visible = false;
  };

  onRaft = () =>
    this.raft && this.raft.visible

  removeFromInventory = (tileType) => {
    if (!this.inventory.has(tileType)) return;
    const count = this.inventory.get(tileType);
    if (count === 1) {
      this.inventory.delete(tileType);
      console.log(`Inventory has no more ${tileType}`);
    } else {
      this.inventory.set(tileType, count - 1);
      console.log(`Inventory has ${count - 1} ${tileType} left`);
    }
  };

  has = (tileType) =>
    Boolean(this.inventory.get(tileType))

  lookingAt = () =>
    directionUtils.coordsTowards(this.gridX, this.gridY, this.direction)

  turnRight = () => {
    this.direction = directionUtils.turnRight(this.direction);
    this.agent.frame = SpriteFrame[this.tileType + this.direction];
  };

  turnLeft = () => {
    this.direction = directionUtils.turnLeft(this.direction);
    this.agent.frame = SpriteFrame[this.tileType + this.direction];
  };

  moveForward = () => {
    const { x, y } = this.lookingAt();
    this.gridX = x;
    this.gridY = y;
    this.x = x * this.tileSize;
    this.y = y * this.tileSize;
  };

  update () {
  }
}
