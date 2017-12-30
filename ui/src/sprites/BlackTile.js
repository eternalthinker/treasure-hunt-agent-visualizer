import Phaser from 'phaser';

export default class extends Phaser.Sprite {
  constructor ({ game, x, y, tileSize, alpha }) {
    super(game, x, y, null, null);
    this.tileSize = tileSize;
    this.gridX = x / tileSize;
    this.gridY = y / tileSize;
    this.alpha = alpha;

    // Add graphics
    const graphics = new Phaser.Graphics(game, 0, 0);
    graphics.beginFill(0x000000, 1);
    graphics.drawRect(0, 0, tileSize, tileSize);
    graphics.endFill();
    this.addChild(graphics);
  }

  update () {
  }
}
