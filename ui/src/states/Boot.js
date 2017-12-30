import Phaser from 'phaser';
import WebFont from 'webfontloader';
import loaderBgImg from '../../assets/images/loader-bg.png';
import loaderBarImg from '../../assets/images/loader-bar.png';

export default class extends Phaser.State {
  init () {
    this.stage.backgroundColor = '#262626';
    this.fontsReady = false;
    this.fontsLoaded = this.fontsLoaded.bind(this);
  }

  preload () {
    this.clearGameCache();

    WebFont.load({
      google: {
        families: ['Bangers']
      },
      active: this.fontsLoaded
    });

    let text = this.add.text(this.world.centerX, this.world.centerY, 'loading fonts', { font: '16px Arial', fill: '#dddddd', align: 'center' });
    text.anchor.setTo(0.5, 0.5);

    this.load.image('loaderBg', loaderBgImg);
    this.load.image('loaderBar', loaderBarImg);
  }

  clearGameCache = () => {
    this.game.load.reset();
    this.game.load.removeAll();
  };

  render () {
    if (this.fontsReady) {
      this.state.start('Splash');
    }
  }

  fontsLoaded () {
    this.fontsReady = true;
  }
}
